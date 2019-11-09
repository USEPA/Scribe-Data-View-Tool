import re
from django.db import models
from django.core import validators
from django.contrib.auth.models import (
    BaseUserManager, AbstractUser
)
from django.utils import timezone
from rest_framework.authtoken.models import Token


class SampleModel(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField('Email Address', unique=True)
    choice = models.CharField(
        max_length=20,
        choices=[('Django', 'Django'), ('React', 'react'), ('Both', 'Both')],
        default='',
    )

    class Meta:
        db_table = 'sample_model'
