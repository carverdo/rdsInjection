/*
Tactical tool to squirt stuff into the rds (via api/redis or backend).

1. Set deployType (which data package from src do you want to build?)
2. run build
3a. SMALL DATA SETS
* run (and tinker with so that you can recognise those datapacks) inject
3b. LARGE DATA SETS
* run sqlBuild and update RDS directly from bastion

* Remember that redis is a buffer so it will lose any repeat sessionIds.
* Adjust if you don't want this behaviour.
 */

const h = require('./lib/helper');
const uuidv4 = require('uuid/v4');

const deployType = '520release';

// get CLI args
const argv = require('yargs')
.usage("Usage:\n   node ./payload.inject.js -r <region e.g. eu-west-1> -e <environment> -s <stage e.g. red> -w <wersion e.g. v5.2.0> -t [build|sqlBuild|inject|inject520]")
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
.option('wersion', {
    alias: 'w',
    describe: 'The version we test the injection against.'
})
.option('type', {
    alias: 't',
    describe: 'The type of deployment we are carrying out - "build", "sqlBuild", "inject", or "inject520"'
})
.demandOption(['r','e', 's', 'w', 't'], 'Please provide region, env, stage, wersion and type arguments')
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
    // prepping data for a SQL "load data infile.." instruction (rather than an injection)
    if (argv.type === 'sqlBuild') {
            build = require(h.toolsdeployDir(deployType) + deployType + '.deploy');
            build.prepForSQL(argv.env);
        }

    // inject build into ProcessPayload
    if (argv.type === 'inject') {
        const datapacks = require(h.buildDir(deployType) + deployType);
        const target = await h.updateTarget(argv.env, argv.stage, argv.wersion, AWS_REGION);

        datapacks.slice(1050, 1100).map(async (x, ix) => {
            // bespoke tinkering with datapacks
            x.sessionId = uuidv4();
            x.createdOn = new Date();
            x.version = 'ffam';  // 'evaq8_issueQ';

            await h.sendIt(x, target.invokeUrl);
            console.log(ix, x.sessionId);
        });
    }

    if (argv.type === 'inject520') {
        const datapacks = require(h.buildDir(deployType) + deployType);
        const target = await h.updateTarget(argv.env, argv.stage, argv.wersion, AWS_REGION);

        let errs = [];
        datapacks.slice(14000,16000).map(async (x, ix) => {  // .slice(1000, 1100)
            // bespoke tinkering with datapacks
            setTimeout( async () => {
                const err = await h.sendIt(x, target.invokeUrl);
                if (err) errs.push(err);
                console.log(ix);
            }, ix*1000);  // safe throttle
        });
        // take copy of errs
        h.copyFilesToBuildArea(deployType, JSON.stringify(errs),"err.json");
    }
}

main();
