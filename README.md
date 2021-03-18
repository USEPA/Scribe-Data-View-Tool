# Scribe Explorer

## Application Setup
From project root folder, do the following setup commands.

On initial setup, first install the project package dependencies with the following commands. 
Then run the automagic and data migration commands in the following steps.

#### Install Project package dependencies:
1. Install project Python package dependencies to virtual environment:

    ```> cd backend```

    Install the Pipenv library, which is a dependency manager for Python projects:
    
    ```> pip install pipenv```

    Start a new virtual environment shell to ensure all commands have access to the installed 
    project package dependencies. 
    ```> pipenv shell```

    Install project Python dependencies to the virtual environment.
    
    ```
    > pipenv install git+https://github.com/Innovate-Inc/django-agol-oauth2.git@master#egg=django-agol-oauth2
    > pipenv install -r requirements.txt
    ```
   
    IMPORTANT NOTE: You may need to rollback versions of the installed Python package dependencies which have breakings bugs in their most recent releases.
    - Presently, the only Python library dependency which latest release has a breaking bug is the pyodbc dependency (version 4.0.28).
    - To fix this, rollback the pyodbc dependency back to version `4.0.27`.

2. Install project JavaScript package dependencies:
```
    > cd frontend
    > npm install
```

#### Run the automagic build_data_models management command to build the Scribe app modules dynamically:
    > python manage.py build_data_models --database=scribe_db --owner=sa --path=scribe_models


#### Apply Django Data Model Migrations to Database
1. Apply new app registry data model migrations built by the above automagic build_data_models management command
   
   ```
   > python manage.py makemigrations
   > python manage.py makemigrations scribe_models
   ```

2. Synchronize migrations to the project's default database with Django's default models/migrations. 
   Run manage.py to set the project settings, and have the project’s setting files point to the project's environment (.env) variables:
    
    ```> python manage.py migrate --database default```

#### Run The Local Development Servers to run the app locally
These commands start/run the project's local development web servers. 
From two separate command-line prompts, run these two commands (one to invoke the JS dependencies, and the other to run the local web server).
```
> cd frontend
> npm run start
```
```
> cd backend
> python manage.py runserver
```
