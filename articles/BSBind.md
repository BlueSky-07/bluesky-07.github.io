# BSBind

在 Github 上查看 [源码](https://github.com/BlueSky-07/ES-6/blob/master/modules/BSBind.js) [测试](https://github.com/BlueSky-07/ES-6/tree/master/test/BSBind)

`Browser-Simple-DataBind` `v0.1`

这是一个关于数据绑定的简单实现。该工具仅用作学习用途，如需在实际环境中使用还需要更多的测试与完善。

**3 种绑定方式**

- 本身可写可读，但源数据更新时会被更新
- 只读实时源数据
- 与源数据读写双向绑定

**效果**

![效果](https://i.loli.net/2018/08/15/5b740f902688e.gif)

## 1. Object.defineProperty(...)

这是 **BSBind** 功能实现的核心，原理就是通过定义对象属性的存取描述符`get()` `set()`来实现劫持数据的读取与修改操作，并在过程中做一些其他的事情。

### 1.1 介绍

>- [Object.defineProperty()](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty) - *<small>developer.mozilla.org</small>*

### 1.2 举例

#### 1.2.1 get()

这个例子演示了如何为一个对象定义一个类似于常量的属性：

```js
const data = {}

Object.defineProperty(data, 'PI', {
  get() {
    return 3.14
  }
})

console.log(data.PI)
data.PI = 3
console.log(data.PI)
```

**结果**
![结果](https://i.loli.net/2018/08/17/5b76222947df5.png)

由于为`data`定义了属性名为`'PI'`的属性，同时设置了`get()`的存取描述符，所以每当读取`data.PI`的时候就会调用这个`get()`方法，得到固定返回值 *3.14* 。

#### 1.2.2 set()

常量在尝试修改的时候应该抛出不允许修改的异常，可以这样实现：

```js
const data = {}

Object.defineProperty(data, 'PI', {
  get() {
    return 3.14
  },
  set(value) {
    throw new Error('data.PI is readonly, cannot be set to ' + value)
  }
})

console.log(data.PI)
data.PI = 3
console.log(data.PI)
```

**结果**
![结果](https://i.loli.net/2018/08/17/5b7624043c812.png)

### 1.3 注意

在设置了属性的`set()`的存取描述符后，如果实现类似于修改后再赋值时要注意避免陷入递归调用。

**错误示例**
```js
const circle = {}

Object.defineProperty(circle, 'r', {
  set(value) {
    if (typeof value === 'number') {
      this.r = value
    } else {
      this.r = 0
    }
  }
})

circle.r = 2
console.log(circle.r)
```
**结果**
![结果](https://i.loli.net/2018/08/17/5b76291c526d0.png)

**正确示例**

使用一个中间变量用作存储，并将其设置为不可枚举（默认）：

```js
const circle = {}

Object.defineProperties(circle, {
  r: {
    // configurable: false,
    enumerable: true,
    get() {
      return this._r
    },
    set(value) {
      if (typeof value === 'number') {
        this._r = value
      } else {
        this._r = 0
      }
    }
	}, _r: {
    // configurable: false,
    // enumerable: false,
    value: 0,
    writable: true
  }
})

circle.r = 2
console.log(circle.r)
Object.entries(circle).forEach(entry => {
  const [key, value] = entry
  console.log(`${key}: ${value}`)
})
```

**结果**
![结果](https://i.loli.net/2018/08/17/5b762b6d35ed4.png)

## 2. DataUnit 对象

现在，可以定义一个类，用来关联所有与某个值绑定的对象及其属性。

```js
class DataUnit {
  constructor(value) {
    this.senders = []
    this.receivers = []
    this.listeners = []
    Object.defineProperty(this, 'value', {
      get() {
        return this._value
      },
      set(value) {
        this._value = value
        // notify all listener
        this.listeners.forEach(listener => {
          listener.target[listener.property] = value
        })
      }
    })
    this.value = value
  }
}
```

**参数说明**
1. `?value`：实例化时需要传入，表示被绑定的 **实际值**，其他属性均与这个值有关， 实际存储在`_value`属性中。默认值为`undefined`。
1. `senders`：对象数组，其里面的每个对象都有一个特定属性与 **实际值** 双向绑定，读取该属性时永远读取 **实际值**，修改该属性等于修改 **实际值**。
1. `receivers`：对象数组，其里面的每个对象都有一个特定属性与 **实际值** 单向绑定，读取该属性时永远读取 **实际值**，修改该属性不生效。
1. `listeners`：对象数组，其里面的每个对象都有一个特定属性与 **实际值** 监听绑定，读取与修改均为该属性本身的值，但是当 **实际值** 有变化时，该属性的值会被修改成 **实际值**。

为`DataUnit`对象添加一个`value`属性，每当要修改该对象的改属性时会调用存取描述符`set()`方法。在这个方法中，会将所有记录的`listener`的相应属性更新值，完成“监听”的操作。

## 3. add...() 方法 - 注册绑定

其他类型的绑定可以通过一个统一的方法注册，代码如下：
```js
class DataUnit {
  add(prefix, target, property) {
    let fn = ''
    if (target[`__bsbind_id_${property}__`]) {
      fn = 'bind'
    }
    if (target[`__bsbind_lid_${property}__`]) {
      fn = 'bindListener'
    }
    if (target[`__bsbind_bid_${property}__`]) {
      fn = 'bindBoth'
    }
    if (fn) {
      throw new Error(`target has been called ${fn}() before`)
    }
    let array = ''
    switch (prefix) {
      case 'l':
        array = this.listeners
        target[property] = this.value
        break
      case 'b':
        array = this.senders
        Object.defineProperty(target, property, {
          configurable: true,
          get: () => this.value,
          set: value => {
            this.value = value
          }
        })
        break
      default:
        array = this.receivers
        Object.defineProperty(target, property, {
          configurable: true,
          get: () => this.value,
          set: value => {
          }
        })
    }
    const id = array.push({
      target, property
    })
    Object.defineProperty(target, `__bsbind_${prefix}id_${property}__`, {
      configurable: true,
      enumerable: false,
      writable: true,
      value: id
    })
  }
  
  // bind()
  addListener(target, property) {
    this.add('l', target, property)
  }
  
  // bindCopy()
  addReceiver(target, property) {
    this.add('', target, property)
  }
  
  // bindBoth()
  addSender(target, property) {
    this.add('b', target, property)
  }

  ......
}
```

**说明**

1. 规定目标只能被最多一种类型的绑定，若试图再次绑定会报错。
1. `receiver`的属性被设置了`get()`存取描述符，直接返回`DataUnit.value`，完成与 **实际值** 永远保持一致的目的。对其赋值时，所赋的值会被忽略。
1. `sender`的属性同时被设置了`get()` `set()`存取描述符，对其赋值将会修改`DataUnit.value`属性，而在此时会触发对`listener`类型的绑定对象的属性更新。
1. 最后，在目标对象中添加一个不可枚举的标记，表示已被某种类型绑定了。

## 4. remove...() 与 clear...() - 解除绑定

有的时候可能不需要再绑定了，所以需要解除绑定的操作，代码如下：
```js
class DataUnit {
  remove(prefix, target, property) {
    const id = (target[`__bsbind_${prefix}id_${property}__`] || 0) - 1
    let fn = ''
    let array = ''
    switch (prefix) {
      case 'l':
        fn = 'bindListener'
        array = this.listeners
        break
      case 'b':
        fn = 'bindBoth'
        array = this.senders
        break
      default:
        fn = 'bind'
        array = this.receivers
    }
    if (id === -1 || !array[id]) {
      throw new Error(`target has not been called ${fn}() before`)
    } else {
      target[`__bsbind_${prefix}id_${property}__`] = undefined
      array[id] = undefined
      Object.defineProperty(target, property, {
        configurable: true,
        writable: true,
        value: target[property]
      })
    }
    
  }
  
  // unbind()
  removeListener(target, property) {
    this.remove('l', target, property)
  }
  
  // unbindCopy()
  removeReceiver(target, property) {
    this.remove('', target, property)
  }
  
  // unbindBoth()
  removeSender(target, property) {
    this.remove('b', target, property)
  }

  ......
}
```

又有的时候，可能需要将所有的绑定全部解除掉，比如当这个 **实际值** 被替换的时候，旧的值需要全部断开彼此之间的联系，因为它们连在一起的基础都已经不再存在了。清空的代码如下：
```js
class DataBind {
  clearAll(array = '', fn = '', all = true) {
    if (all) {
      this.clearAllListeners()
      this.clearAllReceivers()
      this.clearAllSenders()
    } else {
      array.filter(item => item).forEach(item => {
        try {
          fn.call(this, item.target, item.property)
        } catch (e) {
        }
      })
    }
  }
  
  clearAllListeners() {
    this.clearAll(this.listeners, this.removeListener, false)
  }
  
  clearAllReceivers() {
    this.clearAll(this.receivers, this.removeReceiver, false)
  }
  
  clearAllSenders() {
    this.clearAll(this.senders, this.removeSender, false)
  }

  ......
}
```

## 5. BSBind

至此，核心部分已经基本完成。现在将它们封装成一个模块对外输出：

```js
class BSBind {
  static bind(name, target, property = '', type = '', undo = false, all = false) {
    if (typeof target !== 'object') {
      throw new Error('target must be an object')
    }
    if (typeof property !== 'string') {
      throw new Error('property must be a string')
    }
    checkName(name)
    property = property || name
    hasThen(name, (hash, unit) => {
      if (undo && all) {
        unit[({
          copy: 'clearAllReceivers', both: 'clearAllSenders', '': 'clearAllListeners'
        })[type]]()
      } else if (undo) {
        unit[({
          copy: 'removeReceiver', both: 'removeSender', '': 'removeListener'
        })[type]](target, property)
      } else {
        unit[({
          copy: 'addReceiver', both: 'addSender', '': 'addListener'
        })[type]](target, property)
      }
    })
  }
  
  static bindCopy(name, target, property = '') {
    this.bind(name, target, property, 'copy')
  }
  
  static bindBoth(name, target, property = '') {
    this.bind(name, target, property, 'both')
  }
  
  static unbind(name, target, property = '') {
    this.bind(name, target, property, '', true)
  }
  
  static unbindCopy(name, target, property = '') {
    this.bind(name, target, property, 'copy', true)
  }
  
  static unbindBoth(name, target, property = '') {
    this.bind(name, target, property, 'both', true)
  }
  
  static unbindAll(name) {
    this.bind(name, '', '', '', true, true)
  }
  
  static unbindAllCopy(name) {
    this.bind(name, '', '', 'copy', true, true)
  }
  
  static unbindAllBoth(name) {
    this.bind(name, '', '', 'both', true, true)
  }
  
  static clearAll(name) {
    checkName(name)
    hasThen(name, (hash, unit) => {
      unit.clearAll()
    })
  }
  
  static put(name, value = '') {
    checkName(name)
    const hash = md5(name)
    if (BSBind.names.has(hash)) {
      BSBind.storage[hash].clearAll()
    }
    BSBind.names.add(hash)
    BSBind.storage[hash] = new DataUnit(value)
  }
  
  static has(name) {
    checkName(name)
    return BSBind.names.has(md5(name))
  }
  
  static get(name) {
    checkName(name)
    let value = ''
    hasThen(name, (hash, unit) => {
      value = unit.value
    })
    return value
  }
  
  static set(name, value = '') {
    checkName(name)
    hasThen(name, (hash, unit) => {
      unit.value = value
    })
  }
}

const checkName = name => {
  if (typeof name !== 'string') {
    throw new Error(`'${name}' must be a string`)
  }
}

const hasThen = (name, fn) => {
  const hash = md5(name)
  if (!BSBind.names.has(hash)) {
    throw new Error(`'${name}' must be put before`)
  } else {
    fn(hash, BSBind.storage[hash])
  }
}

BSBind.names = new Set()
BSBind.storage = {}

export default BSBind
```

**说明**
1. 为了最大化复用代码，大部分方法最终会调用`bind()`方法，但是使用的时候没有必要通过传入大量的参数去调用`bind()`方法。例如，当想清空某个目标值所绑定的所有`listener`时，只需调用`BSBind.unbindAll(name)`，没有必要调用`BSBind.bind(name, '', '', '', true, true)`。
1. 所有的方法均是静态方法，所以不需要实例化就可以使用。
1. `put()`表示注册一个名称为 **name** 的实际值。若重复注册，则在注册新的之前会将所有与旧的绑定的对象接触绑定。
1. `has()`表示判断是否已经注册过名称为 **name** 的实际值。
1. `get()`表示获取名称为 **name** 的实际值。
1. `set()`表示更新名称为 **name** 的实际值。

**图示**

`put()`
![put()](https://i.loli.net/2018/08/20/5b7a36de5e28d.jpg)
`bind()`
![put()](https://i.loli.net/2018/08/20/5b7a36de6e8ac.jpg)

## 6. 示例

```html
<body>
<p>storage.listener <span id="listener-symbol">:</span> <input id="listener"></p>
<p>storage.receiver <span id="receiver-symbol">:</span> <input id="receiver"></p>
<p>storage.sender <span id="sender-symbol">:</span> <input id="sender"></p>
<p>storage.data <span id="data-symbol">:</span> <input id="data"></p>
<script type="module">
  import BSBind from '//node.com/modules/BSBind.js'
  
  const $ = document.querySelector.bind(document)
  const $$ = document.querySelectorAll.bind(document)
  
  const storage = {
    listener: '', receiver: '', sender: '', data: ''
  }
  
  const inputs = {
    listener: $('#listener'), receiver: $('#receiver'), sender: $('#sender'), data: $('#data')
  }
  
  const render = () => {
    Object.keys(storage).forEach(key => {
      inputs[key].value = key === 'data' ? BSBind.get('data') : storage[key]
    })
  }
  
  const save = id => {
    const value = inputs[id].value
    switch (id) {
      case 'listener':
        storage.listener = value
        break
      case 'receiver':
        storage.receiver = value
        break
      case 'sender':
        storage.sender = value
        break
      case 'data':
        BSBind.set('data', value)
        break
    }
    render()
  }
  
  (() => {
    BSBind.put('data', 'hello')
    BSBind.bind('data', storage, 'listener')
    BSBind.bindCopy('data', storage, 'receiver')
    BSBind.bindBoth('data', storage, 'sender')
    render()
    new Array().forEach.call($$('input'), input => {
      input.addEventListener('click', () => {
        Object.keys(storage).forEach(key => {
          $(`#${key}-symbol`).innerHTML = input.id === key ? '=' : ':'
        })
      })
      input.addEventListener('keyup', () => {
        save(input.id)
      })
    })
  })()
</script>
</body>
```

>- [在线示例页面](https://es6.ihint.me/BSBind_v0.1/index.html)