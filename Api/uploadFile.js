let ownTool = require('xiaohuli-package');
let fs = require('fs');
const request = require('request-promise');
const fse = require('fs-extra');
const path = require('path');
const multiparty = require('multiparty');
//  const os = require('os');
const { getToken, verifyToken, apiPrefix, errorSend, loginVerify, ENV_ID } = require('../baseUtil');
const { uploadApi, downLoadApi, queryApi, addApi, updateApi } = require('./apiDomain');

const UPLOAD_DIR = path.resolve(__dirname, "..", "target"); // 大文件存储目录

// const regWin = /window/i;
// const parsePath = (route) => regWin.test(os.type()) ? route.replace(/\\/g, '/') : route;

const pipeStream = (path, writableStream) => 
    new Promise(resolve => {
        const readStream = fse.createReadStream(path);
        readStream.on('end', () => {
            fse.unlinkSync(path);
            resolve()
        });
        readStream.pipe(writableStream);
    })

const mergeFileChunk = async (filePath, fileName, size) => {
    const chunkDir = path.resolve(UPLOAD_DIR, fileName);
    const chunkPaths = await fse.readdir(chunkDir);
    chunkPaths.sort((a, b) => a.split('-')[1] - b.split('-')[1]);
    await Promise.all(chunkPaths.map((chunkPath, index) =>
        pipeStream(path.resolve(chunkDir, chunkPath),
            fse.createWriteStream(filePath, { start: index * size, end: (index + 1) * size })
        )
    ));
    try {
        //  反复改名啥的很奇怪，但是不这样就会有报错，导致请求返回pending，可能是windows下的bug
        //  文件夹的名字和文件名字不能重复
        await fse.move(filePath, path.resolve(UPLOAD_DIR, `p${fileName}`)).catch(e => {
            console.log(e)
        });
        fse.removeSync(chunkDir);
        // fs.unlink(chunkDir, (e) => {
        //     console.log(e, '删除文件报错')
        // })
        await fse.move(path.resolve(UPLOAD_DIR, `p${fileName}`), path.resolve(UPLOAD_DIR, `${fileName}`)).catch(e => {
            console.log(e);
        });
    } catch(e) {
        //  不管怎么操作这里都会有神秘报错，errno: -4048 目测是权限或者缓存问题
        await fse.move(path.resolve(UPLOAD_DIR, `p${fileName}`), path.resolve(UPLOAD_DIR, `${fileName}`)).catch(e => {
            console.log(e)
        });
    }
}

async function uploadToCloud(filePath, fileName) {
    const wxToken = await getToken();
    const fullPath = path.resolve(filePath, fileName);
    const doamin = uploadApi + wxToken;
    //  获取图片上传相关信息
    let a = await ownTool.netModel.post(doamin, {
        env: ENV_ID,
        path: fileName
    })
    const { authorization, url, token: newToken, cos_file_id, file_id} = a;
    //  真正上传图片
    const option = {
        method: 'POST',
        uri: url,
        formData: {
            "Signature": authorization,
            "key": fileName,
            "x-cos-security-token": newToken,
            "x-cos-meta-fileid": cos_file_id,
            "file": {
                value: fs.createReadStream(fullPath),
                options: {
                    filename: 'test',
                    //contentType: file.type
                }
            }
        }
    }
    await request(option);
    //  获取图片的下载链接
    const getDownDomain = downLoadApi + wxToken;
    let imgInfo = await ownTool.netModel.post(getDownDomain, {
        env: ENV_ID,
        file_list: [{
            fileid: file_id,
            max_age: 7200
        }]
    });
    //  server中转的图片删掉
    fs.unlink(fullPath, (e) => {
        if(e) {
            console.log(e);
        }
    })
    return imgInfo;
}

//  更新文件列表
async function updateList(fileObj, fileName, size) {
    const { download_url, fileid } = fileObj;
    const dataInfo = {
        fileName,
        downloadUrl: download_url,
        fileId: fileid,
        size,
        timeStamp: Date.now()
    };
    const dataInfoString = JSON.stringify(dataInfo);
    const wxToken = await getToken();
    let fileId = '';
    let isNew = false;
    //  先看有没有
    const res = await ownTool.netModel.post(
        queryApi + wxToken, {
        env: ENV_ID,
        query: 'db.collection(\"fileList\").where({ fileName: "' + fileName +'"}).get()'
    });

    //  如果已经有了，就更新记录
    if (res.data.length) {
        fileId = JSON.parse(res.data[0])._id;
        const res1 = await ownTool.netModel.post(updateApi + wxToken, {
            env: ENV_ID,
            query: 'db.collection(\"fileList\").where({ fileName: "' + fileName + '"}).update({ data: ' + dataInfoString +'})'
        })
        //console.log(res);
    //  否则新建一个
    } else {
        const res2 = await ownTool.netModel.post(addApi + wxToken, {
            env: ENV_ID,
            query: 'db.collection(\"fileList\").add({ data: ' + dataInfoString +'})'
        })
        fileId = res2.id_list[0];
        isNew = true;
        console.log(res2);
    }
    const finalData = Object.assign(dataInfo, { _id: fileId });
    return { fileData: finalData, isNew };
}

function uploadFileApi(app) {
    //  接收上传的文件片段
    app.post(apiPrefix + '/uploadFile', async function(req, res) {
        const multipart = new multiparty.Form();
        multipart.parse(req, async (err, fields, files) => {
            if (err) {
                console.log(err);
                return;
            }
            const [chunk] = files.chunk;
            const [hash] = fields.hash;
            const [filename] = fields.filename;
            const chunkDir = path.resolve(UPLOAD_DIR, filename);
            //const chunkDir = path.resolve(UPLOAD_DIR);
            if (!fse.existsSync(chunkDir)) {
                await fse.mkdirs(chunkDir).catch(e => {
                    console.log(e)
                });
            }
            await fse.move(chunk.path, `${chunkDir}/${hash}`);
            res.end('received file chunk');
        })
    })

    //  合并文件
    app.post(apiPrefix + '/fileMergeReq', async function(req, res) {
        const { fileName, size } = req.body;
        const filePath = path.resolve(UPLOAD_DIR, `${fileName}`, `${fileName}`);
        //const filePath = path.resolve(UPLOAD_DIR, `${fileName}`);
        await mergeFileChunk(filePath, fileName, size);
        const fileInfo = await uploadToCloud(UPLOAD_DIR, `${fileName}`);
        const dbInfo = await updateList(fileInfo.file_list[0], fileName, size);
        res.send(dbInfo);
    })
}

exports.uploadFileApi = uploadFileApi;