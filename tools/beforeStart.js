const babel = require('@babel/core');
const fs = require('fs');
const path = require('path');
const UPLOAD_DIR = path.resolve(__dirname, "sensitiveTemplate.js"); // 大文件存储目录

//  通过babel插件，写入新的文件
const oldContent = fs.readFileSync(UPLOAD_DIR);
const newContent = babel.transformSync(oldContent, {
    plugins: ['./tools/babel-plugin-write-info']
}).code;
fs.writeFileSync('operatedFile.js', newContent, 'utf8');