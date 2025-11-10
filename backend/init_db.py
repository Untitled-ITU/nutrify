"""
Database initialization script
Run this to create all tables in your Cloud SQL database
"""
from app import create_app
from extensions import db
from app.auth.models import User

def init_database():
    """Initialize database tables"""
    app = create_app()
    
    with app.app_context():
        print("Creating database tables...")
        db.create_all()
        print("✅ Database tables created successfully!")
        
        # Optional: Create a default admin user
        existing_admin = User.query.filter_by(username='admin').first()
        if not existing_admin:
            admin = User(username='admin', role='admin')
            admin.set_password('admin123')  # Change this password!
            db.session.add(admin)
            db.session.commit()
            print("✅ Default admin user created (username: admin, password: admin123)")
            print("⚠️  IMPORTANT: Change the admin password immediately!")
        else:
            print("ℹ️  Admin user already exists")

if __name__ == '__main__':
    init_database()

