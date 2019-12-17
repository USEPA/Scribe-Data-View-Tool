# Scribe-Data-View-Tool

### Web App Setup
Note: From project root folder, do the following project setup commands.
1. Install project JavaScript package dependencies:
    > cd frontend
    
    > npm install
2. Install project Python dependencies: These commands will create a Python virtual environment instance for the project, and install the project's Python dependencies from the project Pipfile to this new virtual environment instance.
    > cd backend
    
    > pip install pipenv

    > pipenv install git+https://github.com/Innovate-Inc/django-agol-oauth2.git@master#egg=django-agol-oauth2

    > pipenv install --dev && pipenv shell

3. Apply new app registry migrations based on the changes detected in the app data models 
    > python manage.py makemigrations

    > python manage.py makemigrations scribe_models

4. Synchronize migrations just to the default Scribe-Data-View-Tool database with the default django models/migrations. 
   Run manage.py to set the project settings, so the Django project’s setting files point 
   to the project's environment (.env) variables:
    > python manage.py migrate --database default

### Run The Local Development Servers
These commands start/run the project's local development web servers. From two separate command-line prompts, run these two commands (one to invoke the JS dependencies, and the other to run the local web server).
> npm run start

> python manage.py runserver

When the above steps are completed, the website application will be served from [`localhost:4200`](http://localhost:4200/) 
