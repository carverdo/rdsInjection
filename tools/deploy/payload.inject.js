const path = require('path');
const h = require('./lib/helper');
const fs = require('fs-extra');
const shell = require('shelljs');

const deployType = 'payload';

// get CLI args
const argv = require('yargs')
.usage("Usage:\n   node ./qclient.deploy.js -r <region e.g. eu-west-1> -e <environment> -s <stage e.g. test> -t [create|update|delete]")
.option('region', {
    alias: 'r',
    describe: 'The region to deploy to.'
})
.option('env', {
    alias: 'e',
    describe: 'The env to deploy to.'
})
.option('stage', {
    alias: 's',
    describe: 'The API gateway stage to point to.'
})
.option('type', {
    alias: 't',
    describe: 'The type of deployment we are carrying out - "create", "update", or "delete"'
})
.demandOption(['r','e', 's', 't'], 'Please provide region, stage, and env arguments')
.help()
.argv;

// The AWS_REGION env variable will be used by all sub-modules
const AWS_REGION = argv.region.toLowerCase();

// run webpack to create the dev (inline map) and production versions.
function runWebPack(env, region) {
    console.log(`running webpack - development`);
    shell.exec(`webpack --env.environment=${env} --env.awsRegion=${region} --env.build=development`);
    console.log(`running webpack - production`);
    shell.exec(`webpack --env.environment=${env}  --env.awsRegion=${region} --env.build=production`);
    console.log(`   Completed running webpack.`)
}

// run webpack to create the dev (inline map) and production versions.
async function deployToS3(env, packageName) {
    const s3Key = await h.s3Key(env, deployType, packageName);
    const body = await h.readFile(h.packageLocal(env, packageName));

    await h.deployToS3(s3Key, body);
    console.log(`Created ${deployType} package for ${env}`);
}

async function deleteS3Deployment(env, packageName) {
    return await h.deleteS3Package(env, deployType, packageName);
}


async function main() {
    if (argv.type === 'create') {
        await h.copyFilesToBuildArea(argv.env);
        await h.updateTarget(argv.env, argv.stage, AWS_REGION);
        h.getNodeModules(argv.env); // don't need wait

        runWebPack(argv.env, AWS_REGION);

        deployToS3(argv.env, 'main.bundle.dev.js');
        deployToS3(argv.env, 'main.bundle.js');
    } else if (argv.type === 'update') {
        console.log('Does nothing.')
    } else {
        deleteS3Deployment(argv.env, 'main.bundle.js');
        deleteS3Deployment(argv.env, 'main.bundle.dev.js');
    }
}

main();
