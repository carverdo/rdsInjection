/*
* Note that we took a copy of dyno and user.id so that we could reverse / test the hashes.
* */
const CryptoJS = require("crypto-js");
const SECRET_KEY = "Im a pied piper";

const toCipher = (plaintext) => {
    return CryptoJS.AES.encrypt(plaintext, SECRET_KEY).toString();
};

const toPlain = (ciphertext) => {
    const bytes  = CryptoJS.AES.decrypt(ciphertext.toString(), SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
};

const texCipher = (arr) => {
    return Object.values(arr).map(obj => {
        if (obj.tex) obj.tex = toCipher(obj.tex);
        return obj;
    });
};

const patt = /evaq8/gi;
const fromEvaq8 = (obj) => {
    const str = JSON.stringify(obj);
    return JSON.parse(str.replace(patt, "climber"));
};

// Will upgrade anything from to v5.2.0
const clean = (dp) => {
    // dyno, user.id fix to hide those emails
    dp.payload.fp.dyno = toCipher(dp.payload.fp.dyno);
    dp.payload.user.id = toCipher(dp.payload.user.id);
    // and in tex
    dp.payload.ksb.ksb_arr = texCipher(dp.payload.ksb.ksb_arr);

    // evaq8 removal
    dp.payload.fp_source = fromEvaq8(dp.payload.fp_source);

    // VERSIONS
    // because we are going in "the front door" everything has to be v5.2.0;
    // we have instead marked the fo_source.host so that we can distinguish the datasets

    // keep this to end (just in case our treatment varies by versionNumber)
    if (dp.version !=="v5.2.0") {
        dp.version = "v5.2.0";
        dp.payload.meta.version = "v5.2.0";
    }

    return dp;
};

module.exports = {clean};

/*
let plaintext = "";
const ct = toCipher(plaintext);
const pt = toPlain(ct);
console.log(ct);
console.log(toPlain(ct));
*/
