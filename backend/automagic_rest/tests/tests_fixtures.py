import collections

SQL_SERVER_COLUMN_FIELD_MAP_TESTS = {
    "smallint": "IntegerField({}blank=True, null=True{})",
    "int": "IntegerField({}blank=True, null=True{})",
    "tinyint": "IntegerField({}blank=True, null=True{})",
    "bigint": "BigIntegerField({}blank=True, null=True{})",
    "oid": "BigIntegerField({}blank=True, null=True{})",
    "bit": "BooleanField({}blank=True, null=True{})",
    "numeric": "DecimalField({}blank=True, null=True{})",
    "decimal": "DecimalField({}blank=True, null=True{})",
    "money": "DecimalField({}blank=True, null=True{})",
    "smallmoney": "DecimalField({}blank=True, null=True{})",
    "float": "FloatField({}blank=True, null=True{})",
    "real": "FloatField({}blank=True, null=True{})",
    "date": "DateField({}blank=True, null=True{})",
    "datetime": "DateTimeField({}blank=True, null=True{})",
    "datetime2": "DateTimeField({}blank=True, null=True{})",
    "smalldatetime": "DateTimeField({}blank=True, null=True{})",
    "time with time zone": "TimeField({}blank=True, null=True{})",
    "time without time zone": "TimeField({}blank=True, null=True{})",
    "character": "TextField({}blank=True, null=True{})",
    "nchar": "TextField({}blank=True, null=True{})",
    "nvarchar": "TextField({}blank=True, null=True{})",
    "varchar": "TextField({}blank=True, null=True{})",
    "geometry": "TextField({}blank=True, null=True{})",
    "text": "TextField({}blank=True, null=True{})",
    "ntext": "TextField({}blank=True, null=True{})",
    "char": "TextField({}blank=True, null=True{})",
    "xml": "TextField({}blank=True, null=True{})",
    "uuid": "UUIDField({}blank=True, null=True{})",
    "uniqueidentifier": "UUIDField({}blank=True, null=True{})",
    "varbinary": "BinaryField({}blank=True, null=True{})",
    "binary": "BinaryField({}blank=True, null=True{})",
    "image": "BinaryField({}blank=True, null=True{})"
}

context = {'db_name': 'scribe_test_db',
           'schema_name': 'dbo',
           'root_python_path': 'scribe_models',
           'view': 'GenericViewSet',
           'view_path': 'automagic_rest.views',
           'router': 'DefaultRouter',
           'router_path': 'rest_framework.routers',
           'routes': {}
           }

Result = collections.namedtuple('Result', 'schema_name table_name column_name, data_type, character_maximum_length, '
                                          'numeric_precision, numeric_scale')
schemata_data = [Result(schema_name='dbo',
                        table_name='PID_3808_200428 EDD Validated',
                        column_name='CaseNumber',
                        data_type='nvarchar',
                        character_maximum_length=10,
                        numeric_precision=None,
                        numeric_scale=None),
                 Result(schema_name='dbo',
                        table_name='PID_3808_200450A&B EDD Validated',
                        column_name='CarrierName',
                        data_type='nvarchar',
                        character_maximum_length=50,
                        numeric_precision=None,
                        numeric_scale=None)]
