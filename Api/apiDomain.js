//  发送订阅消息
exports.sendApi = 'https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=';
//  更新数据
exports.updateApi = 'https://api.weixin.qq.com/tcb/databaseupdate?access_token=';
//  上传文件
exports.uploadApi = 'https://api.weixin.qq.com/tcb/uploadfile?access_token=';
//  下载文件
exports.downLoadApi = 'https://api.weixin.qq.com/tcb/batchdownloadfile?access_token=';
//  添加数据
exports.addApi = 'https://api.weixin.qq.com/tcb/databaseadd?access_token=';
//  查询数据
exports.queryApi = 'https://api.weixin.qq.com/tcb/databasequery?access_token=';
//  删除文件
exports.deleteFileApi = 'https://api.weixin.qq.com/tcb/batchdeletefile?access_token=';
//  删除数据记录
exports.deleteApi = 'https://api.weixin.qq.com/tcb/databasedelete?access_token=';

exports.pathNotVerify = ['/api/login', '/api/uploadFile'];