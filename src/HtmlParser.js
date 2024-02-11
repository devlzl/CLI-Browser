const CssParser = require('./CssParser')
const CssComputer = require('./CssComputer')
const Layouter = require('./Layouter')


class HtmlParser {
    constructor() {
        this.stack = [{ type: 'document', children: [] }]
        this.currentToken = null
        this.currentAttribute = null
        this.currentTextNode = null

        this.cssParser = new CssParser()
        this.cssComputer = new CssComputer()
        this.cssRules = []
    }

    emitToken() {
        let token = this.currentToken
        let top = this.stack[this.stack.length - 1]
        if (token.type !== 'text') {
            this.currentTextNode = null
        }
        if (token.type === 'startTag') {
            let element = {
                type: 'element',
                tagName: token.tagName,
                attributes: token.attributes,
                children: [],
                parent: top,
                computedStyle: {},
            }
            this.cssComputer.compute(element, this.cssRules)
            top.children.push(element)
            this.stack.push(element)
            // 处理空元素
            if (['br', 'hr', 'img', 'input', 'link', 'meta'].includes(token.tagName)) {
                this.stack.pop()
            }
        } else if (token.type === 'text') {
            if (this.currentTextNode === null) {
                this.currentTextNode = {
                    content: ''
                }
                top.children.push(this.currentTextNode)
            }
            this.currentTextNode.content += token.content            
        } else if (token.type === 'endTag' && top.tagName === token.tagName) {
            if (top.tagName === 'style') {
                let parsedCss = this.cssParser.parse(top.children[0].content)
                this.cssRules.push(...parsedCss)
            }
            new Layouter().layout(top)
            this.stack.pop()
        }
    }

    parse(html) {
        this.state = this.data
        for (let char of html) {
            this.state = this.state(char)
        }
        return this.stack[0]
    }

    data(char) {
        if (char === '<') {
            return this.tagOpen
        } else {
            this.currentToken = {
                type: 'text',
                content: char,
            }
            this.emitToken()
            return this.data
        }
    }

    // 标签相关状态: tagOpen, tagName, endTagOpen
    tagOpen(char) {
        if (char === '!') {
            return this.doctypeTag
        } else if (char.match(/^[a-zA-Z0-9]$/)) {
            this.currentToken = {
                type: 'startTag',
                tagName: '',
                attributes: {},
            }
            // Reconsume in the tag name state
            return this.tagName(char)
        } else if (char === '/') {
            return this.endTagOpen
        }
    }

    doctypeTag(char) {
        // 直接扔掉 DOCTYPE
        if (char === '>') {
            return this.data
        } else {
            return this.doctypeTag
        }
    }

    tagName(char) {
        if (char.match(/^[a-zA-Z0-9]$/)) {
            this.currentToken.tagName += char.toLowerCase()
            return this.tagName
        } else if (char.match(/^[\t\n ]$/)) {
            return this.beforeAttributeName
        } else if (char === '>') {
            this.emitToken()
            return this.data
        }
    }

    endTagOpen(char) {
        if (char.match(/^[a-zA-Z0-9]$/)) {
            this.currentToken = {
                type: 'endTag',
                tagName: '',
            }
            return this.tagName(char)
        }
    }

    // 属性相关状态
    beforeAttributeName(char) {
        if (char.match(/^[a-zA-Z\-]$/)) {
            this.currentAttribute = {
                name: '',
                value: '',
            }
            return this.attributeName(char)
        } else if (char.match(/^[\t\n ]$/)) {
            return this.beforeAttributeName
        } else if (char === '>' || char === '/') {
            return this.afterAttributeName(char)
        }
    }

    attributeName(char) {
        if (char.match(/^[\t\n ]$/) || char === '>' || char === '/') {
            return this.afterAttributeName(char)
        } else if (char === '=') {
            return this.beforeAttributeValue
        } else {
            this.currentAttribute.name += char
            return this.attributeName
        }
    }

    afterAttributeName(char) {
        if (char.match(/^[\t\n ]$/)) {
            return this.afterAttributeName
        } else if (char === '=') {
            return this.beforeAttributeValue
        } else if (char === '>') {
            this.currentToken.attributes[this.currentAttribute.name] = this.currentAttribute.value
            this.emitToken()
            return this.data
        } else {
            this.currentToken.attributes[this.currentAttribute.name] = this.currentAttribute.value
            this.currentAttribute = {
                name: '',
                value: '',
            }
            return this.attributeName(char)
        }
    }

    beforeAttributeValue(char) {
        if (char.match(/^[\t\n ]$/)) {
            return this.beforeAttributeValue
        } else if (char === '\'') {
            return this.singleQuotedAttributeValue
        } else if (char === '"') {
            return this.doubleQuotedAttributeValue
        } else {
            return this.UnquotedAttributeValue(char)
        }
    }

    singleQuotedAttributeValue(char) {
        if (char === '\'') {
            this.currentToken.attributes[this.currentAttribute.name] = this.currentAttribute.value
            return afterQuotedAttributeValue
        } else {
            this.currentAttribute.value += char
            return this.singleQuotedAttributeValue
        }
    }

    doubleQuotedAttributeValue(char) {
        if (char === '"') {
            this.currentToken.attributes[this.currentAttribute.name] = this.currentAttribute.value
            return this.afterQuotedAttributeValue
        } else {
            this.currentAttribute.value += char
            return this.doubleQuotedAttributeValue
        }
    }

    afterQuotedAttributeValue(char) {
        if (char.match(/^[\t\n ]$/)) {
            return this.beforeAttributeName
        } else if (char === '>') {
            this.emitToken()
            return this.data
        }
    }

    UnquotedAttributeValue(char) {
        if (char.match(/^[\t\n ]$/)) {
            this.currentToken.attributes[this.currentAttribute.name] = this.currentAttribute.value
            return this.beforeAttributeName
        } else if (char === '>') {
            this.currentToken.attributes[this.currentAttribute.name] = this.currentAttribute.value
            this.emitToken()
            return this.data
        } else {
            this.currentAttribute.value += char
            return this.UnquotedAttributeValue
        }
    }
}


module.exports = HtmlParser