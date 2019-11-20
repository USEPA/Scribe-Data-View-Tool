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
from rest_framework import routers

from sadie import views as sadie_views
from scribe_models import views as scribe_model_views


"""Django REST Framework notes:
Registered routers generate all the REST API methods for the given ViewSet. 
The 5 standard actions of a ViewSet are list (GET) / create (POST) / show / update / delete. 
ViewSets can also define additional API methods to be routed, using the @action decorator.
"""
router = routers.DefaultRouter()
# router.register(r'sample_requests', sadie_views.SampleViewSet, basename='sample_requests')
router.register(r'projects', scribe_model_views.ProjectsViewSet, basename='scribe_db.projects')
router.register(r'project_tables', sadie_views.ProjectTablesViewSet, basename='scribe_db.project_tables')


urlpatterns = [
    url(r'^admin/', admin.site.urls),

    # Declare registered router-viewsets api calls
    # http://localhost:8080/api/v1/<router-viewsets>
    url(r'^api/v1/', include(router.urls)),
    # Parameterized api urls
    url(r'^api/v1/project_tables/(?P<project_id_p>.+)', sadie_views.ProjectTablesViewSet.as_view({'get': 'list'})),
    url(r'^api/v1/project_tables$', sadie_views.ProjectTablesViewSet.as_view({'get': 'list'})),

    # Declare automagic_rest api calls
    # http://localhost:8080/api/v1/<PID_#>
    url(r'^api/v1/', include('scribe_models.urls')),


    # sample CRUD url
    url(r'^api/v1/submit_sample_request', sadie_views.SampleViewSet.submit_sample_request, name='sample_requests'),

    # catch all other urls
    url(r'.*', never_cache(TemplateView.as_view(template_name='index.html')), name='index'),

]

