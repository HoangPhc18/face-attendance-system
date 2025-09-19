-- Migration script để cập nhật database với network access control
-- Chạy script này để cập nhật database hiện tại

-- 1. Thêm các columns mới cho network access control
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS allow_password_login BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS allow_face_only BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS require_password_for_external BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS employee_id VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS department VARCHAR(100),
ADD COLUMN IF NOT EXISTS position VARCHAR(100);

-- 2. Cập nhật password_hash để cho phép NULL
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- 3. Cập nhật existing users với logic mới
-- Admin users
UPDATE users 
SET 
    allow_password_login = TRUE,
    allow_face_only = TRUE,
    require_password_for_external = FALSE,
    employee_id = CONCAT('ADMIN', LPAD(id, 3, '0')),
    department = 'IT Department',
    position = CASE 
        WHEN role = 'admin' THEN 'System Administrator'
        ELSE position
    END
WHERE role = 'admin';

-- Regular users với password
UPDATE users 
SET 
    allow_password_login = TRUE,
    allow_face_only = TRUE,
    require_password_for_external = TRUE,
    employee_id = CONCAT('EMP', LPAD(id, 3, '0')),
    department = COALESCE(department, 'General'),
    position = COALESCE(position, 'Employee')
WHERE role = 'user' AND password_hash IS NOT NULL;

-- Regular users không có password (face-only)
UPDATE users 
SET 
    allow_password_login = FALSE,
    allow_face_only = TRUE,
    require_password_for_external = TRUE,
    employee_id = CONCAT('EMP', LPAD(id, 3, '0')),
    department = COALESCE(department, 'General'),
    position = COALESCE(position, 'Employee')
WHERE role = 'user' AND password_hash IS NULL;

-- 4. Tạo indexes mới
CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users(employee_id);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);
CREATE INDEX IF NOT EXISTS idx_users_access_flags ON users(allow_password_login, allow_face_only, require_password_for_external);

-- 5. Hiển thị kết quả migration
SELECT 
    'Migration completed successfully' as status,
    COUNT(*) as total_users,
    SUM(CASE WHEN allow_password_login = TRUE THEN 1 ELSE 0 END) as password_login_users,
    SUM(CASE WHEN allow_face_only = TRUE THEN 1 ELSE 0 END) as face_only_users,
    SUM(CASE WHEN require_password_for_external = TRUE THEN 1 ELSE 0 END) as external_restricted_users
FROM users;

-- 6. Hiển thị user types sau migration
SELECT 
    username,
    full_name,
    role,
    employee_id,
    department,
    position,
    CASE 
        WHEN password_hash IS NULL AND allow_face_only = TRUE THEN 'FACE_ONLY'
        WHEN password_hash IS NOT NULL AND allow_password_login = TRUE AND allow_face_only = TRUE THEN 'HYBRID'
        WHEN role = 'admin' THEN 'ADMIN'
        ELSE 'OTHER'
    END as user_type,
    allow_password_login,
    allow_face_only,
    require_password_for_external
FROM users
ORDER BY role DESC, username;
