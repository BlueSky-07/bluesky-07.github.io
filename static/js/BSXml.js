/**
 * Browser-Slim-XML Bundle
 * @BlueSky
 *
 * Version Alpha, 3.5
 *
 * Last updated: 2018/8/28
 *
 */

// =============================================================================

class BSElement {
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
  
  static createEventMark(eventName = '', functionName = '') {
    if (HTMLEvents.has(eventName)) {
      return new BSElement('BSXml-Event', {eventName, functionName})
    } else {
      throw new Error(`invalid event name ${eventName}`)
    }
  }
  
  static createInputMark() {
    return new BSElement('BSXml-Input')
  }
  
  static createComponentMark(component, name, args) {
    return new BSElement('BSXml-Component', {component, name, args})
  }
  
  static createComponentBlockMark(hash) {
    return new BSElement('bsxc', {hash})
  }
  
  static createStyleBlock(styles) {
    const style = new BSElement('style')
    style.children.push(styles)
    return style
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

// HTML events reference
// http://www.w3school.com.cn/tags/html_ref_eventattributes.asp
const HTMLEvents = new Set([
  'abort', 'afterprint',
  'beforeprint', 'beforeunload', 'blur',
  'canplay', 'canplaythrough', 'change', 'click', 'contextmenu',
  'dblclick', 'drag', 'dragend', 'dragenter', 'dragleave', 'dragover', 'dragstart', 'drop', 'durationchange',
  'emptied', 'ended', 'error',
  'focus', 'formchange', 'forminput',
  'haschange',
  'input', 'invalid',
  'keydown', 'keypress', 'keyup',
  'load', 'loadeddata', 'loadedmetadata', 'loadstart',
  'message', 'mousedown', 'mousemove', 'mouseout', 'mouseover', 'mouseup', 'mousewheel',
  'offline', 'online',
  'pagehide', 'pageshow', 'pause', 'play', 'playing', 'popstate', 'progress',
  'ratechange', 'readystatechange', 'redo', 'reset', 'resize',
  'scroll', 'seeked', 'seeking', 'select', 'stalled', 'storage', 'submit', 'suspend',
  'timeupdate',
  'undo', 'unload',
  'volumechange',
  'waiting'
])

// =============================================================================

class Parser {
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
  
  compile(dataset = {}) {
    let child = BSElement.create('vdRoot')
    const parents = []
    
    for (let i = 0; i < this.lines.length; i++) {
      let line = this.lines[i].trim()
      
      // drop comments
      if (
          line.startsWith('//') ||
          (line.startsWith('/*') && line.endsWith('*/'))
      ) {
        continue
      }
      
      // convert $data to dataset[data]
      line = line.replace(
          /{{[^}]*}}/g,
          reg => reg.replace(/\$/g, 'dataset.')
      )
      
      // condition statement
      if (line.includes('@if')) {
        const conditionTemplate = new ConditionParser(line, this.lines, i)
        conditionTemplate.compile(dataset).forEach(
            element => {
              child.children.push(element)
            }
        )
        i += conditionTemplate.lines.length + 1
        continue
      }
      
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
      line = line.replace(
          /{{[^}]*}}/g,
          reg => {
            reg = reg.slice(2, -2)
            try {
              return eval(reg)
            } catch (e) {
              throw new Error(`cannot calculate the result of ${reg.replace(/dataset[.]/g, '$')}`)
            }
          })
      
      
      // Component
      if (line.startsWith('@')) {
        const [component, name, ...args] = line.slice(1).split(' ').filter(i => i.length > 0)
        child.children.push(BSElement.createComponentMark(component, name, args.join(' ')))
        continue
      }
      
      
      // set attributes
      if (line.startsWith('~')) {
        const [key, ...value] = line.slice(1).split(' ').filter(i => i.length > 0)
        child.props[key] = value.join(' ')
        continue
      }
      
      // mark event
      if (line.startsWith('!')) {
        const [eventName, functionName] = line.slice(1).split(' ').filter(i => i.length > 0)
        child.children.push(BSElement.createEventMark(eventName, functionName))
        continue
      }
      
      // create element
      const element = BSElement.create(line)
      
      // mark input and textarea
      if (element.tagName === 'input' || element.tagName === 'textarea') {
        child.children.push(BSElement.createInputMark())
      }
      
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
    }
    if (child.tagName !== 'vdRoot' || parents.length !== 0) {
      throw new Error('template has mistake(s)')
    }
    return child
  }
}

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

const getTemplateOfBlock = (indexOfCurrent = -1, lines = []) => {
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

// =============================================================================

class Renderer {
  constructor(parser, {
    dataset = {},
    functions = {}
  } = {}) {
    if (parser instanceof Parser) {
      this.parser = parser
    } else {
      throw new Error('parser should be an instance of Parser')
    }
    
    this.functions = functions
    this.dataset = dataset
    this.inputs = {}
    this._inputs_ = new Map()
    this.component = null
  }
  
  render() {
    const vdRoot = this.parser.compile(this.dataset)
    const domRoot = vdRoot.compile()
    const fragment = document.createDocumentFragment()
    
    while(domRoot.childNodes[0]) {
      fragment.append(domRoot.childNodes[0])
    }
    
    // register events
    new Array().forEach.call(
        fragment.querySelectorAll('BSXml-Event'),
        mark => {
          const target = mark.parentNode
          const eventName = mark.getAttribute('eventName')
          const functionName = mark.getAttribute('functionName')
          if (Object.keys(this.functions).includes(functionName)) {
            target.addEventListener(
                eventName,
                () => {
                  this.functions[functionName].call(
                      this.functions, {
                        event: window.event,
                        target,
                        dataset: this.dataset,
                        inputs: this.inputs,
                        component: this.component,
                        $this: this.component
                      })
                }
            )
            mark.remove()
          } else {
            throw new Error(`cannot find a function named ${functionName}`)
          }
        }
    )
    
    // register inputs
    new Array().forEach.call(
        fragment.querySelectorAll('BSXml-Input'),
        mark => {
          const target = mark.nextElementSibling
          const hash = uuid()
          const inputName = target.getAttribute('dict') || hash
          Object.defineProperty(
              this.inputs,
              inputName, {
                configurable: false,
                enumerable: true,
                get: () => {
                  return this._inputs_.get(hash).value
                },
                set: value => {
                  this._inputs_.get(hash).value = value
                }
              }
          )
          this._inputs_.set(hash, target)
          mark.remove()
        }
    )
    return fragment
  }
}

DocumentFragment.prototype.paint = function (target, type = 'before') {
  if (!(target instanceof HTMLElement)) {
    throw new Error('target should be an instance of HTMLElement')
  }
  switch (type) {
    case 'before':
      target.parentNode.insertBefore(this, target)
      break
    case 'after':
      if (target.nextElementSibling) {
        target.parentNode.insertBefore(this, target.nextElementSibling)
      } else {
        target.parentNode.appendChild(this)
      }
      break
    case 'replace':
      target.parentNode.replaceChild(this, target)
      break
    case 'push':
      if (target.children[0]) {
        target.insertBefore(this, target.children[0])
      } else {
        target.appendChild(this)
      }
      break
    case 'append':
      target.appendChild(this)
      break
  }
}

// =============================================================================

class BSXml {
  static start(
      templateNodes = [], {
        dataset = {},
        functions = {},
        init = new Function(),
        next = new Function()
      } = {}) {
    
    if (init instanceof Function) {
      init()
    } else {
      throw new Error('init should be a function')
    }
    
    if (!(next instanceof Function)) {
      throw new Error('next should be a function')
    }
    
    if (!Array.isArray(templateNodes)) {
      throw new Error('templateNodes should be an array')
    } else {
      let NEXT = () => {
        // user's next function
        next()
      }
      
      // generate NEXT.next() function
      // real next() will be called after all templateNodes have been showRendered
      for (let i = 0; i < templateNodes.length; i++) {
        NEXT = {
          NEXT,
          next() {
            if (this.NEXT.NEXT) {
              this.NEXT = this.NEXT.NEXT
            } else {
              this.NEXT()
            }
          }
        }
      }
      
      new Array().forEach.call(
          templateNodes,
          async templateNode => {
            if (templateNode) {
              let realTemplateNode = null
              
              // detect templateNode is string (name of BSX) or HTMLElement (node of BSX)
              if (templateNode instanceof HTMLElement) {
                if (templateNode.tagName === 'BSX') {
                  realTemplateNode = templateNode
                } else {
                  throw new Error(`found a node whose tagName is not BSX`)
                }
              } else {
                try {
                  realTemplateNode = document.querySelector(`BSX[name=${templateNode.trim()}]`)
                } catch (e) {
                }
                if (realTemplateNode === null) {
                  throw new Error(`cannot find a node named ${templateNode}`)
                }
              }
              
              // fetch template (.bsx file)
              await TmplLoader.load(realTemplateNode)
              
              // fetch dataset
              let realDataset = await DataLoader.load(realTemplateNode) || {}
              
              run(realTemplateNode.innerHTML, realTemplateNode, {
                dataset: Object.assign(
                    realDataset,
                    dataset
                ),
                functions,
                next: () => {
                  NEXT.next()
                }
              })
            }
          })
    }
  }
}

const run = (
    template, target, {
      dataset = {},
      functions = {},
      init = new Function(),
      next = new Function()
    } = {}) => {
  
  const parser = new Parser(template)
  const renderer = new Renderer(parser, {
    dataset, functions
  })
  init()
  renderer.render().paint(target)
  next()
}

class TmplLoader {
  static async load(realTemplateNode) {
    if (realTemplateNode.getAttribute('link') && !realTemplateNode.getAttribute('ignore-link')) {
      const link = realTemplateNode.getAttribute('link').trim()
      await BSFetch.get(link, {
        restype: 'text'
      }).then(text => {
        realTemplateNode.innerHTML = text
      }).catch(() => {
        throw new Error(`cannot fetch template from ${link}`)
      })
      realTemplateNode.setAttribute('ignore-link', 'true')
    }
  }
}

class DataLoader {
  static async load(realTemplateNode) {
    if (realTemplateNode.getAttribute('data')) {
      const data = realTemplateNode.getAttribute('data').trim()
      try {
        return await BSFetch.get(data)
      } catch (e) {
        throw new Error(`cannot fetch dataset from ${data}`)
      }
    }
  }
}