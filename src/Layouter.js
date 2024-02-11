class Layouter {
    constructor() {
        this.element = null

        this.mainSize = ''      // 'width' | 'height'
        this.mainStart = ''     // 'left' | 'right' | 'top' | 'bottom'
        this.mainEnd = ''       // 'left' | 'right' | 'top' | 'bottom'
        this.mainSign = 0       // +1 | -1
        this.mainBase = 0       // 0 | style.width | style.height

        this.crossSize = ''     // 'width' | 'height'
        this.crossStart = ''    // 'left' | 'right' | 'top' | 'bottom'
        this.crossEnd = ''      // 'left' | 'right' | 'top' | 'bottom'
        this.crossSign = 0      // +1 | -1
        this.crossBase = 0      // 0 | style.width | style.height

        this.children = []

        this.flexLines = []
    }

    setup(element) {
        let style = {}
        for (let [property, valueWithSpecificity] of Object.entries(element.computedStyle)) {
            let value = valueWithSpecificity.value
            if (value.match(/^[0-9\.]+/)) {
                // 扔掉 'px' 并转换为数字类型以方便后续计算
                style[property] = parseInt(value)
            } else {
                style[property] = value
            }
        }
        style.width = style.width ?? 0
        style.height = style.height ?? 0
        element.style = style
    }

    setProperties() {
        let style = this.element.style
        style.justifyContent = style['justify-content'] ?? 'flex-start'
        style.alignItems = style['align-items'] ?? 'stretch'
        style.flexDirection = style['flex-direction'] ?? 'row'
        style.flexWrap = style['flex-wrap'] ?? 'nowrap'
        style.alignContent = style['align-content'] ?? 'stretch'
        if (style['flex-flow']) {
            [style.flexDirection, style.flexWrap] = style['flex-flow'].split(' ')
        }
    }

    setRuler() {
        let style = this.element.style
        let direction = style.flexDirection
        if (direction === 'row') {
            this.mainSize = 'width'
            this.mainStart = 'left'
            this.mainEnd = 'right'
            this.mainSign = +1
            this.mainBase = 0

            this.crossSize = 'height'
            this.crossStart = 'top'
            this.crossEnd = 'bottom'
            this.crossSign = +1
            this.crossBase = 0    
        } else if (direction === 'row-reverse') {
            this.mainSize = 'width'
            this.mainStart = 'right'
            this.mainEnd = 'left'
            this.mainSign = -1
            this.mainBase = style.width

            this.crossSize = 'height'
            this.crossStart = 'top'
            this.crossEnd = 'bottom'
            this.crossSign = +1
            this.crossBase = 0    
        } else if (direction === 'column') {
            this.mainSize = 'height'
            this.mainStart = 'top'
            this.mainEnd = 'bottom'
            this.mainSign = +1
            this.mainBase = 0

            this.crossSize = 'width'
            this.crossStart = 'left'
            this.crossEnd = 'right'
            this.crossSign = +1
            this.crossBase = 0    
        } else if (direction === 'column-reverse') {
            this.mainSize = 'height'
            this.mainStart = 'bottom'
            this.mainEnd = 'top'
            this.mainSign = -1
            this.mainBase = style.height

            this.crossSize = 'width'
            this.crossStart = 'left'
            this.crossEnd = 'right'
            this.crossSign = +1
            this.crossBase = 0    
        }

        if (style.flexWrap === 'wrap-reverse') {
            [this.crossStart, this.crossEnd] = [this.crossEnd, this.crossStart]
            this.crossSign = -1
            this.crossBase = {
                'row': style.height,
                'row-reverse': style.height, 
                'column': style.width,
                'column-reverse': style.width,
            }[direction]
        }
    }
    
    setChildren() {
        let children = []
        for (let child of this.element.children) {
            if (child.type === 'element') {
                this.setup(child)
                child.style.alignSelf = child.style['align-self'] ?? (void 0)
                children.push(child)
            }
        }
        children.sort((a, b) => {
            return (a.style.order ?? 0) - (b.style.order ?? 0)
        })
        this.children = children
    }

    setMainSize() {
        // 内部元素自动撑开
        let style = this.element.style
        if (style[this.mainSize] === 0) {
            for (let child of this.children) {
                style[this.mainSize] += child.style[this.mainSize]
            }
        }
    }

    createLine() {
        let newLine = []
        newLine.mainSpace = this.element.style[this.mainSize]
        newLine.crossSpace = 0
        this.flexLines.push(newLine)
        return newLine
    }

    splitLine() {
        let style = this.element.style
        let newLine = this.createLine()
        for (let child of this.children) {
            let childStyle = child.style
            if (childStyle.flex) {
                // flex 属性意味着可伸缩, 无论剩余多少尺寸都能放进去
                newLine.push(child)
                newLine.crossSpace = Math.max(newLine.crossSpace, childStyle[this.crossSize])
            } else if (style.flexWrap === 'nowrap') {
                // 强行在一行中塞入全部元素
                newLine.push(child)
                newLine.mainSpace -= childStyle[this.mainSize]
                newLine.crossSpace = Math.max(newLine.crossSpace, childStyle[this.crossSize])
            } else {
                // 如果元素超过容器, 则压缩到容器大小
                childStyle[this.mainSize] = Math.min(childStyle[this.mainSize], style[this.mainSize])
                // 分行
                if (newLine.mainSpace < childStyle[this.mainSize]) {
                    newLine = this.createLine()
                }
                // 将元素收入行内
                newLine.push(child)
                newLine.mainSpace -= childStyle[this.mainSize]
                newLine.crossSpace = Math.max(newLine.crossSpace, childStyle[this.crossSize])
            }
        }
    }

    computeFlexLine(line, flexTotal) {
        let currentMain = this.mainBase
        for (let child of line) {
            let childStyle = child.style
            if (childStyle.flex) {
                childStyle[this.mainSize] = childStyle.flex / flexTotal * line.mainSpace
            }
            childStyle[this.mainStart] = currentMain
            childStyle[this.mainEnd] = childStyle[this.mainStart] + this.mainSign * childStyle[this.mainSize]
            currentMain = childStyle[this.mainEnd]
        }
    }

    computeNotFlexLine(line) {
        let style = this.element.style
        let currentMain = this.mainBase
        let space = 0
        if (style.justifyContent === 'flex-start') {
            currentMain = this.mainBase
            space = 0
        } else if (style.justifyContent === 'flex-end') {
            currentMain = this.mainBase + this.mainSign * line.mainSpace
            space = 0
        } else if (style.justifyContent === 'center') {
            currentMain = this.mainBase + this.mainSign * line.mainSpace / 2
            space = 0
        } else if (style.justifyContent === 'space-between') {
            currentMain = this.mainBase
            space = this.mainSign * line.mainSpace / (line.length - 1)
        } else if (style.justifyContent === 'space-around') {
            currentMain = this.mainBase + this.mainSign * line.mainSpace / line.length / 2
            space = this.mainSign * line.mainSpace / line.length
        }
        for (let child of line) {
            let childStyle = child.style
            childStyle[this.mainStart] = currentMain
            childStyle[this.mainEnd] = currentMain + this.mainSign * childStyle[this.mainSize]
            currentMain = childStyle[this.mainEnd] + space
        }
    }

    computeNegativeSpaceLine(line) {
        let style = this.element.style
        let scale = style[this.mainSize] / (style[this.mainSize] + (-line.mainSpace))
        let currentMain = this.mainBase
        for (let child of line) {
            let childStyle = child.style
            if (childStyle.flex) {
                // 将有 flex 属性的元素压缩到 0
                childStyle[this.mainSize] = 0
            }
            childStyle[this.mainSize] *= scale
            childStyle[this.mainStart] = currentMain
            childStyle[this.mainEnd] = childStyle[this.mainStart] + this.mainSign * childStyle[this.mainSize]
            currentMain = childStyle[this.mainEnd]
        }
    }

    computeMainAxis() {
        for (let line of this.flexLines) {
            if (line.mainSpace >= 0) {
                let flexTotal = 0
                for (let child of line) {
                    flexTotal += child.style.flex ?? 0
                }
                if (flexTotal > 0) {
                    // 含有 [有 flex 属性的元素] 的行
                    this.computeFlexLine(line, flexTotal)                
                } else {
                    // 没有 [有 flex 属性的元素] 的行
                    this.computeNotFlexLine(line)
                }    
            } else {
                // 剩余空间为负, 说明 [flex-wrap: nowrap], 等比压缩不含有 flex 元素的属性
                this.computeNegativeSpaceLine(line)
            }
        }
    }

    computeCrossAxis() {
        // 根据 align-content align-items align-self 确定元素位置
        let style = this.element.style
        // 自动撑开交叉轴
        if (style[this.crossSize] === 0) {
            for (let line of this.flexLines) {
                style[this.crossSize] += line.crossSpace
            }
        }
        // 计算交叉轴总空白
        let crossSpaceTotal = style[this.crossSize]
        for (let line of this.flexLines) {
            crossSpaceTotal -= line.crossSpace
        }
        // 确定每一条主轴位于整个容器的交叉轴的位置
        let currentCross = this.crossBase
        let space = 0
        if (style.alignContent === 'flex-start') {
            currentCross = this.crossBase
            space = 0
        } else if (style.alignContent === 'flex-end') {
            currentCross = this.crossBase + this.crossSign * crossSpaceTotal
            space = 0
        } else if (style.alignContent === 'center') {
            currentCross = this.crossBase + this.crossSign * crossSpaceTotal / 2
            space = 0
        } else if (style.alignContent === 'space-between') {
            currentCross = this.crossBase
            space = this.crossSign * crossSpaceTotal / (this.flexLines.length - 1)
        } else if (style.alignContent === 'space-around') {
            currentCross = this.crossBase + this.crossSign * crossSpaceTotal / this.flexLines.length / 2
            space = this.crossSign * crossSpaceTotal / this.flexLines.length
        } else if (style.alignContent === 'stretch') {
            currentCross = this.crossBase
            space = 0
        }
        // 确定每个元素的具体位置
        for (let line of this.flexLines) {
            let lineCrossSize = line.crossSpace
            if (style.alignContent === 'stretch') {
                // 平分剩余的空白空间, 拉伸填满
                lineCrossSize = line.crossSpace + crossSpaceTotal / this.flexLines.length
            }
            for (let child of line) {
                let childStyle = child.style
                let align = childStyle.alignSelf || style.alignItems
                if (align === 'stretch') {
                    childStyle[this.crossStart] = currentCross
                    childStyle[this.crossSize] = childStyle[this.crossSize] ?? lineCrossSize
                    childStyle[this.crossEnd] = childStyle[this.crossStart] + this.crossSign * childStyle[this.crossSize]
                } else if (align === 'flex-start') {
                    childStyle[this.crossStart] = currentCross
                    childStyle[this.crossEnd] = childStyle[this.crossStart] + this.crossSign * childStyle[this.crossSize]
                } else if (align === 'flex-end') {
                    childStyle[this.crossStart] = currentCross + this.crossSign * lineCrossSize - this.crossSign * childStyle[this.crossSize]
                    childStyle[this.crossEnd] = childStyle[this.crossStart] + this.crossSign * childStyle[this.crossSize]
                } else if (align === 'center') {
                    childStyle[this.crossStart] = currentCross + this.crossSign * (lineCrossSize - childStyle[this.crossSize]) / 2
                    childStyle[this.crossEnd] = childStyle[this.crossStart] + this.crossSign * childStyle[this.crossSize]
                }
            }
            currentCross += this.crossSign * lineCrossSize + space
        }
    }

    layout(element) {
        // 只支持 Flex 布局
        if (element.computedStyle.display?.value !== 'flex') {
            return
        }

        this.element = element
        this.setup(element)         // 创建元素的 style 属性, 用于保存排版信息
        this.setProperties()        // 设置 Flex 的相关属性
        this.setRuler()             // 根据 flex-direction 设置相应的尺度
        this.setChildren()          // 添加子元素并按 order 排序
        this.setMainSize()          // 处理自动撑开 mainSize 的情况
        this.splitLine()            // 分行
        this.computeMainAxis()      // 计算主轴
        this.computeCrossAxis()     // 计算交叉轴
    }
}


module.exports = Layouter