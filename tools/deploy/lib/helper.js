const s = require('./awsStack2');
const path = require('path');
const math = require('mathjs');
const csv = require('csvtojson');
const fs = require('fs-extra');
const request = require('request');


function baseDir() {
    return __dirname.replace(/rdsInjection.*/,'rdsInjection');
}

function toolsdeployDir(deployType) {
    return path.normalize(baseDir() + '/tools/deploy/' + deployType + '/');
}

function sourceCodeDir(deployType) {
    return path.normalize(baseDir() + '/src/' + deployType + '/');
}

function sourceCodeFile(deployType) {
    return sourceCodeDir(deployType) + deployType + '.csv';
}

function readFile(fileName) {
    return new Promise(function(resolve, reject) {
        fs.readFile(fileName, function(err, data) {
            if (err) {
                reject(err)
            }
            else {
                resolve(new Buffer(data, 'binary'));
            }
        });
    });
}

function buildDir(env) {
    return path.normalize(baseDir() + '/build/' + env + '/');
}

async function copyFilesToBuildArea(env, jsonData, packageName='payload.json') {
    // const scDir = sourceCodeDir(deployType);
    const bDir = buildDir(env);
    await fs.ensureDir(bDir);
    fs.writeFileSync(bDir+packageName, jsonData);
    return;
}


// SPECIFIC FUNCTIONS
async function readCSV(deployType) {
    return await csv().fromFile(sourceCodeFile(deployType));
}

function transposeAddZero(arr) {
    arr = math.transpose(arr);
    arr = arr.map(val => {
        val = val.map(x => {
            if (x === null) return 0;
            return parseFloat(x);
        });
        val.push(0);
        return val;
    });
    return arr;
}

function makeBoolean(str) {
    return str === 'TRUE';
}


async function reformatFP(payloads) {
    return payloads.map(x => {
        let xp = x.payload;

        xp.fp.fonts = Array(195).fill('0').join('');
        xp.fp.plugins = [[[xp.fp.plugins]]];

        xp.fp.adBlock = makeBoolean(xp.fp.adBlock);
        xp.fp.addBehavior = makeBoolean(xp.fp.addBehavior);
        xp.fp.doNotTrack = makeBoolean(xp.fp.doNotTrack);
        xp.fp.indexedDb = makeBoolean(xp.fp.indexedDb);
        xp.fp.isIE = makeBoolean(xp.fp.isIE);
        xp.fp.localStorage = makeBoolean(xp.fp.localStorage);
        xp.fp.openDatabase = makeBoolean(xp.fp.openDatabase);
        xp.fp.sessionStorage = makeBoolean(xp.fp.sessionStorage);
        xp.fp.touchSupport = makeBoolean(xp.fp.touchSupport);

        xp.fp.bigH = parseInt(xp.fp.bigH);
        xp.fp.canvasDyno = parseInt(xp.fp.canvasDyno);
        xp.fp.canvasStatic = parseInt(xp.fp.canvasStatic);
        xp.fp.timezoneOffset = parseInt(xp.fp.timezoneOffset);
        xp.fp.webgl = parseInt(xp.fp.webgl);

        let tmp = xp.fp.userAgent.split('_');
        xp.fp.userAgent = [tmp[0], makeBoolean(tmp[1]), makeBoolean(tmp[2])];

        tmp = xp.fp.screen.split('|');
        let tmpL = tmp.slice(0, -1).map(x => {
            if (x === 'undefined') return 0;
            return parseInt(x);
        });

        tmpL.push(makeBoolean(tmp.slice(-1)));
        xp.fp.screen = tmpL;

        xp.vis.client_data.metro_code = parseFloat(xp.vis.client_data.metro_code);
        xp.vis.client_data.geolocation.latitude = parseFloat(xp.vis.client_data.geolocation.latitude);
        xp.vis.client_data.geolocation.longitude = parseFloat(xp.vis.client_data.geolocation.longitude);

        xp.vis.latency.reqTime = parseFloat(xp.vis.latency.reqTime);
        xp.vis.latency.nwLatency = parseFloat(xp.vis.latency.nwLatency);
        xp.vis.latency.timezone_offset = parseFloat(xp.vis.latency.timezone_offset);

        xp.vis.client_data.exp_tzo = 0; // .map(x => 0);
        xp.vis.client_data.country_code = "XX"; // .map(x => 0);
        xp.vis.client_data.region_code = "XX"; // .map(x => 0);

        return x;
    });
}


async function reformatMotion(payloads) {
    return payloads.map(function(onePayload, idx) {
        let oneMB = JSON.parse(onePayload.payload.mb);
        return [transposeAddZero(oneMB[0]), transposeAddZero(oneMB[1])];
    });
}


function ksb_obj(oneRow) {
    this.element = oneRow.klab;
    this.kblob = [[oneRow.ktype, oneRow.kcode, parseFloat(oneRow.ktime)]];
    this.tex = oneRow.kcode;
    return this;
}

async function reformatKeys(deployType) {
    const allRows = await csv().fromFile(
        sourceCodeDir(deployType) + 'stroker' + '.csv'
    );
    let lastRec = '|';
    const di = {};
    allRows.map(function(oneRow, idx) {
        // all rows should have a character
        if (oneRow.kcode.length === 0) {oneRow.kcode = 'X'}

        let curRec = oneRow.sesh_id + '|' + oneRow.klab;
        // Any time the record changes we start afresh
        if (curRec !== lastRec) {
            lastRec = curRec;
            di[curRec] = [new ksb_obj(oneRow)];
       } else { // Otherwise add to the object your are building for that curRec
            if (oneRow.kcode === '\'') {
                oneRow.kcode = '@';
            }
            di[curRec][0].kblob.push([oneRow.ktype, oneRow.kcode, parseFloat(oneRow.ktime)]);
            di[curRec][0].tex += oneRow.kcode;
        }
    });
    /* ksb_arr is a part of every payload; here we create a dictionary that matches
    every ksb_arr with its session_id */
    ksb_arrDi = {};
    Object.keys(di).forEach(function(key) {
        let sid = key.split('|')[0];
        if (ksb_arrDi.hasOwnProperty(sid)) {
            ksb_arrDi[sid].push(di[key][0]);
        } else {
            ksb_arrDi[sid] = di[key];
        }
    });
    return ksb_arrDi;
}


async function reformatTouch(deployType) {
    const sourceFile = await readFile(
        sourceCodeDir(deployType) + 'touchcapture' + '.csv'
    );
    let allRows = sourceFile.toString().split('\n');
    allRows = allRows.slice(0, -1);

    let newRows = allRows.map(function(oneRow, idx) {
        oneRow = oneRow.slice(0,-2);
        oneRow = oneRow.replace(/"/g, '');
        oneRow = oneRow.replace(/\(/g, '[');
        oneRow = oneRow.replace(/\)/g, ']');
        oneRow = oneRow.replace(/,000/g, ',0');

        oneRow = oneRow.split(',XX,');

        oneRow = oneRow.slice(2, 5);

        return oneRow.map(function(ele, idx) {
            if (ele === '{}') ele = [0];
            if (ele[0] !== '[') {
                ele = '[' + ele + ']';
            }
            return JSON.parse(ele);
        });

    });
    newRows = newRows.map(function(onerow, idx) {
        try {
            if ((onerow[0].length !== onerow[1].length) || (onerow[1].length !== onerow[2].length)) {
                console.log("Error: ", idx, onerow);
            }
            if (onerow[0].length === 0) {
                return [[0, 0, 0, 0]];
            } else {
                return transposeAddZero(onerow);
            }
        } catch(e) {
            console.log(idx, onerow);
        }
    });
    return newRows;
}


async function updateTarget(env, stageName, wersion, region) {
    const envConfig = await s.getTarget(env, stageName, wersion, region);

    const bDir = buildDir(env);
    await fs.ensureDir(bDir);
    fs.writeFileSync(bDir+'target.json', JSON.stringify(envConfig));
    return envConfig;
}

function sleep(ms){
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    });
}


async function sendIt(oneDatapack, tgt) { // xxx
    const options = {
        method: 'post',
        body: oneDatapack,
        json: true,
        url: tgt,
        headers: {"Content-Type": "application/json"}
    };

    function callback(err, resp, body) {
        if (!err && resp.statusCode === 200) {
            console.log('Success: ' + oneDatapack.sessionId);
        } else {
            console.log('Error :', err);
            console.log('[*]   Failure: ' + oneDatapack.sessionId);
            return oneDatapack.sessionId;
        }
    }

    return request(options, callback);
    // await sleep(1000);
}


module.exports = {
    readCSV, reformatFP, reformatMotion, reformatTouch, reformatKeys,
    copyFilesToBuildArea,
    updateTarget, buildDir,
    sendIt
    , sourceCodeDir
    , toolsdeployDir
};
