# Generated by Django 3.2.20 on 2023-07-14 16:33

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='ProjectsExplorer',
            fields=[
                ('projectid', models.IntegerField(db_column='Project_Id', primary_key=True, serialize=False)),
                ('project_name', models.CharField(blank=True, db_column='Project_Name', max_length=255, null=True)),
                ('Site_No', models.TextField(blank=True, db_column='Site_No', null=True)),
                ('Site_State', models.TextField(blank=True, db_column='Site_State', null=True)),
                ('NPL_Status', models.TextField(blank=True, db_column='NPL_Status', null=True)),
                ('Description', models.TextField(blank=True, db_column='Description', null=True)),
                ('EPARegionNumber', models.TextField(blank=True, db_column='EPARegionNumber', null=True)),
                ('EPAContact', models.TextField(blank=True, db_column='EPAContact', null=True)),
            ],
            options={
                'db_table': 'PROJECTSEXPLORER',
                'ordering': ['projectid'],
                'managed': True,
            },
        ),
    ]
