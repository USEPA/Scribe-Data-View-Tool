#!/usr/bin/env bash
echo "----- Starting Applying Database Migrations -----"
python /code/manage.py makemigrations
python /code/manage.py migrate
#python /code/manage.py runserver 0.0.0.0:8000
