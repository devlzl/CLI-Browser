const BodyParser = require('./ResponseBodyParser').BodyParser
const TrunkedBodyParser = require('./ResponseBodyParser').TrunkedBodyParser


class ResponseParser {
    constructor(response) {
        this.responseLine = ''
        this.headers = {}
        
        this.headerName = ''
        this.headerValue = ''
        this.bodyParser = new BodyParser()

        this.state = this.atResponseLine
        for (let char of response) {
            this.state = this.state(char)
        }
    }

    get response() {
        let [statusCode, statusText] = this.responseLine.split(' ').slice(1)
        return {
            statusCode: statusCode,
            statusText: statusText,
            headers: this.headers,
            body: this.bodyParser.content,
        }
    }

    atResponseLine(char) {
        if (char === '\r') {
            return this.atResponseLineEnd
        } else {
            this.responseLine += char
            return this.atResponseLine
        }
    }

    atResponseLineEnd(char) {
        if (char === '\n') {
            return this.atHeaderName
        }
    }

    atHeaderName(char) {
        if (char === '\r') {
            if (this.headers['Transfer-Encoding'] === 'chunked') {
                this.bodyParser = new TrunkedBodyParser()
            }
            return this.atHeaderBlockEnd
        } else if (char === ':') {
            return this.atHeaderSpace
        } else {
            this.headerName += char
            return this.atHeaderName
        }
    }

    atHeaderSpace(char) {
        if (char === ' ') {
            return this.atHeaderValue
        }
    }

    atHeaderValue(char) {
        if (char === '\r') {
            this.headers[this.headerName] = this.headerValue
            this.headerName = ''
            this.headerValue = ''
            return this.atHeaderLineEnd
        } else {
            this.headerValue += char
            return this.atHeaderValue
        }
    }

    atHeaderLineEnd(char) {
        if (char === '\n') {
            return this.atHeaderName
        }
    }

    atHeaderBlockEnd(char) {
        if (char === '\n') {
            return this.atBody
        }
    }

    atBody(char) {
        this.bodyParser.receiveChar(char)
        return this.atBody
    }
}


module.exports = ResponseParser