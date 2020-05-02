let ownTool = require('xiaohuli-package');
var jwt = require('jwt-simple');
const { queryApi } = require('./Api/apiDomain');

const secret = 'xiaohuli';
const apiPrefix = '/api';
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
        appid: 'wxac77677dc117cc7f',
        secret: '4d06c4b654f7145675960e6c9a5a29a2'
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

const loginVerify = async function(userName, password) {
    const token = await getToken();
    const doamin = queryApi + token;
    const request =  await ownTool.netModel.post(doamin, {
        env: 'test-psy-qktuk',
        query: 'db.collection(\"user\").where({name:"' + userName + '"}).get()'
    })
    const resObj = JSON.parse(request.data);
    return {
        verifyResult: request.errmsg === 'ok' && resObj.secret.toString() === password,
        identity: resObj.identity
    }
}

const outOfDatePeriod = 2 * 60 * 60 * 1000;

const verifyToken = ({name, token = ''}) => {
    const res =  token ? jwt.decode(token, secret) : {};
    return res.userName === name && (res.tokenTimeStamp + outOfDatePeriod) > Date.now();
}

exports.getToken = getToken;
exports.verifyToken = verifyToken;
exports.secret = secret;
exports.apiPrefix = apiPrefix;
exports.errorSend = errorSend;
exports.loginVerify = loginVerify;