from scribe_models.models.scribe_base_models import *
from scribe_models.models.dbo import *
from django.utils.module_loading import import_string


# populate the table using information from the project table and the corresponding
# site table identified using the project id
def populate_projects_explorer():
    db_name = 'scribe_db'
    projects = Projects.objects.using(db_name).all()

    for p in projects:
        SiteModel = import_string(f'scribe_models.models.dbo.PID_{p.projectid}_Site_model')
        site = SiteModel.objects.using(db_name).first()  # There is only one record in the site table.
        project_explorer = ProjectsExplorer()

        project_explorer.projectid = p.projectid
        project_explorer.project_name = p.project_name
        project_explorer.Site_No = site.Site_No
        project_explorer.Site_State = site.Site_State
        project_explorer.NPL_Status = site.NPL_Status
        project_explorer.Description = site.Description
        project_explorer.EPARegionNumber = site.EPARegionNumber
        project_explorer.EPAContact = site.EPAContact

        project_explorer.save(using=db_name)





