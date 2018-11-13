# BSFetch

在 Github 上查看 [源码](https://github.com/BlueSky-07/ES-6/blob/master/modules/BSFetch.js) [测试](https://github.com/BlueSky-07/ES-6/tree/master/test/BSFetch)

`Browser-Simple-Fetch` `v1.1`

这是一个关于`fetch(...)`的简单封装。该工具仅用作学习用途，如需在实际环境中使用还需要更多的测试与完善。

----

## 1. HTTP 请求

#### 参考资料

> + [HTTP](https://developer.mozilla.org/zh-CN/docs/Web/HTTP) - <small>developer.mozilla.org</small>
> + [HTTP 请求方法](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Methods) - <small>developer.mozilla.org</small>
> + [HTTP 请求头](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers) - <small>developer.mozilla.org</small>
> + [HTTP 响应代码](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Status) - <small>developer.mozilla.org</small>

经过测试，浏览器的`fetch(...)`支持以下 HTTP 请求方法的请求：

`head` `get` `post` `put` `delete` `patch` `options`

#### 测试代码

```js
(() => {
	const HTTPMethods = [
		'HEAD', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'CONNECT', 'TRACE'
	]
	for (const method of HTTPMethods) {
			fetch('', {method}).catch(e => {
				console.log(`Not Support '${method}': ${e}`)
			})
	}
	return 'Tested.'
})()
```

#### 运行结果

![运行结果](https://i.loli.net/2018/08/14/5b72447492c51.png)

所以，**BSFetch** 将上述支持的请求方式全部封装其中。

## 2. Request 包装

#### 参考资料

> 1. [Request](https://developer.mozilla.org/zh-CN/docs/Web/API/Request) - <small>developer.mozilla.org</small>

为了简化在实际使用场景时的操作，即每次不需要自己传入一个`Request`对象，取而代之的是由一些常用的参数组成的对象，可以这样封装：

```js
class BSRequest {
  constructor(url = '', debug = false) {
    this.url = url
    this.config = {}
    this.debug = debug
    
    for (const key of ['body', 'credentials', 'headers', 'method']) {
      Object.defineProperty(this, key, {
        get() {
          return this.config[key]
        },
        set(value) {
          this.config[key] = value
        }
      })
    }
  }
  
  info() {
    return `${this.method} '${this.url}':`
  }
  
  request() {
    return new Request(this.url, this.config)
  }
}
```

| 参数方法 | 说明                                                                |
|-----------|---------------------------------------------------------------------|
| url       | 必要参数，表示请求目标地址                                          |
| debug?    | 可选参数，表示是否输入实际请求`Request`对象及原始响应`Response`对象 |
| config    | 一个对象，里面有 4 个常用的属性，见下表                             |
| request() | 返回一个`Request`对象，该对象是最终被`fetch()`使用的参数            |

| config属性  | 说明                                                                                            |
|-------------|-------------------------------------------------------------------------------------------------|
| body        | 请求携带的数据部分，当请求头中`Content-Type`值被设为`application/x-www-form-urlencoded`时会使用 |
| credentials | 是否在跨域请求的情况下向其他域发送身份信息（包含**cookie**），有 3 个合法值，见下表             |
| headers     | 请求头，是一个`Headers`实例                                                                     |
| method      | 请求方法                                                                                        |

| credentials 合法值 	| 操作                                       	|
|--------------------	|--------------------------------------------	|
| omit               	| 从不发送                                   	|
| same-origin        	| 默认值，只有当 **URL**与响应脚本同源才发送 	|
| include            	| 不论是不是跨域的请求，总是发送             	|

## 3. doRequest() 方法

实现如何将上面的`BSFetch`真正传给`fetch()`使用：

```js
const doRequest = (request = new BSRequest()) => {
  if (request.debug) console.log(request.info(), request.request())
  return new Promise((resolve, reject) => {
    fetch(
        request.request()
    ).then(
        response => {
          if (request.debug) console.log(request.info(), response)
          if (request.responseType === 'RESPONSE') {
            return response
          } else if (request.responseType === 'STATUS') {
            return response.status
          }
          if (!response.ok) {
            const e = new Error()
            e.message = `cannot fetch resource: ${response.status}`
            e.message += response.statusText ? ` - ${response.statusText}` : ''
            e.response = response
            throw e
          }
          switch (request.responseType) {
            case 'JSON':
              return response.json()
            case 'TEXT':
              return response.text()
            case 'BLOB':
              return response.blob()
            case 'FORMDATA':
              return response.formData()
            case 'ARRAYBUFFER':
              return response.arrayBuffer()
            case 'HEADERS':
              return response.headers
          }
        }
    ).then(
        data => {
          resolve(data)
        }
    ).catch(
        e => {
          reject(e)
        }
    )
  })
}
```

#### 说明

1. 最终返回值是一个`Promise`实例，使用者可根据`fetch()`的返回值或出错的异常决定如何处理。
1. 除非设置`BSFetch`实例的`responseType`属性为`RESPONSE`或`STATUS`，否则将根据原始响应的`Response.ok`判断是否完成请求，同时根据其设置的`responseType`去决定数据如何处理后返回。
1. 无法完成请求时抛出的异常中含有`response`属性，为此次失败请求的原始响应`Response`对象。

## 4. BSFetch 对象

完成以上的操作后，可以发送传入参数为`BSRequest`的请求，并获取响应。现在将其再封装，同时将常用属性拆开，以可选参数形式传值。

```js
class BSFetch {
  static async fetch(url = '#', method = 'GET', {
    data = {}, reqtype = '', restype = 'json', cookies = '', headers = {}, debug = false
  } = {}) {
    if (typeof url !== 'string' || typeof method !== 'string') {
      throw new Error('BSFetch.fetch(url, method, {?...}): url/method must be a string')
    }
    
    const request = new BSRequest(url, debug)
    request.headers = new Headers(headers)
    
    method = method.toLowerCase()
    if (HttpMethods.has(method)) {
      request.method = method.toUpperCase()
    } else {
      request.method = 'GET'
    }
    switch (request.method) {
      case 'HEAD':
        restype = restype === 'response' ? restype : 'headers'
      case 'GET':
        if (data instanceof FormData) {
          request.url += '?' + BSData.object_to_body(BSData.formdata_to_object(data))
        } else if (Object.keys(data).length > 0) {
          request.url += '?' + BSData.object_to_body(data)
        } else if (typeof data === 'string' && data.length > 0) {
          request.url += '?' + BSData.object_to_body(BSData.json_to_object(data))
        }
        break
      case 'PUT':
      case 'DELETE':
      case 'PATCH':
        restype = restype === 'response' ? restype : 'status'
      case 'POST':
        switch (reqtype) {
          case 'json':
            request.headers.set('Content-Type', ContentTypes.JSON)
            if (data instanceof FormData) {
              request.body = BSData.object_to_json(BSData.formdata_to_object(data))
            } else if (Object.keys(data).length > 0) {
              request.body = BSData.object_to_json(data)
            } else if (typeof data === 'string' && data.length > 0) {
              request.body = data
            }
            break
          case 'formdata':
            // request.headers.set('Content-Type', ContentTypes.FORMDATA)
            if (data instanceof FormData) {
              request.body = data
            } else if (Object.keys(data).length > 0) {
              request.body = BSData.object_to_formdata(data)
            } else if (typeof data === 'string' && data.length > 0) {
              request.body = BSData.object_to_formdata(BSData.json_to_object(data))
            }
            break
          default:
            request.headers.set('Content-Type', ContentTypes.FORM)
            if (data instanceof FormData) {
              request.body = BSData.object_to_body(BSData.formdata_to_object(data))
            } else if (Object.keys(data).length > 0) {
              request.body = BSData.object_to_body(data)
            } else if (typeof data === 'string' && data.length > 0) {
              request.body = BSData.object_to_body(BSData.json_to_object(data))
            }
        }
        break
      case 'OPTIONS':
        restype = restype === 'response' ? restype : 'headers'
        break
    }
    
    restype = restype.toLowerCase()
    if (ResponseTypes.has(restype)) {
      request.responseType = restype.toUpperCase()
    } else {
      request.responseType = 'JSON'
    }
    
    if (cookies === '' || cookies === 'same' || cookies === 'same-origin' || cookies === 'default') {
      // request.credentials = 'same-origin'
    } else if (cookies === true || cookies === 'true' || cookies === 'include') {
      request.credentials = 'include'
    } else if (cookies === false || cookies === 'false' || cookies === 'none') {
      request.credentials = 'omit'
    }
    
    return doRequest(request)
  }
}

// Reference:
// https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Methods
const HttpMethods = new Set([
  'head', 'get', 'post', 'put', 'delete', 'options', 'patch'
])

const ResponseTypes = new Set([
  'json', 'text', 'blob', 'formdata', 'arraybuffer', 'response', 'headers', 'status'
])

const ContentTypes = {
  JSON: 'application/json; charset=utf-8 ',
  FORM: 'application/x-www-form-urlencoded; charset=UTF-8',
  FORMDATA: 'multipart/form-data'
}

export default BSFetch
```


| 参数     | 说明               |
|----------|-------------------|
| url      | 必要参数，表示请求目标地址 |
| method   | 必要参数，表示请求方法。若传入的值不合法，将会被设为`GET` |
| data?    | 可选参数，表示此次请求携带的数据。传入值应该为一个由`{key: value}`组成的对象（**value**的深度必须为 1），或者是前者类型对象的 **JSON** 形式字符串，或者是`FormData`实例（一般用于文件传输），数据会根据数据传输方式自动转换。默认值为`{}` |
| reqtype? | 可选参数，表示数据传输的方式，即最终请求头的`Content-Type`属性，有以下 3 个合法值，见下表，默认值为`''` |
| restype? | 可选参数，表示对于响应`response.ok === true`时的响应主体如何处理，有以下 8 个合法值，见下表，默认为`'json'` |
| cookies? | 可选参数，表示是否在跨域请求的情况下向其他域发送身份信息（包含**cookie**），有以下 3 种合法值，见下表，默认为 `''`  |
| headers? | 可选参数，表示请求头，传入值应该为一个由`{key: value}`组成的对象，默认为`{}` |
| debug?   | 可选参数，表示是否在控制台打印原始请求`Request`和原始响应`Response` |

| reqtype参数      | 说明                                                                                             |
|------------------|--------------------------------------------------------------------------------------------------|
| json             | 表示`application/json`，最终`data`会被转换成 **JSON** 字符串                                     |
| formdata         | 表示`multipart/form-data`，最终`data`会被转换成`FormData`实例                                    |
| `''`或其他任意值   | 表示`application/x-www-form-urlencoded`，最终`data`会被转换成`key1=value1&key2=value2`格式字符串 |

| restype参数 | 说明                                                                  |
|-------------|-----------------------------------------------------------------------|
| json        | 会识别成 **JSON** 字符串，并将其解析成对象返回                        |
| text        | 会识别成文本，返回响应主体文本                                        |
| blob        | 会识别成`Blob`对象，将其转换成`Blob`实例后返回                        |
| formdata    | 会被识别成`FormData`对象，将其转换成`FormData`实例后返回              |
| arraybuffer | 会被识别成`ArrayBuffer`对象，将其转换成`ArrayBuffer`实例后返回        |
| headers     | 直接返回响应头，即原始响应`response.headers`对象，为一个`Headers`实例 |
| response    | **忽略`response.ok`值**，直接返回原始响应`Response`实例               |
| status      | **忽略`response.ok`值**，直接返回原始响应`response.status`值          |

| cookie参数                                | 说明                |
|-------------------------------------------|--------------------|
| `''` `'same'` `'same-origin'` `'default'` | 最终请求`Request`的`credentials`属性将会被设为`'same-origin'`，表示只有当 **URL**与响应脚本同源才发送 |
| `true` `'true'` `'include'`           | 最终请求`Request`的`credentials`属性将会被设为`'include'`，表示不论是不是跨域的请求，总是发送 |
| `false` `'false'` `'omit'`            | 最终请求`Request`的`credentials`属性将会被设为`'omit'`，表示从不发送 |

#### 调用示例

```js
import BSFetch from 'https://static.ihint.me/BSFetch.js'

BSFetch.fetch('/get', 'get').then(json => {
	console.log(json)
})
```

## 5. 其他

#### 5.1 方法简写

由于 `BSFetch.fetch(url, method, {?})` 的第 2 个参数值为枚举量，所以可以全部单独提出来作为一个方法，以方便简化调用：

```js
class BSFetch() {
  static async head(url = '', {data = {}, reqtype = '', restype = 'headers', cookies = '', headers = {}, debug = false} = {}) {
    return this.fetch(url, 'HEAD', {data, reqtype, restype, cookies, headers, debug})
  }
  
  static async get(url = '', {data = {}, reqtype = '', restype = 'json', cookies = '', headers = {}, debug = false} = {}) {
    return this.fetch(url, 'GET', {data, reqtype, restype, cookies, headers, debug})
  }
  
  static async post(url = '', {data = {}, reqtype = '', restype = 'json', cookies = '', headers = {}, debug = false} = {}) {
    return this.fetch(url, 'POST', {data, reqtype, restype, cookies, headers, debug})
  }
  
  static async put(url = '', {data = {}, reqtype = '', restype = 'status', cookies = '', headers = {}, debug = false} = {}) {
    return this.fetch(url, 'PUT', {data, reqtype, restype, cookies, headers, debug})
  }
  
  static async delete(url = '', {data = {}, reqtype = '', restype = 'status', cookies = '', headers = {}, debug = false} = {}) {
    return this.fetch(url, 'DELETE', {data, reqtype, restype, cookies, headers, debug})
  }
  
  static async patch(url = '', {data = {}, reqtype = '', restype = 'status', cookies = '', headers = {}, debug = false} = {}) {
    return this.fetch(url, 'PATCH', {data, reqtype, restype, cookies, headers, debug})
  }
  
  static async options(url = '', {headers = {}, cookies = '', debug = false}) {
    return this.fetch(url, 'OPTIONS', {headers, cookies, debug})
	}
	
	......
}
```

#### 调用示例

```js
import BSFetch from 'https://static.ihint.me/BSFetch.js'

console.log(await BSFetch.post('/post', {
	data: new FormData(document.forms[0]),
	reqtype: 'json',
	restype: 'text',
	cookies: true
}))

BSFetch.head('/head').then(headers => {
	for (const entry of headers.entries()) {
		const [key, value] = entry
		console.log(`${key}: ${value}`)
	}
}).catch(e => {
	console.log(e.response)
})
```

#### 5.2 自动添加 API 接口前缀

有的接口可能前缀路径相同，只有最后路径不同，对此可以优化：

```js
class BSFetch {
  constructor({basepath = ''} = {}) {
    this.basepath = basepath || location.hostname
  }
  
  URL(request = '') {
    const basepath = this.basepath || location.hostname
    return `${this.basepath}${request}`
	}
	
  async head(url = '', {data = {}, reqtype = '', restype = 'headers', cookies = '', headers = {}, debug = false} = {}) {
    return BSFetch.fetch(this.URL(url), 'HEAD', {data, reqtype, restype, cookies, headers, debug})
  }
  
  async get(url = '', {data = {}, reqtype = '', restype = 'json', cookies = '', headers = {}, debug = false} = {}) {
    return BSFetch.fetch(this.URL(url), 'GET', {data, reqtype, restype, cookies, headers, debug})
  }
  
  async post(url = '', {data = {}, reqtype = '', restype = 'json', cookies = '', headers = {}, debug = false} = {}) {
    return BSFetch.fetch(this.URL(url), 'POST', {data, reqtype, restype, cookies, headers, debug})
  }
  
  async put(url = '', {data = {}, reqtype = '', restype = 'status', cookies = '', headers = {}, debug = false} = {}) {
    return BSFetch.fetch(this.URL(url), 'PUT', {data, reqtype, restype, cookies, headers, debug})
  }
  
  async delete(url = '', {data = {}, reqtype = '', restype = 'status', cookies = '', headers = {}, debug = false} = {}) {
    return BSFetch.fetch(this.URL(url), 'DELETE', {data, reqtype, restype, cookies, headers, debug})
  }
  
  async patch(url = '', {data = {}, reqtype = '', restype = 'status', cookies = '', headers = {}, debug = false} = {}) {
    return BSFetch.fetch(this.URL(url), 'PATCH', {data, reqtype, restype, cookies, headers, debug})
  }
  
  async options(url = '', {headers = {}, cookies = '', debug = false}) {
    return BSFetch.fetch(this.URL(url), 'OPTIONS', {headers, cookies, debug})
  }
  
  async fetch(url = '#', method = 'GET', {
    data = {}, reqtype = '', restype = 'json', cookies = '', headers = {}, debug = false
  } = {}) {
    return BSFetch.fetch(this.URL(url), method, {data, reqtype, restype, cookies, headers, debug})
  }
	
	......
}
```

| 参数      | 说明 |
|-----------|------|
| bathpath? | 可选参数，表示该实例化对象后续所有请求自动添加的前缀路径，若为空会被设为`location.hostname` |

**注意**：以上方法全部是非静态方法，需要实例化才能使用。

#### 调用示例

```js
import BSFetch from 'https://static.ihint.me/BSFetch.js'

const API = new BSFetch({
  basepath: '//api.example.com/v1/msg/'
})

BSFetch.get(API.URL('receive'))
API.post('send', {
	data: {
		msg: 'a message'
	}
})
```

#### 5.2 全局注册

为了让 **BSFetch** 可以在全局使用，可以添加一个注册方法：

```js
class BSFetch {
  static global() {
    window.BSFetch = BSFetch
  }
	
	......
}
```

#### 调用示例

```html
<button onclick="showPic()">showPic</button>
<img id="pic">
<script type="module">
	// 需要一个注册模块来调用 BSFetch 的全局注册方法
  import BSFetch from 'https://static.ihint.me/BSFetch.js'
  
  BSFetch.global()
</script>
<script>
  const showPic = () => {
    if (BSFetch) {
      BSFetch.get('data/image.png', {
        restype: 'blob'
      }).then(img => {
        const reader = new FileReader()
        reader.onload = () => {
          document.querySelector('#google').src = reader.result
        }
        reader.readAsDataURL(img)
      })
    } else {
      alert('BSFetch has not been registered')
    }
  }
</script>
```
