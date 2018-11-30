const _ = require('lodash');
const path = require('path');

const prepend = '-PayloadAPI';

function parseTarget(str, target) {
    return str.replace(/__invokeUrl__/g, target)
}

async function getTarget(env, stageName, region) {
    const AWS = require('aws-sdk');

    AWS.config.update({region: region});
    const apigateway = new AWS.APIGateway({apiVersion: '2015-07-09'});

    // We assume a local target as default
    let invokeUrl = "http://localhost:3000/payload";

    // Get all APis
    const data = await apigateway.getRestApis().promise();

    // Filter APIs
    const rePattern = new RegExp(env + prepend);
    const arrayOfAPIs = _.filter(data.items, function(api) {
        return api.name.match(rePattern);
    });

    // If already down to one API only, do stuff;
    // else, present user with choices
    if (arrayOfAPIs.length !== 1) {
        console.log('[*] Invalid Choice.');
        console.log('API choices available - ');
        _.forEach(data.items, function(api) {
            console.log(`[*] ${api.name}`);
            // console.log(api);
        });
    } else {
        const apiId = arrayOfAPIs[0].id;

        // Get all stages associated with that api
        const stages = await apigateway.getStages({restApiId: apiId}).promise();

        // Filter
        const stagePattern = new RegExp(stageName);
        const arrayOfStages = _.filter(stages.item, function(stage) {
            return stage.stageName.match(stageName);
        });

        // If already down to one stage only, do stuff;
        // else, present user with choices
        if (arrayOfStages.length !== 1) {
            console.log('Choose one of these stageNames - ');
            _.forEach(stages.item, function(stage) {
                console.log(`[*] ${stage.stageName}`);
            });
        } else {
            const stager = arrayOfStages[0].stageName;
            invokeUrl = `https://${apiId}.execute-api.${region}.amazonaws.com/${stager}/trouble`;
        }
    }
    console.log(`Target for ${env}: ${invokeUrl}`);
    return {
        "invokeUrl": invokeUrl,
        "env": env
    };
}

module.exports = {
    getTarget, parseTarget
};
