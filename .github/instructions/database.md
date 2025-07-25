# Database Instructions

This project uses PostgreSQL as its database engine.

The database stores:

- User accounts and roles
- Face embeddings
- Attendance logs
- System logs and permissions

The schema is defined in `models.py` (SQLAlchemy ORM).  
Initial database schema is created with `database/init.sql`.  
Migrations are handled using Flask-Migrate.

Security: Biometric and personal data are encrypted.
