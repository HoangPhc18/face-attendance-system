# AI integration API routes
from flask import Blueprint, request, jsonify
from datetime import datetime, date
from ..core.database import get_db_cursor
from ..core.utils import create_response, require_external_auth, validate_required_fields, log_activity
from ..ai_integration.ai_integration import calculate_salary, get_chatbot_response

ai_bp = Blueprint('ai_integration', __name__)

@ai_bp.route('/calculate-salary', methods=['POST'])
@require_external_auth
def calculate_user_salary(current_user_id):
    """Calculate salary using AI"""
    try:
        data = request.get_json()
        validate_required_fields(data, ['month', 'year'])
        
        month = int(data['month'])
        year = int(data['year'])
        user_id = data.get('user_id', current_user_id)
        
        # Check if user is admin or requesting own salary
        with get_db_cursor() as cursor:
            cursor.execute("SELECT role FROM users WHERE id = %s", (current_user_id,))
            user_role = cursor.fetchone()
            
            if user_id != current_user_id and (not user_role or user_role[0] != 'admin'):
                return create_response(False, error='Access denied', status_code=403)
            
            # Get attendance data for the month
            cursor.execute("""
                SELECT a.date, a.check_in_time, a.check_out_time, a.status,
                       u.username, u.full_name
                FROM attendance a
                JOIN users u ON a.user_id = u.id
                WHERE a.user_id = %s 
                AND EXTRACT(MONTH FROM a.date) = %s 
                AND EXTRACT(YEAR FROM a.date) = %s
                ORDER BY a.date
            """, (user_id, month, year))
            
            attendance_records = cursor.fetchall()
            
            if not attendance_records:
                return create_response(False, error='No attendance records found for the specified period', status_code=404)
            
            # Calculate salary using AI
            salary_data = calculate_salary(attendance_records, month, year)
            
            # Store AI report
            cursor.execute("""
                INSERT INTO ai_reports (user_id, report_type, content) 
                VALUES (%s, 'salary_calculation', %s)
            """, (user_id, str(salary_data)))
            
            log_activity('INFO', f'Salary calculated for user {user_id} for {month}/{year}', 'ai_integration')
            
            return create_response(True, salary_data)
            
    except ValueError as e:
        return create_response(False, error=str(e), status_code=400)
    except Exception as e:
        log_activity('ERROR', f'Salary calculation error: {str(e)}', 'ai_integration')
        return create_response(False, error=f'Salary calculation failed: {str(e)}', status_code=500)

@ai_bp.route('/chatbot', methods=['POST'])
@require_external_auth
def chatbot(current_user_id):
    """AI chatbot endpoint"""
    try:
        data = request.get_json()
        validate_required_fields(data, ['message'])
        
        user_message = data['message']
        
        # Get user context
        with get_db_cursor() as cursor:
            cursor.execute(
                "SELECT username, full_name, role FROM users WHERE id = %s",
                (current_user_id,)
            )
            user_info = cursor.fetchone()
            
            if not user_info:
                return create_response(False, error='User not found', status_code=404)
            
            # Get chatbot response
            response = get_chatbot_response(user_message, {
                'user_id': current_user_id,
                'username': user_info[0],
                'full_name': user_info[1],
                'role': user_info[2]
            })
            
            log_activity('INFO', f'Chatbot interaction by user {current_user_id}', 'ai_integration')
            
            return create_response(True, {
                'message': user_message,
                'response': response,
                'timestamp': datetime.now().isoformat()
            })
            
    except ValueError as e:
        return create_response(False, error=str(e), status_code=400)
    except Exception as e:
        log_activity('ERROR', f'Chatbot error: {str(e)}', 'ai_integration')
        return create_response(False, error=f'Chatbot request failed: {str(e)}', status_code=500)
