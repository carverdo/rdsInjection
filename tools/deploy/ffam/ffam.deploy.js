// const math = require('mathjs');
const Validator = require('jsonschema').Validator;
const h = require('../lib/helper');

const deployType = 'payload';
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
    /* 0. READ IN RAW DATA
    * Its not truly raw; we have processed as much as possible */
    const payloads = await h.readCSV(deployType);

    /* 1. PROCESS DATA */
    FPs = await h.reformatFP(payloads);

    // we know that the motion and touch data is badly formatted
    MBs = await h.reformatMotion(payloads);
    TBs = await h.reformatTouch(deployType);

    let newPayloads = payloads.map(function(onePayload, idx) {
        onePayload.payload.mb = MBs[idx];
        onePayload.payload.tb.tstarter = TBs[idx];
        onePayload.payload.tb.tmover = [[0,0,0,0]];
        return onePayload;
    });



    // this one needs treated differently because of the row mismatch at outset
    KeyObject = await h.reformatKeys(deployType);

    newPayloads.map(payler => {
        let sid = payler.sessionId;
        payler.payload.ksb.ksb_arr = KeyObject[sid];

        if (KeyObject[sid] === undefined) {
            payler.payload.ksb.ksb_arr = [{
                'element': 'none',
                'tex': 'none',
                'kblob': []
            } ]
        } else {
            payler.payload.ksb.ksb_arr = KeyObject[sid];
        }

        return payler;
    });

    // console.log("======================");
    // console.log(newPayloads[0].createdOn);
    // console.log(newPayloads[0].version);

    // console.log(newPayloads[0].payload.fp);
    // console.log(newPayloads[1].payload.tb.tstarter);
    // console.log(newPayloads[0].payload.tb.tmover);
    // console.log(newPayloads[0].payload.mb[0].slice(0,25));
    // console.log(newPayloads[0].payload.mb[1].slice(0,25));
    //
    // console.log(newPayloads[262].payload.ksb);
    // console.log(newPayloads[262].payload.ksb.ksb_arr[0].kblob.slice(0,5));

    /* 2 VALIDATE NEW PAYLOAD */
    newPayloads.map(async function(x, ix) {
        let reser = await v.validate(x, payload_schema);
        if (reser.errors.length > 0) {
            console.log('         ' + ix);
            console.log(reser.errors);
        }
    });

    return newPayloads;
}

async function main() {
    // Validate
    const newPayloads = await validate(deployType);
    console.log(newPayloads.length);
    // Build
    h.copyFilesToBuildArea(deployType, JSON.stringify(newPayloads));
}

module.exports = {main};