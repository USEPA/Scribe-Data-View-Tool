from sadie.models import ProjectsExplorer
from scribe_models.models.scribe_base_models import Projects
from django.utils.module_loading import import_string
import logging
from django.core.cache import cache
from django.db import connections
from shapely.wkt import loads
from geojson import Feature, FeatureCollection
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

        try:
            LocationModel = import_string(f'scribe_models.models.dbo.PID_{project.projectid}_Location_model')
            with connections["scribe_db"].cursor() as cursor:
                cursor.execute(f"""select 
    GEOGRAPHY::ConvexHullAggregate(GEOGRAPHY::STPointFromText('POINT(' + CAST(Longitude as VARCHAR(20)) + ' ' + CAST(Latitude as VARCHAR(20)) + ')', 4326)).STAsText()
    FROM {LocationModel._meta.db_table}
    where latitude is not null and longitude is not null""")
                geometry = loads(cursor.fetchone()[0])
                feature = Feature(geometry=geometry)
                feature_collection = FeatureCollection([feature])
                project_explorer.extent = feature_collection
        except Exception as e:
            print(e)
            pass

        project_explorer.save()
    except Exception as e:
        logger.error(f'Error on project {project.projectid}', e)


def get_set_project_cache(project_id):
    data = cache.get(f'project_samples{project_id}')
    if data is None:
        project_samples_sql = f"""
        SELECT * 
        FROM {project_id}_Samples samp
        INNER JOIN {project_id}_Site s ON samp.Site_No = s.Site_No
        INNER JOIN {project_id}_Location loc ON samp.Location = loc.Location
        """

        column_defs = []
        row_data = []
        with connections["scribe_db"].cursor() as cursor:
            cursor.execute(project_samples_sql)
            rows = cursor.fetchall()
            cols = cursor.description
            for idx, col in enumerate(cols):
                column_defs.append({'headerName': col[0], 'field': col[0], 'sortable': True, 'filter': True})
            for row in rows:
                row_values = {}
                for idx, col in enumerate(cols):
                    row_values[col[0]] = row[idx]
                row_data.append(row_values)
            data = {'columnDefs': column_defs, 'rowData': row_data}
            cache.set(f'project_samples{project_id}', data)
    return data
