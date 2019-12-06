Previous
There were no readme notes, but we can see that data was taken from csv to INITIALLY
inflate the RDS.

520Release was written MUCH later; there is certainly some repetition in the project.

520Release
This is slightly different: 
- cleaning up previous data in the RDS to a semver standard; and, 
- removing personal info for our test users.

Since the clean data is squirted back into the RDS this project is used iteratively.

Take a local copy of the RDS:
* run a snapshot in aws rds;
* aws s3 cp from bastion into s3;
* download to pc (doesn't matter where it goes);

Now you've got a big .sql file, and we need to inflate the local database:
* mysql> use quill;
* mysql> source C:/Users/donal/Downloads/dev1-rds-dump.sql

Then generate version-CSVs by sql query (see .config):
* mysql> select * from payload where json_extract(payload, "$.version")="4.2.1" into outfile "C:/ProgramData/MySQL/MySQL Server 5.7/Uploads/query.csv";*

and run, producing a combined build/json as output.