# Database Setup Instructions

## Quick Import Method

1. **Create PostgreSQL database:**
   ```sql
   CREATE DATABASE face_attendance_db;
   ```

2. **Import the complete schema:**
   ```bash
   psql -U postgres -d face_attendance_db -f database.sql
   ```

## Default Admin Account

After importing, you can login with:
- **Username:** `admin`
- **Password:** `admin123`
- **Email:** `admin@company.com`

⚠️ **IMPORTANT:** Change the admin password immediately after first login!

## Sample Users (Optional)

The database also includes sample users:
- **Username:** `john_doe` / **Password:** `user123`
- **Username:** `jane_smith` / **Password:** `user123`

## Environment Configuration

Make sure your `.env` file has the correct database settings:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=face_attendance_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password
JWT_SECRET_KEY=your_jwt_secret_key
SECRET_KEY=your_secret_key
```

## Start the Backend

After database import:
```bash
python run.py
```

The admin login should now work properly!
