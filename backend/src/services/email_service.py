import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from ..utils import _get_env_var


class EmailService:
    def __init__(self):
        self._smtp_host: str | None = None
        self._smtp_port: int | None = None
        self._smtp_user: str | None = None
        self._smtp_password: str | None = None
        self._from_email: str | None = None
        self._frontend_url: str | None = None

    def _load_config(self):
        """Lazy load configuration to avoid errors during import if env vars aren't set"""
        if self._smtp_host is None:
            self._smtp_host = _get_env_var("SMTP_HOST")
            self._smtp_port = int(_get_env_var("SMTP_PORT"))
            self._smtp_user = _get_env_var("SMTP_USER")
            self._smtp_password = _get_env_var("SMTP_PASSWORD")
            self._from_email = _get_env_var("FROM_EMAIL")
            self._frontend_url = _get_env_var("FRONTEND_URL")

    def send_verification_email(self, to_email: str, token: str, username: str):
        """Send email verification link to user"""
        self._load_config()

        verification_url = f"{self._frontend_url}/verify-email?token={token}"

        message = MIMEMultipart("alternative")
        message["Subject"] = "Verify your email - Market Memo"
        message["From"] = f"LogiTrades <{self._from_email}>"
        message["To"] = to_email

        text_content = f"""\
Welcome to LogiTrades, {username}!

Please verify your email by visiting the following link:
{verification_url}

This link expires in 24 hours.

If you didn't create this account, please ignore this email."""

        html_content = f"""\
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Market Memo!</h1>
    </div>
    <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px;">Hi <strong>{username}</strong>,</p>
        <p style="font-size: 16px;">Thanks for signing up! Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{verification_url}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">Verify Email</a>
        </div>
        <p style="font-size: 14px; color: #666;">Or copy and paste this link into your browser:</p>
        <p style="font-size: 14px; color: #667eea; word-break: break-all;">{verification_url}</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        <p style="font-size: 12px; color: #999;">This link expires in 24 hours. If you didn't create this account, please ignore this email.</p>
    </div>
</body>
</html>"""

        message.attach(MIMEText(text_content, "plain"))
        message.attach(MIMEText(html_content, "html"))

        with smtplib.SMTP(self._smtp_host, self._smtp_port) as server:
            server.starttls()
            server.login(self._smtp_user, self._smtp_password)
            server.sendmail(self._from_email, to_email, message.as_string())

    def send_password_reset_email(self, to_email: str, token: str, username: str):
        """Send password reset link to user"""
        self._load_config()

        reset_url = f"{self._frontend_url}/reset-password?token={token}"

        message = MIMEMultipart("alternative")
        message["Subject"] = "Reset your password - LogiTrades"
        message["From"] = f"LogiTrades <{self._from_email}>"
        message["To"] = to_email

        text_content = f"""\
Hi {username},

We received a request to reset your password. Click the link below to set a new password:
{reset_url}

This link expires in 1 hour.

If you didn't request this, please ignore this email."""

        html_content = f"""\
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Reset Your Password</h1>
    </div>
    <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px;">Hi <strong>{username}</strong>,</p>
        <p style="font-size: 16px;">We received a request to reset your password. Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{reset_url}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">Reset Password</a>
        </div>
        <p style="font-size: 14px; color: #666;">Or copy and paste this link into your browser:</p>
        <p style="font-size: 14px; color: #667eea; word-break: break-all;">{reset_url}</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        <p style="font-size: 12px; color: #999;">This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
    </div>
</body>
</html>"""

        message.attach(MIMEText(text_content, "plain"))
        message.attach(MIMEText(html_content, "html"))

        with smtplib.SMTP(self._smtp_host, self._smtp_port) as server:
            server.starttls()
            server.login(self._smtp_user, self._smtp_password)
            server.sendmail(self._from_email, to_email, message.as_string())


email_service = EmailService()
