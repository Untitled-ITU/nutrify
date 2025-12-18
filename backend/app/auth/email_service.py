from ...extensions import mail

from flask_mail import Message
from flask import current_app

import secrets


def generate_verification_code():
    return ''.join([str(secrets.randbelow(10)) for _ in range(6)])


def send_email(to_email, subject, html_body, body=None):
    try:
        msg = Message(
            subject=subject,
            recipients=[to_email],
            html=html_body,
            sender=current_app.config['MAIL_DEFAULT_SENDER']
        )
        if body:
            msg.body = body

        mail.send(msg)
        current_app.logger.info(f"Email sent successfully to {to_email}")
        return True
    except Exception as e:
        current_app.logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return False


def send_verification_email(to_email, verification_code):
    subject = "Nutrify - Email Verification"

    html_body = f"""
    <html>
        <body>
            <h2>Welcome!</h2>
            <p>Thank you for registering with Nutrify.</p>
            <p>Please use the following code to verify your email address:</p>
            <h1 style="color: #4CAF50; letter-spacing: 5px;">{verification_code}</h1>
            <p>This code is valid for 10 minutes.</p>
            <p>If you did not create this account, please ignore this email.</p>
            <br>
            <p>Best regards,<br>The Nutrify Team</p>
        </body>
    </html>
    """
    return send_email(to_email, subject, html_body)


def send_reset_code_email(to_email, reset_code):
    subject = "Nutrify - Password Reset"

    html_body = f"""
    <html>
        <body>
            <h2>Password Reset Request</h2>
            <p>You have requested to reset your password.</p>
            <p>Please use the following code to reset your password:</p>
            <h1 style="color: #FF9800; letter-spacing: 5px;">{reset_code}</h1>
            <p>This code is valid for 10 minutes.</p>
            <p>If you did not request this, please ignore this email.</p>
            <br>
            <p>Best regards,<br>Nutrify Team</p>
        </body>
    </html>
    """
    return send_email(to_email, subject, html_body)
