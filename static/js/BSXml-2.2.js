/**
 * Browser-Slim-XML
 * @BlueSky
 *
 * Version Alpha, 2.2
 *
 * Last updated: 2018/8/7
 *
 */

import md5 from './md5.js'

const $ = document.querySelector.bind(document)
const $$ = document.querySelectorAll.bind(document)

class El {
  constructor(tagName = '', props = {}, children = []) {
    this.tagName = tagName
    this.props = props
    this.children = children
  }
  
  render() {
    const el = document.createElement(this.tagName)
    const props = this.props
    
    for (const propName in props) {
      const propValue = props[propName]
      if (!propValue) continue
      el.setAttribute(propName, propValue)
    }
    
    const children = this.children || []
    
    children.forEach(
        child => {
          const childEl = (child instanceof El)
              ? child.render()
              : document.createTextNode(child)
          el.appendChild(childEl)
        })
    
    return el
  }
}

class BSXml {
  static start(
      templateNodes = [],
      {
        dataset = {},
        functions = {},
        init = () => {
        },
        next = () => {
        }
      } = {}) {
    
    if (init instanceof Function) {
      init()
    } else {
      throw new Error('init should be a function')
    }
    
    if (!next instanceof Function) {
      throw new Error('next should be a function')
    }
    // add some functions into next for registering events and inputs
    let NEXT = () => {
      // register events
      new Array().forEach.call(
          $$('BSXml-Event'),
          mark => {
            const target = mark.parentNode
            const eventName = mark.getAttribute('eventName')
            const functionName = mark.getAttribute('functionName')
            if (Object.keys(functions).includes(functionName)) {
              target.addEventListener(
                  eventName,
                  () => {
                    functions[functionName].call(functions, window.event, target, dataset)
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
          $$('BSXml-Input'),
          mark => {
            const target = mark.nextElementSibling
            const inputName = `${(target.getAttribute('name') || new Date().getTime())}`
            const hash = md5(inputName)
            target.setAttribute('md5', hash)
            Object.defineProperty(
                BSXml.inputs,
                inputName,
                {
                  enumerable: true,
                  get() {
                    const hash = md5(inputName)
                    return BSXml.__inputs__[hash].value
                  },
                  set(value) {
                    const hash = md5(inputName)
                    BSXml.__inputs__[hash].value = value
                  }
                }
            )
            BSXml.__inputs__[hash] = target
            BSXml.inputs[inputName] = ''
            mark.remove()
          }
      )
      
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
    
    // call showRendered for each templateNode
    if (Array.isArray(templateNodes)) {
      [].forEach.call(
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
                realTemplateNode = getTemplateNode(templateNode)
                if (realTemplateNode === null) {
                  throw new Error(`cannot find a node named ${templateNode}`)
                }
              }
              
              // fetch template (.bsx file)
              if (realTemplateNode.getAttribute('link')) {
                const link = realTemplateNode.getAttribute('link').trim()
                await fetch(link)
                    .then(
                        r => {
                          if (r.ok) {
                            return r.text()
                          } else {
                            throw new Error(`cannot fetch template from ${link}`)
                          }
                        }
                    )
                    .then(
                        text => {
                          realTemplateNode.innerHTML = text
                        }
                    )
                    .catch(
                        e => {
                          throw e
                        }
                    )
              }
              
              // fetch dataset
              let realDataset = {}
              if (realTemplateNode.getAttribute('data')) {
                const data = realTemplateNode.getAttribute('data').trim()
                await fetch(data)
                    .then(
                        r => {
                          if (r.ok) {
                            return r.json()
                          } else {
                            throw new Error(`cannot fetch dataset from ${data}`)
                          }
                        }
                    )
                    .then(
                        json => {
                          realDataset = json
                        }
                    )
                    .catch(
                        e => {
                          throw e
                        }
                    )
              }
              
              // work
              showRendered(
                  generateVirtualDOM(
                      realTemplateNode.innerHTML,
                      Object.assign(
                          realDataset,
                          dataset
                      )
                  ),
                  realTemplateNode
              )
              
              // call NEXT.next()
              NEXT.next()
            }
          })
    } else {
      throw new Error('templateNodes should be an array')
    }
  }
}

const showRendered = (vdRoot, templateNode) => {
  if (!templateNode instanceof HTMLElement || !vdRoot instanceof HTMLElement) {
    throw new Error('illegal call')
  }
  
  // insert before templateNode
  const parentNode = templateNode.parentNode
  const leftNodesToInsert = vdRoot.render().children
  while (leftNodesToInsert.length > 0) {
    parentNode.insertBefore(leftNodesToInsert[0], templateNode)
  }
  
  // keep or remove templateNode
  if (templateNode.getAttribute('keep') !== 'true') {
    parentNode.removeChild(templateNode)
  }
}

const generateVirtualDOM = (template = '', dataset = {}) => {
  const lines = template.split('\n')
  let child = createEl('vdRoot')
  const parents = []
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim()
    
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
    
    // loop statement
    if (line.includes('@for')) {
      const loopTargetName = line.match(/@for\({{[^}]*}}\)/g)[0].slice(5, -1).slice(2, -2)
      let loopTarget = null
      try {
        loopTarget = eval(loopTargetName)
      } catch (e) {
        throw new Error(`cannot find a variable called ${loopTargetName.replace(/dataset[.]/g, '$')} from dataset`)
      }
      if (!Array.isArray(loopTarget)) {
        throw new Error(`$${loopTargetName.replace(/dataset[.]/g, '')} must be an array`)
      }
      try {
        const loopTemplate = getTemplateOfBlock(i, lines)
        const back = new Map()
        back.index = dataset.index
        back.item = dataset.item
        for (let index = 0; index < loopTarget.length; index++) {
          generateVirtualDOM(
              loopTemplate.join('\n'),
              Object.assign(
                  dataset,
                  {
                    index, item: loopTarget[index]
                  }
              )
          ).children.forEach(
              el => {
                child.children.push(el)
              }
          )
        }
        back.index ? (dataset.index = back.index) : null
        back.item ? (dataset.item = back.item) : null
        i += loopTemplate.length + 1
        continue
      } catch (e) {
        if (e.message.length > 0) throw e
        throw new Error(`cannot find the end of loop, first line is: ${line.replace(/dataset[.]/g, '$')}`)
      }
    }
    
    // condition statement
    if (line.includes('@if')) {
      const conditionTargetName = line.match(/@if\({{[^}]*}}\)/g)[0].slice(4, -1).slice(2, -2)
      let conditionTarget = null
      try {
        conditionTarget = eval(conditionTargetName)
      } catch (e) {
        throw new Error(`cannot calculate the result of ${conditionTargetName.replace(/dataset[.]/g, '$')}`)
      }
      try {
        const ifTemplate = getTemplateOfBlock(i, lines)
        if (conditionTarget) {
          generateVirtualDOM(
              ifTemplate.join('\n'),
              dataset
          ).children.forEach(
              el => {
                child.children.push(el)
              }
          )
        }
        i += ifTemplate.length + 1
        continue
      } catch (e) {
        if (e.message.length > 0) throw e
        throw new Error(`cannot find the end of condition, first line is: ${line.replace(/dataset[.]/g, '$')}`)
      }
    }
  
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
    if (line.startsWith('~')) {
      line = line.slice(1)
      const key_value = line.split(' ').filter(i => i.length > 0)
      const key = key_value[0]
      const value = key_value.slice(1).join(' ')
      setElProps(child, key, value)
      continue
    }
    
    // mark event
    if (line.startsWith('!')) {
      line = line.slice(1)
      const args = line.split(' ').filter(i => i.length > 0)
      const eventName = args[0]
      const functionName = args[1]
      child.children.push(registerEvent(eventName, functionName))
      continue
    }
    
    // create element
    const el = createEl(line)
    
    // mark input and textarea
    if (el instanceof El && new Set(['input', 'textarea']).has(el.tagName)) {
      child.children.push(registerInput())
    }
    
    if (line.endsWith('{') && !line.endsWith('{{')) {
      parents.push(child)
      child = el
      setElSpecialProps(child, line)
    } else if (line.startsWith('}') && !line.startsWith('}}')) {
      const parent = parents.pop()
      parent.children.push(child)
      child = parent
    } else {
      child.children.push(el)
    }
  }
  return child
}

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

const registerInput = () => {
  return new El('BSXml-Input')
}

const registerEvent = (eventName = '', functionName = '') => {
  if (HTMLEvents.has(eventName)) {
    return new El('BSXml-Event', {eventName, functionName})
  } else {
    throw new Error(`invalid event name`)
  }
}

const createEl = (text = '') => {
  const tagName = text.trim().split(' ')[0]
  if (tagName.length === 0) {
    return ' '
  }
  if (HTMLTags.has(tagName)) {
    return new El(tagName)
  } else {
    return text.trim()
  }
}

const setElSpecialProps = (element, raw = '') => {
  if (element instanceof El) {
    const props = {
      class: (raw.match(/[.][\w\d-]* /g) || []).map(i => i.trim().slice(1)).join(' '),
      id: (raw.match(/[#][\w\d-]* /) || [''])[0].slice(1).trim()
    }
    if (element.tagName === 'a') {
      props.href = (raw.match(/"[^]*"/) || [''])[0].slice(1, -1)
      if (raw.includes('*"')) props.target = '_blank'
    }
    element.props = Object.assign(element.props, props)
  }
}

const setElProps = (element, key = '', value = '') => {
  if (element instanceof El) {
    const props = {}
    props[key] = value
    element.props = Object.assign(element.props, props)
  }
}

const getTemplateNode = (name = '') => {
  if (name.trim().length > 0) {
    return $(`BSX[name=${name}]`)
  } else {
    return null
  }
}

const getTemplateOfBlock = (indexOfCurrent = -1, lines = []) => {
  const template = []
  const countOfBrackets = {
    left: 0, right: 0
  }
  for (let i = indexOfCurrent + 1; i < lines.length; i++) {
    const line = lines[i]
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

BSXml.inputs = Object.create(null)
BSXml.__inputs__ = new Map()

export default BSXml