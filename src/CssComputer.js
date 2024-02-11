class CssComputer {
    match(element, selector) {
        if (selector[0] === '#') {
            let id = element.attributes.id
            if (id === selector.slice(1)) {
                return true
            }
        } else if (selector[0] === '.') {
            let classNames = element.attributes.class?.split(' ') ?? []
            for (let className of classNames) {
                if (className === selector.slice(1)) {
                    return true
                }
            }
        } else if (selector === element.tagName) {
            return true
        } else {
            return false
        }
    }

    specificity(selector) {
        // https://drafts.csswg.org/selectors-3/#specificity
        // 左高右低 [内联样式(暂不计算), id选择器, class选择器, 元素选择器]
        let s = [0, 0, 0, 0]
        for (let part of selector.split(' ')) {
            if (part[0] === '#') {
                s[1] += 1
            } else if (part[0] === '.') {
                s[2] += 1
            } else {
                s[3] += 1
            }
        }
        return s
    }

    compare(s1, s2) {
        if (s1[0] !== s2[0]) {
            return s1[0] > s2[0]
        } else if (s1[1] !== s2[1]) {
            return s1[1] > s2[1]
        } else if (s1[2] !== s2[2]) {
            return s1[2] > s2[2]
        } else if (s1[3] !== s2[3]) {
            return s1[3] - s2[3]
        } else {
            return false
        }
    }

    compute(element, cssRules) {
        ruleLoop:
        for (let rule of cssRules) {
            let selector = rule.selector.split(' ').reverse()
            let parent = element
            for (let i = 0; i < selector.length; i++) {
                if (this.match(parent, selector[i])) {
                    parent = parent.parent
                } else {
                    continue ruleLoop
                }
            }
            let specificity = this.specificity(rule.selector)
            let style = element.computedStyle
            for (let [property, value] of Object.entries(rule.declaration)) {
                style[property] = style[property] ?? {}
                style[property].specificity = style[property].specificity ?? specificity
                if (this.compare(style[property].specificity, specificity)) {
                    // 如果原样式比新样式的优先级更高, 则无需改变
                    continue
                }
                // 后来优先原则
                style[property].value = value
            }
        }
    }
}


module.exports = CssComputer