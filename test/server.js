const http = require('http')
const fs = require('fs')


http.createServer((request, response) => {
    let path = Number(request.url.slice(1)) || 1
    let body = fs.readFileSync(`test/test${path}.html`, 'utf8')
    response.writeHead(200, {
        'Content-Type': 'text/html',
    })
    response.end(body)
}).listen(8000)
console.log('127.0.0.1:8000')
