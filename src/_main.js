const HttpRequest = require('./HttpRequest')
const HtmlParser = require('./HtmlParser')
const Render = require('./Render')


void async function() {
    let s = process.argv[2].split(':')
    let host = s[0]
    let [port, path] = s[1].split('/')

    let request = new HttpRequest({
        method: 'GET',
        host: host,
        port: port,
        path: `/${path}`,
        headers: {},
    })
    let response = await request.send()
    let htmlParser = new HtmlParser()
    let dom = htmlParser.parse(response.body)
    new Render(100, 100).draw(dom) 
}()


/*
使用 JavaScript 模拟实现的浏览器 (不借助任何第三方库)
支持 开始标签, 结束标签, 自闭合标签
支持 基本选择器 和 后代选择器
支持 Flex 布局


代码结构:
HttpRequest                     // 使用 HTTP 协议请求页面
    ResponseParser              // 解析响应
        ResponseBodyParser      // 解析响应的 body
HtmlParser                      // 解析 HTML
    CssParser                   // 解析 CSS
    CssComputer                 // 计算 CSS
    Layouter                    // 排版
Render                          // 渲染和绘制
*/
