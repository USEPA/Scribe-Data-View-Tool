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

from sadie import views as sample_views


"""Django REST Framework notes:
Registered routers generate all the REST API methods for the given ViewSet. 
The 5 standard actions of a ViewSet are list (GET) / create (POST) / show / update / delete. 
ViewSets can also define additional API methods to be routed, using the @action decorator.
"""
router = routers.DefaultRouter()
router.register(r'project_tables', sample_views.ProjectTablesViewSet, basename='project_tables')
router.register(r'sample_requests', sample_views.SampleViewSet, basename='sample_requests')

urlpatterns = [
    url(r'^admin/', admin.site.urls),

    # Declare router-viewsets api calls
    # http://localhost:8080/api/<router-viewsets>
    url(r'^api/v1/', include(router.urls)),
    url(r'^api/v2/', include('sadie_models.urls')),

    # Declare custom api urls
    url(r'^api/v1/project_tables/(?P<project_id_p>.+)', sample_views.ProjectTablesViewSet.as_view({'get': 'list'})),
    url(r'^api/v1/project_tables$', sample_views.ProjectTablesViewSet.as_view({'get': 'list'})),

    url(r'^api/v1/submit_sample_request', sample_views.SampleViewSet.submit_sample_request, name='sample_requests'),

    # catch all other urls
    url(r'.*', never_cache(TemplateView.as_view(template_name='index.html')), name='index'),

]

