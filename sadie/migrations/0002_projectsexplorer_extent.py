# Generated by Django 3.2.20 on 2023-08-02 17:51

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('sadie', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='projectsexplorer',
            name='extent',
            field=models.JSONField(blank=True, null=True),
        ),
    ]