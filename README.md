# CLI-Browser

A small web browser that renders on command-line interface.

[中文版](./README_CN.md)


## Introduction
This is a small web browser written in Vanilla JS (its runtime is Node.js, no external dependency).  
It includes: HTTP Library, HTML Parser, CSS Parser, Layout Engine, Rendering Engine.  
But the most special thing is that it renders the page on command-line interface.


## How it works
1. Get `HTML` content via HTTP protocol. (HttpRequest.js, ResponseParser.js, ResponseBodyParser.js)
2. Parse HTML, build `DOM tree`. (HtmlParser.js)
3. Parse and match CSS, build `DOM with CSS`. (CssParser.js, CssComputer.js)
4. Layout, build `DOM with position`. (Layouter.js)
5. Rendering and Drawing. (Render.js)

In particular, the page is rendered on CLI, how it works ?  
`Rendering` means converting DOM tree into a bitmap (bitmap, is a two-dimensional table created in memory, saving each pixel).  
`Drawing` means the process of drawing a bitmap to the visible screen.  

In short, how do we display a bunch of pixels on CLI?  
The answer is `ANSI escape code` (it can control each character color on CLI),  
so I use a colored square whitespace character (\u3000) to represent a pixel,  
In the end, the page is rendered as a bunch of colored square whitespace characters.


## Usage
1. `git clone https://github.com/devlzl/CLI-Browser.git`
2. `cd CLI-Browser`
3. Run `node test/server.js`, there are 27 test cases in the `/test` directory.
4. You can first see how test cases look in a real browser. For example, visiting `http://127.0.0.1:8000/24` in chrome to see the content of `test24.html`.
5. Then open another new CLI (iTerm2 is recommended), press "command -" several times to shrink its font, then drag its window to make it bigger (characters as pixels should be as small as possible, window should be as large as possible to display more "pixels"). Then run `node src/_main.js 127.0.0.1:8000/24` to see the content of `test24.html` in CLI !


## Screenshot
on Google Chrome:  
<img src="screenshot/chrome.png" width="700">

on iTerm2:  
<img src="screenshot/iterm2.png" width="700">
