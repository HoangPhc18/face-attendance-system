# Notifications API routes
from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from ..core.database import get_db_cursor
from ..core.utils import create_response, require_external_auth, validate_required_fields, log_activity
import json

notifications_bp = Blueprint('notifications', __name__)

@notifications_bp.route('/', methods=['GET'])
@require_external_auth
def get_notifications(current_user_id):
    """Lấy danh sách thông báo của user"""
    try:
        page = request.args.get('page', type=int, default=1)
        limit = request.args.get('limit', type=int, default=20)
        unread_only = request.args.get('unread_only', type=bool, default=False)
        
        offset = (page - 1) * limit
        
        with get_db_cursor() as cursor:
            # Build query
            base_query = """
                SELECT id, title, message, type, is_read, created_at, data
                FROM notifications 
                WHERE user_id = %s
            """
            count_query = "SELECT COUNT(*) FROM notifications WHERE user_id = %s"
            params = [current_user_id]
            
            if unread_only:
                base_query += " AND is_read = FALSE"
                count_query += " AND is_read = FALSE"
            
            # Get total count
            cursor.execute(count_query, params)
            total_notifications = cursor.fetchone()[0]
            
            # Get notifications with pagination
            base_query += " ORDER BY created_at DESC LIMIT %s OFFSET %s"
            params.extend([limit, offset])
            
            cursor.execute(base_query, params)
            notifications = cursor.fetchall()
            
            notifications_data = []
            for notif in notifications:
                notifications_data.append({
                    'id': notif[0],
                    'title': notif[1],
                    'message': notif[2],
                    'type': notif[3],
                    'is_read': notif[4],
                    'created_at': notif[5].isoformat(),
                    'data': json.loads(notif[6]) if notif[6] else None
                })
            
            return create_response(True, {
                'notifications': notifications_data,
                'pagination': {
                    'page': page,
                    'limit': limit,
                    'total': total_notifications,
                    'pages': (total_notifications + limit - 1) // limit
                }
            })
            
    except Exception as e:
        log_activity('ERROR', f'Get notifications error: {str(e)}', 'notifications')
        return create_response(False, error=f'Failed to get notifications: {str(e)}', status_code=500)

@notifications_bp.route('/unread-count', methods=['GET'])
@require_external_auth
def get_unread_count(current_user_id):
    """Lấy số lượng thông báo chưa đọc"""
    try:
        with get_db_cursor() as cursor:
            cursor.execute("""
                SELECT COUNT(*) FROM notifications 
                WHERE user_id = %s AND is_read = FALSE
            """, (current_user_id,))
            
            unread_count = cursor.fetchone()[0]
            
            return create_response(True, {
                'unread_count': unread_count
            })
            
    except Exception as e:
        log_activity('ERROR', f'Get unread count error: {str(e)}', 'notifications')
        return create_response(False, error=f'Failed to get unread count: {str(e)}', status_code=500)

@notifications_bp.route('/<int:notification_id>/read', methods=['PUT'])
@require_external_auth
def mark_as_read(current_user_id, notification_id):
    """Đánh dấu thông báo đã đọc"""
    try:
        with get_db_cursor() as cursor:
            cursor.execute("""
                UPDATE notifications 
                SET is_read = TRUE, read_at = %s
                WHERE id = %s AND user_id = %s
            """, (datetime.now(), notification_id, current_user_id))
            
            if cursor.rowcount == 0:
                return create_response(False, error='Notification not found', status_code=404)
            
            return create_response(True, message='Notification marked as read')
            
    except Exception as e:
        log_activity('ERROR', f'Mark notification read error: {str(e)}', 'notifications')
        return create_response(False, error=f'Failed to mark notification as read: {str(e)}', status_code=500)

@notifications_bp.route('/mark-all-read', methods=['PUT'])
@require_external_auth
def mark_all_as_read(current_user_id):
    """Đánh dấu tất cả thông báo đã đọc"""
    try:
        with get_db_cursor() as cursor:
            cursor.execute("""
                UPDATE notifications 
                SET is_read = TRUE, read_at = %s
                WHERE user_id = %s AND is_read = FALSE
            """, (datetime.now(), current_user_id))
            
            updated_count = cursor.rowcount
            
            return create_response(True, {
                'updated_count': updated_count,
                'message': f'{updated_count} notifications marked as read'
            })
            
    except Exception as e:
        log_activity('ERROR', f'Mark all notifications read error: {str(e)}', 'notifications')
        return create_response(False, error=f'Failed to mark all notifications as read: {str(e)}', status_code=500)

@notifications_bp.route('/<int:notification_id>', methods=['DELETE'])
@require_external_auth
def delete_notification(current_user_id, notification_id):
    """Xóa thông báo"""
    try:
        with get_db_cursor() as cursor:
            cursor.execute("""
                DELETE FROM notifications 
                WHERE id = %s AND user_id = %s
            """, (notification_id, current_user_id))
            
            if cursor.rowcount == 0:
                return create_response(False, error='Notification not found', status_code=404)
            
            return create_response(True, message='Notification deleted')
            
    except Exception as e:
        log_activity('ERROR', f'Delete notification error: {str(e)}', 'notifications')
        return create_response(False, error=f'Failed to delete notification: {str(e)}', status_code=500)

@notifications_bp.route('/send', methods=['POST'])
@require_external_auth
def send_notification(current_user_id):
    """Gửi thông báo (admin only)"""
    try:
        with get_db_cursor() as cursor:
            cursor.execute("SELECT role FROM users WHERE id = %s", (current_user_id,))
            user_role = cursor.fetchone()
            
            if not user_role or user_role[0] != 'admin':
                return create_response(False, error='Admin access required', status_code=403)
            
            data = request.get_json()
            validate_required_fields(data, ['title', 'message', 'recipients'])
            
            title = data['title']
            message = data['message']
            recipients = data['recipients']  # 'all', 'users', 'admins', hoặc list user_ids
            notification_type = data.get('type', 'info')  # info, warning, success, error
            additional_data = data.get('data')
            
            # Xác định danh sách user_ids
            user_ids = []
            
            if recipients == 'all':
                cursor.execute("SELECT id FROM users")
                user_ids = [row[0] for row in cursor.fetchall()]
            elif recipients == 'users':
                cursor.execute("SELECT id FROM users WHERE role = 'user'")
                user_ids = [row[0] for row in cursor.fetchall()]
            elif recipients == 'admins':
                cursor.execute("SELECT id FROM users WHERE role = 'admin'")
                user_ids = [row[0] for row in cursor.fetchall()]
            elif isinstance(recipients, list):
                user_ids = recipients
            else:
                return create_response(False, error='Invalid recipients format', status_code=400)
            
            # Tạo thông báo cho từng user
            created_count = 0
            for user_id in user_ids:
                try:
                    cursor.execute("""
                        INSERT INTO notifications (user_id, title, message, type, data, created_at)
                        VALUES (%s, %s, %s, %s, %s, %s)
                    """, (user_id, title, message, notification_type, 
                          json.dumps(additional_data) if additional_data else None, 
                          datetime.now()))
                    created_count += 1
                except Exception as e:
                    log_activity('WARNING', f'Failed to create notification for user {user_id}: {str(e)}', 'notifications')
            
            log_activity('INFO', f'Notifications sent: {created_count} recipients', 'notifications')
            
            return create_response(True, {
                'created_count': created_count,
                'message': f'Notification sent to {created_count} users'
            })
            
    except Exception as e:
        log_activity('ERROR', f'Send notification error: {str(e)}', 'notifications')
        return create_response(False, error=f'Failed to send notification: {str(e)}', status_code=500)

@notifications_bp.route('/cleanup', methods=['POST'])
@require_external_auth
def cleanup_old_notifications(current_user_id):
    """Dọn dẹp thông báo cũ (admin only)"""
    try:
        with get_db_cursor() as cursor:
            cursor.execute("SELECT role FROM users WHERE id = %s", (current_user_id,))
            user_role = cursor.fetchone()
            
            if not user_role or user_role[0] != 'admin':
                return create_response(False, error='Admin access required', status_code=403)
            
            # Xóa thông báo cũ hơn 90 ngày và đã đọc
            cutoff_date = datetime.now() - timedelta(days=90)
            
            cursor.execute("""
                DELETE FROM notifications 
                WHERE created_at < %s AND is_read = TRUE
            """, (cutoff_date,))
            
            deleted_count = cursor.rowcount
            
            log_activity('INFO', f'Notification cleanup: {deleted_count} old notifications deleted', 'notifications')
            
            return create_response(True, {
                'deleted_count': deleted_count,
                'message': f'Cleanup completed: {deleted_count} old notifications deleted'
            })
            
    except Exception as e:
        log_activity('ERROR', f'Notification cleanup error: {str(e)}', 'notifications')
        return create_response(False, error=f'Notification cleanup failed: {str(e)}', status_code=500)

# Utility functions for creating notifications
def create_notification(user_id, title, message, notification_type='info', data=None):
    """Tạo thông báo mới"""
    try:
        with get_db_cursor() as cursor:
            cursor.execute("""
                INSERT INTO notifications (user_id, title, message, type, data, created_at)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (user_id, title, message, notification_type, 
                  json.dumps(data) if data else None, datetime.now()))
            return True
    except Exception as e:
        log_activity('ERROR', f'Create notification error: {str(e)}', 'notifications')
        return False

def create_system_notification(title, message, notification_type='info', data=None):
    """Tạo thông báo hệ thống cho tất cả admin"""
    try:
        with get_db_cursor() as cursor:
            cursor.execute("SELECT id FROM users WHERE role = 'admin'")
            admin_ids = [row[0] for row in cursor.fetchall()]
            
            for admin_id in admin_ids:
                create_notification(admin_id, title, message, notification_type, data)
            
            return True
    except Exception as e:
        log_activity('ERROR', f'Create system notification error: {str(e)}', 'notifications')
        return False
