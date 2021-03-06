# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey has `on_delete` set to the desired behavior.
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.

# models generated by inspectdb command:
# Example: python manage.py inspectdb --database=scribe_db Projects > scribe_models/models/scribe_base_models.py

from django.db import models


class Projects(models.Model):
    projectid = models.IntegerField(db_column='PROJECTID', primary_key=True)  # Field name made lowercase.
    current_version = models.IntegerField(db_column='CURRENT_VERSION', blank=True, null=True)  # Field name made lowercase.
    last_update = models.DateTimeField(db_column='LAST_UPDATE', blank=True, null=True)  # Field name made lowercase.
    project_name = models.CharField(db_column='PROJECT_NAME', max_length=255, blank=True, null=True)  # Field name made lowercase.
    update_to_version = models.IntegerField(db_column='UPDATE_TO_VERSION')  # Field name made lowercase.
    full_name = models.CharField(db_column='FULL_NAME', max_length=100, blank=True, null=True)  # Field name made lowercase.
    organization = models.CharField(db_column='ORGANIZATION', max_length=100, blank=True, null=True)  # Field name made lowercase.
    publisher_role = models.CharField(db_column='PUBLISHER_ROLE', max_length=100, blank=True, null=True)  # Field name made lowercase.
    phone_number = models.CharField(db_column='PHONE_NUMBER', max_length=50, blank=True, null=True)  # Field name made lowercase.
    email = models.CharField(db_column='EMAIL', max_length=250, blank=True, null=True)  # Field name made lowercase.
    client_username = models.CharField(db_column='CLIENT_USERNAME', max_length=100, blank=True, null=True)  # Field name made lowercase.
    client_computername = models.CharField(db_column='CLIENT_COMPUTERNAME', max_length=100, blank=True, null=True)  # Field name made lowercase.

    class Meta:
        managed = False
        app_label = 'scribe_models'
        db_table = 'PROJECTS'
