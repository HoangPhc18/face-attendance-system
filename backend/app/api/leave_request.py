# Leave request API routes
from flask import Blueprint, request, jsonify
from datetime import datetime, date
from ..core.database import get_db_cursor
from ..core.utils import create_response, require_auth, validate_required_fields, log_activity

leave_request_bp = Blueprint('leave_request', __name__)

@leave_request_bp.route('/submit', methods=['POST'])
@require_auth
def submit_leave_request(current_user_id):
    """Submit a new leave request"""
    try:
        data = request.get_json()
        validate_required_fields(data, ['start_date', 'end_date', 'reason'])
        
        start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
        end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
        reason = data['reason']
        
        if start_date > end_date:
            return create_response(False, error='Start date cannot be after end date', status_code=400)
        
        with get_db_cursor() as cursor:
            cursor.execute("""
                INSERT INTO leave_requests (user_id, start_date, end_date, reason, status) 
                VALUES (%s, %s, %s, %s, 'pending') RETURNING id
            """, (current_user_id, start_date, end_date, reason))
            
            request_id = cursor.fetchone()[0]
            
            log_activity('INFO', f'Leave request submitted by user {current_user_id}', 'leave_request')
            
            return create_response(True, {
                'request_id': request_id,
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
                'reason': reason,
                'status': 'pending'
            }, message='Leave request submitted successfully')
            
    except ValueError as e:
        return create_response(False, error=str(e), status_code=400)
    except Exception as e:
        log_activity('ERROR', f'Leave request submission error: {str(e)}', 'leave_request')
        return create_response(False, error=f'Failed to submit leave request: {str(e)}', status_code=500)

@leave_request_bp.route('/list', methods=['GET'])
@require_auth
def get_leave_requests(current_user_id):
    """Get leave requests for current user"""
    try:
        with get_db_cursor() as cursor:
            cursor.execute("""
                SELECT id, start_date, end_date, reason, status, created_at, updated_at
                FROM leave_requests 
                WHERE user_id = %s 
                ORDER BY created_at DESC
            """, (current_user_id,))
            
            requests = cursor.fetchall()
            
            request_data = []
            for req in requests:
                request_data.append({
                    'id': req[0],
                    'start_date': req[1].isoformat() if req[1] else None,
                    'end_date': req[2].isoformat() if req[2] else None,
                    'reason': req[3],
                    'status': req[4],
                    'created_at': req[5].isoformat() if req[5] else None,
                    'updated_at': req[6].isoformat() if req[6] else None
                })
            
            return create_response(True, {
                'requests': request_data,
                'count': len(request_data)
            })
            
    except Exception as e:
        return create_response(False, error=f'Failed to get leave requests: {str(e)}', status_code=500)

@leave_request_bp.route('/approve/<int:request_id>', methods=['POST'])
@require_auth
def approve_leave_request(current_user_id, request_id):
    """Approve a leave request (admin only)"""
    try:
        # Check if user is admin
        with get_db_cursor() as cursor:
            cursor.execute("SELECT role FROM users WHERE id = %s", (current_user_id,))
            user_role = cursor.fetchone()
            
            if not user_role or user_role[0] != 'admin':
                return create_response(False, error='Admin access required', status_code=403)
            
            # Update leave request status
            cursor.execute("""
                UPDATE leave_requests 
                SET status = 'approved', updated_at = %s 
                WHERE id = %s
            """, (datetime.now(), request_id))
            
            if cursor.rowcount == 0:
                return create_response(False, error='Leave request not found', status_code=404)
            
            log_activity('INFO', f'Leave request {request_id} approved by admin {current_user_id}', 'leave_request')
            
            return create_response(True, message='Leave request approved successfully')
            
    except Exception as e:
        return create_response(False, error=f'Failed to approve leave request: {str(e)}', status_code=500)
