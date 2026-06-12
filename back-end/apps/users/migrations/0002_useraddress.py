# Generated migration for UserAddress model
# apps/users/migrations/0002_useraddress.py

import uuid
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='UserAddress',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('label', models.CharField(
                    blank=True,
                    default='Home',
                    help_text='"Home", "Office"',
                    max_length=50,
                )),
                ('first_name', models.CharField(max_length=100)),
                ('last_name', models.CharField(max_length=100)),
                ('phone', models.CharField(max_length=20)),
                ('street_address', models.CharField(max_length=255)),
                ('city', models.CharField(max_length=100)),
                ('province', models.CharField(
                    choices=[
                        ('Punjab', 'Punjab'),
                        ('Sindh', 'Sindh'),
                        ('KPK', 'KPK'),
                        ('Balochistan', 'Balochistan'),
                        ('Islamabad', 'Islamabad'),
                    ],
                    max_length=20,
                )),
                ('postal_code', models.CharField(max_length=20)),
                ('is_default', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='addresses',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'verbose_name': 'User Address',
                'verbose_name_plural': 'User Addresses',
                'ordering': ['-is_default', '-created_at'],
            },
        ),
    ]
