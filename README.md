项目安装 npm i

在根目录下创建`trueFile.js`文件，内容如下：
```js
//  这些内容在小程序后台可查

const sensitiveInfo = {
    ENV_ID: '你的环境id',
    appid: '你的appid 小程序管理页面可查',
    secret: '你的秘钥'
}
exports.sensitiveInfo = sensitiveInfo;
```

项目启动：
npm run start  
(监听的端口是4000)  

与该项目配套的前端项目地址：  
[项目前端代码git地址](https://github.com/dianluyuanli-wp/myCloudDisk) 
