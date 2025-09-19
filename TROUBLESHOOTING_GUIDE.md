# 🔧 TROUBLESHOOTING GUIDE

## 🚨 **COMMON ISSUES & SOLUTIONS**

### **❌ Issue: API Login Returns 500 Error**

#### **🔍 Symptoms:**
```
Failed to load resource: the server responded with a status of 500 (INTERNAL SERVER ERROR)
:5000/api/auth/login:1
```

#### **🛠️ Solutions:**

##### **1. Check Database Connection:**
```bash
# Test database connection
cd backend
python debug_auth.py
```

##### **2. Verify Database Setup:**
```bash
# Setup fresh database
python setup_database.py

# Or import SQL manually
mysql -u root -p < database.sql
```

##### **3. Check Environment Variables:**
```bash
# Verify config.env file exists and has correct values
cat config.env

# Required variables:
DB_HOST=localhost
DB_PORT=3306
DB_NAME=face_attendance_db
DB_USER=root
DB_PASSWORD=your_password
JWT_SECRET_KEY=your-jwt-secret
```

##### **4. Test Simple Auth Server:**
```bash
# Run simple auth test
python simple_auth_test.py

# Test in another terminal
curl -X POST http://localhost:5001/test-auth \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

##### **5. Check Missing Dependencies:**
```bash
# Install required packages
pip install flask flask-cors mysql-connector-python bcrypt PyJWT python-dotenv
```

---

### **❌ Issue: Database Connection Failed**

#### **🔍 Symptoms:**
```
Database connection failed: connection to server failed
```

#### **🛠️ Solutions:**

##### **1. Start MySQL Service:**
```bash
# Windows
net start mysql

# Linux/Mac
sudo systemctl start mysql
# or
brew services start mysql
```

##### **2. Check MySQL Credentials:**
```bash
# Test MySQL connection
mysql -u root -p

# If password issues, reset MySQL password
```

##### **3. Create Database:**
```sql
-- Connect to MySQL and run:
CREATE DATABASE IF NOT EXISTS face_attendance_db;
USE face_attendance_db;
```

##### **4. Import Database Schema:**
```bash
# Import complete schema
mysql -u root -p face_attendance_db < database.sql
```

---

### **❌ Issue: React Router Warnings**

#### **🔍 Symptoms:**
```
React Router Future Flag Warning: React Router will begin wrapping state updates in React.startTransition in v7
```

#### **🛠️ Solutions:**

##### **1. Update Router Configuration:**
```javascript
// In your router setup
import { createBrowserRouter } from 'react-router-dom';

const router = createBrowserRouter([
  // your routes
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
});
```

##### **2. Or Suppress Warnings (Temporary):**
```javascript
// Add to index.js
console.warn = () => {}; // Suppress warnings (not recommended for production)
```

---

### **❌ Issue: Camera Access Denied**

#### **🔍 Symptoms:**
```
Error accessing camera: NotAllowedError: Permission denied
```

#### **🛠️ Solutions:**

##### **1. Enable Camera Permissions:**
- **Chrome**: Settings → Privacy and security → Site settings → Camera
- **Firefox**: Preferences → Privacy & Security → Permissions → Camera
- **Safari**: Preferences → Websites → Camera

##### **2. Use HTTPS in Production:**
```javascript
// Camera requires HTTPS in production
// Use localhost for development
```

##### **3. Check Camera Availability:**
```javascript
// Test camera access
navigator.mediaDevices.enumerateDevices()
  .then(devices => {
    const cameras = devices.filter(device => device.kind === 'videoinput');
    console.log('Available cameras:', cameras.length);
  });
```

---

### **❌ Issue: Network Detection Not Working**

#### **🔍 Symptoms:**
```
Network type always shows 'external' or 'internal'
```

#### **🛠️ Solutions:**

##### **1. Configure IP Ranges:**
```bash
# In config.env
INTERNAL_IP_RANGES=192.168.0.0/16,10.0.0.0/8,172.16.0.0/12,127.0.0.1/32
```

##### **2. Check Client IP:**
```javascript
// Debug network detection
fetch('/api/network/status')
  .then(res => res.json())
  .then(data => console.log('Network info:', data));
```

##### **3. Test from Different Networks:**
```bash
# Test from internal network (office WiFi)
# Test from external network (mobile hotspot, home)
```

---

## 🚀 **QUICK START CHECKLIST**

### **✅ Backend Setup:**
```bash
1. cd backend
2. pip install -r requirements.txt
3. cp config.env.example config.env  # Edit with your settings
4. python setup_database.py
5. python run.py
```

### **✅ Frontend Setup:**
```bash
1. cd frontend
2. npm install
3. npm start
```

### **✅ Database Setup:**
```bash
1. Start MySQL service
2. Create database: CREATE DATABASE face_attendance_db;
3. Import schema: mysql -u root -p face_attendance_db < database.sql
4. Verify: SELECT COUNT(*) FROM users;
```

### **✅ Test Everything:**
```bash
1. Backend health: curl http://localhost:5000/
2. Database test: python debug_auth.py
3. Login test: python test_login.py
4. Frontend: Open http://localhost:3000
```

---

## 🔧 **DEBUGGING TOOLS**

### **📊 Backend Debugging:**

#### **1. Debug Auth System:**
```bash
python debug_auth.py
```

#### **2. Simple Auth Test:**
```bash
python simple_auth_test.py
```

#### **3. Database Test:**
```bash
python simple_test.py
```

#### **4. Login Test:**
```bash
python test_login.py
```

### **📱 Frontend Debugging:**

#### **1. Network Detection:**
```javascript
// In browser console
console.log('Network type:', localStorage.getItem('networkType'));
```

#### **2. API Calls:**
```javascript
// Check API responses
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'admin123' })
})
.then(res => res.json())
.then(data => console.log(data));
```

#### **3. Component State:**
```javascript
// Use React DevTools to inspect component state
// Install: https://react.dev/link/react-devtools
```

---

## 📋 **COMMON COMMANDS**

### **🐍 Backend Commands:**
```bash
# Start backend
python run.py

# Setup database
python setup_database.py

# Run tests
python -m pytest tests/

# Install dependencies
pip install -r requirements.txt

# Create migration
python migrate_to_new_schema.py
```

### **⚛️ Frontend Commands:**
```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Install dependencies
npm install

# Update dependencies
npm update
```

### **🗄️ Database Commands:**
```bash
# Connect to MySQL
mysql -u root -p

# Import schema
mysql -u root -p face_attendance_db < database.sql

# Backup database
mysqldump -u root -p face_attendance_db > backup.sql

# Check tables
mysql -u root -p -e "SHOW TABLES;" face_attendance_db
```

---

## 🆘 **EMERGENCY FIXES**

### **🚨 Complete Reset:**
```bash
# 1. Stop all servers
# 2. Reset database
DROP DATABASE face_attendance_db;
CREATE DATABASE face_attendance_db;

# 3. Import fresh schema
mysql -u root -p face_attendance_db < database.sql

# 4. Clear browser cache
# 5. Restart servers
```

### **🚨 Quick Backend Fix:**
```bash
# Use simple auth server if main server fails
python simple_auth_test.py

# Update frontend API URL temporarily
# Change localhost:5000 to localhost:5001
```

### **🚨 Frontend Recovery:**
```bash
# Clear React cache
rm -rf node_modules package-lock.json
npm install
npm start
```

---

## 📞 **SUPPORT CHECKLIST**

When asking for help, provide:

1. **Error Messages**: Full error text and stack traces
2. **Environment**: OS, Python version, Node version, MySQL version
3. **Steps to Reproduce**: Exact steps that cause the issue
4. **Configuration**: Relevant config files (without sensitive data)
5. **Logs**: Backend logs and browser console logs

### **📋 Environment Info:**
```bash
# System info
python --version
node --version
mysql --version

# Package versions
pip list | grep -E "(flask|mysql|bcrypt|jwt)"
npm list react react-dom

# Database status
mysql -u root -p -e "SELECT VERSION();"
```

---

## 🎯 **PERFORMANCE TIPS**

### **⚡ Backend Optimization:**
```python
# Enable database connection pooling
# Use Redis for caching
# Optimize database queries
# Enable gzip compression
```

### **⚡ Frontend Optimization:**
```javascript
// Code splitting
const LazyComponent = lazy(() => import('./Component'));

// Memoization
const MemoizedComponent = memo(Component);

// Optimize images
// Use service workers
// Enable compression
```

### **⚡ Database Optimization:**
```sql
-- Add indexes
CREATE INDEX idx_attendance_user_date ON attendance(user_id, date);
CREATE INDEX idx_faces_user_id ON faces(user_id);

-- Optimize queries
EXPLAIN SELECT * FROM attendance WHERE user_id = 1;
```

---

**💡 Remember: Most issues are related to database connection, missing dependencies, or configuration problems. Start with the basics!**
