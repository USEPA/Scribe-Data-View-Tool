# Scribe-Data-View-Tool

## Application Setup
Note: From project root folder, do the following application setup commands.

### Install Project JavaScript and Python package dependencies:
1. Install project JavaScript package dependencies:
    > cd frontend
    
    > npm install

2. Install project Python package dependencies:
    IMPORTANT: It's best practice to create a Python virtual environment for the project and install the project Python packages to the virtual environment, as the following commands does so.

    > cd backend
    
    Install the Pipenv library, which is a dependency manager for Python projects:
    > pip install pipenv

    Start a new virtual environment shell to ensure all commands have access to the installed project package dependencies. 
    > pipenv shell

    Install project Python dependencies to the virtual environment. 
    This will create a Pipfile (if one doesn't already exist) and install the specified dependencies.
    
    > pipenv install git+https://github.com/Innovate-Inc/django-agol-oauth2.git@master#egg=django-agol-oauth2
    
    > pipenv install -r requirements.txt

    Or install the project's Python dev dependencies directly from the project's existing Pipfile.
    > pipenv install --dev

3. Apply new app registry data model migrations based on the changes detected in the app data models 
    > python manage.py makemigrations

    > python manage.py makemigrations scribe_models

4. Synchronize migrations just to the default Scribe-Data-View-Tool database with the default django models/migrations. 
   Run manage.py to set the project settings, and have the project’s setting files point to the project's environment (.env) variables:
    > python manage.py migrate --database default

5. IMPORTANT: Finally, need to rollback versions of the installed Python package dependencies which have breakings bugs in their most recent releases.
- Presently, the only Python library dependency which latest release has a breaking bug is the pyodbc dependency (version 4.0.28).
- To fix this, rollback the pyodbc dependency back to version `4.0.27`.


### Run The Local Development Servers
These commands start/run the project's local development web servers. From two separate command-line prompts, run these two commands (one to invoke the JS dependencies, and the other to run the local web server).
> cd frontend
> npm run start

> cd backend
> python manage.py runserver

When the above steps are completed, the web application will be served from [`localhost:4200`](http://localhost:4200/) 

### Setup the ArGIS Online Django OAuth Toolkit Application to authenticate GeoPlatform AGOL users:

1. Create a Django administrative user account:
> python manage.py createsuperuser

2. Login to Django Admin Console (http://localhost:8000/admin/) with the administrator user.

3. Add a new Django user account and attach your GeoPlatform AGOL username to that user account:
- Go to http://localhost:8000/admin/auth/user/add/
- Enter the Django user account credentials. 
- For the `Agol username` field, input your GeoPlatform AGOL username.
- Click Save

4. Add the ArGIS Online Django OAuth Toolkit Application, and attach the above Django user account to it.
- Go to http://localhost:8000/admin/oauth2_provider/application/add/
- For the `User` field, select the User you added in the previous step 3.
- For the `Client type` field select `Public`. 
- For the `Authorization grant type` select `Client credentials`.
- Enter an application `Name` of your choosing.
- Copy the `Client id` to paste in the next step.
- Click Save

5. Go to the environment.ts file and paste the `Client id` as the value for the `local_client_id` environment property.

6. Go to http://localhost:4200/login and sign-in using your GeoPlatform user account to begin using the Scribe-Data-View-Tool.

