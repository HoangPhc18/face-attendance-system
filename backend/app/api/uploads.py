# File upload API routes
from flask import Blueprint, request, jsonify, send_file
from datetime import datetime
import os
import uuid
from werkzeug.utils import secure_filename
from PIL import Image
from ..core.database import get_db_cursor
from ..core.utils import create_response, require_external_auth, validate_required_fields, log_activity
from ..config.settings import Config

uploads_bp = Blueprint('uploads', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'}
MAX_FILE_SIZE = 16 * 1024 * 1024  # 16MB

def allowed_file(filename):
    """Kiểm tra file extension có được phép không"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def validate_image(file_path):
    """Validate và resize image nếu cần"""
    try:
        with Image.open(file_path) as img:
            # Kiểm tra kích thước
            if img.size[0] > 2048 or img.size[1] > 2048:
                # Resize nếu quá lớn
                img.thumbnail((2048, 2048), Image.Resampling.LANCZOS)
                img.save(file_path, optimize=True, quality=85)
            
            # Convert sang RGB nếu cần
            if img.mode in ('RGBA', 'P'):
                rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                rgb_img.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                rgb_img.save(file_path, 'JPEG', optimize=True, quality=85)
        
        return True
    except Exception as e:
        log_activity('ERROR', f'Image validation failed: {str(e)}', 'uploads')
        return False

@uploads_bp.route('/image', methods=['POST'])
@require_external_auth
def upload_image(current_user_id):
    """Upload ảnh"""
    try:
        if 'file' not in request.files:
            return create_response(False, error='No file provided', status_code=400)
        
        file = request.files['file']
        if file.filename == '':
            return create_response(False, error='No file selected', status_code=400)
        
        if not allowed_file(file.filename):
            return create_response(False, error='File type not allowed', status_code=400)
        
        # Kiểm tra kích thước file
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        
        if file_size > MAX_FILE_SIZE:
            return create_response(False, error='File too large (max 16MB)', status_code=400)
        
        # Tạo tên file unique
        filename = secure_filename(file.filename)
        file_ext = filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{uuid.uuid4().hex}.{file_ext}"
        
        # Tạo thư mục upload theo ngày
        upload_date = datetime.now().strftime('%Y/%m/%d')
        upload_dir = os.path.join(Config.UPLOAD_FOLDER, 'images', upload_date)
        os.makedirs(upload_dir, exist_ok=True)
        
        file_path = os.path.join(upload_dir, unique_filename)
        file.save(file_path)
        
        # Validate và optimize image
        if not validate_image(file_path):
            os.remove(file_path)
            return create_response(False, error='Invalid image file', status_code=400)
        
        # Lưu thông tin vào database
        relative_path = os.path.join('images', upload_date, unique_filename).replace('\\', '/')
        
        with get_db_cursor() as cursor:
            cursor.execute("""
                INSERT INTO uploaded_files (user_id, original_filename, stored_filename, 
                                          file_path, file_size, file_type, upload_date)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (current_user_id, filename, unique_filename, relative_path, 
                  file_size, file_ext, datetime.now()))
            
            file_id = cursor.fetchone()[0]
            
            log_activity('INFO', f'Image uploaded: {filename} -> {unique_filename}', 'uploads')
            
            return create_response(True, {
                'file_id': file_id,
                'filename': unique_filename,
                'original_filename': filename,
                'file_path': relative_path,
                'file_size': file_size,
                'upload_url': f'/api/uploads/file/{file_id}'
            })
            
    except Exception as e:
        log_activity('ERROR', f'Image upload error: {str(e)}', 'uploads')
        return create_response(False, error=f'Upload failed: {str(e)}', status_code=500)

@uploads_bp.route('/file/<int:file_id>', methods=['GET'])
def get_file(file_id):
    """Lấy file đã upload"""
    try:
        with get_db_cursor() as cursor:
            cursor.execute("""
                SELECT file_path, original_filename, file_type 
                FROM uploaded_files 
                WHERE id = %s
            """, (file_id,))
            
            file_info = cursor.fetchone()
            if not file_info:
                return create_response(False, error='File not found', status_code=404)
            
            file_path = os.path.join(Config.UPLOAD_FOLDER, file_info[0])
            
            if not os.path.exists(file_path):
                return create_response(False, error='File not found on disk', status_code=404)
            
            return send_file(
                file_path,
                as_attachment=False,
                download_name=file_info[1],
                mimetype=f'image/{file_info[2]}'
            )
            
    except Exception as e:
        log_activity('ERROR', f'File retrieval error: {str(e)}', 'uploads')
        return create_response(False, error=f'File retrieval failed: {str(e)}', status_code=500)

@uploads_bp.route('/files', methods=['GET'])
@require_external_auth
def list_user_files(current_user_id):
    """Liệt kê files của user"""
    try:
        page = request.args.get('page', type=int, default=1)
        limit = request.args.get('limit', type=int, default=20)
        file_type = request.args.get('type')  # image, document, etc.
        
        offset = (page - 1) * limit
        
        with get_db_cursor() as cursor:
            # Kiểm tra quyền admin
            cursor.execute("SELECT role FROM users WHERE id = %s", (current_user_id,))
            user_role = cursor.fetchone()
            is_admin = user_role and user_role[0] == 'admin'
            
            # Build query
            base_query = """
                SELECT f.id, f.original_filename, f.stored_filename, f.file_path,
                       f.file_size, f.file_type, f.upload_date, u.username, u.full_name
                FROM uploaded_files f
                JOIN users u ON f.user_id = u.id
                WHERE 1=1
            """
            count_query = "SELECT COUNT(*) FROM uploaded_files f WHERE 1=1"
            params = []
            
            if not is_admin:
                base_query += " AND f.user_id = %s"
                count_query += " AND user_id = %s"
                params.append(current_user_id)
            
            if file_type:
                base_query += " AND f.file_type = %s"
                count_query += " AND file_type = %s"
                params.append(file_type)
            
            # Get total count
            cursor.execute(count_query, params)
            total_files = cursor.fetchone()[0]
            
            # Get files with pagination
            base_query += " ORDER BY f.upload_date DESC LIMIT %s OFFSET %s"
            params.extend([limit, offset])
            
            cursor.execute(base_query, params)
            files = cursor.fetchall()
            
            files_data = []
            for file in files:
                files_data.append({
                    'id': file[0],
                    'original_filename': file[1],
                    'stored_filename': file[2],
                    'file_path': file[3],
                    'file_size': file[4],
                    'file_type': file[5],
                    'upload_date': file[6].isoformat(),
                    'uploader': {
                        'username': file[7],
                        'full_name': file[8]
                    } if is_admin else None,
                    'download_url': f'/api/uploads/file/{file[0]}'
                })
            
            return create_response(True, {
                'files': files_data,
                'pagination': {
                    'page': page,
                    'limit': limit,
                    'total': total_files,
                    'pages': (total_files + limit - 1) // limit
                }
            })
            
    except Exception as e:
        log_activity('ERROR', f'File listing error: {str(e)}', 'uploads')
        return create_response(False, error=f'File listing failed: {str(e)}', status_code=500)

@uploads_bp.route('/file/<int:file_id>', methods=['DELETE'])
@require_external_auth
def delete_file(current_user_id, file_id):
    """Xóa file"""
    try:
        with get_db_cursor() as cursor:
            # Kiểm tra quyền
            cursor.execute("SELECT role FROM users WHERE id = %s", (current_user_id,))
            user_role = cursor.fetchone()
            is_admin = user_role and user_role[0] == 'admin'
            
            # Lấy thông tin file
            cursor.execute("""
                SELECT file_path, user_id, original_filename 
                FROM uploaded_files 
                WHERE id = %s
            """, (file_id,))
            
            file_info = cursor.fetchone()
            if not file_info:
                return create_response(False, error='File not found', status_code=404)
            
            # Kiểm tra quyền xóa
            if not is_admin and file_info[1] != current_user_id:
                return create_response(False, error='Permission denied', status_code=403)
            
            # Xóa file khỏi disk
            file_path = os.path.join(Config.UPLOAD_FOLDER, file_info[0])
            if os.path.exists(file_path):
                os.remove(file_path)
            
            # Xóa record khỏi database
            cursor.execute("DELETE FROM uploaded_files WHERE id = %s", (file_id,))
            
            log_activity('INFO', f'File deleted: {file_info[2]} (ID: {file_id})', 'uploads')
            
            return create_response(True, message='File deleted successfully')
            
    except Exception as e:
        log_activity('ERROR', f'File deletion error: {str(e)}', 'uploads')
        return create_response(False, error=f'File deletion failed: {str(e)}', status_code=500)

@uploads_bp.route('/cleanup', methods=['POST'])
@require_external_auth
def cleanup_orphaned_files(current_user_id):
    """Dọn dẹp files không còn được sử dụng (admin only)"""
    try:
        with get_db_cursor() as cursor:
            cursor.execute("SELECT role FROM users WHERE id = %s", (current_user_id,))
            user_role = cursor.fetchone()
            
            if not user_role or user_role[0] != 'admin':
                return create_response(False, error='Admin access required', status_code=403)
            
            # Tìm files cũ hơn 30 ngày và không được reference
            cursor.execute("""
                SELECT id, file_path, original_filename
                FROM uploaded_files 
                WHERE upload_date < %s
                AND id NOT IN (
                    SELECT DISTINCT file_id FROM file_references 
                    WHERE file_id IS NOT NULL
                )
            """, (datetime.now() - timedelta(days=30),))
            
            orphaned_files = cursor.fetchall()
            deleted_count = 0
            
            for file_info in orphaned_files:
                try:
                    # Xóa file khỏi disk
                    file_path = os.path.join(Config.UPLOAD_FOLDER, file_info[1])
                    if os.path.exists(file_path):
                        os.remove(file_path)
                    
                    # Xóa record khỏi database
                    cursor.execute("DELETE FROM uploaded_files WHERE id = %s", (file_info[0],))
                    deleted_count += 1
                    
                except Exception as e:
                    log_activity('WARNING', f'Failed to delete orphaned file {file_info[2]}: {str(e)}', 'uploads')
            
            log_activity('INFO', f'Cleanup completed: {deleted_count} orphaned files deleted', 'uploads')
            
            return create_response(True, {
                'deleted_count': deleted_count,
                'message': f'Cleanup completed: {deleted_count} files deleted'
            })
            
    except Exception as e:
        log_activity('ERROR', f'Cleanup error: {str(e)}', 'uploads')
        return create_response(False, error=f'Cleanup failed: {str(e)}', status_code=500)
