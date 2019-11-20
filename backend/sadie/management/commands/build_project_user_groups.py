from django.core.management.base import BaseCommand
from django.apps import apps
from django.db import connections
from django.contrib.auth.models import User, Group, Permission
from django.contrib.contenttypes.models import ContentType

import logging


PERMISSIONS = ['view']  # For now only view permission by default


class Command(BaseCommand):
    """
    Command to add project user groups to the Groups auth model, add users to the groups, and
    set model permissions to the group
    """

    # ./manage.py build_data_models --app=scribe_models --database=scribe_db
    @staticmethod
    def add_arguments(parser):
        parser.add_argument(
            "--app",
            action="store",
            dest="app",
            default="scribe_models",
            help='The app to use. Defaults to the "scribe_models" app.',
        )
        parser.add_argument(
            "--database",
            action="store",
            dest="database",
            default="scribe_db",
            help='The database to use. Defaults to the "scribe_db" database.',
        )

    @staticmethod
    def get_db(options):
        """
        Returns the Django name of the database we will connect to.
        """
        return options.get("database")

    def handle(self, *args, **options):
        logging.basicConfig(level=logging.INFO, format='%(message)s')
        logger = logging.getLogger()
        logger.addHandler(logging.FileHandler('build_project_user_groups.log', 'a'))
        print = logger.info

        app_name = options.get("app")
        db_name = self.get_db(options)
        db_conn = connections[db_name]

        superusers = User.objects.filter(is_superuser=True)
        for superuser in superusers:
            superuser.user_permissions.clear()

        # Get unique project IDs
        with db_conn.cursor() as cursor:
            cursor.execute("SELECT PROJECTID FROM dbo.PROJECTS ")
            project_ids = []
            for row in cursor.fetchall():
                if row[0] not in project_ids:
                    project_ids.append(row[0])
        # Add missing project user groups
        for project_id in project_ids:
            new_group, created_group = Group.objects.get_or_create(name='PID_' + str(project_id))
            group_to_set = new_group if new_group else created_group

            # Add superusers to group
            for superuser in superusers:
                group_to_set.user_set.add(superuser)
            # TODO: Perhaps add logic later to determine what staff users are added to each group

            # Set Scribe data model permissions for group
            group_model_permissions = []
            for model in apps.get_app_config(app_name).get_models():
                model_name = model.__name__
                if str(project_id) in model_name:
                    for permission in PERMISSIONS:
                        # Create or update new permission.
                        name = 'Can {} {}'.format(permission, model._meta.object_name)
                        ct = ContentType.objects.get_for_model(model)
                        model_permission = Permission.objects.update_or_create(codename="Can view model", name=name,
                                                                               content_type=ct)[0]
                        group_model_permissions.append(model_permission)
                        # Give superusers this permission
                        for superuser in superusers:
                            superuser.user_permissions.add(model_permission)
                        # TODO: Perhaps add logic later to determine what staff users are given the permission
            group_to_set.permissions.set(group_model_permissions)
            print("Group {0} added and {0} data model permissions granted to group users.".format('PID_' + str(project_id)))




