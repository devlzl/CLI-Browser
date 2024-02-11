const net = require('net')
const ResponseParser = require('./ResponseParser')


class HttpRequest {
    constructor(options) {
        this.method = options.method ?? 'GET'
        this.host = options.host ?? '127.0.0.1'
        this.port = options.port ?? 80
        this.path = options.path ?? '/'
        this.headers = options.headers ?? {}
    }

    toString() {
        let requestLine = `${this.method} ${this.path} HTTP/1.1\r\n`
        let headers = ''
        for (let [key, value] of Object.entries(this.headers)) {
            headers += `${key}: ${value}\r\n`
        }
        return `${requestLine}${headers}\r\n`
    }

    send() {
        return new Promise((resolve) => {
            let connect = net.connect(this.port, this.host)
            connect.setEncoding('utf-8')
            connect.on('connect', () => {
                connect.write(this.toString())
            })
            connect.on('data', (data) => {
                let parser = new ResponseParser(data)
                resolve(parser.response)
                connect.end()
            })
        })
    }
}


module.exports = HttpRequest