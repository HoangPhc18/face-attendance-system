# Admin API routes
from flask import Blueprint, request, jsonify
from datetime import datetime
from ..core.database import get_db_cursor
from ..core.utils import create_response, require_auth, validate_required_fields, log_activity

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/users', methods=['GET'])
@require_auth
def get_users(current_user_id):
    """Get all users (admin only)"""
    try:
        with get_db_cursor() as cursor:
            # Check if user is admin
            cursor.execute("SELECT role FROM users WHERE id = %s", (current_user_id,))
            user_role = cursor.fetchone()
            
            if not user_role or user_role[0] != 'admin':
                return create_response(False, error='Admin access required', status_code=403)
            
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
@require_auth
def update_user(current_user_id, user_id):
    """Update user information (admin only)"""
    try:
        with get_db_cursor() as cursor:
            # Check if user is admin
            cursor.execute("SELECT role FROM users WHERE id = %s", (current_user_id,))
            user_role = cursor.fetchone()
            
            if not user_role or user_role[0] != 'admin':
                return create_response(False, error='Admin access required', status_code=403)
            
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
@require_auth
def delete_user(current_user_id, user_id):
    """Delete user (admin only)"""
    try:
        with get_db_cursor() as cursor:
            # Check if user is admin
            cursor.execute("SELECT role FROM users WHERE id = %s", (current_user_id,))
            user_role = cursor.fetchone()
            
            if not user_role or user_role[0] != 'admin':
                return create_response(False, error='Admin access required', status_code=403)
            
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
@require_auth
def get_all_leave_requests(current_user_id):
    """Get all leave requests (admin only)"""
    try:
        with get_db_cursor() as cursor:
            # Check if user is admin
            cursor.execute("SELECT role FROM users WHERE id = %s", (current_user_id,))
            user_role = cursor.fetchone()
            
            if not user_role or user_role[0] != 'admin':
                return create_response(False, error='Admin access required', status_code=403)
            
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
