# Extended attendance API routes with additional endpoints
from flask import Blueprint, request, jsonify, g
from datetime import datetime, date, timedelta
from ..core.database import get_db_cursor
from ..core.utils import create_response, require_internal_network_only, external_network_limited_auth, require_admin, log_activity

attendance_extended_bp = Blueprint('attendance_extended', __name__)

@attendance_extended_bp.route('/status', methods=['GET'])
def get_attendance_status():
    """Get current attendance status for user"""
    try:
        # Get user_id from query parameters
        target_user_id = request.args.get('user_id')
        if not target_user_id:
            return create_response(False, error='User ID required', status_code=400)
        
        today = date.today()
        
        with get_db_cursor() as cursor:
            # Get today's attendance record
            cursor.execute("""
                SELECT id, check_in_time, check_out_time, status, date
                FROM attendance 
                WHERE user_id = %s AND date = %s
            """, (target_user_id, today))
            
            record = cursor.fetchone()
            
            # Get user info
            cursor.execute("""
                SELECT username, full_name FROM users WHERE id = %s
            """, (target_user_id,))
            
            user_info = cursor.fetchone()
            
            if not user_info:
                return create_response(False, error='User not found', status_code=404)
            
            status_info = {
                'user_id': target_user_id,
                'username': user_info[0],
                'full_name': user_info[1],
                'date': today.isoformat(),
                'is_checked_in': False,
                'check_in_time': None,
                'check_out_time': None,
                'status': 'absent',
                'network_type': 'internal' if hasattr(g, 'is_internal_network') and g.is_internal_network else 'external'
            }
            
            if record:
                status_info.update({
                    'is_checked_in': record[1] is not None,
                    'check_in_time': record[1].isoformat() if record[1] else None,
                    'check_out_time': record[2].isoformat() if record[2] else None,
                    'status': record[3]
                })
            
            return create_response(True, status_info)
            
    except Exception as e:
        return create_response(False, error=f'Failed to get attendance status: {str(e)}', status_code=500)

@attendance_extended_bp.route('/summary', methods=['GET'])
@external_network_limited_auth
def get_attendance_summary(current_user_id=None):
    """Get attendance summary for a period"""
    try:
        # Date range parameters
        start_date = request.args.get('start_date', (date.today() - timedelta(days=30)).isoformat())
        end_date = request.args.get('end_date', date.today().isoformat())
        
        # For external network, restrict to own records unless admin
        target_user_id = current_user_id
        can_view_all = False
        
        if current_user_id:
            with get_db_cursor() as cursor:
                cursor.execute("SELECT role FROM users WHERE id = %s", (current_user_id,))
                user_role = cursor.fetchone()
                can_view_all = user_role and user_role[0] == 'admin'
                
                if can_view_all:
                    target_user_id = request.args.get('user_id', current_user_id)
        else:
            # Internal network
            target_user_id = request.args.get('user_id')
            if not target_user_id:
                return create_response(False, error='User ID required', status_code=400)
        
        with get_db_cursor() as cursor:
            # Get attendance records for the period
            cursor.execute("""
                SELECT date, check_in_time, check_out_time, status
                FROM attendance 
                WHERE user_id = %s AND date BETWEEN %s AND %s
                ORDER BY date DESC
            """, (target_user_id, start_date, end_date))
            
            records = cursor.fetchall()
            
            # Calculate summary statistics
            total_days = len(records)
            present_days = len([r for r in records if r[3] == 'present'])
            absent_days = len([r for r in records if r[3] == 'absent'])
            late_days = len([r for r in records if r[1] and r[1].time() > datetime.strptime('09:00', '%H:%M').time()])
            
            # Calculate total working hours
            total_hours = 0
            for record in records:
                if record[1] and record[2]:  # Both check-in and check-out
                    check_in = datetime.combine(record[0], record[1].time())
                    check_out = datetime.combine(record[0], record[2].time())
                    hours = (check_out - check_in).total_seconds() / 3600
                    total_hours += hours
            
            summary = {
                'user_id': target_user_id,
                'period': {
                    'start_date': start_date,
                    'end_date': end_date
                },
                'statistics': {
                    'total_days': total_days,
                    'present_days': present_days,
                    'absent_days': absent_days,
                    'late_days': late_days,
                    'attendance_rate': round((present_days / max(total_days, 1)) * 100, 2),
                    'total_hours': round(total_hours, 2)
                },
                'network_type': 'internal' if hasattr(g, 'is_internal_network') and g.is_internal_network else 'external'
            }
            
            return create_response(True, summary)
            
    except Exception as e:
        return create_response(False, error=f'Failed to get attendance summary: {str(e)}', status_code=500)

@attendance_extended_bp.route('/manual-entry', methods=['POST'])
@require_admin
def manual_attendance_entry(current_user_id):
    """Manual attendance entry (admin only)"""
    try:
        data = request.get_json()
        required_fields = ['user_id', 'date', 'check_in_time']
        
        for field in required_fields:
            if field not in data:
                return create_response(False, error=f'Missing required field: {field}', status_code=400)
        
        user_id = data['user_id']
        entry_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        check_in_time = datetime.strptime(data['check_in_time'], '%H:%M').time()
        check_out_time = None
        
        if 'check_out_time' in data:
            check_out_time = datetime.strptime(data['check_out_time'], '%H:%M').time()
        
        status = data.get('status', 'present')
        
        with get_db_cursor() as cursor:
            # Check if user exists
            cursor.execute("SELECT username FROM users WHERE id = %s", (user_id,))
            user = cursor.fetchone()
            
            if not user:
                return create_response(False, error='User not found', status_code=404)
            
            # Check if attendance record already exists
            cursor.execute("""
                SELECT id FROM attendance WHERE user_id = %s AND date = %s
            """, (user_id, entry_date))
            
            existing = cursor.fetchone()
            
            check_in_datetime = datetime.combine(entry_date, check_in_time)
            check_out_datetime = datetime.combine(entry_date, check_out_time) if check_out_time else None
            
            if existing:
                # Update existing record
                cursor.execute("""
                    UPDATE attendance 
                    SET check_in_time = %s, check_out_time = %s, status = %s, updated_at = %s
                    WHERE id = %s
                """, (check_in_datetime, check_out_datetime, status, datetime.now(), existing[0]))
                
                action = 'updated'
            else:
                # Create new record
                cursor.execute("""
                    INSERT INTO attendance (user_id, check_in_time, check_out_time, date, status) 
                    VALUES (%s, %s, %s, %s, %s)
                """, (user_id, check_in_datetime, check_out_datetime, entry_date, status))
                
                action = 'created'
            
            log_activity('INFO', f'Manual attendance {action} for user {user_id} by admin {current_user_id}', 'attendance')
            
            return create_response(True, {
                'action': action,
                'user_id': user_id,
                'username': user[0],
                'date': entry_date.isoformat(),
                'check_in_time': check_in_time.strftime('%H:%M'),
                'check_out_time': check_out_time.strftime('%H:%M') if check_out_time else None,
                'status': status
            }, message=f'Attendance record {action} successfully')
            
    except ValueError as e:
        return create_response(False, error=f'Invalid date/time format: {str(e)}', status_code=400)
    except Exception as e:
        return create_response(False, error=f'Failed to create manual entry: {str(e)}', status_code=500)

@attendance_extended_bp.route('/bulk-update', methods=['POST'])
@require_admin
def bulk_attendance_update(current_user_id):
    """Bulk attendance update (admin only)"""
    try:
        data = request.get_json()
        
        if 'records' not in data or not isinstance(data['records'], list):
            return create_response(False, error='Records array required', status_code=400)
        
        records = data['records']
        updated_count = 0
        errors = []
        
        with get_db_cursor() as cursor:
            for i, record in enumerate(records):
                try:
                    user_id = record['user_id']
                    entry_date = datetime.strptime(record['date'], '%Y-%m-%d').date()
                    status = record.get('status', 'present')
                    
                    # Update or insert attendance record
                    cursor.execute("""
                        INSERT INTO attendance (user_id, date, status, check_in_time) 
                        VALUES (%s, %s, %s, %s)
                        ON CONFLICT (user_id, date) 
                        DO UPDATE SET status = EXCLUDED.status, updated_at = %s
                    """, (user_id, entry_date, status, datetime.now(), datetime.now()))
                    
                    updated_count += 1
                    
                except Exception as e:
                    errors.append(f'Record {i+1}: {str(e)}')
        
        log_activity('INFO', f'Bulk attendance update: {updated_count} records by admin {current_user_id}', 'attendance')
        
        result = {
            'updated_count': updated_count,
            'total_records': len(records)
        }
        
        if errors:
            result['errors'] = errors
        
        return create_response(True, result, 
                             message=f'Bulk update completed: {updated_count}/{len(records)} records updated')
        
    except Exception as e:
        return create_response(False, error=f'Bulk update failed: {str(e)}', status_code=500)
