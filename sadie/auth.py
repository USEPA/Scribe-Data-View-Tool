import jwt
from django.conf import settings
from django.contrib.auth.models import AnonymousUser
from django.http import HttpRequest
from jwt import ExpiredSignatureError
from rest_framework.authentication import BaseAuthentication


class JWTUser(AnonymousUser):
    def __init__(self, username):
        self.username = username

    @property
    def is_anonymous(self):
        return False

    @property
    def is_authenticated(self):
        return True


    # @property
    # def allowed_project_ids(self):
    #     return self._allowed_projects
    #
    # @allowed_project_ids.setter
    # def allowed_project_ids(self, project_ids):
    #     self._allowed_projects = project_ids


class JWTAuth(BaseAuthentication):
    def authenticate(self, request: HttpRequest):
        try:
            token = request.headers.get('Authorization')
            if token:
                payload = jwt.decode(token, settings.INTAKE_TOKEN['SECRET'], algorithms=[settings.INTAKE_TOKEN['ALGORITHM']])
                jwt_user = JWTUser(payload.get('username'))
                return jwt_user, None
        except ExpiredSignatureError:
            pass
        return None
