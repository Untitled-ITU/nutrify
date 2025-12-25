from extensions import db

from werkzeug.security import generate_password_hash, check_password_hash

import secrets
from datetime import datetime, timezone


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.BigInteger, primary_key=True)
    username = db.Column(db.Text, nullable=False)
    email = db.Column(db.Text, unique=True, nullable=False)
    password_hash = db.Column(db.Text, nullable=False)
    role = db.Column(db.Text, nullable=False, default='consumer')
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f'<User {self.email} ({self.role})>'


class VerificationCode(db.Model):
    __tablename__ = 'verification_codes'

    id = db.Column(db.BigInteger, primary_key=True)
    email = db.Column(db.Text, nullable=False, index=True)
    code = db.Column(db.String(6), nullable=False)
    purpose = db.Column(db.Text, nullable=False)
    expires_at = db.Column(db.DateTime(timezone=True), nullable=False)
    used = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    pending_username = db.Column(db.Text, nullable=True)
    pending_password_hash = db.Column(db.Text, nullable=True)
    pending_role = db.Column(db.Text, nullable=True)

    @staticmethod
    def generate_code():
        return ''.join([str(secrets.randbelow(10)) for _ in range(6)])

    def is_valid(self):
        if not self.expires_at:
            return False
        expires = self.expires_at
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        return (not self.used) and (datetime.now(timezone.utc) < expires)

    def __repr__(self):
        return f'<VerificationCode {self.email} ({self.purpose})>'
