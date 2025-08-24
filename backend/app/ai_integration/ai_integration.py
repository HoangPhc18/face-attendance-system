# ai_integration.py
# Module tích hợp AI
import os
from datetime import datetime, timedelta
from ..core.database import get_db_cursor

def calculate_salary(user_id, month=None, year=None):
    """Tính lương dựa trên dữ liệu chấm công"""
    if not month:
        month = datetime.now().month
    if not year:
        year = datetime.now().year
    
    try:
        with get_db_cursor() as cursor:
            # Lấy dữ liệu chấm công trong tháng
            cursor.execute("""
                SELECT 
                    COUNT(*) as total_days,
                    SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_days,
                    SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_days,
                    SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_days,
                    SUM(total_hours) as total_hours
                FROM attendance 
                WHERE user_id = %s 
                AND EXTRACT(MONTH FROM date) = %s 
                AND EXTRACT(YEAR FROM date) = %s
            """, (user_id, month, year))
            
            result = cursor.fetchone()
            if not result:
                return {
                    'user_id': user_id,
                    'month': month,
                    'year': year,
                    'basic_salary': 0,
                    'overtime_pay': 0,
                    'late_penalty': 0,
                    'total_salary': 0,
                    'attendance_summary': {}
                }
            
            total_days, present_days, late_days, absent_days, total_hours = result
            
            # Cấu hình lương (có thể lưu trong database hoặc config)
            BASIC_SALARY_PER_DAY = 500000  # 500k VND/ngày
            OVERTIME_RATE = 50000  # 50k VND/giờ
            LATE_PENALTY = 20000  # 20k VND/lần đi muộn
            
            # Tính toán
            basic_salary = present_days * BASIC_SALARY_PER_DAY
            overtime_hours = max(0, (total_hours or 0) - (present_days * 8))  # Giờ làm thêm
            overtime_pay = overtime_hours * OVERTIME_RATE
            late_penalty = late_days * LATE_PENALTY
            
            total_salary = basic_salary + overtime_pay - late_penalty
            
            return {
                'user_id': user_id,
                'month': month,
                'year': year,
                'basic_salary': basic_salary,
                'overtime_pay': overtime_pay,
                'late_penalty': late_penalty,
                'total_salary': total_salary,
                'attendance_summary': {
                    'total_days': total_days,
                    'present_days': present_days,
                    'late_days': late_days,
                    'absent_days': absent_days,
                    'total_hours': total_hours or 0,
                    'overtime_hours': overtime_hours
                }
            }
            
    except Exception as e:
        print(f"Error calculating salary: {e}")
        return None

def get_chatbot_response(message, user_id=None):
    """Chatbot AI response cho hệ thống chấm công"""
    try:
        # Phân tích intent từ message
        message_lower = message.lower()
        
        # Trả lời về chấm công
        if any(word in message_lower for word in ['chấm công', 'attendance', 'check in', 'check out']):
            return {
                'response': 'Để chấm công, bạn có thể sử dụng tính năng nhận diện khuôn mặt trên trang chính. Hệ thống sẽ tự động ghi nhận thời gian vào và ra của bạn.',
                'type': 'info',
                'suggestions': ['Hướng dẫn chấm công', 'Xem lịch sử chấm công', 'Báo cáo vấn đề']
            }
        
        # Trả lời về lương
        elif any(word in message_lower for word in ['lương', 'salary', 'tiền lương', 'thu nhập']):
            if user_id:
                salary_info = calculate_salary(user_id)
                if salary_info:
                    return {
                        'response': f'Lương tháng này của bạn: {salary_info["total_salary"]:,} VND. Bao gồm lương cơ bản: {salary_info["basic_salary"]:,} VND, làm thêm giờ: {salary_info["overtime_pay"]:,} VND, phạt đi muộn: {salary_info["late_penalty"]:,} VND.',
                        'type': 'success',
                        'data': salary_info
                    }
            return {
                'response': 'Để xem thông tin lương, vui lòng đăng nhập và truy cập mục "Báo cáo lương" trong dashboard.',
                'type': 'info'
            }
        
        # Trả lời về nghỉ phép
        elif any(word in message_lower for word in ['nghỉ phép', 'leave', 'xin nghỉ', 'đơn nghỉ']):
            return {
                'response': 'Để xin nghỉ phép, bạn có thể tạo đơn xin nghỉ trong mục "Quản lý nghỉ phép". Đơn sẽ được gửi đến quản lý để phê duyệt.',
                'type': 'info',
                'suggestions': ['Tạo đơn xin nghỉ', 'Xem trạng thái đơn nghỉ', 'Chính sách nghỉ phép']
            }
        
        # Trả lời về hệ thống
        elif any(word in message_lower for word in ['hệ thống', 'system', 'hướng dẫn', 'help']):
            return {
                'response': 'Hệ thống chấm công khuôn mặt giúp bạn: 1) Chấm công tự động bằng nhận diện khuôn mặt, 2) Theo dõi lịch sử làm việc, 3) Quản lý nghỉ phép, 4) Xem báo cáo lương. Bạn cần hỗ trợ gì cụ thể?',
                'type': 'info',
                'suggestions': ['Hướng dẫn sử dụng', 'Đăng ký khuôn mặt', 'Liên hệ hỗ trợ']
            }
        
        # Trả lời mặc định
        else:
            return {
                'response': 'Tôi là trợ lý AI của hệ thống chấm công. Tôi có thể hỗ trợ bạn về: chấm công, lương, nghỉ phép, và hướng dẫn sử dụng hệ thống. Bạn cần hỗ trợ gì?',
                'type': 'info',
                'suggestions': ['Hướng dẫn chấm công', 'Xem thông tin lương', 'Tạo đơn xin nghỉ', 'Hỗ trợ kỹ thuật']
            }
            
    except Exception as e:
        print(f"Error in chatbot response: {e}")
        return {
            'response': 'Xin lỗi, tôi gặp lỗi khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.',
            'type': 'error'
        }
