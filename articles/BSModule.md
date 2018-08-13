# BSModule

在 Github 上查看 [源码](https://github.com/BlueSky-07/ES-6/blob/master/modules/BSModule.js) [测试](https://github.com/BlueSky-07/ES-6/tree/master/test/BSModule)

`Browser-Simple-Module` `v1.1` 

这是一个关于页面组件载入的简单实现。该工具仅用作学习用途，如需在实际环境中使用还需要更多的测试与完善。

**功能包含**

- [模块载入](#1-)
- [单页面模块间与多页面数据传输](#2-)
- [页面路由](#3-)


----

## 1. 模块载入

即引入 **.js** 文件，通过向`document.body`中添加`<script src="?.js"></script>`节点即可达到目的。代码：
```js
const add_js = (id, src, {callback = '', type = ''} = {}) => {
  try {
    $(`#${id}`).remove()
  } catch (e) {
  }
  if (typeof id !== 'string' || id.length === 0) {
    throw new Error('id must be set as a not empty string')
  }
  if (typeof src !== 'string' || src.length === 0) {
    throw new Error('src must be set as a not empty string')
  }
  
  const newScript = document.createElement('script')
  newScript.src = `${src}?${new Date().getTime()}`
  newScript.id = id
  
  callback = callback || new Function()
  if (typeof callback !== 'function') {
    throw new Error('callback must be a function without args')
  } else {
    newScript.onload = callback
  }
  if (type === 'module') {
    newScript.type = 'module'
  }
  document.body.appendChild(newScript)
}
```

**参数说明**

1. `id`其实是一个非必要参数，但是为了需求的扩展，比如检查是否引入过某个 **.js** 文件的时候可能会需要 **id** 属性，现规定为强制需要的参数。
1. `src`是目标 **.js** 文件的路径，可以是绝对路径，也可以是相对于当前 **.html** 页面的相对路径。
1. `?callback`是可选参数，通过给这个即将添加的新`<script>`节点添加`onload`事件来在该 **.js** 文件载入完成后执行`callback`回调函数。
1. `?type`是可选参数，若不设置默认引入普通 **.js**，若传入`type: 'module'`则会给这个即将添加的新`<script>`节点添加 **type** 属性为 **module**。

**调用示例**

```js
// 引入与当前 html 同一路径的 a.js 文件
add_js('a', 'a.js')

// 引入在当前 html 路径下的 js/b.js 文件，并在载入完成后执行 callback 函数
add_js('b', 'js/b.js', {
  callback() {
    console.log('b added')
  }
})

// 引入 jQuery
add_js('jq', 'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js', {
  callback() {
    console.log($('body'))
  }
})

// 引入一个 ES6 的模块
add_js('BSData', 'https://static.ihint.me/BSData.js', {
  type: 'module',
  callback() {
    // callback 不能调用模块里的任何变量、函数
    console.log('BSData module added') // OK
    console.log(BSData.object_to_json({a: 1, b: 2})) // NO!
  }
})
```

### 1.1 关于 ES6 的 动态 import()

1. 参考链接：
>- [Dynamic_Imports](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import#Dynamic_Imports) - *<small>developer.mozilla.org</small>*
>- [import()](http://es6.ruanyifeng.com/#docs/module#import) - *<small>es6.ruanyifeng.com</small>*
1. 目前还未被全部主流浏览器完全支持，支持的浏览器可以把上面的示例代码的最后一个的示例改成这样的动态 **import()** 写法：

```js
// 可以在 Chrome 63 及以后版本中运行
import('https://static.ihint.me/BSData.js')
.then(module => {
  const BSData = module.default
  const json_string = BSData.object_to_json({
    a: 1,
    b: 2
  })
  console.log(json_string)
}).catch(e => {
  console.log(e)
})
```

### 1.2 ES6 Module 的载入的新思路

虽然暂时不能通过 **BSModule** 在引入一个 **ES6 Module** 后立即使用这个模块，但是仍然可以在引入的 **import.js** 中通过`import ? from 'target.js'`引入目标 **ES6 Module**来使用它们。示例：
```html
<!--index.html-->
<body>
  <script>
    const add_js = (...) => {
      ......
    }
    add_js('import', 'import.js', {
      type: 'module'
    })
  </script>
</body>
```

```js
// import.js
import BSData from 'https://static.ihint.me/BSData.js'

console.log(BSData.object_to_json({a: 1, b: 2})) // OK
```

### 1.3 BSModule 模块化封装

为了将最终的所有功能最终向外输出一个 **ES6 Module**，可以这样封装：
```js
class BSModule {
  static add_js(id, src, {callback = '', type = ''} = {}) {
    ......
  }
}
export default BSModule
```
现在，只能通过 **ES6 Module** 的 **import** 命令来使用了：
```html
<body>
  <script type="module">
    import BSModule from 'https://static.ihint.me/BSModule.js'

    BSModule.add_js('jq', 'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js', {
      callback() {
        console.log($('body'))
      }
    })
  </script>
</body>
```

----

## 2. 单页面模块间与多页面数据传输

### 2.1 准备工作

考虑到 **.js** 文件可能所在路径各不相同，所以可以尝试配置一个根路径，在引入 **.js** 的路径前自动添加根路径。所以接下来的所有方法全部是非静态的，即需要实例化`new BSModule(...)`后才能调用。
```js
class BSModule {
  constructor({id_prefix = 'js_module_', js_root = 'js/', emptyjs = 'empty.js'} = {}) {
    this.id_prefix = id_prefix
    this.js_root = js_root
    this.emptyjs = `${js_root}${emptyjs}`
  }

  static add_js(...) { ...... }
}
```
当然，`add_js()`方法是通过传入值进行操作的，所以不需要实例化就能使用，使用时直接调用静态方法：`BSModule.add_js(...)`。

**参数说明**

1. `?id_prefix`是可选参数，表示所有新`<script>`标签的 **id** 属性前缀。默认值：`'js_module_'`。
1. `?js_root`是可选参数，表示该 **BSModule** 实例化对象所引入的 **.js** 文件的根路径。该跟路径可以是绝对路径，也可以是相对于当前 **.html** 页面的相对路径。默认值：`'js/'`。
1. `?emptyjs`是可选参数，表示一个空的 **.js** 文件的文件名。这个空 **.js** 文件会在同时引入多个 **.js** 时后引入，然后执行这次批量引入的回调函数。传入值为相对于 **js_root** 路径的完整文件名。默认值：`'empty.js'`。

**empty.js 文件示例**
```js
// this .js is used to call the callback function after importing new modules
```

**调用示例**
```js
import BSModule from 'https://static.ihint.me/BSModule.js'

const manager = new BSModule({
  id_prefix: 'test_',
  js_root: 'static/js/',
  emptyjs: 'empty.js'
})
```

### 2.2 封装 ES6 Module 类型 **.js** 引入

添加两个方法用来专门引入`type='module'`的 **.js**：
```js
class BSModule {
  constructor(...) { ...... }
  static add_js(...) { ...... }

  add_module(name = '', {src = '', callback = ''} = {}) {
    BSModule.add_js(`${this.id_prefix}${name}`, `${this.js_root}${src || name}.js`, {callback, type: 'module'})
  }
  
  add_modules(modules = [], callback = '') {
    for (const module of modules) {
      for (const {name, src} of module) {
        this.add_module(name, {src})
      }
    }
    BSModule.add_js(`${this.id_prefix}callback`, this.emptyjs, {callback, type: 'module'})
  }
}
```

**参数说明**

1. `name`是模块名，获取数据时会用到，使用时需要确保值唯一，否则新模块的数据会覆盖之前模块的数据。
1. `?src`是可选参数，表示这个模块的 **.js** 路径，无需后缀。若未设置，则按上述的`name`值引入。
1. `?callback`是可选参数，与 **add_js()** 效果相同。同样，不能在回调函数里使用引入模块里的任何变量、函数。
1. `modules`是一个数组，由上述`{name: '?', src: '?'}`构成的对象组成。

### 2.3 同一页面模块的引入与数据传输

上文说过，虽然暂时不能使用 [动态 import()](#1-1-es6-import-) 来访问引入模块的变量和函数，但是也提到了一个 [新思路](#1-2-es6-module-)，参照这个新思路，也可以尝试向引入的模块传值。

```js
class BSModule {
  ......

  my_import(module_name = '', {data = {}} = {}) {
    BSModule.dataStorage[module_name] = data
    BSModule.lastModuleName = module_name
    const src = BSModule.dataStorage[module_name]._src_ || module_name
    this.add_module(module_name, {src})
  }
}
BSModule.dataStorage = {}
```

**参数说明**

1. `module_name`是模块名，与前文一致。
1. `?data`是可选参数，表示传给即将引入模块所使用的值。

**ES6** 的 **import 命令** 不会重复引入 **src** 相同的模块，执行到重复引用时会使用第一次引入的模块。而且，**ES6 Module** 是动态引用，并且不会缓存值，模块里面的变量绑定其所在的模块。根据这个原理，给 **BSModule** 添加一个静态变量`dataStorage`用来存储数据，在引入的模块中也引入 **BSModule**，就可以通过`BSModule.dataStorage[module_name]`来获取数据了。

**参考资料**
>- [ES6 模块与 CommonJS 模块的差异](http://es6.ruanyifeng.com/#docs/module-loader#ES6-%E6%A8%A1%E5%9D%97%E4%B8%8E-CommonJS-%E6%A8%A1%E5%9D%97%E7%9A%84%E5%B7%AE%E5%BC%82) - *<small>es6.ruanyifeng.com</small>*

**调用示例**

```html
<!--index.html-->
<body>
  <script type="module">
    import BSModule from 'https://static.ihint.me/BSModule.js'

    const manager = new BSModule({
      js_root: './'
    })

    // https://static.ihint.me/BSModule.js 里没有 my_import() 方法
    // 如需运行此处代码先替换成 auto，这是一个改进版方法，会在下文中说明
    // manager.auto('test', {
    manager.my_import('test', {
      data: {
        msg: 'this msg set from html'
      }
    })
  </script>
</body>
```

```js
// test.js
import BSModule from 'https://static.ihint.me/BSModule.js'

console.log(`imported a module named: ${BSModule.lastModuleName}`)
console.log(`data received: ${BSModule.dataStorage[BSModule.lastModuleName]}`)
```

**运行结果**

![结果](https://i.loli.net/2018/08/10/5b6d46e4a1d59.png)

**src 设置**

给传入的模块的数据`data: {}`中设置`_src_`值，它表示实际 **.js** 文件与模块名不同，在引入时会使用这个`_src_`值。参考上文 [此处](#2-2-es6-module-js-)。

**调用示例**

```html
<!--index.html-->
<body>
  <script type="module">
    import BSModule from 'https://static.ihint.me/BSModule.js'

    const manager = new BSModule({
      js_root: './'
    })

    // https://static.ihint.me/BSModule.js 里没有 my_import() 方法
    // 如需运行此处代码先替换成 auto，这是一个改进版方法，会在下文中说明
    // manager.auto('any_name_you_like', {
    manager.my_import('any_name_you_like', {
      data: {
        msg: 'this msg set from html',
        _src_: 'test'
      }
    })
  </script>
</body>
```

```js
// test.js
import BSModule from 'https://static.ihint.me/BSModule.js'

console.log(`imported a module named: ${BSModule.lastModuleName}`)
console.log(`data received: ${BSModule.dataStorage[BSModule.lastModuleName]}`)
```

**运行结果**

![结果](https://i.loli.net/2018/08/10/5b6d471c5b5e6.png)

### 2.4 不同页面模块的数据传输

向另一个页面传输数据，可以通过地址拼接完成。

```js
class BSModule {
  ......

  to_another_page(module_name = '', htmlpath = '', {data = {}} = {}) {
    const current_htmlpath = location.pathname
    const transferring_data = Object.assign(
      data, {
        _from_: current_htmlpath
      }
    )
    location.href = `${htmlpath}#${module_name}?${BSData.object_to_body(transferring_data)}`
  }

  apply_module() {
    module_name = (location.hash.split('?')[0] || '').slice(1)
    const raw_data = location.hash.slice(location.hash.split('?')[0].length + 1)
    BSModule.dataStorage[module_name] = BSData.body_to_object(raw_data) || {}
    BSModule.lastModuleName = module_name
    const src = BSModule.dataStorage[module_name]._src_ || module_name
    this.add_module(module_name, {src})
  }
}
BSModule.dataStorage = {}
```

**参数说明**
1. `htmlpath`表示目的 **.html** 路径。

在出发页调用`to_another_page(...)`，在目的页调用`apply_module()`即可完成模块的引用和数据的传输。

**调用示例**
```html
<!--index.html-->
<body>
  <script type="module">
    import BSModule from 'https://static.ihint.me/BSModule.js'

    const manager = new BSModule({
      js_root: './'
    })

    // https://static.ihint.me/BSModule.js 里没有 to_another_page() 方法
    // 如需运行此处代码先替换成 auto，这是一个改进版方法，会在下文中说明
    // manager.auto('test', {htmlpath: 'target.html',
    manager.to_another_page('test', 'target.html', {
      data: {
        msg: 'this msg set from index.html'
      }
    })
  </script>
</body>
```
```html
<!--target.html-->
<body>
  <script type="module">
    import BSModule from 'https://static.ihint.me/BSModule.js'

    const manager = new BSModule({
      js_root: './'
    })

    manager.apply_module()
  </script>
</body>
```
```js
// test.js
import BSModule from 'https://static.ihint.me/BSModule.js'

console.log(`imported a module named: ${BSModule.lastModuleName}`)
console.log(`data received: ${BSModule.dataStorage[BSModule.lastModuleName]}`)
```

**结果**
![结果](https://i.loli.net/2018/08/10/5b6d5112946ea.png)

### 2.5 方法整合 auto()

可以看到不论是否在同一页面，其核心原理是一样的，将其整合成一个 **auto()** 方法，使其能够自动处理不同情况。

```js
class BSModule {
  ......

  auto(module_name = '', {htmlpath = '', data = {}} = {}) {
    const current_htmlpath = location.pathname
    const target_htmlpath = htmlpath || current_htmlpath
    if (current_htmlpath === target_htmlpath) {
      BSModule.dataStorage[module_name] = data
      this.apply_module(module_name, true)
    } else {
      const transferring_data = Object.assign(
          data, {
            _from_: current_htmlpath
          }
      )
      location.href = `${target_htmlpath}#${module_name}?${BSData.object_to_body(transferring_data)}`
    }
  }

  apply_module(module_name = '', is_current = false) {
    if (!is_current) {
      module_name = (location.hash.split('?')[0] || '').slice(1)
      const raw_data = location.hash.slice(location.hash.split('?')[0].length + 1)
      BSModule.dataStorage[module_name] = BSData.body_to_object(raw_data) || {}
    }
    if (module_name) {
      BSModule.lastModuleName = module_name
      const src = BSModule.dataStorage[module_name]._src_ || module_name
      this.add_module(module_name, {src})
    }
  }
}
BSModule.dataStorage = {}
```
在调用时无需多做修改，全部调用`manager.auto(...)`即可。代码可参考上文的注释部分。

### 2.6 在线测试页面

- **场景 1** - 同一页面的不同模块：
>[BSModule - same page, different modules](https://es6.ihint.me/BSModule_v1.1/samepage-diffmodules/BSModule.html)

- **场景 2** - 同一页面的同一模块，但源文件不同：
> [BSModule - same page, same module with different src](https://es6.ihint.me/BSModule_v1.1/samepage-diffsrcs/BSModule.html)

- **场景 3** - 不同页面的数据传输：
>- [1.html](https://es6.ihint.me/BSModule_v1.1/diffpage/1.html)
>- [2.html](https://es6.ihint.me/BSModule_v1.1/diffpage/2.html)

----

## 3. 页面路由

结合目前所实现的功能，可以通过地址`#`的变化引入不同的 **ES6 Module** 来实现一个简单的单页应用的路由功能。

### 3.1 路径注册

路由第一步，就是要确定有哪些“路”。通过将路径与访问该路径时需要引入的 **ES6 Module** 绑定，称之为“注册”。实现如下：
```js
class BSModule {
  ......

  register_router(path = '', module_name = {}) {
    if (path[0] !== '/') {
      throw new Error('path must start with /')
    }
    if (!this.routers) {
      this.routers = {}
    }
    const hash = md5(path)
    this.routers[hash] = {path, module_name}
    if (!BSModule.hashchange_event_registered) {
      BSModule.hashchange_event_registered = true
      window.onhashchange = () => {
        this.apply_module()
      }
    }
  }
  
  register_routers(routers = []) {
    if (Array.isArray(routers)) {
      for (const router of routers) {
        if (Array.isArray(router)) {
          const [path, module_name] = router
          this.register_router(path, module_name)
        } else if (router.path && router.module_name) {
          const {path, module_name} = router
          this.register_router(path, module_name)
        } else {
          throw new Error('item should be [path, module_name] or {path, module_name}')
        }
      }
    } else {
      throw new Error('routers should be an array')
    }
  }
}
```
**说明**
1. `path`为路径，`module_name`为该路径绑定的模块名。
1. 同时写一个批量注册的方法，该方法识别`[path, module_name]`和`{path, module_name}`并将其路径信息注册。
1. 规定合法路径以`/`开头，同时在存储时将路径序列化以便统一数据。
1. 规定`module_name`必须和实际 **ES6 Module** 的 **.js** 文件同名，即不响应数据中的 `_src_` 值。
1. 给当前实例化对象添加了一个属性`routers`用于存储路径与其绑定的模块名信息。
1. 检测是否注册了地址`#`变化监听，若没有，则注册监听时间，并给 **BSModule** 添加一个静态属性`hashchange_event_registered`用于标识已注册监听事件。

这样，接下来就可以通过`<a href='#/?'></a>`来响应页面的切换，以加载目标页面需要的 **Module**。但是这种切换方式利用了地址的变化来载入模块，所以此时的加载模式类似于不同页面间的模块载入，数据的传输需要拼接在地址的后面。

### 3.2 修改地址方式载入模块和传输数据

为了复用之前的`apply_module(...)`方法，需要做一些调整，同时不影响`auto()`的调用。代码：
```js
class BSModule {
  ......

  apply_module(module_name = '', is_current = false, is_router = false) {
    if (!is_current) {
      module_name = (location.hash.split('?')[0] || '').slice(1)
      if (module_name.startsWith('/')) {
        const path = module_name
        try {
          module_name = this.routers[md5(path)].module_name
          is_router = true
        } catch (e) {
          throw new Error(`router for ${path} must be registered before apply`)
        }
      }
      const raw_data = location.hash.slice(location.hash.split('?')[0].length + 1)
      BSModule.dataStorage[module_name] = BSData.body_to_object(raw_data) || {}
    }
    if (module_name) {
      BSModule.lastModuleName = module_name
      if (is_router) {
        delete BSModule.dataStorage[module_name]._src_
      }
      const src = BSModule.dataStorage[module_name]._src_ || module_name
      this.add_module(module_name, {src})
    }
  }
}
```
**说明**
1. 新增了对于`#/`开头的识别，因为规定了路径必须以`/`开头，所以这样的地址将会被识别成 **path**。
1. 识别到 **path** 之后尝试从路径信息集里获取其对应的模块名，同时将`_src_`属性删除。

这样即可完成模块的载入。

**调用示例**
```html
<body>
  <div id="page">
    <p>this is <span id="page_name">intro</span> page.</p>
    <p><a href="#/">#/</a></p>
    <p><a href="#/login">#/login</a></p>
    <p><a href="#/?msg=msg%20set%20by%20link%20#/">#/?msg=msg%20set%20by%20link%20#/</a></p>
    <p><a href="#/login?msg=msg%20set%20by%20link%20#/login">#/login?msg=msg%20set%20by%20link%20#/login</a></p>
  </div>
  <div id="data"></div>
  <script type="module">
    import BSModule from 'https://static.ihint.me/BSModule.js'
    
    const manager = new BSModule({
      js_root: './'
    })
    
    manager.register_routers([
          ['/', 'index'],
          ['/login', 'login']
        ]
    )
    
    manager.apply_module()
  </script>
</body>
```
```js
// index.js
import BSModule from 'https://static.ihint.me/BSModule.js'

document.querySelector('#page_name').innerHTML = 'index</a>'
document.querySelector('#data').innerHTML = `data:${JSON.stringify(BSModule.dataStorage.index)}<br>`
```
```js
// login.js
import BSModule from 'https://static.ihint.me/BSModule.js'

document.querySelector('#page_name').innerHTML = 'login'
document.querySelector('#data').innerHTML = `data:${JSON.stringify(BSModule.dataStorage.login)}<br>`
```

### 3.3 函数方式载入模块及数据传输

上述的方式切换页面会将数据拼接到地址后面才能传输，这样的话地址栏将会变得不太好看。考虑到大部分场景可能是单页应用，即不会切换 **.html**页面，所以可以写一个方法来完成页面的切换与数据的传输，同时不把数据拼在地址后面 。代码：
```js
class BSModule {
  ......

  register_router(path = '', module_name = {}) {
    if (path[0] !== '/') {
      throw new Error('path must start with /')
    }
    if (!this.routers) {
      this.routers = {}
    }
    const hash = md5(path)
    this.routers[hash] = {path, module_name}
    if (!BSModule.hashchange_event_registered) {
      BSModule.hashchange_event_registered = true
      window.onhashchange = () => {
        if (BSModule.gotoPreventApplyAgain) {
          BSModule.gotoPreventApplyAgain = false
        } else {
          this.apply_module()
        }
      }
    }
  }

  goto(path = '', {data = {}} = {}) {
    const hash = md5(path)
    if (this.routers[hash]) {
      BSModule.gotoPreventApplyAgain = true
      const module_name = this.routers[hash].module_name
      BSModule.dataStorage[module_name] = data
      location.href = `${location.pathname}#${path}`
      this.apply_module(module_name, true, true)
    } else {
      throw new Error(`${path} has not be registered`)
    }
  }
}
```
**说明**
1. 思路与上文的单页面多模块间数据传输一样，通过`BSModule.dataStorage`保存数据。
1. 与之前不同的是，这次操作会改变地址，所以会响应之前的`onhashchange`事件，为了不让模块第二次载入，用一个标记`BSModule.gotoPreventApplyAgain`标识，同时修改之前的注册事件来识别该标识。
1. 注意：传入的`path`不需要在前面加`#`。

**调用示例**
```html
<body>
  <div id="page">
    <p>this is <span id="page_name">intro</span> page.</p>
    <p><button url="/">goto('/')</button></p>
    <p><button url="/login">goto('/login')</button></p>
  </div>
  <div id="data"></div>
  <script type="module">
    import BSModule from 'https://static.ihint.me/BSModule.js'
  
    const manager = new BSModule({
      js_root: './'
    })
    
    manager.register_routers([
          ['/', 'index'],
          ['/login', 'login']
        ]
    )
    
    manager.apply_module()
    
    new Array().forEach.call(document.querySelectorAll('button'),
      button => {
        button.addEventListener('click', () => {
          manager.goto(button.getAttribute('url'), {
            data: {
              msg: `msg set by goto('${button.getAttribute ('url')}')`
            }
          })
        })
      })
  </script>
</body>
```
```js
// index.js
import BSModule from 'https://static.ihint.me/BSModule.js'

document.querySelector('#page_name').innerHTML = 'index</a>'
document.querySelector('#data').innerHTML = `data:${JSON.stringify(BSModule.dataStorage.index)}<br>`
```
```js
// login.js
import BSModule from 'https://static.ihint.me/BSModule.js'

document.querySelector('#page_name').innerHTML = 'login'
document.querySelector('#data').innerHTML = `data:${JSON.stringify(BSModule.dataStorage.login)}<br>`
```

### 3.4 index.html#/ 跳转到 #/

普通名称页面在上述处理后会变成形如`https://a.b.c/page.html#/login`这样的地址，但是如果是 **index.html** 可以省去 **index.html** 变成形如`https://a.b.c/#/login`这样的地址。对此，可以写一个方法来实现 “去**index.html**” 跳转。
```js
class BSModule {
  ......

  static prevent_index_html({filename = 'index.html', index_path = '/'} = {}) {
    if (location.pathname.endsWith(filename)) {
      location.href = `${location.pathname.slice(0, 0 - (filename.length))}#${index_path}`
    }
  }
}
```
**说明**
1. 考虑到有可能还有其他可能的文件名情况，如 **index.htm**，**index.jsp**，**index.php** 等等，所以设置一个参数`filename`，其默认值为 `'index.html'`。
1. 默认跳转到 `#/`，所以在执行该方法之前必须注册一个路径为 `/` 的路由信息。

**调用示例**
```html
<body>
<script type="module">
  import BSModule from 'https://static.ihint.me/BSModule.js'
  
  manager.register_routers([
        ['/', 'index']
      ]
  )
  
  manager.apply_module()

  BSModule.prevent_index_html()
</script>
</body>
```
```js
// js/index.js
......
```

### 3.5 在线测试页面

>- [router.html](https://es6.ihint.me/BSModule_v1.1/router/router.html)
>- [index.html](https://es6.ihint.me/BSModule_v1.1/router/index.html)