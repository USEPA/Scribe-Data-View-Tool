"""
Django dev settings for VC project.

Generated by 'django-admin startproject' using Django 2.2.5.

For more information on this file, see
https://docs.djangoproject.com/en/2.2/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/2.2/ref/settings/
"""

import os

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/2.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'sbrn8pas3(km3y8m4=ekh#zt+(&$+ja+5wi*ff57zbsqi-n88v'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost').split(',')

APPEND_SLASH = False

# Application definition

INSTALLED_APPS = [
    'django.contrib.auth',
    'agol_oauth2',
    'django.contrib.admin',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework.authtoken',
    'automagic_rest',
    'sadie',
    'scribe_models',
    'oauth2_provider',
    'social_django',
    'rest_framework_social_oauth2'
]

'''
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [],
    'DEFAULT_PERMISSION_CLASSES': [],
}
'''

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'oauth2_provider.contrib.rest_framework.OAuth2Authentication',
        'rest_framework.authentication.BasicAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': ('rest_framework.permissions.DjangoModelPermissions',),

}

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'urls'

# TODO: Set template directory to Angular template to separate the backend from the frontend (i.e. Host
#  the Angular app completely separately from Django templates.)
#  Have API calls made to a separate Django server, on a different sub-domain with CORS.
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(PROJECT_ROOT, 'frontend', 'src')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'settings.wsgi.application'

# Database
# https://docs.djangoproject.com/en/2.2/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'sql_server.pyodbc',
        'HOST': os.environ.get('SADIE_DB_HOST', ''),
        'NAME': 'Sadie',
        'USER': os.environ.get('SADIE_DB_USER', ''),
        'PASSWORD': os.environ.get('SADIE_DB_PASSWORD', ''),
        'PORT': os.environ.get('SADIE_DB_PORT', '1433'),
        'OPTIONS': {
            'driver': "ODBC Driver 17 for SQL Server"
        }
    },
    'scribe_db': {
        'ENGINE': 'sql_server.pyodbc',
        'HOST': os.environ.get('SCRIBE_DB_HOST', ''),
        'NAME': 'Scribe',
        'USER': os.environ.get('SCRIBE_DB_USER', ''),
        'PASSWORD': os.environ.get('SCRIBE_DB_PASSWORD', ''),
        'PORT': os.environ.get('SCRIBE_DB_PORT', '1433'),
        'OPTIONS': {
            'driver': "ODBC Driver 17 for SQL Server"
        }
    },
}

RUN_AUTOMAGIC_REST = [os.environ.get('RUN_AUTOMAGIC_REST', '')]

# Password validation
# https://docs.djangoproject.com/en/2.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
# https://docs.djangoproject.com/en/2.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_L10N = True

USE_TZ = True

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/2.2/howto/static-files/
# Static files path
STATIC_URL = '/static/'
# With these settings, when the project builds, the Django static files will be placed in the same location as
# the Angular build files. This way, Django fully handles serving the static files.
ANGULAR_APP_DIR = os.path.join(PROJECT_ROOT, 'frontend')
STATIC_ROOT = os.path.join(ANGULAR_APP_DIR, 'src', 'static')

LOGIN_REDIRECT_URL = '/'
LOGOUT_REDIRECT_URL = '/'

SOCIAL_AUTH_AGOL_KEY = os.environ.get('SOCIAL_AUTH_AGOL_KEY', '')
SOCIAL_AUTH_AGOL_SECRET = os.environ.get('SOCIAL_AUTH_AGOL_SECRET', '')
SOCIAL_AUTH_AGOL_REDIRECT_URI = os.environ.get('SOCIAL_AUTH_AGOL_REDIRECT_URI', '')
SOCIAL_AUTH_AGOL_DOMAIN = 'epa.maps.arcgis.com'

SOCIAL_AUTH_PIPELINE = [  # Note: Sequence of functions matters here.
    'social_core.pipeline.social_auth.social_details',  # 0
    'social_core.pipeline.social_auth.social_uid',  # 1
    'social_core.pipeline.social_auth.auth_allowed',  # 2
    'social_core.pipeline.social_auth.social_user',  # 3
    'social_core.pipeline.user.get_username',  # 4
    'agol_oauth2.pipeline.associate_by_username',
    'social_core.pipeline.social_auth.associate_user',  # 6
    'social_core.pipeline.social_auth.load_extra_data',  # 7
    'social_core.pipeline.user.user_details',  # 8
]

AUTHENTICATION_BACKENDS = (
    'agol_oauth2.backend.AGOLOAuth2',
    'django.contrib.auth.backends.ModelBackend',
)

MIGRATION_MODULES = {
    'oauth2_provider': 'oauth2'
}

OAUTH2_PROVIDER_ACCESS_TOKEN_MODEL = 'oauth2_provider.AccessToken'
OAUTH2_PROVIDER_APPLICATION_MODEL = 'oauth2_provider.Application'
OAUTH2_PROVIDER_REFRESH_TOKEN_MODEL = 'oauth2_provider.RefreshToken'

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
    }
}