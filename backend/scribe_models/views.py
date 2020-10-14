from django.db import connections
from django.http import HttpResponseServerError
from django.core.cache import cache
from social_django.utils import load_strategy

from rest_framework import serializers
from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from arcgis.gis import GIS
import geojson
import tempfile

from .models.scribe_base_models import Projects


class ProjectsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Projects
        fields = "__all__"


class ProjectsViewSet(viewsets.ModelViewSet):
    db_name = "scribe_db"
    permission_classes = [IsAuthenticated]
    queryset = Projects.objects.using(db_name).order_by('project_name')
    serializer_class = ProjectsSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_project_samples(request, project_id_p=0):
    """
    :param request:
    :param project_id_p: project identifier
    :return: list of project samples
    """
    try:
        response_data = cache.get(f'project_samples{project_id_p}')
        if response_data is not None:
            return Response(response_data)

        project_samples_sql = f"""
        SELECT * 
        FROM {project_id_p}_Samples samp
        INNER JOIN {project_id_p}_Site s ON samp.Site_No = s.Site_No
        INNER JOIN {project_id_p}_Location loc ON samp.Location = loc.Location
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
            cache.set(f'project_samples{project_id_p}', data)
            return Response(data)
    except Exception as e:
        return Response({'columnDefs': [], 'rowData': []})


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def publish_to_agol(request):
    geojson_item = None
    agol_conn = None
    try:
        # open an AGOL connection
        social_auth = request.user.social_auth.get(provider='agol')
        agol_token = social_auth.get_access_token(load_strategy())
        agol_conn = GIS(token=agol_token)
        # construct data as GeoJson: https://doc.arcgis.com/en/arcgis-online/reference/geojson.htm
        geojson_features = []
        for row in request.data['rows']:
            try:
                point = geojson.Point((row['Longitude'], row['Latitude']))
                geojson_features.append(geojson.Feature(geometry=point, properties=row))
            except Exception as ex:
                geojson_features.append(geojson.Feature(geometry={"type": "Point", "coordinates": []}, properties=row))
        if len(geojson_features) > 0:
            feature_collection = geojson.FeatureCollection(geojson_features)
            item_properties = {
                'title': request.data['title'],
                'description': 'Scribe Explorer generated feature layer',
                'tags': 'GeoJson, Scribe Explorer',
                'type': 'GeoJson',
            }
            geojson_tmp_file = write_temp_geojson_file(feature_collection)
            geojson_item = agol_conn.content.add(item_properties=item_properties, data=geojson_tmp_file)
            geojson_lyr = geojson_item.publish(overwrite=True)
            agol_conn.content.delete_items([geojson_item.itemid])
            return Response(geojson_lyr.url)
        else:
            return Response('')
    except Exception as ex:
        print(ex)
        if agol_conn and geojson_item:
            agol_conn.content.delete_items([geojson_item.itemid])
        return Response(status=500)


def write_temp_geojson_file(feature_collection):
    tmp_file = tempfile.mkstemp(suffix='.geojson')
    with open(tmp_file[1], 'w') as outfile:
        geojson.dump(feature_collection, outfile)
    return tmp_file[1]


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_published_agol_services(request):
    try:
        # open an AGOL connection
        social_auth = request.user.social_auth.get(provider='agol')
        agol_token = social_auth.get_access_token(load_strategy())
        agol_conn = GIS(token=agol_token)
        # get user's published services
        items = []
        agol_items = agol_conn.content.search(
            query="owner:{owner} tags:{tags}".format(owner=social_auth.uid, tags='Scribe Explorer'),
            item_type="Feature *")
        for item in agol_items:
            items.append({'title': item.title, 'url': item.homepage})
        return Response(items)
    except Exception as ex:
        print(ex)
        return Response(status=500)
