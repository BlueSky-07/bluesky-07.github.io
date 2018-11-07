# BSXml-Conponent

在 Github 上查看 [源码](https://github.com/BlueSky-07/ES-6/blob/master/modules/BSXml) [测试](https://github.com/BlueSky-07/ES-6/tree/master/test/BSXml)

`Broswer-Slim-Xml-Component` `v3.6`

一个前端开发框架的简单实现。该工具仅用作学习用途，如需在实际环境中使用还需要更多的测试与完善。

**功能包含**

- [模版引擎渲染](?BSXml-Template#1-)
- [事件注册、输入框双向绑定](?BSXml-Template#2-)
- [组件化开发](?BSXml-Component)

**DEMO**
>- [students](https://es6.ihint.me/BSXml/component/)

----
# 1. BSComponent
## 1.1 通用组件类

首先先设计一个 **BSComponent** 类，所有的自定义的类均要继承这个通用组件类。针对这个通用类，去实现一些基本的方法，比如渲染、注册事件、组建通信等，后续的类可以选择使用这些方法，也可以去重写这些方法。

为了节省篇幅，这里先把所有的属性值罗列如下，具体会在后文陆续介绍：

![属性值](https://i.loli.net/2018/11/07/5be2844833159.jpg)

其中，与模板相关的属性值部分作用及用法与 **BSXml** 模板引擎部分介绍的一致。其中新增了`style`，该属性表示组件的 **CSS 样式**，在编译的时候会将其转换成`<style>`标签。

`BSComponent`类设计：
```js
export default class BSComponent {
  constructor() {
    this.need = {}
  
    this.template = ''
    this.style = ''
    this.dataset = {}
    this.functions = {}
    this.inputs = {}
    
    this.renderer = null
    this.emitter = new BSEvent(uuid())
    this.listen = {}
  
    this.components = {}
    this.parent = null
    this.context = {}
    
    this.uuid = uuid().slice(0, 8)
    this.el = null
    this.$el = null
    this.$$el = null
    this.$_start = null
    this.$_end = null
  }
}
```
## 1.2 组件的初始化

有了各式各样的的属性后，接下来完成初始化方法。初始化方法需要将模块的核心工作元件初始化完成，还要做一些其他的准备工作备用。

初始化方法被设计成不需要自己调用的方法，而是在需要的时候自动被调用，比如在渲染之前会自动初始化。这样的话，如果大量的初始化一些组件，只要它们还没被渲染，就不会有大量的内存占用。所以为了防止重复初始化，需要在开始时去判断`renderer`是否已被初始化。

```js
class BSComponent {
  ......

  init() {
    if (this.renderer) {
      return
    }
    
    if (typeof this.template !== 'string') {
      throw new Error('template must be a string')
    }
    if (typeof this.style !== 'string') {
      throw new Error('style must be a string')
    }
    if (typeof this.dataset !== 'object') {
      throw new Error('dataset must be an object')
    }
    if (typeof this.functions !== 'object') {
      throw new Error('functions must be an object')
    }
    if (typeof this.need !== 'object') {
      throw new Error('need must be an object')
    }
    if (typeof this.listen !== 'object') {
      throw new Error('listen must be an object')
    }
    
    this.renderer = new Renderer(new Parser(this.template), {
      dataset: this.dataset, functions: this.functions
    })
    this.renderer.component = this
    this.inputs = this.renderer.inputs
    
    Object.defineProperty(this, 'template', {
      configurable: false,
      get() {
        return this.renderer.parser.template
      },
      set(template) {
        this.renderer.parser.template = template
      }
    })
    
    this.styleBlock = BSElement.createStyleBlock(this.style)
    this.blockMark = BSElement.createComponentBlockMark(this.uuid)
    
    Object.entries(this.listen).forEach(([signal, callback]) => {
      if (signal.startsWith('_')) {
        this.emitter.once(signal.slice(1), callback)
      } else {
        this.emitter.on(signal, callback)
      }
    })
  }
}
```

这里将`template`属性与`renderer`的`template`双向绑定，以便在组件的模板变化后重新编译时读入的是更新后的模板。关于模板的渲染原理可以查看这篇文章：[BSXml-Template](?BSXml-Template) 。

同时，在初始化方法中，又新添加了两个属性：
1. `styleBlock`：将`style`属性保存的 **CSS** 样式转换成`<style>`标签。
1. `blockMark`：用于标记当前组件的在文档中的开始与结束的位置。

那么，在之前的`BSElement`类中添加这两个方法：
```js
class BSElement {
  ......
  
  static createComponentBlockMark(uuid) {
    return new BSElement('bsxc', {uuid})
  }
  
  static createStyleBlock(styles) {
    const style = new BSElement('style')
    style.children.push(styles)
    return style
  }
}
```

最后，对所有的信号监听函数注册到`emitter`中，留作后续组件间通信备用。关于事件的处理，可以查看这篇文章：[BSEvent](?BSEvent) 。

## 1.3 一些辅助方法

在编译与渲染组件之前，还要准备一些备用的方法。其中有些方法被设计成返回实例本身，所以可以支持链式调用。

```js
class BSComponent {
  ......
  
  read(dataset) {
    this.init()
    Object.entries(dataset).forEach(([key, value]) => {
      this.dataset[key] = value
    })
    return this
  }
  
  plug(components = {}) {
    this.init()
    Object.entries(components).forEach(([name, component]) => {
      this.components[name] = component
      this.components[name].parent = this
    })
    return this
  }
  
  needComponent(component, name, ...args) {
    this.components[name] = new this.need[component](...args)
    this.components[name].parent = this
    this.components[name].context = this.context
    return this.components[name]
  }
}
```

1. `read()`：载入数据集，在实例化一个组件后调用。这个方法的存在的意义在于，因为之前的数据集已经被绑定到`renderer`上了，如果直接替换`renderer`的数据集，那么每次都要传入所有的键值对，若有缺失会在组件重新编译的时候缺少数据而报错。那么这个方法会遍历传入的对象，然后将键与值更新到`renderer.dataset`上，完成数据的更新。
1. `plug()`：传入特定的子组件，而不是根据`need`中的子组件原型去实例化新的子组件。
1. `needComponent()`：创建新的子组件实例。

## 1.4 在模板中添加组件

示例：
```js
class Buttons extends BSComponent {
  constructor() {
    super()
    this.template = `
      div .buttons {
        @for({{$buttons}}) {
          @Button btn-{{$item}}
        }
      }
    `
    this.dataset = {
      buttons: []
    }
    this.need = {
      Button
    }
  }
}

class Button extends BSComponent {
  constructor(name = 'btn', msg = 'clicked') {
    super()
    this.template = `
      button {
        ! click hit
        ${name}
      }
    `
    this.functions = {
      hit() {
        alert(`${name}: ${msg}`)
      }
    }
  }
}

new Buttons().read({
  buttons: [
    'hello', 'default'
  ]
}).plug({
  'btn-hello': new Button('Hello', 'World')
}).paint(document.querySelector('#app'), 'replace')
```

结果：
>- [组件在模板中的定义](https://es6.ihint.me/BSXml/component-1/)

这里新增的模板语法是以`@`开头的语句会被识别成组件，且`@`后的参数依次表示为：`@组件原型名 组件名 ...组件参数`。

那么，需要在之前的`Parser`类中添加对于组件的识别：
```js
compile(dataset = {}) {
  ......
  // drop comments
  // convert $data to dataset[data]
  // condition statement
  // loop statement
  // read data from dataset
  
  // Component
  if (line.startsWith('@')) {
    const [component, name, ...args] = line.slice(1).split(' ').filter(i => i.length > 0)
    child.children.push(BSElement.createComponentMark(component, name, args.join(' ')))
    continue
  }
  
  // set attributes
  // create element
......
```

相应的也要在`BSElement`类中添加新的标记创建方法：
```js
class BSElement {
  ......
  
  static createComponentMark(component, name, args) {
    return new BSElement('BSXml-Component', {component, name, args})
  }
}
```

## 1.5 组件的编译与渲染

接下来，就可以完成对于组件的模板编译和渲染了。代码如下：

```js
class BSComponent {
  ......

  render() {
    this.init()
    const fragment = document.createDocumentFragment()
    return Promise.resolve()
        .then(async () => {
          return await this.beforeRender()
        })
        .then(() => {
          fragment.appendChild(this.blockMark.compile())
          fragment.appendChild(this.renderer.render())
          fragment.appendChild(this.styleBlock.compile())
          fragment.appendChild(this.blockMark.compile())
          return fragment
        })
        .then(fragment => {
          const promises = []
          Object.entries(this.need).forEach(([component, prototype]) => {
            promises.push(... new Array().map.call(fragment.querySelectorAll(`BSXml-Component[component='${component}']`), mark => {
              const name = mark.getAttribute('name')
              if (!this.components[name]) {
                const args = mark.getAttribute('args')
                if (args) {
                  this.components[name] = new prototype(...args.split(' '))
                } else {
                  this.components[name] = new prototype()
                }
              }
              this.components[name].parent = this
              this.components[name].context = this.context
              return this.components[name].paint(mark, 'replace', fragment)
            }))
          })
          return Promise.all(promises)
        })
        .then(async () => {
          return await this.afterRender()
        })
        .then(() => {
          return fragment
        })
        .catch(e => {
          throw e
        })
  }

  // hooks:
  
  async beforeRender() {
  }
  
  async afterRender() {
  }
}
```

它的工作流程是这样的：
![编译与渲染](https://i.loli.net/2018/09/17/5b9f6751aa14d.jpg)

关于模板的渲染原理可以查看这篇文章：[BSXml-Template](?BSXml-Template) 。

在组件模板编译与渲染结束后，遍历所有的子组件原型集，同时也遍历所有在模板中定义的模板标记，然后依次初始化这些子组件，最后装载到`fragment`中，完成一个组件的编译与渲染。

在初始化子组件的时候，会判断该子组件是否已被实例化过，如该组件调用过`plug()`方法，那么此时不会去创建新的子组件实例，而是复用现有的子组件。所以，在设计组件的时候要注意组件命名不能重复。

## 1.6 组件的装载

得到了组件渲染生成的`DocumentFragment`后，接下来就需要将其装载到`document`中。

```js
class BSComponent {
  ......

  paint(target, type = 'replace', document = window.document) {
    return Promise.resolve()
        .then(async () => {
          return await this.beforePaint()
        })
        .then(async () => {
          return await this.render()
        })
        .then(fragment => {
          fragment.paint(target, type)
          this.el = document.querySelector(`bsxc[uuid='${this.uuid}']`).nextElementSibling
          this.$el = this.el.querySelector.bind(this.el)
          this.$$el = this.el.querySelectorAll.bind(this.el)
          return 'OK'
        })
        .then(() => {
          this.$_start = null
          this.$_end = null
          new Array().forEach.call(document.querySelectorAll(`bsxc[uuid='${this.uuid}']`), bsxc => {
            const uuid = bsxc.getAttribute('uuid')
            const comment = window.document.createComment(`BSXC[${uuid}]: ${this.constructor.name}`)
            bsxc.parentNode.replaceChild(comment, bsxc)
            if (!this.$_start) {
              this.$_start = comment
            } else if (!this.$_end) {
              this.$_end = comment
            }
          })
          return 'OK'
        })
        .then(async () => {
          return await this.afterPaint()
        })
        .catch(e => {
          throw e
        })
  }
  
  // hooks:

  async beforePaint() {
  }
  
  async afterPaint() {
  }
}
```

这里在装载到文档后，设置了三个属性`el` `$el()` `$$el()`，分别表示这个组件的第一个节点和这个组件第一个节点的选择器。为了配合使用，在设计组件的时候，应该用一个容器将组件内容装入其中。

## 1.7 组件的更新

```js
class BSComponent {
  ......

  refresh() {
    return Promise.resolve()
        .then(async () => {
          return await this.beforeRefresh()
        })
        .then(() => {
          let next = this.$_start.nextSibling
          while (next !== this.$_end) {
            next.remove()
            next = this.$_start.nextSibling
          }
          next.remove()
          this.paint(this.$_start, 'replace')
          return 'OK'
        })
        .then(async () => {
          return await this.afterRefresh()
        })
        .catch(e => {
          throw e
        })
  }
  
  // hooks:

  async beforeRefresh() {
  }
  
  async afterRefresh() {
  }
}
```

这里实现了对于组件的完全移除然后重新渲染、装载。这是最重的、最耗性能、最不应该采取的策略，实际设计组件的时候应该重写该方法，实现对于特定的元素的属性值的更新。

## 1.8 组件间的通信

```js
class BSComponent {
  ......

  notify(signal = '') {
    if (this.parent) {
      this.parent.signal(signal)
    }
  }
  
  signal(signal = '') {
    if (typeof signal === 'string') {
      this.emitter.emit(signal)
    } else if (signal.signal) {
      this.emitter.emit(signal.signal, signal)
    }
  }
}
```

这里通过信号机制完成组件之间的通信。子组件通过`notify()`去向父组件发送信号，父组件通过`signal()`响应信号。这样的设计只能在父子组件完成通信，如果需要跨父组件通信，可以在父组件监听该信号，然后其向其父组件发送信号，完成通信。也就是说，组件间的通信是一级一级完成的。

通信的工作流程如下：
![组件间通信工作流程](https://i.loli.net/2018/09/17/5b9f7718d56ca.jpg)

具体的原理可以查看这篇文章：[BSEvent](?BSEvent) 。

## 1.9 总结

到此为止，全部的有关组件的部分就结束了。总体的设计思路分为几个部分：
1. 对于组件的初次渲染，同时要渲染子组件。
1. 在实例化子组件的时候处理组件之间的关系。
1. 组件间的通信，基于信号机制。
1. 组件的更新，需要自己重写高效的更新方法，避免使用默认的更新方法。

## 1.10 未来计划

### 1.10.1 针对组件更新的重新架构

由于策略的选择，包括组件的渲染、渲染后的事件注册、输入的绑定，渲染一个组件最终产生的是 **DocumentFragment** 实例，而不是一个虚拟 **DOM** 实例，所以类似于基于常见框架的 **diff** 算法的组件更新暂时没有实现的思路。后续有重构计划的时候会考虑妥善处理流程，最终实现类似的更新方法。

<del><small>而且，为了实现这个组件的默认更新方法，对于每个组件增加了前后的开始结束标记节点，污染了文档。如果重新架构的话也要对于组件的定位采取新的策略。</small></del>在 3.6 版本中已将所有的标记节点换成了注释节点。

### 1.10.2 为每个组件生成独特的样式

目前写在组件`style`的样式会在渲染每个组件的时候生成，所以当有大量相同类型的组件的时候，文档里会有很多重复的样式。而且如果不同组件的样式名相同的话会产生冲突。

应当为每个组件生成自己独特的一套样式，使其只能控制这个组件。

### 1.10.3 组件的权限控制

目前组件没有权限约束，有无数种途径都可以随意的控制一个组件的细节，那么在设计组件的时候可能会产生混乱，比如新的组件错误地修改了旧的组件，使得旧的组件无法正常工作产生崩溃。

应该构建一套权限系统，使一个组件能够保证自己不被破坏，且能够自己决定暴露哪些功能或属性。

### 1.10.4 组件的状态设计

目前的组件没有实现“状态”机制，那么组件在更新后的状态就会变得不可知，在其它组件与其协作的时候会产生困难。

----

# 2. 组件设计样例

下文会实现一个 todo 类的应用，该应用采用了上文设计的组件模型，同时使用了 [BSModule](?BSModule) 中设计的页面路由功能。

**在线地址**

>- [todo](https://es6.ihint.me/todo/#/)（[源码](https://github.com/BlueSky-07/ES-6/tree/master/test/BSXml/todo)）



## 2.1 界面与组件

![界面](https://i.loli.net/2018/09/21/5ba456a65c1a2.png)

由此可以得到三个组件：
![组件](https://i.loli.net/2018/09/21/5ba45657acab4.png)

## 2.2 组件设计

先不做页面路由，**HTML** 页面：
```html
<body>
<div id="app">
  <div id="loading" style="display: flex; justify-content: center; align-items: center; height: 20em;">
    <h2>Loading...</h2>
  </div>
</div>
</body>
```

### 2.2.1 Main.js

接下来先设计主界面：
```js
import BSComponent from '//node.com/modules/BSXml/BSComponent.js'
import Timeline from './timeline/Timeline.js'
import Viewer from './viewer/Viewer.js'
import Console from './console/Console.js'

export default class Main extends BSComponent {
  constructor() {
    super()
    this.template = `
      div #main-panel {
        @Timeline timeline
        @Viewer viewer
        @Console console
      }
    `
    this.need = {
      Timeline, Viewer, Console
    }
    this.listen = {
      view: (signal) => {
        this.components.viewer.refresh('load', signal)
      },
      'new-timepoint': (signal) => {
        this.components.timeline.refresh('add', signal.timepoint)
      },
      'system-out': (signal) => {
        this.components.console.refresh('system-out', signal.message, signal.style)
      },
      finish: (signal) => {
        this.components.timeline.refresh('finish', signal.id)
      }
    }
    this.style = `
      body {
        margin: 0;
        background-color: #eee;
      }
      
      *::selection {
        background-color: transparent;
      }
    `
  }
  
  refresh(command, ...args) {
    switch (command) {
      case 'show':
        this.components.viewer.refresh('hide')
        this.el.hidden = ''
        break
      default:
        super.refresh()
    }
  }
  
  afterPaint() {
    this.components.console.refresh('focus')
  }
}
```

这里，主界面组件注册了 4 个信号监听函数：

1. `view`：用于显示预览区。
1. `new-timepoint`：用于显示新创建的标签。
1. `system-out`：用于在控制台输出。
1. `finish`：用于将已完成的标签移除。

这里体现了组件设计的原则之一：

**父组件控制子组件的显示**：避免子组件控制另一个子组件的显示，而是向父组件发送信号，然后由父组件去控制子组件的显示。也就是要保证，一个组件只能控制自己或它子组件的显示。

### 2.2.2 timeline/Timeline.js

然后设计标签区组件：

```js
import BSComponent from '//node.com/modules/BSXml/BSComponent.js'
import TimePoint from './TimePoint.js'
import DataLoader from '../../utils/DataLoader.js'

export default class Timeline extends BSComponent {
  constructor(timepoints = []) {
    super()
    this.template = `
      div #timeline .timeline {
        div .timeline-container {
          @if({{$timepoints.length}}) {
            @for({{$timepoints}}) {
              @TimePoint tp-{{$item.id}} {{encodeURI($item.id)}} {{encodeURI($item.date)}} {{encodeURI($item.title)}}
            }
          }
          div #empty .timeline-empty {
            ~ hidden {{$timepoints.length ? 'hidden' : ''}}
            h1 {
              All Done
            }
          }
        }
        div #trash .trash {
          ~ hidden hidden
          
          ! dragover willDelete
          ! dragleave cancelDelete
          ! drop delete
        }
      }
    `
    this.dataset = {
      timepoints
    }
    this.need = {
      TimePoint
    }
    this.listen = {
      'trash-show': ({offsetX, offsetY}) => {
        this.refresh('trash-show', offsetX, offsetY)
      },
      'trash-hide': () => {
        this.refresh('trash-hide')
      }
    }
    this.functions = {
      willDelete: ({event}) => {
        event.preventDefault()
        this.refresh('trash-hover')
      },
      cancelDelete: () => {
        this.refresh('trash-leave')
      },
      delete: ({event}) => {
        this.refresh('finish', event.dataTransfer.getData('id'), false)
      }
    }
    this.style = `
      /* 此处省略组件样式 */
      ......
    `
  }
  
  async beforeRender() {
    this.read({
      timepoints: (await DataLoader.getTimeline()).sort((a, b) => {
        return new Date(a.date).getTime() - new Date(b.date).getTime()
      })
    })
  }
  
  afterPaint() {
    this.els = {
      trash: this.$el('#trash')
    }
  }
  
  refresh(command, ...args) {
    switch (command) {
      case 'trash-show': {
        const offsetX = args[0] || 16
        const offsetY = (args[1] || 21 * 16) - pageYOffset
        const finalY = offsetY > 21 * 16 ? 21 * 16 : offsetY
        this.els.trash.hidden = ''
        this.els.trash.style.left = offsetX - 16 + 'px'
        this.els.trash.style.top = finalY + 16 + 'px'
        break
      }
      case 'trash-hide': {
        this.els.trash.hidden = 'hidden'
        this.els.trash.style.left = '1em'
        this.els.trash.style.top = '21em'
        this.els.trash.classList.remove('trash-dragover')
        break
      }
      case 'trash-hover': {
        this.els.trash.classList.add('trash-dragover')
        break
      }
      case 'trash-leave': {
        this.els.trash.classList.remove('trash-dragover')
        break
      }
      case 'add': {
        const timepoint = args[0]
        DataLoader.addTimepoint(timepoint)
            .then(json => {
              if (json.status === 'Success') {
                this.notify({
                  signal: 'system-out',
                  message: `[SYNC-ADDED]\n`,
                  style: 'default'
                })
                super.refresh()
              } else {
                throw 'Failure'
              }
            })
            .catch(() => {
              this.notify({
                signal: 'system-out',
                message: `[SYNC-ERROR]: Fail to add, check network\n`,
                style: 'default'
              })
            })
        break
      }
      case 'finish': {
        const id = args[0]
        const notNotify = args[1] || true
        const tpCom = this.components['tp-' + id]
        tpCom.refresh('drop')
        this.refresh('trash-hide')
        delete this.components['tp-' + id]
        const timepoint = this.dataset.timepoints.filter(tp => String(tp.id) === String(id))[0]
        this.read({
          timepoints: this.dataset.timepoints.filter(tp => String(tp.id) !== String(id))
        })
        if (this.dataset.timepoints.length === 0) {
          this.refresh()
        }
        if (!notNotify) {
          this.notify({
            signal: 'system-out',
            message: `[DROP] ${timepoint.title}
                   Due: ${new Date(timepoint.date).toLocaleString()}
                   ${timepoint.content ? 'Detail: ' + timepoint.content + '\n' : ''}`,
            style: 'drop'
          })
        }
        DataLoader.deleteTimepointById(id)
            .then(() => {
              this.notify({
                signal: 'system-out',
                message: `[SYNC-DROPPED]\n`,
                style: 'default'
              })
            })
            .catch(() => {
              this.notify({
                signal: 'system-out',
                message: `[SYNC-ERROR]: Fail to drop, check network\n`,
                style: 'default'
              })
            })
        break
      }
      default:
        super.refresh()
    }
  }
}
```

在模板中，用循环和组件初始化语法来初始化标签组件(**@TimePoint**)，参数依次写在子组件名后面，以空格隔开。具体语法参考[这里](#1-4-)。

关于组件的设计原则：
1. 组件的样式中包含页面中仅出现一次的样式，以及页面中可能会有多个同类子组件的通用样式。这也是对于当前组件样式不能独立编译的无奈之举，具体可以看[这里](#1-10-2-)。
1. 关于组件的更新时机：在`functions`中的函数里只处理数据，然后传递给`refresh()`，交由其去处理组件的更新。在`refresh`中，预先设计全部允许的组件更新命令，包括需要传入的参数、如何更新等等。这也是对于当前组件[没有状态](#1-10-4-)、组件的[无权限控制](#1-10-3-)的弥补操作，实践的时候参考了 **Flux** 的设计思想。
1. 组件的更新一定要尽最大努力避免使用原始的`refresh()`方法，它的实现请看[这里](#1-7-)。

**参考资料**

>- [Flux 架构入门教程](http://www.ruanyifeng.com/blog/2016/01/flux.html) <small>ruanyifeng.com</small>

标签区组件的设计还包含了拖拽来删除标签的功能，这个功能不作为单个标签组件的子组件设计，因为在一个时刻内只能拖拽一个标签，因此可以作为标签区组件的一个元素，可以减少页面的元素、事件数量，提升性能。

为此，增加一些关于垃圾箱图标的更新方法，通过计算目标标签的位置来将其移动或控制是否显示，最终只需要一个垃圾桶元素就能完成所有标签的拖拽删除功能。

关于数据的处理，使用了一个`DataLoader`类，它负责所有数据的读写请求。实现的时候参考了 **Java** 中的接口设计，可以对于不同的数据源编写具体内容不同，但是方法名相同的数据请求方法，来方便切换数据源。

### 2.2.3 timeline/TimePoint.js

现在来设计标签组件：

```js
import BSComponent from '//node.com/modules/BSXml/BSComponent.js'
import {router} from '../../app.js'
import DateFormatter from '../../utils/DateFormatter.js'

export default class TimePoint extends BSComponent {
  constructor(id = 0, date = new Date('2000/1/1').getTime(), title = '') {
    super()
    id = decodeURI(id)
    date = DateFormatter.format(decodeURI(date))
    title = decodeURI(title)
    this.template = `
      div .timepoint .timepoint-in {
        ! click view
        ~ draggable true
        ! dragstart willDelete
        ! dragend cancelDelete
        
        div #title .title {
          {{$title}}
        }
        div #date .date {
          {{$date}}
        }
      }
    `
    this.dataset = {
      id, date, title
    }
    this.functions = {
      view({$this, dataset}) {
        router.gotoRouter('/view/' + dataset.id)
      },
      willDelete({$this, event, dataset}) {
        const offsetX = event.target.offsetLeft + event.target.offsetWidth / 2
        const offsetY = event.target.offsetTop + event.target.offsetHeight
        $this.notify({
          signal: 'trash-show', offsetX, offsetY
        })
        event.dataTransfer.setData('id', dataset.id)
      },
      cancelDelete({$this}) {
        $this.notify('trash-hide')
      }
    }
  }
  
  refresh(command, ...args) {
    switch (command) {
      case 'drop': {
        this.el.classList.remove('timepoint-in')
        this.el.classList.add('timepoint-out')
        setTimeout(() => {
          this.el.hidden = 'hidden'
        }, 500)
        break
      }
      default:
        super.refresh()
    }
  }
}
```

一个标签组件在被拖拽的时候，会向父组件发送信号来显示垃圾桶图标，完成父子组件的通信功能。关于组件间的通信可以看[这里](#1-8-)。

### 2.2.4 其他组件

此篇文章主要是为了介绍组件的设计原则，所以有关其他组件的设计细节可以查看[源码](https://github.com/BlueSky-07/ES-6/tree/master/test/BSXml/todo)。

## 2.3 总结

关于组件设计的原则，现归纳如下：

1. 组件最终产生一个根节点，以使用元素选择器。
1. 预先设置所有可能的更新操作，重写`refresh()`方法。
1. 在`functions`中处理数据，在`refresh`中处理视图。
1. 一个组件只负责自己的显示，也可以调用子组件的`refresh(command)`去让子组件更新它的显示。
1. 跨组件的通信通过向父组件发送信号，交由父组件控制。