/*
* This is very manual - basically we are playing with the data until it satisfies the semver standard.
* */

// Will upgrade anything from to v5.2.0
const reformat520 = (dp) => {
    // all else are fill-ins, if missing
    if (dp.payload.fp.cookieEnabled === undefined) dp.payload.fp.cookieEnabled = true;
    if (dp.payload.fp.memory === undefined) dp.payload.fp.memory = 1;
    if (dp.payload.fp.colorPixelDepths === undefined) dp.payload.fp.colorPixelDepths = [24, 24];
    if (dp.payload.fp.pixelRatio === undefined) dp.payload.fp.pixelRatio = 1;
    if (dp.payload.fp.systemTimeZone === undefined) dp.payload.fp.systemTimeZone = "Europe/London";
    if (dp.payload.fp.screenResolution === undefined) dp.payload.fp.screenResolution = [1280, 720];
    if (dp.payload.fp.availScreenResolution === undefined) dp.payload.fp.availScreenResolution = [1280, 720];
    if (dp.payload.fp.availScreenLeftTop === undefined) dp.payload.fp.availScreenLeftTop = [0, 0];
    if (dp.payload.fp.orientation === undefined) dp.payload.fp.orientation = "landscape";
    if (dp.payload.fp.browserLies === undefined) dp.payload.fp.browserLies = false;
    if (dp.payload.fp.osLies === undefined) dp.payload.fp.osLies = false;
    if (dp.payload.fp.resolutionLies === undefined) dp.payload.fp.resolutionLies = false;

    // beneeath is partly clean-up to make "host" a useful marker
    if (dp.version === "ffam") dp.payload.fp_source = {
        url: dp.payload.fp_source,
        host: "ffam.com",
        referrer: "https://test.com/",
        merchantData: ["", ""]
    };
    if (dp.version==="4.0.0") dp.payload.fp_source = {
        url: dp.payload.fp_source,
        host: "400.com",
        referrer: "https://test.com/",
        merchantData: ["", ""]
    };
    if (dp.version==="4.1.1" || dp.version==="4.2.1") dp.payload.fp_source = {
        url: dp.payload.fp_source.url, // note
        host: "400.com",
        referrer: "https://test.com/",
        merchantData: ["", ""]
    };
    // this change only applies to evaq8 (see clean for choice of replace)
    if (dp.version === "4.2.2") dp.payload.fp_source.host = "climber.co.uk";

    if (dp.payload.meta === undefined) dp.payload.meta = {
        version: dp.version,
        createdOn: dp.createdOn,
        sessionId: dp.sessionId,
        visitId: dp.sessionId // NOTE!
    };

    return dp;
};


module.exports = {reformat520};


/*if (typeof(dp.payload.fp_source) === "string") dp.payload.fp_source = {
    url: "https://test.com/demo",
    host: "test.com",
    referrer: "https://test.com/",
    merchantData: ["", ""]
};*/
// if (dp.payload.fp_source.host === undefined) dp.payload.fp_source.host = "climber.co.uk";