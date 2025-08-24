# Statistics API routes
from flask import Blueprint, request, jsonify
from datetime import datetime, date, timedelta
from ..core.database import get_db_cursor
from ..core.utils import create_response, require_external_auth, validate_required_fields, log_activity
import calendar

statistics_bp = Blueprint('statistics', __name__)

@statistics_bp.route('/attendance/monthly', methods=['GET'])
@require_external_auth
def get_monthly_attendance_stats(current_user_id):
    """Thống kê chấm công theo tháng"""
    try:
        month = request.args.get('month', type=int, default=datetime.now().month)
        year = request.args.get('year', type=int, default=datetime.now().year)
        user_id = request.args.get('user_id')
        
        with get_db_cursor() as cursor:
            cursor.execute("SELECT role FROM users WHERE id = %s", (current_user_id,))
            user_role = cursor.fetchone()
            
            if user_id and user_id != str(current_user_id):
                if not user_role or user_role[0] != 'admin':
                    return create_response(False, error='Admin access required', status_code=403)
            
            # Lấy số ngày trong tháng
            days_in_month = calendar.monthrange(year, month)[1]
            
            # Query cơ bản
            base_query = """
                SELECT 
                    DATE(a.date) as attendance_date,
                    COUNT(DISTINCT a.user_id) as total_checkins,
                    AVG(CASE WHEN a.total_hours IS NOT NULL THEN a.total_hours ELSE 0 END) as avg_hours,
                    COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
                    COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_count,
                    COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count
                FROM attendance a
                WHERE EXTRACT(MONTH FROM a.date) = %s 
                AND EXTRACT(YEAR FROM a.date) = %s
            """
            params = [month, year]
            
            if user_id:
                base_query += " AND a.user_id = %s"
                params.append(user_id)
            elif user_role and user_role[0] != 'admin':
                base_query += " AND a.user_id = %s"
                params.append(current_user_id)
            
            base_query += " GROUP BY DATE(a.date) ORDER BY attendance_date"
            
            cursor.execute(base_query, params)
            daily_stats = cursor.fetchall()
            
            # Thống kê tổng quan
            cursor.execute("""
                SELECT 
                    COUNT(DISTINCT user_id) as unique_users,
                    SUM(CASE WHEN total_hours IS NOT NULL THEN total_hours ELSE 0 END) as total_hours,
                    COUNT(CASE WHEN status = 'present' THEN 1 END) as total_present,
                    COUNT(CASE WHEN status = 'late' THEN 1 END) as total_late,
                    COUNT(CASE WHEN status = 'absent' THEN 1 END) as total_absent,
                    AVG(CASE WHEN total_hours IS NOT NULL THEN total_hours ELSE 0 END) as avg_daily_hours
                FROM attendance
                WHERE EXTRACT(MONTH FROM date) = %s 
                AND EXTRACT(YEAR FROM date) = %s
            """ + (" AND user_id = %s" if (user_id or (user_role and user_role[0] != 'admin')) else ""), 
            params)
            
            summary = cursor.fetchone()
            
            # Tạo dữ liệu cho tất cả các ngày trong tháng
            daily_data = {}
            for stat in daily_stats:
                daily_data[stat[0].day] = {
                    'date': stat[0].strftime('%Y-%m-%d'),
                    'total_checkins': stat[1],
                    'avg_hours': round(float(stat[2] or 0), 2),
                    'present_count': stat[3],
                    'late_count': stat[4],
                    'absent_count': stat[5]
                }
            
            # Điền dữ liệu cho các ngày không có chấm công
            full_month_data = []
            for day in range(1, days_in_month + 1):
                if day in daily_data:
                    full_month_data.append(daily_data[day])
                else:
                    date_str = f"{year}-{month:02d}-{day:02d}"
                    full_month_data.append({
                        'date': date_str,
                        'total_checkins': 0,
                        'avg_hours': 0,
                        'present_count': 0,
                        'late_count': 0,
                        'absent_count': 0
                    })
            
            return create_response(True, {
                'period': f"{month:02d}/{year}",
                'summary': {
                    'unique_users': summary[0] if summary else 0,
                    'total_hours': round(float(summary[1] or 0), 2) if summary else 0,
                    'total_present': summary[2] if summary else 0,
                    'total_late': summary[3] if summary else 0,
                    'total_absent': summary[4] if summary else 0,
                    'avg_daily_hours': round(float(summary[5] or 0), 2) if summary else 0,
                    'working_days': len([d for d in daily_stats if d[1] > 0])
                },
                'daily_data': full_month_data
            })
            
    except Exception as e:
        log_activity('ERROR', f'Monthly attendance stats error: {str(e)}', 'statistics')
        return create_response(False, error=f'Failed to get monthly stats: {str(e)}', status_code=500)

@statistics_bp.route('/attendance/trends', methods=['GET'])
@require_external_auth
def get_attendance_trends(current_user_id):
    """Thống kê xu hướng chấm công theo thời gian"""
    try:
        period = request.args.get('period', 'month')  # week, month, quarter, year
        limit = request.args.get('limit', type=int, default=12)
        user_id = request.args.get('user_id')
        
        with get_db_cursor() as cursor:
            cursor.execute("SELECT role FROM users WHERE id = %s", (current_user_id,))
            user_role = cursor.fetchone()
            
            if user_id and user_id != str(current_user_id):
                if not user_role or user_role[0] != 'admin':
                    return create_response(False, error='Admin access required', status_code=403)
            
            # Xây dựng query theo period
            if period == 'week':
                date_format = "DATE_TRUNC('week', date)"
                date_label = "TO_CHAR(DATE_TRUNC('week', date), 'YYYY-\"W\"WW')"
            elif period == 'month':
                date_format = "DATE_TRUNC('month', date)"
                date_label = "TO_CHAR(DATE_TRUNC('month', date), 'YYYY-MM')"
            elif period == 'quarter':
                date_format = "DATE_TRUNC('quarter', date)"
                date_label = "TO_CHAR(DATE_TRUNC('quarter', date), 'YYYY-\"Q\"Q')"
            elif period == 'year':
                date_format = "DATE_TRUNC('year', date)"
                date_label = "TO_CHAR(DATE_TRUNC('year', date), 'YYYY')"
            else:
                return create_response(False, error='Invalid period', status_code=400)
            
            query = f"""
                SELECT 
                    {date_label} as period_label,
                    {date_format} as period_date,
                    COUNT(DISTINCT user_id) as unique_users,
                    COUNT(*) as total_records,
                    SUM(CASE WHEN total_hours IS NOT NULL THEN total_hours ELSE 0 END) as total_hours,
                    AVG(CASE WHEN total_hours IS NOT NULL THEN total_hours ELSE 0 END) as avg_hours,
                    COUNT(CASE WHEN status = 'present' THEN 1 END) as present_count,
                    COUNT(CASE WHEN status = 'late' THEN 1 END) as late_count,
                    COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_count
                FROM attendance
                WHERE 1=1
            """
            params = []
            
            if user_id:
                query += " AND user_id = %s"
                params.append(user_id)
            elif user_role and user_role[0] != 'admin':
                query += " AND user_id = %s"
                params.append(current_user_id)
            
            query += f"""
                GROUP BY {date_format}, {date_label}
                ORDER BY period_date DESC
                LIMIT %s
            """
            params.append(limit)
            
            cursor.execute(query, params)
            trends = cursor.fetchall()
            
            trend_data = []
            for trend in trends:
                attendance_rate = 0
                if trend[1]:  # total_records
                    attendance_rate = round((trend[6] + trend[7]) / trend[3] * 100, 2)  # (present + late) / total
                
                trend_data.append({
                    'period': trend[0],
                    'unique_users': trend[2],
                    'total_records': trend[3],
                    'total_hours': round(float(trend[4] or 0), 2),
                    'avg_hours': round(float(trend[5] or 0), 2),
                    'present_count': trend[6],
                    'late_count': trend[7],
                    'absent_count': trend[8],
                    'attendance_rate': attendance_rate
                })
            
            return create_response(True, {
                'period_type': period,
                'trends': trend_data
            })
            
    except Exception as e:
        log_activity('ERROR', f'Attendance trends error: {str(e)}', 'statistics')
        return create_response(False, error=f'Failed to get attendance trends: {str(e)}', status_code=500)

@statistics_bp.route('/users/performance', methods=['GET'])
@require_external_auth
def get_user_performance_stats(current_user_id):
    """Thống kê hiệu suất làm việc của nhân viên"""
    try:
        period_days = request.args.get('days', type=int, default=30)
        limit = request.args.get('limit', type=int, default=10)
        
        with get_db_cursor() as cursor:
            cursor.execute("SELECT role FROM users WHERE id = %s", (current_user_id,))
            user_role = cursor.fetchone()
            
            if not user_role or user_role[0] != 'admin':
                return create_response(False, error='Admin access required', status_code=403)
            
            end_date = date.today()
            start_date = end_date - timedelta(days=period_days)
            
            cursor.execute("""
                SELECT 
                    u.id,
                    u.username,
                    u.full_name,
                    COUNT(a.id) as total_days,
                    SUM(CASE WHEN a.total_hours IS NOT NULL THEN a.total_hours ELSE 0 END) as total_hours,
                    AVG(CASE WHEN a.total_hours IS NOT NULL THEN a.total_hours ELSE 0 END) as avg_daily_hours,
                    COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_days,
                    COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_days,
                    COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_days,
                    CASE 
                        WHEN COUNT(a.id) > 0 THEN 
                            ROUND((COUNT(CASE WHEN a.status IN ('present', 'late') THEN 1 END) * 100.0 / COUNT(a.id)), 2)
                        ELSE 0 
                    END as attendance_rate
                FROM users u
                LEFT JOIN attendance a ON u.id = a.user_id 
                    AND a.date >= %s AND a.date <= %s
                WHERE u.role = 'user'
                GROUP BY u.id, u.username, u.full_name
                ORDER BY total_hours DESC, attendance_rate DESC
                LIMIT %s
            """, (start_date, end_date, limit))
            
            performance_data = []
            for user in cursor.fetchall():
                performance_data.append({
                    'user_id': user[0],
                    'username': user[1],
                    'full_name': user[2],
                    'total_days': user[3],
                    'total_hours': round(float(user[4] or 0), 2),
                    'avg_daily_hours': round(float(user[5] or 0), 2),
                    'present_days': user[6],
                    'late_days': user[7],
                    'absent_days': user[8],
                    'attendance_rate': float(user[9] or 0)
                })
            
            return create_response(True, {
                'period': f"{start_date} to {end_date}",
                'period_days': period_days,
                'performance_data': performance_data
            })
            
    except Exception as e:
        log_activity('ERROR', f'User performance stats error: {str(e)}', 'statistics')
        return create_response(False, error=f'Failed to get performance stats: {str(e)}', status_code=500)

@statistics_bp.route('/system/overview', methods=['GET'])
@require_external_auth
def get_system_overview(current_user_id):
    """Tổng quan hệ thống"""
    try:
        with get_db_cursor() as cursor:
            cursor.execute("SELECT role FROM users WHERE id = %s", (current_user_id,))
            user_role = cursor.fetchone()
            
            if not user_role or user_role[0] != 'admin':
                return create_response(False, error='Admin access required', status_code=403)
            
            today = date.today()
            this_month = today.replace(day=1)
            last_month = (this_month - timedelta(days=1)).replace(day=1)
            
            # Tổng số người dùng
            cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'user'")
            total_users = cursor.fetchone()[0]
            
            # Người dùng hoạt động (có chấm công trong 30 ngày)
            cursor.execute("""
                SELECT COUNT(DISTINCT user_id) FROM attendance 
                WHERE date >= %s
            """, (today - timedelta(days=30),))
            active_users = cursor.fetchone()[0]
            
            # Chấm công hôm nay
            cursor.execute("""
                SELECT COUNT(DISTINCT user_id) FROM attendance 
                WHERE date = %s
            """, (today,))
            today_checkins = cursor.fetchone()[0]
            
            # Tổng giờ làm tháng này
            cursor.execute("""
                SELECT COALESCE(SUM(total_hours), 0) FROM attendance 
                WHERE date >= %s
            """, (this_month,))
            month_hours = float(cursor.fetchone()[0] or 0)
            
            # So sánh với tháng trước
            cursor.execute("""
                SELECT COALESCE(SUM(total_hours), 0) FROM attendance 
                WHERE date >= %s AND date < %s
            """, (last_month, this_month))
            last_month_hours = float(cursor.fetchone()[0] or 0)
            
            # Đơn xin nghỉ
            cursor.execute("""
                SELECT status, COUNT(*) FROM leave_requests 
                GROUP BY status
            """)
            leave_stats = dict(cursor.fetchall())
            
            # Khuôn mặt đã đăng ký
            cursor.execute("SELECT COUNT(*) FROM faces")
            registered_faces = cursor.fetchone()[0]
            
            # Khuôn mặt chờ xử lý
            cursor.execute("SELECT COUNT(*) FROM pending_faces")
            pending_faces = cursor.fetchone()[0]
            
            # Tính phần trăm thay đổi
            hours_change = 0
            if last_month_hours > 0:
                hours_change = round((month_hours - last_month_hours) / last_month_hours * 100, 2)
            
            return create_response(True, {
                'users': {
                    'total': total_users,
                    'active': active_users,
                    'activity_rate': round(active_users / total_users * 100, 2) if total_users > 0 else 0
                },
                'attendance': {
                    'today_checkins': today_checkins,
                    'month_hours': round(month_hours, 2),
                    'last_month_hours': round(last_month_hours, 2),
                    'hours_change_percent': hours_change
                },
                'leave_requests': {
                    'pending': leave_stats.get('pending', 0),
                    'approved': leave_stats.get('approved', 0),
                    'rejected': leave_stats.get('rejected', 0),
                    'total': sum(leave_stats.values())
                },
                'faces': {
                    'registered': registered_faces,
                    'pending': pending_faces
                },
                'generated_at': datetime.now().isoformat()
            })
            
    except Exception as e:
        log_activity('ERROR', f'System overview error: {str(e)}', 'statistics')
        return create_response(False, error=f'Failed to get system overview: {str(e)}', status_code=500)
