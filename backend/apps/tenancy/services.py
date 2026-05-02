"""
DocPilot AI — Tenancy Services

Business logic kept out of views.
"""

import logging

from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger("apps.tenancy")


def send_invitation_email(invitation) -> None:
    """
    Send an invitation email with the accept link.
    In dev, EMAIL_BACKEND=console prints to stdout — no actual sending.
    """
    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000")
    accept_url = f"{frontend_url}/invite/{invitation.token}"
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@docpilot.local")

    subject = f"Vous avez été invité à rejoindre {invitation.tenant.name} sur DocPilot AI"
    body = (
        f"Bonjour,\n\n"
        f"Vous avez été invité à rejoindre l'organisation « {invitation.tenant.name} »"
        f" en tant que {invitation.role}.\n\n"
        f"Pour accepter l'invitation et créer votre compte, cliquez sur le lien ci-dessous :\n"
        f"{accept_url}\n\n"
        f"Ce lien est valable 7 jours.\n\n"
        f"— L'équipe DocPilot AI"
    )

    try:
        send_mail(
            subject=subject,
            message=body,
            from_email=from_email,
            recipient_list=[invitation.email],
            fail_silently=False,
        )
    except Exception as exc:
        logger.error(
            "Failed to send invitation email",
            extra={"invitation_id": str(invitation.id), "email": invitation.email, "error": str(exc)},
        )
        raise
