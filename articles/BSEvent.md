# BSEvent

在 Github 上查看 [源码](https://github.com/BlueSky-07/ES-6/blob/master/modules/BSEvent.js) [测试](https://github.com/BlueSky-07/ES-6/tree/master/test/BSEvent)

`Broswer-Simple-EventEmitter` `v0.2`

这是一个关于事件处理的简单实现。该工具仅用作学习用途，如需在实际环境中使用还需要更多的测试与完善。

- `emitter.on(...)`
- `emitter.once(...)`
- `emitter.emit(...)`

----

## 1. 事件注册

![图示](https://i.loli.net/2018/09/03/5b8cf8fa6f438.png)

对于每个`BSEvent`实例，维护一个`events`对象，这是一个由事件名做键名，`EventBundle`实例做值的对象。

注册的事件有两种类型，一种是一次性事件`once(...)`，一种是持久性事件`on(...)`，在处理的时候用一个属性做标记来区分这两种不同的事件。

```js
class EventBundle {
  constructor() {
    this.funs = []
  }
  
  push(f, once) {
    this.funs.push({
      f, once
    })
  }
}

class BSEvent {
  constructor(name = '') {
    this.events = {}
    
    BSEvent[name] = this
  }
  
  on(name = '', callbacks = new Function(), once = false) {
    if (!name) {
      throw new Error('name must be a string')
    }
    if (!this.events[name]) {
      this.events[name] = new EventBundle()
    }
    if (!(callbacks instanceof Array)) {
      callbacks = [callbacks]
    }
    for (const callback of callbacks) {
      if (!(callback instanceof Function)) {
        throw new Error('callback must be a function')
      }
      this.events[name].push(callback, once)
    }
  }
  
  once(name, callbacks) {
    this.on(name, callbacks, true)
  }
}

export default BSEvent
```

## 2. 事件触发

![图示](https://i.loli.net/2018/09/03/5b8d03c78f84f.png)

判断是否注册了该事件，若已注册，则依次调用目前已经绑定的回调函数。结束后，将所有的一次性事件去除。

```js
class EventBundle {
  handle(args) {
    this.funs.forEach(fun => {
      fun.f.call(null, ...args)
    })
    this.funs = this.funs.filter(fun => !fun.once)
  }

	......
}

class BSEvent {
  emit(name = '', ...args) {
    if (this.events[name]) {
      this.events[name].handle(args)
    } else {
      throw new Error(`${name} has not been registered`)
    }
  }

	......
}
```

## 3. 移除事件

有的时候可能需要将事件移除，实现如下：

```js
class EventBundle {
  remove(f) {
    this.funs = this.funs.filter(fun => fun.f !== f)
  }
  
  clear() {
    this.funs = []
  }
  
}

class BSEvent {
  remove(name, callback) {
    if (this.events[name]) {
      this.events[name].remove(callback)
    } else {
      throw new Error(`${name} has not been registered`)
    }
  }
  
  clear(name) {
    if (this.events[name]) {
      this.events[name].clear()
    } else {
      throw new Error(`${name} has not been registered`)
    }
  }
}
```

## 4. 在线样例

>- [BSEvent](https://es6.ihint.me/BSEvent/BSEvent.html)

## 5. 总结

总体上实现的思路很简单，更好的实现应该在处理所有注册的函数时使用`Promise`，同时增加对于异常处理的机制。