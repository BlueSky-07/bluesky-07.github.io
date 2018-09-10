# BSXml-Template

在 Github 上查看 [源码](https://github.com/BlueSky-07/ES-6/blob/master/modules/BSXml) [测试](https://github.com/BlueSky-07/ES-6/tree/master/test/BSXml)

`Broswer-Slim-Xml` `v3.5`

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

针对以上痛点，还有更多我没有提到的痛点，诞生了许许多多的解决方案，也就是形形色色的前端框架。它们提供了很多想法，也使页面的开发变得简单高效，所以越来越多的人从原生 **HTML** 到面向前端框架开发。

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

该对象有一个`compile()`方法，可以将以此节点为根节点生成一个节点树。在创建实例的时候，调用`BSElement.create(...)`方法，此处会去判断原始字符串是一个标签的开始，还是标签内的文本。所有合法的标签名被`HTMLTags`记录。

注意，这里没有做标签的转义，也就是无法创建文本内容为 **HTML** 标签名的节点。

那么解释器的基本流程将会是这样的：

![基本流程](https://i.loli.net/2018/09/07/5b91e214bea13.jpg)

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
    if (child.tagName !== 'vdRoot' || parents.length !== 0) {
      throw new Error('template has mistake(s)')
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

该代码定义了一个`Parser`对象，这个对象负责将 **BSXml** 语法转换成上述的 `BSElement` 对象。它的工作流程是这样的：

![基础流程](https://i.loli.net/2018/09/07/5b91e1cfdd9d1.jpg)

`initElement()`方法用于处理与标签名在同一行的属性，这里处理了所有标签的`id` `class`属性和 **a 标签** 的`href` `target`属性。在实例化`Parser`的时候可以将自定义的标签初始化方法传入，实现对于 **BSXml** 语法的定制。

**在线示例**
>- [BSXml - Template 基础流程](https://es6.ihint.me/BSXml/template-1/)

## 1.4 标签属性处理

现在可以通过`initElement()`完成对于属性的解析。但是各种各样的标签有各式各样的属性，总不能全部考虑到位。所以，现在来实现对于所有属性的通用语法解析。

规定形如`~ {属性名} {属性值}`这样的语句会被转换成`<某标签 {属性名}="{属性值}">`，例如：
```text
form {
  ~ name login

  input {
    ~ name username
    ~ placeholder 用户名
  }

  input {
    ~ name password
    ~ placeholder 密码
    ~ type password
  }

  input {
    ~ type submit
    ~ value 登录
  }
}
```

上面的模板将会被转换成下面的 **HTML** 语句：

```html
<form name="login">
  <input name="username" placeholder="用户名">
  <input name="password" placeholder="密码" type="password">
  <input type="submit" value="登录">
</form>
```

实现时只需要在创建`BSElement`对象之前做一次判断即可：
```js
compile(dataset = {}) {
  ......
  let line = this.lines[i].trim()

  // set attributes
  if (line.startsWith('~')) {
    const [key, ...value] = line.slice(1).split(' ')  .filter(i => i.length > 0)
    child.props[key] = value.join(' ')
    continue
  }

  // create element
  const element = BSElement.create(line)
......
```

**在线示例**
>- [BSXml - Template 属性值处理](https://es6.ihint.me/BSXml/template-2/)

## 1.5 注释

规定以`//`开头的，或者是以`/*`开头并且以`*/`结尾的一行为注释，在解析时忽略。

实现：
```js
compile(dataset = {}) {
  ......
  let line = this.lines[i].trim()

  // drop comments
  if (
      line.startsWith('//') ||
      (line.startsWith('/*') && line.endsWith('*/'))
  ) {
    continue
  }

  // set attributes
  // create element
......
```

## 1.6 数据填充

现在基本完成了对于 **BSXml** 语法向 **HTML** 解析，接下来就要做一些 **HTML** 原来不支持的功能。第一步，来实现对于数据的填充功能。

作为模版，它的作用应当是规定元素的位置、样式，然后再去读取数据，填充进来，这样就可以复用模板。

现在规定，形如`{{js 语句}}`的部分会在解析时计算其 **js 语句** 部分，然后替换整个部分。而且，规定形如`{{$obj}}`的语句，以美元符开头的部分会被解析成传入的数据集属性。

比如有这样一组数据：
```json
{
  "author": {
    "name": "BlueSky",
    "website": "https://ihint.me"
  },
  "style": {
    "name_color": "#00f",
    "website_color": "#0f0"
  }
}
```

模板：
```text
div .author {
  p .name {
    ~ style color: {{$style.name_color}}; font-size: 22px;
    name: {{$author.name}}
  }
  p .website {
    ~ style color: {{$style.website_color}}; font-size: 14px;
    website:
    
    a *"{{$author.website}}" {
      {{$author.website}}
    }
  }
  p {
    today:

    {{new Date().toLocaleString()}}
  }
}
```

那么二者配合会生成以下的 **HTML** 语句：
```html
<div class="author">
  <p class="name" style="color: #00f; font-size: 22px;">
    name: BlueSky
  </p>
  <p class="website" style="color: #0f0; font-size: 14px;">
    website:
    <a href="https://ihint.me" target="_blank">https://ihint.me</a>
  </p>
  <p>
    today:
    某日期
  </p>
</div>
```

实现步骤如下：先将所有的`{{}}`块中的`$`替换成`dataset.`，然后再对所有的`{{}}`块内的语句调用`eval()`得到结果，并用结果去替换。

那么在调用 **Parser** 实例的`compile()`方法时需要传入数据集`dataset`，代码调整如下：
```js
compile(dataset = {}) {
  ......
  // drop comments

  // convert $data to dataset[data]
  line = line.replace(
      /{{[^}]*}}/g,
      reg => reg.replace(/\$/g, 'dataset.')
  )

  // read data from dataset
  try {
    line = line.replace(
        /{{[^}]*}}/g,
        reg => {
          reg = reg.slice(2, -2)
          try {
            return eval(reg)
          } catch (e) {
            throw new Error(`cannot calculate the result of ${reg.replace(/dataset[.]/g, '$')}`)
          }
        }
    )
  } catch (e) {
    throw e
  }

  // set attributes
  // create element
  const element = BSElement.create(line)
    if (line.endsWith('{') && !line.endsWith('{{')) {
    parents.push(child)
    child = element
    initElement(child, line, this.initElement)
  } else if (line.startsWith('}') && !line.startsWith('}}')) {
    const parent = parents.pop()
    parent.children.push(child)
    child = parent
  } else {
    child.children.push(element)
  }
......
```

**在线示例**
>- [BSXml - Template 值填充](https://es6.ihint.me/BSXml/template-3/)

## 1.7 条件模版

在能够获取值的情况下，就可以添加一些其他语言非常常见的条件语句与循环语句了。

规定条件模板语法如下：
```text
@if({{$isLogined}}) {
  Welcome: {{$user.nickname}}!
}
@if({{!$isLogined}}) {
  Please login first.
}
```

```json
{
  "isLogined": true,
  "user": {
    "nickname": "BlueSky"
  }
}
```

暂时不考虑`@elseif`和`@else`语法。

原`Parser`类增加：
```js
compile(dataset = {}) {
  ......
  // drop comments
  // convert $data to dataset[data]

  // condition statement
  if (line.includes('@if')) {
    const conditionTemplate = new ConditionParser (line, this.lines, i)
    conditionTemplate.compile(dataset).forEach(
        element => {
          child.children.push(element)
        }
    )
    i += conditionTemplate.lines.length + 1
    continue
  }

  // read data from dataset
  // set attributes
  // create element
......
```

增加`ConditionParser`类：
```js
class ConditionParser extends Parser {
  constructor(definition, lines, i) {
    try {
      super(getTemplateOfBlock(i, lines))
    } catch (e) {
      throw new Error(`cannot find the end of condition, first line is: ${definition.replace(/dataset[.]/g, '$')}`)
    }
    this.definition = definition
  }
  
  compile(dataset = {}) {
    const conditionTargetName = this.definition.match(/@if\({{[^}]*}}\)/g)[0].slice(4, -1).slice(2, -2)
    let conditionTarget = null
    try {
      conditionTarget = eval(conditionTargetName)
    } catch (e) {
      throw new Error(`cannot calculate the result of ${conditionTargetName.replace(/dataset[.]/g, '$')}`)
    }
    const elements = []
    if (conditionTarget) {
      super.compile(
          dataset
      ).children.forEach(
          element => {
            elements.push(element)
          }
      )
    }
    return elements
  }
}

const getTemplateOfBlock = (indexOfCurrent = -1 lines = []) => {
  const template = []
  const countOfBrackets = {
    left: 0, right: 0
  }
  for (let i = indexOfCurrent + 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line.endsWith('{') && !line.endsWith('{{')) {
      countOfBrackets.left++
    } else if (line.endsWith('}') && !line.endsWith('}}')) {
      countOfBrackets.right++
    }
    if (countOfBrackets.right > countOfBrackets.left) {
      break
    } else {
      template.push(line)
    }
  }
  if (countOfBrackets.right > countOfBrackets.left) {
    return template
  } else {
    throw new Error()
  }
}
```

`ConditionParser`类继承了`Parser`，因为它内部的编译代码部分与`Parser`是一致的，而它特殊在添加了对被`@if(){...}`包含的语法块的处理，其关键是统计左右大括号并匹配。

**在线示例**
>- [BSXml - Template 条件模板](https://es6.ihint.me/BSXml/template-4/)

## 1.8 循环模板

与条件模板类似，规定：
```js
@for({{$projects}}) {
  p {
    {{$item.name}}: {{$item.description}}
  }
}
```

```json
{
  "projects": [{
      "name": "BSXml",
      "description": "a solution for web programing"
    }, {
      "name": "BSModule",
      "description": "a tool for importing modules, including router for SPA, data transferring between modules"
    }, {
      "name": "BSFetch",
      "description": "a pack of Fetch API"
    }, {
      "name": "BSBind",
      "description": "a tool for data binding"
    }, {
      "name": "BSEvent",
      "description": "a tool for events' registering and triggering"
    }]
}
```

实现上也与条件模板类似：

原`Parser`类增加：
```js
compile(dataset = {}) {
  ......
  // drop comments
  // convert $data to dataset[data]
  // condition statement
  
  // loop statement
      if (line.includes('@for')) {
        const loopTemplate = new LoopParser(line, this.lines, i)
        loopTemplate.compile(dataset).forEach(
            element => {
              child.children.push(element)
            }
        )
        i += loopTemplate.lines.length + 1
        continue
      }

  // read data from dataset
  // set attributes
  // create element
......
```
增加`LoopParser`类：
```js
class LoopParser extends Parser {
  constructor(definition, lines, i) {
    try {
      super(getTemplateOfBlock(i, lines))
    } catch (e) {
      throw new Error(`cannot find the end of loop, first line is: ${definition.replace(/dataset[.]/g, '$')}`)
    }
    this.definition = definition
  }
  
  compile(dataset = {}) {
    const loopTargetName = this.definition.match(/@for\({{[^}]*}}\)/g)[0].slice(5, -1).slice(2, -2)
    let loopTarget = null
    try {
      loopTarget = eval(loopTargetName)
    } catch (e) {
      throw new Error(`cannot find a variable called ${loopTargetName.replace(/dataset[.]/g, '$')} from dataset`)
    }
    if (!Array.isArray(loopTarget)) {
      throw new Error(`$${loopTargetName.replace(/dataset[.]/g, '')} must be an array`)
    }
    const elements = []
    for (let index = 0; index < loopTarget.length; index++) {
      super.compile(
          Object.assign({},
              dataset, {
                index, item: loopTarget[index]
              }
          )
      ).children.forEach(
          element => {
            elements.push(element)
          }
      )
    }
    return elements
  }
}
```

`LoopParser`类也继承了`Parser`，因为它内部的编译代码部分与`Parser`也是一致的，而它特殊在添加了对被`@for(){...}`包含的语法块的处理，其关键不仅包含统计左右大括号并匹配，而且要对于数组的所有元素去循环处理模板。

而且在编译其内部内容部分的时候，会在数据集`dataset`中新增两个属性`"item"`和`"index"`，分别表示当前元素和当前元素在数组中的下标。如果传入的数据中有`"item"`或`"index"`时会被覆盖，应该避免使用这两个属性。

此处会发现`@if`优先级别会比`@for`高，也就是说以下模板会被识别成条件模板：
```text
@for({{[1, 2, 3]}}) @if({{false}}) {
  {{$item}}
}
```
但是在实现细节上可以发现，二者均处理了该行仅仅包含其中之一的情况，所以避免在一行内同时写`@if`和`@for`。

**在线示例**
>- [BSXml - Template 循环模板](https://es6.ihint.me/BSXml/template-5/)

## 1.9 编译流程总结

到目前为止，**BSXml** 已经完成了大部分的编译部分的工作，虽然实现的很简单，但是该有的功能一样也不少，现在其完整编译流程如下：

![工作流程](https://i.loli.net/2018/09/10/5b9608ac63f04.jpg)