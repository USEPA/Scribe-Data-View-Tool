from django.test import TestCase, TransactionTestCase, SimpleTestCase
from django.template.loader import render_to_string

from re import sub

from .tests_fixtures import schemata_data, context, SQL_SERVER_COLUMN_FIELD_MAP_TESTS


# python manage.py test
class TestAutoMagicBuilds(SimpleTestCase):
    schemata_data_fixtures = schemata_data
    context_fixture = context

    def setUp(self):
        self.context_fixture["tables"] = {}

    def test_schemata_table_outputs(self):

        for row in self.schemata_data_fixtures:
            context["tables"][row.table_name] = []
            # normalize the column name to adhere to Python/Django variable naming rules
            column_name_normalized = sub("[^A-Za-z0-9_]+", "", row.column_name)
            if column_name_normalized.isdigit() or type(column_name_normalized) == int:
                column_name_normalized = '_' + str(column_name_normalized)
            db_column = ", db_column='{}'".format(row.column_name)
            field_map = (
                SQL_SERVER_COLUMN_FIELD_MAP_TESTS[row.data_type].format("primary_key=True", db_column).replace("blank=True, null=True", "")
            )
            self.context_fixture["tables"][row.table_name].append(
                f"""{column_name_normalized} = models.{field_map}"""
            )

        write_schema_files(self.context_fixture, 'models')


def write_schema_files(context, template_name):
    with open(f"""automagic_rest/tests/{template_name}_test_output.py""", "w") as test_template_output:
        output = render_to_string(f"automagic_rest/{template_name}.html", context)
        test_template_output.write(output)
