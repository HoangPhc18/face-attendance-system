# Admin API routes
from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from ..core.database import get_db_cursor
from ..core.utils import create_response, require_admin, validate_required_fields, log_activity
import bcrypt

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/users', methods=['GET'])
@require_admin
def get_users(current_user_id):
    """Get all users (admin only)"""
    try:
        with get_db_cursor() as cursor:
            # Get all users
            cursor.execute("""
                SELECT id, username, full_name, email, role, created_at, updated_at
                FROM users 
                ORDER BY created_at DESC
            """)
            
            users = cursor.fetchall()
            
            user_data = []
            for user in users:
                user_data.append({
                    'id': user[0],
                    'username': user[1],
                    'full_name': user[2],
                    'email': user[3],
                    'role': user[4],
                    'created_at': user[5].isoformat() if user[5] else None,
                    'updated_at': user[6].isoformat() if user[6] else None
                })
            
            return create_response(True, {
                'users': user_data,
                'count': len(user_data)
            })
            
    except Exception as e:
        return create_response(False, error=f'Failed to get users: {str(e)}', status_code=500)

@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@require_admin
def update_user(current_user_id, user_id):
    """Update user information (admin only)"""
    try:
        with get_db_cursor() as cursor:
            data = request.get_json()
            allowed_fields = ['username', 'full_name', 'email', 'role']
            
            update_fields = []
            update_values = []
            
            for field in allowed_fields:
                if field in data:
                    update_fields.append(f"{field} = %s")
                    update_values.append(data[field])
            
            if not update_fields:
                return create_response(False, error='No valid fields to update', status_code=400)
            
            update_values.append(datetime.now())
            update_values.append(user_id)
            
            query = f"""
                UPDATE users 
                SET {', '.join(update_fields)}, updated_at = %s 
                WHERE id = %s
            """
            
            cursor.execute(query, update_values)
            
            if cursor.rowcount == 0:
                return create_response(False, error='User not found', status_code=404)
            
            log_activity('INFO', f'User {user_id} updated by admin {current_user_id}', 'admin')
            
            return create_response(True, message='User updated successfully')
            
    except Exception as e:
        return create_response(False, error=f'Failed to update user: {str(e)}', status_code=500)

@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@require_admin
def delete_user(current_user_id, user_id):
    """Delete user (admin only)"""
    try:
        with get_db_cursor() as cursor:
            # Prevent admin from deleting themselves
            if user_id == current_user_id:
                return create_response(False, error='Cannot delete your own account', status_code=400)
            
            # Delete user (cascade will handle related records)
            cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
            
            if cursor.rowcount == 0:
                return create_response(False, error='User not found', status_code=404)
            
            log_activity('INFO', f'User {user_id} deleted by admin {current_user_id}', 'admin')
            
            return create_response(True, message='User deleted successfully')
            
    except Exception as e:
        return create_response(False, error=f'Failed to delete user: {str(e)}', status_code=500)

@admin_bp.route('/leave-requests', methods=['GET'])
@require_admin
def get_all_leave_requests(current_user_id):
    """Get all leave requests (admin only)"""
    try:
        with get_db_cursor() as cursor:
            cursor.execute("""
                SELECT lr.id, lr.user_id, u.username, u.full_name,
                       lr.start_date, lr.end_date, lr.reason, lr.status,
                       lr.created_at, lr.updated_at
                FROM leave_requests lr
                JOIN users u ON lr.user_id = u.id
                ORDER BY lr.created_at DESC
            """)
            
            requests = cursor.fetchall()
            
            request_data = []
            for req in requests:
                request_data.append({
                    'id': req[0],
                    'user_id': req[1],
                    'username': req[2],
                    'full_name': req[3],
                    'start_date': req[4].isoformat() if req[4] else None,
                    'end_date': req[5].isoformat() if req[5] else None,
                    'reason': req[6],
                    'status': req[7],
                    'created_at': req[8].isoformat() if req[8] else None,
                    'updated_at': req[9].isoformat() if req[9] else None
                })
            
            return create_response(True, {
                'requests': request_data,
                'count': len(request_data)
            })
            
    except Exception as e:
        return create_response(False, error=f'Failed to get leave requests: {str(e)}', status_code=500)

@admin_bp.route('/leave-requests/<int:request_id>/approve', methods=['PUT'])
@require_admin
def approve_leave_request(current_user_id, request_id):
    """Approve leave request (admin only)"""
    try:
        with get_db_cursor() as cursor:
            cursor.execute("""
                UPDATE leave_requests 
                SET status = 'approved', updated_at = %s 
                WHERE id = %s
            """, (datetime.now(), request_id))
            
            if cursor.rowcount == 0:
                return create_response(False, error='Leave request not found', status_code=404)
            
            log_activity('INFO', f'Leave request {request_id} approved by admin {current_user_id}', 'admin')
            
            return create_response(True, message='Leave request approved successfully')
            
    except Exception as e:
        return create_response(False, error=f'Failed to approve leave request: {str(e)}', status_code=500)

@admin_bp.route('/leave-requests/<int:request_id>/reject', methods=['PUT'])
@require_admin
def reject_leave_request(current_user_id, request_id):
    """Reject leave request (admin only)"""
    try:
        data = request.get_json()
        rejection_reason = data.get('reason', 'No reason provided')
        
        with get_db_cursor() as cursor:
            cursor.execute("""
                UPDATE leave_requests 
                SET status = 'rejected', rejection_reason = %s, updated_at = %s 
                WHERE id = %s
            """, (rejection_reason, datetime.now(), request_id))
            
            if cursor.rowcount == 0:
                return create_response(False, error='Leave request not found', status_code=404)
            
            log_activity('INFO', f'Leave request {request_id} rejected by admin {current_user_id}', 'admin')
            
            return create_response(True, message='Leave request rejected successfully')
            
    except Exception as e:
        return create_response(False, error=f'Failed to reject leave request: {str(e)}', status_code=500)

@admin_bp.route('/users', methods=['POST'])
@require_admin
def create_user(current_user_id):
    """Create new user (admin only)"""
    try:
        data = request.get_json()
        required_fields = ['username', 'full_name', 'email', 'password']
        
        if not validate_required_fields(data, required_fields):
            return create_response(False, error='Missing required fields', status_code=400)
        
        with get_db_cursor() as cursor:
            # Check if username or email already exists
            cursor.execute("""
                SELECT id FROM users WHERE username = %s OR email = %s
            """, (data['username'], data['email']))
            
            if cursor.fetchone():
                return create_response(False, error='Username or email already exists', status_code=400)
            
            # Hash password
            hashed_password = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt())
            
            # Create user
            cursor.execute("""
                INSERT INTO users (username, full_name, email, password_hash, role, created_at)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                data['username'],
                data['full_name'], 
                data['email'],
                hashed_password.decode('utf-8'),
                data.get('role', 'user'),
                datetime.now()
            ))
            
            user_id = cursor.fetchone()[0]
            
            log_activity('INFO', f'User {user_id} created by admin {current_user_id}', 'admin')
            
            return create_response(True, {
                'message': 'User created successfully',
                'user_id': user_id
            })
            
    except Exception as e:
        return create_response(False, error=f'Failed to create user: {str(e)}', status_code=500)

@admin_bp.route('/users/<int:user_id>/reset-password', methods=['PUT'])
@require_admin
def reset_user_password(current_user_id, user_id):
    """Reset user password (admin only)"""
    try:
        data = request.get_json()
        new_password = data.get('password')
        
        if not new_password:
            return create_response(False, error='New password is required', status_code=400)
        
        with get_db_cursor() as cursor:
            # Hash new password
            hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
            
            cursor.execute("""
                UPDATE users 
                SET password_hash = %s, updated_at = %s 
                WHERE id = %s
            """, (hashed_password.decode('utf-8'), datetime.now(), user_id))
            
            if cursor.rowcount == 0:
                return create_response(False, error='User not found', status_code=404)
            
            log_activity('INFO', f'Password reset for user {user_id} by admin {current_user_id}', 'admin')
            
            return create_response(True, message='Password reset successfully')
            
    except Exception as e:
        return create_response(False, error=f'Failed to reset password: {str(e)}', status_code=500)

@admin_bp.route('/dashboard/stats', methods=['GET'])
@require_admin
def get_admin_dashboard_stats(current_user_id):
    """Get admin dashboard statistics"""
    try:
        with get_db_cursor() as cursor:
            stats = {}
            
            # Total users
            cursor.execute("SELECT COUNT(*) FROM users")
            stats['total_users'] = cursor.fetchone()[0]
            
            # Total attendance records today
            today = datetime.now().date()
            cursor.execute("""
                SELECT COUNT(*) FROM attendance 
                WHERE DATE(check_in_time) = %s
            """, (today,))
            stats['today_attendance'] = cursor.fetchone()[0]
            
            # Pending leave requests
            cursor.execute("""
                SELECT COUNT(*) FROM leave_requests 
                WHERE status = 'pending'
            """, )
            stats['pending_leave_requests'] = cursor.fetchone()[0]
            
            # Active users (logged in last 7 days)
            week_ago = datetime.now() - timedelta(days=7)
            cursor.execute("""
                SELECT COUNT(DISTINCT user_id) FROM attendance 
                WHERE check_in_time >= %s
            """, (week_ago,))
            stats['active_users_week'] = cursor.fetchone()[0]
            
            # Recent activities
            cursor.execute("""
                SELECT u.full_name, a.check_in_time, a.check_out_time
                FROM attendance a
                JOIN users u ON a.user_id = u.id
                ORDER BY a.check_in_time DESC
                LIMIT 10
            """)
            
            recent_activities = []
            for activity in cursor.fetchall():
                recent_activities.append({
                    'user_name': activity[0],
                    'check_in': activity[1].isoformat() if activity[1] else None,
                    'check_out': activity[2].isoformat() if activity[2] else None
                })
            
            stats['recent_activities'] = recent_activities
            
            return create_response(True, stats)
            
    except Exception as e:
        return create_response(False, error=f'Failed to get dashboard stats: {str(e)}', status_code=500)

@admin_bp.route('/attendance/all', methods=['GET'])
@require_admin
def get_all_attendance(current_user_id):
    """Get all attendance records (admin only)"""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        offset = (page - 1) * limit
        
        with get_db_cursor() as cursor:
            # Get total count
            cursor.execute("SELECT COUNT(*) FROM attendance")
            total_count = cursor.fetchone()[0]
            
            # Get attendance records with pagination
            cursor.execute("""
                SELECT a.id, a.user_id, u.username, u.full_name,
                       a.check_in_time, a.check_out_time, a.work_hours,
                       a.created_at
                FROM attendance a
                JOIN users u ON a.user_id = u.id
                ORDER BY a.check_in_time DESC
                LIMIT %s OFFSET %s
            """, (limit, offset))
            
            attendance_records = []
            for record in cursor.fetchall():
                attendance_records.append({
                    'id': record[0],
                    'user_id': record[1],
                    'username': record[2],
                    'full_name': record[3],
                    'check_in_time': record[4].isoformat() if record[4] else None,
                    'check_out_time': record[5].isoformat() if record[5] else None,
                    'work_hours': float(record[6]) if record[6] else None,
                    'created_at': record[7].isoformat() if record[7] else None
                })
            
            return create_response(True, {
                'attendance_records': attendance_records,
                'pagination': {
                    'page': page,
                    'limit': limit,
                    'total': total_count,
                    'pages': (total_count + limit - 1) // limit
                }
            })
            
    except Exception as e:
        return create_response(False, error=f'Failed to get attendance records: {str(e)}', status_code=500)

@admin_bp.route('/system/logs', methods=['GET'])
@require_admin
def get_system_logs(current_user_id):
    """Get system activity logs (admin only)"""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 100))
        level = request.args.get('level', 'all')
        offset = (page - 1) * limit
        
        with get_db_cursor() as cursor:
            # Build query based on level filter
            where_clause = ""
            params = []
            
            if level != 'all':
                where_clause = "WHERE level = %s"
                params.append(level.upper())
            
            # Get total count
            count_query = f"SELECT COUNT(*) FROM logs {where_clause}"
            cursor.execute(count_query, params)
            total_count = cursor.fetchone()[0]
            
            # Get logs with pagination
            query = f"""
                SELECT id, level, message, category, created_at
                FROM logs {where_clause}
                ORDER BY created_at DESC
                LIMIT %s OFFSET %s
            """
            params.extend([limit, offset])
            cursor.execute(query, params)
            
            logs = []
            for log in cursor.fetchall():
                logs.append({
                    'id': log[0],
                    'level': log[1],
                    'message': log[2],
                    'category': log[3],
                    'created_at': log[4].isoformat() if log[4] else None
                })
            
            return create_response(True, {
                'logs': logs,
                'pagination': {
                    'page': page,
                    'limit': limit,
                    'total': total_count,
                    'pages': (total_count + limit - 1) // limit
                }
            })
            
    except Exception as e:
        return create_response(False, error=f'Failed to get system logs: {str(e)}', status_code=500)
