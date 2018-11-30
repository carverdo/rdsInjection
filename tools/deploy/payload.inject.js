/*
Tactical tool to squirt stuff into the rds (via redis).

1. Set deployType (which data package from src do you want to build?)
2. run build
3. run (and tinker with so that you can recognise those datapacks) inject
 */

const h = require('./lib/helper');
const uuidv4 = require('uuid/v4');

const deployType = 'ffam';

// get CLI args
const argv = require('yargs')
.usage("Usage:\n   node ./payload.inject.js -r <region e.g. eu-west-1> -e <environment> -s <stage e.g. red> -t [build|inject]")
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

async function main() {
    // always run a build first
    if (argv.type === 'build') {
        build = require(h.toolsdeployDir(deployType) + deployType + '.deploy');
        build.main();
    }

    // inject build into ProcessPayload
    if (argv.type === 'inject') {
        const datapacks = require(h.buildDir(deployType) + deployType);
        const target = await h.updateTarget(argv.env, argv.stage, AWS_REGION);

        datapacks.slice(1050).map(async (x, ix) => {
            // bespoke tinkering with datapacks
            x.sessionId = uuidv4();
            x.createdOn = new Date();
            x.version = 'ffam';  // 'evaq8_issueQ';

            await h.sendIt(x, target.invokeUrl);
            console.log(ix, x.sessionId);
        });
    }
}

main();
