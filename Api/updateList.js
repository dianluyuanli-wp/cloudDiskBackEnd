let ownTool = require('xiaohuli-package');
let fs = require('fs');
const request = require('request-promise');
const fse = require('fs-extra');
const path = require('path');
const multiparty = require('multiparty');
//  const os = require('os');
const { getToken, verifyToken, apiPrefix, errorSend, loginVerify, ENV_ID } = require('../baseUtil');
const { uploadApi, downLoadApi, queryApi, addApi, deleteFileApi, deleteApi } = require('./apiDomain');

function fileList(app) {
    //  查询文件列表
    app.post(apiPrefix + '/queryFileList', async function(req, res) {
        const wxToken = await getToken();
        const doamin = queryApi + wxToken;
        const { queryString } = req.body;
        const result = await ownTool.netModel.post(doamin, {
            env: ENV_ID,
            query: queryString
        })
        res.send(result);
    })

    //  删除文件
    app.post(apiPrefix + '/deleteFile', async function(req, res) {
        const wxToken = await getToken();
        const doamin = deleteFileApi + wxToken;
        const { deleteFileList } = req.body;
        const result = await ownTool.netModel.post(doamin, {
            env: ENV_ID,
            fileid_list: deleteFileList
        })
        const xxx = await ownTool.netModel.post(
            deleteApi + wxToken, {
            env: ENV_ID,
            query: 'db.collection(\"fileList\").where({ fileId: db.RegExp({ regexp: "' + deleteFileList.join('|') +'", options: "i"}) }).remove()'
        });
        res.send(xxx);
    });
}

exports.fileList = fileList;

