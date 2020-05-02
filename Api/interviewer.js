let ownTool = require('xiaohuli-package');
const { getToken, verifyToken, apiPrefix, errorSend } = require('../baseUtil');
const { updateApi, queryApi, sendApi } = require('./apiDomain');

const infoMap = {
    accept: '已确认',
    deny: '被拒绝',
    apply: '申请中',
    cancel: '已取消'
}

async function senMess(infoObj) {
    const { counselorName, date, time, status, openId } = infoObj;
    const res = await ownTool.netModel.post(infoObj.sendDomain, {
        "touser": openId,
        "template_id": "TsHTB3iCONjwJijrDPLH2eQUq3QmxPk5iNfFiRcZU3M",
        "page": "index",
        "miniprogram_state":"developer",
        "lang":"zh_CN",
        "data": {
            "name10": {
                "value": counselorName
            },
            "date3": {
                "value": date.replace('-', '年').replace('-', '月') + '日 ' + time.slice(0,5)
            },
            "phrase14": {
                "value": infoMap[status]
            },
            "phone_number4": {
                "value": "13688774455"
            },
            "thing8": {
                "value": '详情请查看小程序"我的预约"或电话联系'
            }
        }
    })
    console.log(res);
}

function reqisterInterviewerAPI(app) {
    //  查询某个咨询师的可用预约列表
    app.post(apiPrefix + '/getInterviewerList', async function(req,res){
        const wxToken = await getToken();
        const doamin = queryApi + wxToken;
        const { offset, size } = req.body;
        const result = await ownTool.netModel.post(doamin, {
            env: 'test-psy-qktuk',
            query: 'db.collection(\"interviewee\").where({counselorId:"' + req.body.name + '"}).skip(' + offset + ').limit(' + size + ').orderBy("formData.date","desc").get()'
        })
        res.send(result);
    });

    //  查询某个咨询师的可用预约列表
    app.post(apiPrefix + '/queryInterviewerFreely', async function(req,res){
        const wxToken = await getToken();
        const doamin = queryApi + wxToken;
        const { queryString } = req.body;
        const result = await ownTool.netModel.post(doamin, {
            env: 'test-psy-qktuk',
            query: queryString
        })
        res.send(result);
    });

    //  更改预约时段状态
    app.post(apiPrefix + '/updateStatus', async function(req,res){
        const wxToken = await getToken();
        const doamin = updateApi + wxToken;
        const { token, name, updateStatus, status, _id, ...rest } = req.body;
        let a = await ownTool.netModel.post(doamin, 
            {
                env: 'test-psy-qktuk',
                query: 'db.collection(\"interviewee\").doc("' + _id + '").update({data:{status: "' + status + '"}})'
            }
        )
        const bookInfo = await ownTool.netModel.post(queryApi + wxToken,
            {
                env: 'test-psy-qktuk',
                query: 'db.collection(\"interviewee\").doc("' + _id + '").get()'
            });
        const { openId, counselorName, formData: { date, time}, periodId } = JSON.parse(bookInfo.data[0]);
        const mesObj = { sendDomain: sendApi + wxToken, openId, counselorName, date, time, status };
        senMess(mesObj);
        //  如果操作是确认预约，减库存
        if (status === 'accept') {
            let reduce = await ownTool.netModel.post(doamin, 
                {
                    env: 'test-psy-qktuk',
                    query: 'db.collection(\"period\").doc("' + periodId + '").update({data:{count: "' + 0 + '"}})'
                }
            )
        }
        res.send(a);
    });
}

exports.reqisterInterviewerAPI = reqisterInterviewerAPI;