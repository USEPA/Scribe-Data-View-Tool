import sys
import re
from django.apps import AppConfig


class SadieAppConfig(AppConfig):
    name = 'sadie'
    verbose_name = "Sadie Application"

    def ready(self):
        if 'runserver' not in sys.argv:
            return True
        # imports after Django server is running
        from django.conf import settings
        from django.db import connections
        from django.contrib.auth.models import User
        from django.contrib.auth.models import Group

        # call startup code here
        """Runs the django-admin command that builds the Sadie PID data models"""
        # if settings.RUN_AUTOMAGIC_REST:
        #     from django.core.management import call_command
        #     call_command('build_data_models', database='scribe_db', path='sadie_models')

        """Adds missing project user groups to the Groups auth model and adds superusers to the new groups"""
        projects_sql = "SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE " \
                       "FROM INFORMATION_SCHEMA.COLUMNS " \
                       "WHERE table_catalog = 'Scribe' AND TABLE_NAME LIKE '%s'" % ('%PID_%')
        default_db_conn = connections['scribe_db']
        with default_db_conn.cursor() as cursor:
            cursor.execute(projects_sql)
            project_ids = []
            for row in cursor.fetchall():
                project_id = re.findall(r'PID_(.+?)_', row[0])[0]
                if project_id not in project_ids:
                    project_ids.append(project_id)
        # Add missing user groups
        superusers = User.objects.filter(is_superuser=True)
        for project_id in project_ids:
            if not Group.objects.filter(name='PID_'+project_id).exists():
                new_group = Group.objects.create(name='PID_'+project_id)
                # Add superusers to new group
                for superuser in superusers:
                    new_group.user_set.add(superuser)
                # TODO: Add logic to determine what staff users are added to group


