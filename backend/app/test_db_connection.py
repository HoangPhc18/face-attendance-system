import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text

# Load biến môi trường từ .env
load_dotenv()

def test_db_connection():
    db_url = os.getenv("DATABASE_URL")

    if not db_url:
        print("❌ Không tìm thấy biến DATABASE_URL trong .env")
        return

    try:
        # Tạo engine kết nối DB
        engine = create_engine(db_url)
        
        # Mở kết nối thử
        with engine.connect() as connection:
            result = connection.execute(text("SELECT version();"))
            version = result.fetchone()
            print("✅ Kết nối thành công tới PostgreSQL!")
            print("🔢 Phiên bản:", version[0])

    except SQLAlchemyError as e:
        print("❌ Kết nối thất bại:")
        print(e)

if __name__ == "__main__":
    test_db_connection()
