var express=require('express');
var app =express();
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
const { verifyToken, secret, apiPrefix, errorSend, loginVerify } = require('./baseUtil');
const { uploadFileApi } = require('./Api/uploadFile');
const { fileList } = require('./Api/updateList');
const { pathNotVerify } = require('./Api/apiDomain');

var jwt = require('jwt-simple');

app.use(bodyParser.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
//设置跨域访问
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin",  req.headers.origin);
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Headers", "X-Requested-With,Content-Type,AccessToken");
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By",' 3.2.1');
    res.header("Content-Type", "application/json;charset=utf-8");
    const rawUrl = req.url;
    //  统一处理鉴权逻辑
    if (!pathNotVerify.includes(rawUrl)) {
        if (verifyToken(req.body)) {
            next()
        } else {
            errorSend(res);
        }
    } else {
        next();
    }
});

uploadFileApi(app);
fileList(app);

//登陆接口 
app.post(apiPrefix + '/login', async function(req,res){
    const { password } = req.body;
    const verifyObj = await loginVerify(password);
    if (verifyObj.verifyResult) {
        res.send({
            verifyResult: true,
            //  用户请求的鉴权token
            accessToken: jwt.encode(Object.assign(req.body, { tokenTimeStamp: Date.now() } ), secret)
        })
    } else {
        res.send({
            verifyResult: false,
        });
    }
});
 
//配置服务端口

let PORT = process.env.PORT || 4000;
var server = app.listen(PORT, function () {
 
    var host = server.address().address;
 
    var port = server.address().port;
    console.log('open success')
 
    console.log('Example app listening at http://%s:%s', host, port);
})