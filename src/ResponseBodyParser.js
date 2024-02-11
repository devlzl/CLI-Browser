class BodyParser {
    constructor() {
        this.content = ''
    }

    receiveChar(char) {
        this.content += char
    }
}


class TrunkedBodyParser extends BodyParser {
    constructor() {
        super()
        this.length = 0
        this.content = ''
        this.state = this.atNumber
    }

    receiveChar(char) {
        this.state = this.state(char)
    }

    atNumber(char) {
        if (char === '\r') {
            return this.atNumberEnd
        } else {
            this.length *= 16
            this.length += parseInt(char, 16)
            return this.atNumber
        }
    }

    atNumberEnd(char) {
        if (char === '\n') {
            return this.atTrunk
        }
    }

    atTrunk(char) {
        this.content += char
        this.length -= 1
        if (this.length === 0) {
            return this.atNewLine
        } else {
            return this.atTrunk
        }
    }

    atNewLine(char) {
        if (char === '\r') {
            return this.atNewLineEnd
        }
    }

    atNewLineEnd(char) {
        if (char === '\n') {
            return this.atNumber
        }
    }
}


exports.BodyParser = BodyParser
exports.TrunkedBodyParser = TrunkedBodyParser