"""URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/2.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import include
from django.conf.urls import url
from django.views.decorators.cache import never_cache
from django.views.generic import TemplateView
from django.conf import settings
from rest_framework import routers

from sadie.views import EsriProxy, ProjectTablesViewSet, current_user, ProjectsExplorerViewSet
from scribe_models.views import *


"""Django REST Framework notes:
Registered routers generate all the REST API methods for the given ViewSet. 
The 5 standard actions of a ViewSet are list (GET) / create (POST) / show / update / delete. 
ViewSets can also define additional API methods to be routed, using the @action decorator.
"""
router = routers.DefaultRouter()
router.register(r'projects', ProjectsViewSet, basename='scribe_db.projects')
router.register(r'projectsexplorer', ProjectsExplorerViewSet, basename='scribe_db.projectsexplorer')
router.register(r'project_tables', ProjectTablesViewSet, basename='scribe_db.project_tables')


urlpatterns = [
    url(r'^admin/', admin.site.urls),
    # Authentication api calls
    url('^api/oauth2/', include('social_django.urls', namespace='social_django')),
    url(r'^api/auth/', include('rest_framework.urls', namespace='rest_framework')),
    url(r'^api/current_user/', current_user),
    url(r'^api/proxy/', EsriProxy.as_view()),
    # url(r'^{}api/oauth2/'.format(settings.URL_PREFIX), include('rest_framework_social_oauth2.urls')),

    # Declare registered router ViewSet api calls
    # http://localhost:8080/api/v1/<router-viewsets>
    url(r'^{}api/v1/'.format(settings.URL_PREFIX), include(router.urls)),
    url(r'^{}api/v1/generate_geojson/'.format(settings.URL_PREFIX), generate_geojson),
    # Declare parameterized project api urls
    url(r'^{}api/v1/projects/(?P<project_id_p>.+)/samples/'.format(settings.URL_PREFIX), get_project_samples),
    url(r'^{}api/v1/project_tables/(?P<project_id_p>.+)'.format(settings.URL_PREFIX), ProjectTablesViewSet.as_view({'get': 'list'})),
    url(r'^{}api/v1/project_tables$'.format(settings.URL_PREFIX), ProjectTablesViewSet.as_view({'get': 'list'})),

    # Declare AutoMagic_REST api calls (e.g. http://localhost:8080/api/v1/<PID_#>)
    url(r'^{}api/v1/'.format(settings.URL_PREFIX), include('scribe_models.urls')),

    # catch all other urls
    # url(r'.*', never_cache(TemplateView.as_view(template_name='index.html')), name='index'),
]

LOGIN_REDIRECT_URL = '/admin/'
LOGIN_URL = '/admin/'
