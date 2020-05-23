let ownTool = require('xiaohuli-package');
var jwt = require('jwt-simple');
const { queryApi } = require('./Api/apiDomain');
const { sensitiveInfo } = require('./operatedFile');

const secret = 'xiaohuli';
const apiPrefix = '/api';
const ENV_ID = sensitiveInfo.ENV_ID;
let accessObj = {
    token: '',
    period: 0,
    getTimeStamp: 0
};

const errorSend = (res) => {
    res.send({
        response: {
            status: '401',
            url: '报错'
        },
    });
}

const getAccessToken = async() => {
    const domain = 'https://api.weixin.qq.com/cgi-bin/token';
    return await ownTool.netModel.get(domain, {
        grant_type: 'client_credential',
        appid: sensitiveInfo.appid,
        secret: sensitiveInfo.secret
    });
}

const getToken = async () => {
    let { token, period, getTimeStamp} = accessObj;
    const nowTiemStamp = Date.now();
    if (token && (nowTiemStamp < (getTimeStamp + period * 1000))) {
        return token;
    } else {
        const { access_token, expires_in } = await getAccessToken();
        accessObj.token = access_token;
        accessObj.getTimeStamp = nowTiemStamp;
        accessObj.period = expires_in;
        return access_token;
    } 
}

const loginVerify = async function(password) {
    const token = await getToken();
    const doamin = queryApi + token;
    const request =  await ownTool.netModel.post(doamin, {
        env: ENV_ID,
        query: 'db.collection(\"user\").where({name:"wang"}).get()'
    })
    const resObj = JSON.parse(request.data);
    return {
        verifyResult: request.errmsg === 'ok' && resObj.secret.toString() === password
    }
}

const outOfDatePeriod = 2 * 60 * 60 * 1000;

const verifyToken = ({token = ''}) => {
    const res =  token ? jwt.decode(token, secret) : {};
    return (res.tokenTimeStamp + outOfDatePeriod) > Date.now();
}

exports.getToken = getToken;
exports.verifyToken = verifyToken;
exports.secret = secret;
exports.apiPrefix = apiPrefix;
exports.errorSend = errorSend;
exports.loginVerify = loginVerify;
exports.ENV_ID = ENV_ID;