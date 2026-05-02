import uuid
from datetime import timedelta

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models
from django.utils import timezone

import apps.tenancy.models


class Migration(migrations.Migration):

    dependencies = [
        ("tenancy", "0002_space_acl"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="UserInvitation",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("email", models.EmailField(max_length=255)),
                (
                    "role",
                    models.CharField(
                        choices=[("admin", "admin"), ("manager", "manager"), ("member", "member")],
                        default="member",
                        max_length=20,
                    ),
                ),
                ("token", models.CharField(default=apps.tenancy.models._default_token, max_length=64, unique=True)),
                ("expires_at", models.DateTimeField(default=apps.tenancy.models._default_expires_at)),
                ("consumed_at", models.DateTimeField(blank=True, null=True)),
                ("revoked_at", models.DateTimeField(blank=True, null=True)),
                (
                    "invited_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="sent_invitations",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "tenant",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="invitations",
                        to="tenancy.tenant",
                    ),
                ),
            ],
            options={
                "verbose_name": "Invitation",
                "verbose_name_plural": "Invitations",
                "db_table": "user_invitations",
            },
        ),
    ]
