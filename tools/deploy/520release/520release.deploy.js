/*
* The RDS is up and running.
* We want to suck out the data, and upgrade it according to a
* version-standard and ultimately re-squirt it back into the DB.
*
* In config we run the local query; here we clean the data.
* */
const fs = require('fs-extra');
const pps = require('../../../lib/ProcessPayloadSchema/ProcessPayloadSchema.validator');

// data src
const config = require('../../../src/520release/520release.config');

// cleaning tools
const rcu = require('./520release.upgrade');
const rcc = require('./520release.clean');
const h = require('../lib/helper');

// the semver standard we aim for
const version = "v5.2.0";
const [v, payload_schema] = pps.buildValidator(version);

const deployType = '520release';


// format into a sql-type json-blob
const getDataArray = (url) => {
    raw = fs.readFileSync(url, "utf8");
    let lines = raw.split('\n').slice(0,-1);

    return Object.values(lines).map(v => {
        cols = v.split('\t');
        let otherCols = {};
        // We are going to squirt only this back into the front-end
        otherCols["payload"] = JSON.parse(cols[3]);
        // Decorative Only: these are automatically added by RedisToRDS
        // left in, but we could delete
        otherCols["session_id"] = cols[0];
        otherCols["load_timestamp"] = cols[1];
        otherCols["created_on"] = cols[2];

        return otherCols;
    });
};

// validator
const checkErrors = async (datapackage) => {
    const vres = await v.validate(datapackage, payload_schema);
    console.log(vres.errors);
    return vres.errors.length;
};

/*const writeToFile = (data) => {
    fs.writeFile(targetUrl, JSON.stringify(data), (err) => {
        if (err) throw err;
        console.log('[*] The file has been saved.');
    });
};*/


// Somewhat iterative: if no errors, save it.
const main = async (append=true) => {
    // format query data
    let allRowCols = getDataArray(config.srcUrl);

    // make upgrades to current version
    let rows = Object.values(allRowCols).map((row) => {
        row.payload = rcu.reformat520(row.payload);
        return row;
    });

    // rework the data (as opposed to its structure), e.g. hide personal data
    rows = Object.values(rows).map((row) => {
        row.payload = rcc.clean(row.payload);
        return row;
    });

    // ensure no errors
    let errCt = await checkErrors(rows[0].payload);

    errCt = 0;
    // write if no errors
    if (!errCt) {
        let targetUrl = h.buildDir(deployType) + `${deployType}.json`;
        // only saving the payload key
        rows = Object.values(rows).map(x => x.payload);
        if (append) {
            if (fs.existsSync(targetUrl)) {
                const data = require(targetUrl);
                Object.values(rows).map(r => {
                   data.push(r);
                });
                h.copyFilesToBuildArea(deployType, JSON.stringify(data), deployType+'.json');
            } else {
                h.copyFilesToBuildArea(deployType, JSON.stringify(rows), deployType+'.json');
            }
        } else {
            h.copyFilesToBuildArea(deployType, JSON.stringify(rows), deployType+'.json');
        }
    }
};


module.exports = {main};