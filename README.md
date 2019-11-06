# Sadie

### Web App Setup
Note: From project root folder, do the following project setup commands.
1. Install project JavaScript package dependencies:
    > cd frontend
    
    > yarn install
2. Install project Python dependencies: These commands will create a Python virtual environment instance for the project, and install the project's Pyhton dependencies from the project Pipfile to this new virtual environment instance.
    > cd backend
    
    > pip install pipenv

    > pipenv install --dev && pipenv shell

3. Applys migrations for the default and project defined DB tables (user, products, etc...) 
    > python manage.py makemigrations

4. Run manage.py to set the project settings, so the project's environment (.env) variables point to the Django project’s setting files:
    > python manage.py migrate

### Run The Local Development Servers
These commands start/run the project's local development web servers. From two seperate command-line prompts, run these two commands (one to invoke the JS dependencies, and the other to run the local web server).
> yarn serve

> python manage.py runserver

When the above steps are completed, the website application will be served from [`localhost:3000`](http://localhost:3000/) 
