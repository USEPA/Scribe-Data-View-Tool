from sadie.models import ProjectsExplorer
from scribe_models.models.scribe_base_models import Projects
from django.utils.module_loading import import_string
import logging

logger = logging.getLogger('django')

db_name = 'scribe_db'


# populate the table using information from the project table and the corresponding
# site table identified using the project id
def populate_project_explorer():
    projects = Projects.objects.using(db_name).all()
    for p in projects:
        save_in_project_explorer(p)


def delete_all_records():
    ProjectsExplorer.objects.all().delete()


def add_new_project_explorer():
    project_ids = Projects.objects.using(db_name).all().values_list('projectid', flat=True)
    project_explorer_ids = ProjectsExplorer.objects.all().values_list('projectid', flat=True)
    if project_ids.count() > project_explorer_ids.count():
        for i in project_ids:
            if i not in project_explorer_ids:
                project = Projects.objects.using(db_name).get(projectid=i)
                save_in_project_explorer(project)
    return project_ids.count() - project_explorer_ids.count()


# helper function
def save_in_project_explorer(project):
    SiteModel = import_string(f'scribe_models.models.dbo.PID_{project.projectid}_Site_model')
    try:
        site = SiteModel.objects.using(db_name).first()  # There is only one record in the site table.
        project_explorer = ProjectsExplorer()

        project_explorer.projectid = project.projectid
        project_explorer.project_name = project.project_name
        project_explorer.Site_No = site.Site_No
        project_explorer.Site_State = site.Site_State
        project_explorer.NPL_Status = site.NPL_Status
        project_explorer.Description = site.Description
        project_explorer.EPARegionNumber = site.EPARegionNumber
        project_explorer.EPAContact = site.EPAContact

        project_explorer.save()
    except Exception as e:
        logger.error(f'Error on project {project.projectid}', e)
