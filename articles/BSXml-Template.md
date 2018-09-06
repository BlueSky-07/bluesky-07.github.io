# BSXml-Template

在 Github 上查看 [源码](https://github.com/BlueSky-07/ES-6/blob/master/modules/BSXml) [测试](https://github.com/BlueSky-07/ES-6/tree/master/test/BSXml)

`Broswer-Slim-Xml` `v3.4`

一个前端开发框架的简单实现。该工具仅用作学习用途，如需在实际环境中使用还需要更多的测试与完善。

**功能包含**

- [模版引擎渲染](#1-)
- [事件注册](#2-)
- [输入框双向绑定](#3-)
- [组件化开发](?BSXml-Component)

----

# 0. 背景

现在的 **HTML** 在很多情况下过于臃肿了，除了正文内容以外，可能更多的是样式、属性、脚本，还有大量大量其他的可视化组件代码。在开发的时候，有时候想快速定位到自己想要的部分往往会被这些乱七八糟的东西干扰视线。而且，在开发的时候，总要去管理标签的开始和结束，这实在是太不优雅了。

## 当前 HTML 语法的痛点

1. 标签包裹内容，属性可以定义在开始标签上，如果属性定义的多了，整体代码就非常冗杂，内容区域与属性区域交叉影响视线。
2. 基于标签的语法不够整洁，而且如果标签嵌套，往往不知道当前标签所包裹的区域。
3. 不支持条件语法和循环语法，缺少前者导致多写脚本判断，缺少后者导致如果有类似的结构，会写大量的重复部分，且如果需要改动则处处改动。

当然，**HTML** 是超文本标记语言，它实际上只是负责最终页面的呈现，规定页面有哪些元素，以及这些元素长什么样，这些都是它分内的事儿，所以以上这些痛点都不是 **HTML** 的错。而且不管页面实际代码有多复杂，对于用户来说都是不关心的，他们只会在乎页面的最终呈现结果而已。但是对于开发者而言，以上这些都是实实在在的痛点。

针对以上痛点，还有更多我没有提到的痛点，诞生了许许多多的解决方案，也就是形形色色的前端框架。它们提供了很多想法，也使页面的开发变得简单高效，所以越来越多的人从裸撸 **HTML** 到面向前端框架开发。

我也从中获得了一些灵感，包括模板引擎、数据绑定等。用的时候还是比较爽的，但是我更喜欢去研究它们的原理，所以我打算自己实现一套，去探究这些神奇工具背后的原理。

我的计划是先自己想自己做，如果遇到了困难再去查查资料。在简单实现后，再去学习常见框架的源码，看看工业级框架是如何思考的，来学习我没想到或想的不够好的地方。

# 1. 模版引擎

## 1.1 瘦身版 HTML 模版语法

上文说到了我遇到的一些痛点，为了解决这些痛点，我设想了一套“瘦身版”的 **HTML** 模版语法。它大概长这样：
```text
div .page {
  div .header {
    h2 .title #title {
      What is BSXml Like?
    }
    h4 .author #author {
      BlueSky

      a *"https://ihint.me" {
        ihint.me
      }
    }
  }
  div .content {
    p .paragraph {
      I am who I am.
    }
  }
}
```

它等同于以下的 **HTML** 代码：
```html
<div class="page">
  <div class="header">
    <h2 class="title" id="title">What is BSXml Like?</h2>
    <h4 class="author" id="author">BlueSky <a href="https://ihint.me" target="_href"></a></h4>
  </div>
  <div class="content">
    <p class="paragraph">I am who I am.</p>
  </div>
</div>
```

可以看到，瘦身版的语法非常精炼，因为它只保留了 **HTML** 最最核心的部分，包括标签名，最常用的两个属性——`id`和`class`，还有它们的子标签、内容。当然，这只是最基本的功能，包含条件、循环、值填充等功能会在下文慢慢叙述。

为了使得瘦身版的代码能够被浏览器识别，必须得将它们转换成下面的 **HTML** 代码，因为浏览器只认识 **HTML** 语法。那么，需要实现一个解释器，将瘦身语法变成 **HTML**。

## 1.2 标签的抽象模型

文档的 **DOM** 是一个树状结构，特别是经过瘦身提炼，可以发现每一个节点都可以被抽象成三个最为关键的属性：标签名、属性列表、子节点。所以，第一步可以先将节点抽象成对象：

```js
export default class BSElement {
  constructor(tagName = '', props = {}, children = []) {
    this.tagName = tagName
    this.props = props
    this.children = children
  }

  compile() {
    const element = document.createElement(this.tagName)
    
    Object.entries(this.props).forEach(([key, value]) => {
      if (value) element.setAttribute(key, value)
    })
    
    this.children.forEach(
        child => {
          const childElement = (child instanceof BSElement)
              ? child.compile()
              : document.createTextNode(child)
          element.appendChild(childElement)
        })
    
    return element
  }
  
  static create(text = '') {
    const tagName = text.trim().split(' ')[0]
    if (tagName.length === 0) {
      return ' '
    }
    if (HTMLTags.has(tagName)) {
      return new BSElement(tagName)
    } else {
      return text.trim()
    }
  }
}

// HTML tags reference
// http://www.w3school.com.cn/tags/index.asp
const HTMLTags = new Set([
  'vdRoot', // root
  // '!--...--', '!DOCTYPE'
  'a', 'abbr', 'acronym', 'address', 'applet', 'area', 'article', 'aside', 'audio',
  'b', 'base', 'basefont', 'bdi', 'bdo', 'big', 'blockquote', 'body', 'br', 'button',
  'canvas', 'caption', 'center', 'cite', 'code', 'col', 'colgroup', 'command',
  'datalist', 'dd', 'del', 'details', 'dir', 'div', 'dfn', 'dialog', 'dl', 'dt',
  'em', 'embed',
  'fieldset', 'figcaption', 'figure', 'font', 'footer', 'form', 'frame', 'frameset',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hr', 'html',
  'i', 'iframe', 'img', 'input', 'ins', 'isindex',
  'kbd', 'keygen',
  'label', 'legend', 'li', 'link',
  'map', 'mark', 'menu', 'menuitem', 'meta', 'meter',
  'nav', 'noframes', 'noscript',
  'object', 'ol', 'optgroup', 'option', 'output',
  'p', 'param', 'pre', 'progress',
  'q',
  'rp', 'rt', 'ruby',
  's', 'samp', 'script', 'section', 'select', 'small', 'source', 'span', 'strike', 'strong', 'style', 'sub', 'summary', 'sup',
  'table', 'tbody', 'td', 'textarea', 'tfoot', 'th', 'thead', 'time', 'title', 'tr', 'track', 'tt',
  'u', 'ul',
  'var', 'video',
  'wbr',
  'xmp'
])
```

那么解释器的基本流程将会是这样的：

![基本流程](https://i.loli.net/2018/09/06/5b9125c0d2a31.png)

## 1.3 Parser 语法解析器

下面来实现如何将 **BSXml** 基础语法转换成上述的标签对象。因为主要是为了学习，所以性能问题先不做过多考虑。

```js
export default class Parser {
  constructor(template = '', {initElement = ''} = {}) {
    Object.defineProperty(this, 'template', {
      configurable: false,
      get:() => {
        return this.lines.join('\n')
      },
      set:template => {
        if (Array.isArray(template)) {
          this.lines = template
        } else {
          this.lines = template.split('\n')
        }
      }
    })
    this.template = template
    if (initElement instanceof Function) {
      this.initElement = initElement
    } else {
      this.initElement = ''
    }
  }
  
  compile() {
    let child = BSElement.create('vdRoot')
    const parents = []
    
    for (let i = 0; i < this.lines.length; i++) {
      let line = this.lines[i].trim()

      // create element
      const element = BSElement.create(line)
      
      if (line.endsWith('{')) {
        parents.push(child)
        child = element
        initElement(child, line, this.initElement)
      } else if (line.startsWith('}')) {
        const parent = parents.pop()
        parent.children.push(child)
        child = parent
      } else {
        child.children.push(element)
      }
    }
    return child
  }
}

const initElement = (element, raw = '', initElement = '') => {
  if (element instanceof BSElement) {
    if (!initElement) {
      const props = {
        class: (raw.match(/[.][\w\d-]* /g) || []).map(i => i.trim().slice(1)).join(' '),
        id: (raw.match(/[#][\w\d-]* /) || [''])[0].slice(1).trim()
      }
      if (element.tagName === 'a') {
        props.href = (raw.match(/"[^]*"/) || [''])[0].slice(1, -1)
        if (raw.includes('*"')) props.target = '_blank'
      }
      Object.assign(element.props, props)
    } else {
      initElement.call(null, element, raw)
    }
  }
}
```

**在线示例**
>- [BSXml - Template 基础语法](https://es6.ihint.me/BSXml/template-1/)