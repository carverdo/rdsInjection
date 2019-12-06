/*
* We have taken a local copy / snapshot of the RDS -
* aws s3 cp from bastion into s3;
* download to pc (doesn't matter where it goes);
*
* Now you've got a big .sql file.
* We need to inflate the local database.
*
* mysql> use quill;
* mysql> source C:/Users/donal/Downloads/dev1-rds-dump.sql
*
* SELECT INTO OUTFILE (see below)
* Need to use particular directories -
* mysql> SHOW VARIABLES LIKE 'datadir'
* mysql> SHOW VARIABLES LIKE 'secure_file_priv'
*
* mysql> select * from payload where json_extract(payload, "$.version")="4.2.1" into outfile "C:/ProgramData/MySQL/MySQL Server 5.7/Uploads/query.csv";*
* copy them across
* */

// copy them query files across
const srcDir = "./dbBackup";
// scroll these guys up, sequentially -
let srcFile = "/query421.csv";
/*
let srcFile = "/queryffam.csv";

// low vol expts
let srcFile = "/query400.csv";
let srcFile = "/query410.csv";  // We DELETE THIS PUPPY
let srcFile = "/query411.csv";
let srcFile = "/query421.csv";

// zaid
let srcFile = "/query422.csv";
let srcFile = "/query500.csv";

// extras
let srcFile = "/query510.csv";
let srcFile = "/query520.csv";
*/

let srcUrl = srcDir + srcFile;

module.exports = {srcUrl};


// INSERT INTO payload(session_id, load_timestamp, created_on, payload) VALUES("abcd", "2019-12-031 11:00:00", "2019-12-031 11:00:00", "{\"payload\": 12}");
// delete from payload where session_id="abcd";

// delete from payload where json_extract(payload, "$.version") = "4.0.0";
// delete from payload where json_extract(payload, "$.version") = "4.1.0";
// delete from payload where json_extract(payload, "$.version") = "4.1.1";
// delete from payload where json_extract(payload, "$.version") = "4.2.1";
