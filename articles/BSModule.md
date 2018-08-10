# BSModule

在 [Github](https://github.com/BlueSky-07/ES-6/blob/master/static/modules/BSModule.js) 上查看源码

`Browser-Simple-Module` `v1.0` 

这是一个关于页面组件载入的简单实现。用到了很多 ES 6 的特性，功能包含：

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

**参数说明：**

1. `id`其实是一个非必要参数，但是为了需求的扩展，比如检查是否引入过某个 **.js** 文件的时候可能会需要 **id** 属性，现规定为强制需要的参数。
1. `src`是目标 **.js** 文件的路径，可以是绝对路径，也可以是相对于当前 **.html** 页面的相对路径。
1. `?callback`是可选参数，通过给这个即将添加的新`<script>`节点添加`onload`事件来在该 **.js** 文件载入完成后执行`callback`回调函数。
1. `?type`是可选参数，若不设置默认引入普通 **.js**，若传入`type: 'module'`则会给这个即将添加的新`<script>`节点添加 **type** 属性为 **module**。

**调用示例：**
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

**关于 ES6 的 动态 import()**
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
**ES6 Module 的载入**

虽然我们暂时不能在引入一个 **ES6 Module** 后立即使用，但是我们仍然可以在引入的 **Module.js** 中通过`import ? from '?'`引入目标 **ES 6 Module**来使用它们。

**模块化**

为了将最终的所有功能最终向外输出一个 **ES6 Module**，可以这样封装：
```js
class BSModule {
  static add_js(id, src, {callback = '', type = ''} = {}) {
    ......
  }
}
export default BSModule
```
现在，只能通过 ES 6 的模块 **import** 语句来使用了：
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



----

## 3. 页面路由