from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("conversations", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="conversation",
            name="hidden_for_user",
            field=models.BooleanField(
                default=False,
                db_index=True,
                help_text="When True, the owner hid this conversation. Admins/owners still see it.",
            ),
        ),
    ]
