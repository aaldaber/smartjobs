# Generated by Django 3.2.4 on 2024-12-23 06:26

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0004_auto_20241222_2317'),
    ]

    operations = [
        migrations.AddField(
            model_name='emailalertsubscription',
            name='active',
            field=models.BooleanField(default=True),
        ),
    ]
