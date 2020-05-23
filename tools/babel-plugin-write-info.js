const trueInfo = require('../trueFile').sensitiveInfo;

//  要小心循环引用，超过迭代次数还没有出来就会自动停止，而且不会报错
module.exports = function (babel) {
    const { types: t } = babel;
    return {
        name: 'write in new content', // not required
        visitor: {
            VariableDeclaration(path) {
                const node = path.node;
                if (node.declarations[0].id.name === 'fakeInfo') {
                    path.replaceWith(t.variableDeclaration('const', 
                    [ t.variableDeclarator(t.identifier('sensitiveInfo'),t.objectExpression(
                        [ t.objectProperty(t.identifier('ENV_ID'), t.stringLiteral(trueInfo.ENV_ID)),
                          t.objectProperty(t.identifier('appid'), t.stringLiteral(trueInfo.appid)),
                          t.objectProperty(t.identifier('secret'), t.stringLiteral(trueInfo.secret)),
                        ]
                    )),
                    ]),
                )
                }
            },
        }
    };
};