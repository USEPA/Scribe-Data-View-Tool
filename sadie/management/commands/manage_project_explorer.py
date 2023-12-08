from django.core.management.base import BaseCommand
from scribe_models.func import populate_project_explorer, delete_all_records, add_new_project_explorer


class Command(BaseCommand):
    help = '''Populate: For each project in project table, find the corresponding site table 
    and populate the project_explorer table with data from project and site tables.
    Delete: Delete all records from the project explorer table.
    Add: Add new projects to the project explorer table
    '''

    def add_arguments(self, parser):
        parser.add_argument('-p', '--populate', action='store_true', help='Populate the project explorer table')
        parser.add_argument('-d', '--delete', action='store_true',
                            help='Delete all records from the project explorer table')
        parser.add_argument('-a', '--add', action='store_true',
                            help='Add new projects to the project explorer table')

    def handle(self, *args, **options):
        populate = options['populate']
        delete = options['delete']
        add = options['add']
        if populate:
            populate_project_explorer()
            self.stdout.write('The project explorer table has been successfully populated.')
        if delete:
            delete_all_records()
            self.stdout.write('All records from the project explorer table has been deleted.')
        if add:
            number_of_projects = add_new_project_explorer()
            if number_of_projects > 0:
                self.stdout.write(f'{number_of_projects} records have been added to the project explorer table.')
            self.stdout.write('No new records have been added to the project explorer table')


