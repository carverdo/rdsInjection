const Validator = require('jsonschema').Validator;
const h = require('../lib/helper');

const deployType = 'badpayload';
const v = new Validator;

const fp_schema = require('../../../src/schemas/schema_fp');
const ksb_schema = require('../../../src/schemas/schema_ksb');
const mb_schema = require('../../../src/schemas/schema_mb');
const tb_schema = require('../../../src/schemas/schema_tb');
const vis_schema = require('../../../src/schemas/schema_vis');
const user_schema = require('../../../src/schemas/schema_user');
const payload_schema = require('../../../src/schemas/schema_payload');

v.addSchema(fp_schema, '/fp');
v.addSchema(ksb_schema, '/ksb');
v.addSchema(mb_schema, '/mb');
v.addSchema(tb_schema, '/tb');
v.addSchema(vis_schema, '/vis');
v.addSchema(user_schema, '/payload');


async function validate(deployType) {
    /* 1 MANIPULATE BAD PAYLOAD
    We spotted that a search, replaceAll for ["PASS"] -> [[["PASS"]]]
    was all we needed to do. We then put those cases at the tail.
     */
    const payloads = require(h.sourceCodeDir(deployType) + "/" + deployType);

    /* 2 VALIDATE PAYLOADS */
    payloads.map(async function(x, ix) {
        let reser = await v.validate(x, payload_schema);
        if (reser.errors.length > 0) {
            console.log('         ' + ix);
            console.log(reser.errors);
        }
        console.log(ix, x.sessionId);
    });

    return payloads;
}

async function main() {
    // Validate
    const newPayloads = await validate(deployType);
    console.log(newPayloads.length);
    // Build
    h.copyFilesToBuildArea(deployType, JSON.stringify(newPayloads), deployType+'.json');
}

module.exports = {main};