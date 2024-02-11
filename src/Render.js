class Render {
    constructor(viewportX, viewportY) {
        let viewport = []
        for (let y = 0; y < viewportY; y++) {
            let line = []
            for (let x = 0; x < viewportX; x++) {
                line.push('\x1b[107m\u3000\x1b[0m')
            }
            viewport.push(line)
        }
        this.viewport = viewport
    }

    pixelShader(color) {
        let colorNumber = {
            black: 40,
            white: 107,
            gray: 100,
            red: 101,
            green: 102,
            blue: 104,
            yellow: 103,
        }[color]
        return `\x1b[${colorNumber}m\u3000\x1b[0m`
    }

    render(element) {
        if (element.type === 'element' && element.style) {
            let left = element.style.left
            let right = element.style.right
            let top = element.style.top
            let bottom = element.style.bottom
            let pixel = this.pixelShader(element.style.background)
            for (let y = 0; y < this.viewport.length; y++) {
                let line = this.viewport[y]
                for (let x = 0; x < line.length; x++) {
                    if (x >= left && x <= right && y >= top && y <= bottom) {
                        this.viewport[y][x] = pixel
                    }
                }
            }
        }
        for (let child of element.children ?? []) {
            this.render(child)
        }
    }

    draw(element) {
        this.render(element)
        let lines = []
        for (let line of this.viewport) {
            lines.push(line.join(''))
        }
        console.log(lines.join('\n'))
    }
}


module.exports = Render
