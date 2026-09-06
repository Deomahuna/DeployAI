import os
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType

conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
    MAIL_FROM=os.getenv("MAIL_FROM"),
    MAIL_SERVER=os.getenv("MAIL_SERVER"),
    MAIL_PORT=int(os.getenv("MAIL_PORT", 587)),
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
)


async def send_otp_email(to_email: str, code: str):
    message = MessageSchema(
        subject="Votre code de vérification DeployAI",
        recipients=[to_email],
        body=f"""
        <div style="font-family: sans-serif; max-width: 400px; margin: auto;">
            <h2>Vérifie ton adresse email</h2>
            <p>Voici ton code de vérification DeployAI :</p>
            <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">{code}</p>
            <p>Ce code expire dans 10 minutes.</p>
        </div>
        """,
        subtype=MessageType.html,
    )
    fm = FastMail(conf)
    await fm.send_message(message)


async def send_reset_password_email(to_email: str, code: str):
    message = MessageSchema(
        subject="Réinitialisation de ton mot de passe DeployAI",
        recipients=[to_email],
        body=f"""
        <div style="font-family: sans-serif; max-width: 400px; margin: auto;">
            <h2>Réinitialise ton mot de passe</h2>
            <p>Voici ton code de réinitialisation DeployAI :</p>
            <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">{code}</p>
            <p>Ce code expire dans 10 minutes. Si tu n'es pas à l'origine de cette demande, ignore cet email.</p>
        </div>
        """,
        subtype=MessageType.html,
    )
    fm = FastMail(conf)
    await fm.send_message(message)