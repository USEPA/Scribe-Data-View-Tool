from django.db import models


# Model to use when filtering to explore the projects
class ProjectsExplorer(models.Model):
    projectid = models.IntegerField(db_column='Project_Id', primary_key=True)
    project_name = models.CharField(db_column='Project_Name', max_length=255, blank=True, null=True)
    Site_No = models.TextField(blank=True, null=True, db_column='Site_No')
    Site_State = models.TextField(blank=True, null=True, db_column='Site_State')
    NPL_Status = models.TextField(blank=True, null=True, db_column='NPL_Status')
    Description = models.TextField(blank=True, null=True, db_column='Description')
    EPARegionNumber = models.TextField(blank=True, null=True, db_column='EPARegionNumber')
    EPAContact = models.TextField(blank=True, null=True, db_column='EPAContact')

    class Meta:
        managed = True
        app_label = 'scribe_models'
        db_table = 'PROJECTSEXPLORER'
        ordering = ['projectid']
