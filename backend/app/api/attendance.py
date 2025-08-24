# Attendance API routes
from flask import Blueprint, request, jsonify
from datetime import datetime, date
from ..core.database import get_db_cursor
from ..core.utils import create_response, require_internal_network, decode_base64_image, log_activity
from ..attendance.attendance import process_attendance_image, match_face
import json

attendance_bp = Blueprint('attendance', __name__)

@attendance_bp.route('/check-in', methods=['POST'])
@require_internal_network
def check_in():
    """Face recognition check-in endpoint (internal network only)"""
    try:
        data = request.get_json()
        
        if not data or 'image' not in data:
            return create_response(False, error='No image data provided', status_code=400)
        
        # Decode and process image with liveness detection
        image = decode_base64_image(data['image'])
        result = process_attendance_image(image, enable_liveness_check=True)
        
        if not result['success']:
            log_activity('WARNING', f"Attendance check-in failed: {result['error']}", 'attendance')
            return create_response(False, error=result['error'], status_code=400)
        
        encoding = result['encoding']
        
        # Get all known face encodings from database
        with get_db_cursor() as cursor:
            cursor.execute("""
                SELECT f.id, f.face_encoding, u.id, u.username, u.full_name 
                FROM faces f 
                JOIN users u ON f.user_id = u.id
            """)
            known_faces = cursor.fetchall()
            
            if not known_faces:
                return create_response(False, error='No registered faces found', status_code=404)
            
            # Extract encodings and match
            known_encodings = []
            face_info = []
            
            for face in known_faces:
                try:
                    face_encoding = json.loads(face[1])
                    known_encodings.append(face_encoding)
                    face_info.append({
                        'face_id': face[0],
                        'user_id': face[2],
                        'username': face[3],
                        'full_name': face[4]
                    })
                except json.JSONDecodeError:
                    continue
            
            # Match face
            match_idx, confidence = match_face(encoding, known_encodings)
            
            if match_idx is None:
                log_activity('WARNING', 'Face not recognized during check-in', 'attendance')
                return create_response(False, error='Face not recognized', status_code=404)
            
            matched_user = face_info[match_idx]
            user_id = matched_user['user_id']
            
            # Check if already checked in today
            today = date.today()
            cursor.execute("""
                SELECT id, check_in_time, check_out_time 
                FROM attendance 
                WHERE user_id = %s AND date = %s
            """, (user_id, today))
            
            existing_record = cursor.fetchone()
            current_time = datetime.now()
            
            if existing_record:
                # Update check-out time
                cursor.execute("""
                    UPDATE attendance 
                    SET check_out_time = %s, updated_at = %s 
                    WHERE id = %s
                """, (current_time, current_time, existing_record[0]))
                
                action = 'check_out'
                message = f"Check-out successful for {matched_user['full_name']}"
            else:
                # Create new check-in record
                cursor.execute("""
                    INSERT INTO attendance (user_id, check_in_time, date, status) 
                    VALUES (%s, %s, %s, 'present')
                """, (user_id, current_time, today))
                
                action = 'check_in'
                message = f"Check-in successful for {matched_user['full_name']}"
            
            log_activity('INFO', message, 'attendance')
            
            return create_response(True, {
                'action': action,
                'user': {
                    'id': user_id,
                    'username': matched_user['username'],
                    'full_name': matched_user['full_name']
                },
                'confidence': float(confidence),
                'timestamp': current_time.isoformat(),
                'liveness_passed': result.get('liveness_passed', False),
                'liveness_score': result.get('liveness_score')
            }, message=message)
            
    except ValueError as e:
        return create_response(False, error=str(e), status_code=400)
    except Exception as e:
        log_activity('ERROR', f"Attendance check-in error: {str(e)}", 'attendance')
        return create_response(False, error=f'Check-in failed: {str(e)}', status_code=500)

@attendance_bp.route('/history', methods=['GET'])
def get_attendance_history():
    """Get attendance history"""
    try:
        user_id = request.args.get('user_id')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        
        offset = (page - 1) * per_page
        
        query = """
            SELECT a.id, a.user_id, u.username, u.full_name, 
                   a.check_in_time, a.check_out_time, a.date, a.status,
                   a.created_at
            FROM attendance a
            JOIN users u ON a.user_id = u.id
            WHERE 1=1
        """
        params = []
        
        if user_id:
            query += " AND a.user_id = %s"
            params.append(user_id)
        
        if start_date:
            query += " AND a.date >= %s"
            params.append(start_date)
        
        if end_date:
            query += " AND a.date <= %s"
            params.append(end_date)
        
        query += " ORDER BY a.date DESC, a.check_in_time DESC LIMIT %s OFFSET %s"
        params.extend([per_page, offset])
        
        with get_db_cursor() as cursor:
            cursor.execute(query, params)
            records = cursor.fetchall()
            
            # Get total count
            count_query = query.replace(
                "SELECT a.id, a.user_id, u.username, u.full_name, a.check_in_time, a.check_out_time, a.date, a.status, a.created_at",
                "SELECT COUNT(*)"
            ).replace("ORDER BY a.date DESC, a.check_in_time DESC LIMIT %s OFFSET %s", "")
            cursor.execute(count_query, params[:-2])
            total_count = cursor.fetchone()[0]
            
            attendance_data = []
            for record in records:
                attendance_data.append({
                    'id': record[0],
                    'user_id': record[1],
                    'username': record[2],
                    'full_name': record[3],
                    'check_in_time': record[4].isoformat() if record[4] else None,
                    'check_out_time': record[5].isoformat() if record[5] else None,
                    'date': record[6].isoformat() if record[6] else None,
                    'status': record[7],
                    'created_at': record[8].isoformat() if record[8] else None
                })
            
            return create_response(True, {
                'records': attendance_data,
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': total_count,
                    'pages': (total_count + per_page - 1) // per_page
                }
            })
            
    except Exception as e:
        return create_response(False, error=f'Failed to get attendance history: {str(e)}', status_code=500)
