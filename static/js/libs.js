/**
 * iHint-Pages Javascript
 * @BlueSky
 * Version Alpha, 0.5
 * https://github.com/BlueSky-07/bluesky-07.github.io
 */

// =============================================================================

/*
 * JavaScript MD5
 * https://github.com/blueimp/JavaScript-MD5
 *
 * Copyright 2011, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * https://opensource.org/licenses/MIT
 *
 * Based on
 * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
 * Digest Algorithm, as defined in RFC 1321.
 * Version 2.2 Copyright (C) Paul Johnston 1999 - 2009
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for more info.
 */

/*
* Add integers, wrapping at 2^32. This uses 16-bit operations internally
* to work around bugs in some JS interpreters.
*/
function safeAdd(x, y) {
  var lsw = (x & 0xffff) + (y & 0xffff)
  var msw = (x >> 16) + (y >> 16) + (lsw >> 16)
  return (msw << 16) | (lsw & 0xffff)
}

/*
* Bitwise rotate a 32-bit number to the left.
*/
function bitRotateLeft(num, cnt) {
  return (num << cnt) | (num >>> (32 - cnt))
}

/*
* These functions implement the four basic operations the algorithm uses.
*/
function md5cmn(q, a, b, x, s, t) {
  return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b)
}

function md5ff(a, b, c, d, x, s, t) {
  return md5cmn((b & c) | (~b & d), a, b, x, s, t)
}

function md5gg(a, b, c, d, x, s, t) {
  return md5cmn((b & d) | (c & ~d), a, b, x, s, t)
}

function md5hh(a, b, c, d, x, s, t) {
  return md5cmn(b ^ c ^ d, a, b, x, s, t)
}

function md5ii(a, b, c, d, x, s, t) {
  return md5cmn(c ^ (b | ~d), a, b, x, s, t)
}

/*
* Calculate the MD5 of an array of little-endian words, and a bit length.
*/
function binlMD5(x, len) {
  /* append padding */
  x[len >> 5] |= 0x80 << (len % 32)
  x[((len + 64) >>> 9 << 4) + 14] = len
  
  var i
  var olda
  var oldb
  var oldc
  var oldd
  var a = 1732584193
  var b = -271733879
  var c = -1732584194
  var d = 271733878
  
  for (i = 0; i < x.length; i += 16) {
    olda = a
    oldb = b
    oldc = c
    oldd = d
    
    a = md5ff(a, b, c, d, x[i], 7, -680876936)
    d = md5ff(d, a, b, c, x[i + 1], 12, -389564586)
    c = md5ff(c, d, a, b, x[i + 2], 17, 606105819)
    b = md5ff(b, c, d, a, x[i + 3], 22, -1044525330)
    a = md5ff(a, b, c, d, x[i + 4], 7, -176418897)
    d = md5ff(d, a, b, c, x[i + 5], 12, 1200080426)
    c = md5ff(c, d, a, b, x[i + 6], 17, -1473231341)
    b = md5ff(b, c, d, a, x[i + 7], 22, -45705983)
    a = md5ff(a, b, c, d, x[i + 8], 7, 1770035416)
    d = md5ff(d, a, b, c, x[i + 9], 12, -1958414417)
    c = md5ff(c, d, a, b, x[i + 10], 17, -42063)
    b = md5ff(b, c, d, a, x[i + 11], 22, -1990404162)
    a = md5ff(a, b, c, d, x[i + 12], 7, 1804603682)
    d = md5ff(d, a, b, c, x[i + 13], 12, -40341101)
    c = md5ff(c, d, a, b, x[i + 14], 17, -1502002290)
    b = md5ff(b, c, d, a, x[i + 15], 22, 1236535329)
    
    a = md5gg(a, b, c, d, x[i + 1], 5, -165796510)
    d = md5gg(d, a, b, c, x[i + 6], 9, -1069501632)
    c = md5gg(c, d, a, b, x[i + 11], 14, 643717713)
    b = md5gg(b, c, d, a, x[i], 20, -373897302)
    a = md5gg(a, b, c, d, x[i + 5], 5, -701558691)
    d = md5gg(d, a, b, c, x[i + 10], 9, 38016083)
    c = md5gg(c, d, a, b, x[i + 15], 14, -660478335)
    b = md5gg(b, c, d, a, x[i + 4], 20, -405537848)
    a = md5gg(a, b, c, d, x[i + 9], 5, 568446438)
    d = md5gg(d, a, b, c, x[i + 14], 9, -1019803690)
    c = md5gg(c, d, a, b, x[i + 3], 14, -187363961)
    b = md5gg(b, c, d, a, x[i + 8], 20, 1163531501)
    a = md5gg(a, b, c, d, x[i + 13], 5, -1444681467)
    d = md5gg(d, a, b, c, x[i + 2], 9, -51403784)
    c = md5gg(c, d, a, b, x[i + 7], 14, 1735328473)
    b = md5gg(b, c, d, a, x[i + 12], 20, -1926607734)
    
    a = md5hh(a, b, c, d, x[i + 5], 4, -378558)
    d = md5hh(d, a, b, c, x[i + 8], 11, -2022574463)
    c = md5hh(c, d, a, b, x[i + 11], 16, 1839030562)
    b = md5hh(b, c, d, a, x[i + 14], 23, -35309556)
    a = md5hh(a, b, c, d, x[i + 1], 4, -1530992060)
    d = md5hh(d, a, b, c, x[i + 4], 11, 1272893353)
    c = md5hh(c, d, a, b, x[i + 7], 16, -155497632)
    b = md5hh(b, c, d, a, x[i + 10], 23, -1094730640)
    a = md5hh(a, b, c, d, x[i + 13], 4, 681279174)
    d = md5hh(d, a, b, c, x[i], 11, -358537222)
    c = md5hh(c, d, a, b, x[i + 3], 16, -722521979)
    b = md5hh(b, c, d, a, x[i + 6], 23, 76029189)
    a = md5hh(a, b, c, d, x[i + 9], 4, -640364487)
    d = md5hh(d, a, b, c, x[i + 12], 11, -421815835)
    c = md5hh(c, d, a, b, x[i + 15], 16, 530742520)
    b = md5hh(b, c, d, a, x[i + 2], 23, -995338651)
    
    a = md5ii(a, b, c, d, x[i], 6, -198630844)
    d = md5ii(d, a, b, c, x[i + 7], 10, 1126891415)
    c = md5ii(c, d, a, b, x[i + 14], 15, -1416354905)
    b = md5ii(b, c, d, a, x[i + 5], 21, -57434055)
    a = md5ii(a, b, c, d, x[i + 12], 6, 1700485571)
    d = md5ii(d, a, b, c, x[i + 3], 10, -1894986606)
    c = md5ii(c, d, a, b, x[i + 10], 15, -1051523)
    b = md5ii(b, c, d, a, x[i + 1], 21, -2054922799)
    a = md5ii(a, b, c, d, x[i + 8], 6, 1873313359)
    d = md5ii(d, a, b, c, x[i + 15], 10, -30611744)
    c = md5ii(c, d, a, b, x[i + 6], 15, -1560198380)
    b = md5ii(b, c, d, a, x[i + 13], 21, 1309151649)
    a = md5ii(a, b, c, d, x[i + 4], 6, -145523070)
    d = md5ii(d, a, b, c, x[i + 11], 10, -1120210379)
    c = md5ii(c, d, a, b, x[i + 2], 15, 718787259)
    b = md5ii(b, c, d, a, x[i + 9], 21, -343485551)
    
    a = safeAdd(a, olda)
    b = safeAdd(b, oldb)
    c = safeAdd(c, oldc)
    d = safeAdd(d, oldd)
  }
  return [a, b, c, d]
}

/*
* Convert an array of little-endian words to a string
*/
function binl2rstr(input) {
  var i
  var output = ''
  var length32 = input.length * 32
  for (i = 0; i < length32; i += 8) {
    output += String.fromCharCode((input[i >> 5] >>> (i % 32)) & 0xff)
  }
  return output
}

/*
* Convert a raw string to an array of little-endian words
* Characters >255 have their high-byte silently ignored.
*/
function rstr2binl(input) {
  var i
  var output = []
  output[(input.length >> 2) - 1] = undefined
  for (i = 0; i < output.length; i += 1) {
    output[i] = 0
  }
  var length8 = input.length * 8
  for (i = 0; i < length8; i += 8) {
    output[i >> 5] |= (input.charCodeAt(i / 8) & 0xff) << (i % 32)
  }
  return output
}

/*
* Calculate the MD5 of a raw string
*/
function rstrMD5(s) {
  return binl2rstr(binlMD5(rstr2binl(s), s.length * 8))
}

/*
* Calculate the HMAC-MD5, of a key and some data (raw strings)
*/
function rstrHMACMD5(key, data) {
  var i
  var bkey = rstr2binl(key)
  var ipad = []
  var opad = []
  var hash
  ipad[15] = opad[15] = undefined
  if (bkey.length > 16) {
    bkey = binlMD5(bkey, key.length * 8)
  }
  for (i = 0; i < 16; i += 1) {
    ipad[i] = bkey[i] ^ 0x36363636
    opad[i] = bkey[i] ^ 0x5c5c5c5c
  }
  hash = binlMD5(ipad.concat(rstr2binl(data)), 512 + data.length * 8)
  return binl2rstr(binlMD5(opad.concat(hash), 512 + 128))
}

/*
* Convert a raw string to a hex string
*/
function rstr2hex(input) {
  var hexTab = '0123456789abcdef'
  var output = ''
  var x
  var i
  for (i = 0; i < input.length; i += 1) {
    x = input.charCodeAt(i)
    output += hexTab.charAt((x >>> 4) & 0x0f) + hexTab.charAt(x & 0x0f)
  }
  return output
}

/*
* Encode a string as utf-8
*/
function str2rstrUTF8(input) {
  return unescape(encodeURIComponent(input))
}

/*
* Take string arguments and return either raw or hex encoded strings
*/
function rawMD5(s) {
  return rstrMD5(str2rstrUTF8(s))
}

function hexMD5(s) {
  return rstr2hex(rawMD5(s))
}

function rawHMACMD5(k, d) {
  return rstrHMACMD5(str2rstrUTF8(k), str2rstrUTF8(d))
}

function hexHMACMD5(k, d) {
  return rstr2hex(rawHMACMD5(k, d))
}

function md5(string, key, raw) {
  if (!key) {
    if (!raw) {
      return hexMD5(string)
    }
    return rawMD5(string)
  }
  if (!raw) {
    return hexHMACMD5(key, string)
  }
  return rawHMACMD5(key, string)
}

// =============================================================================

/**
 * Browser-Simple-DataHandler
 * @BlueSky
 *
 * Version Alpha, 0.2
 *
 * Last updated: 2018/8/13
 *
 */

class BSData {
  static object_to_json(data = {}) {
    return JSON.stringify(data)
  }
  
  static json_to_object(json_string = '') {
    return JSON.parse(json_string)
  }
  
  static object_to_body(data = {}) {
    let res = ''
    Object.entries(data)
        .forEach(
            ([key, value]) => {
              res += `&${key}=${value}`
            }
        )
    return res.slice(1)
  }
  
  static body_to_object(body_string = '') {
    const data = {}
    body_string
        .split('&')
        .map(
            i => i.split('=')
        )
        .forEach(
            ([key, value]) => {
              key = decodeURI(key)
              value = decodeURI(value)
              data[key] = value
            }
        )
    delete data['']
    return data
  }
  
  static formdata_to_object(formdata = new FormData()) {
    if (formdata instanceof FormData) {
      const data = {}
      for (const entry of formdata.entries()) {
        const [key, value] = entry
        data[key] = value
      }
      return data
    } else {
      throw new Error('arg must be an instance of FormData')
    }
  }
  
  static object_to_formdata(data = {}) {
    const formdata = new FormData()
    Object.entries(data)
        .forEach(
            ([key, value]) => {
              formdata.append(key, value)
            }
        )
    return formdata
  }
}

// =============================================================================

/**
 * Browser-Simple-Fetch
 * @BlueSky
 *
 * Version Alpha, 1.1
 *
 * Last updated: 2018/8/14
 *
 */
import BSData from './BSData-0.2.js'

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

class BSFetch {
  constructor({basepath = ''} = {}) {
    this.basepath = basepath || location.hostname
  }
  
  static global() {
    window.BSFetch = BSFetch
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

// Reference:
// https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Methods
const HttpMethods = new Set([
  'head', 'get', 'post', 'put', 'delete', 'options', 'patch'
])

const ResponseTypes = new Set([
  'json', 'text', 'blob', 'formdata', 'arraybuffer', 'response', 'headers', 'status'
])

const ContentTypes = {
  JSON: 'application/json; charset=utf-8',
  FORM: 'application/x-www-form-urlencoded; charset=UTF-8',
  FORMDATA: 'multipart/form-data'
}

// =============================================================================

const $ = document.querySelector.bind(document)
const $$ = document.querySelectorAll.bind(document)

if (location.pathname.endsWith('index.html')) {
	location.href = `${location.pathname.slice(0, 0 - ('index.html').length)}${location.search}`
	throw new Error('redirecting ...')
} else if (!location.search) {
	location.href = `?index`
	throw new Error('redirecting to index page')
}

BSXml.start(['loading', 'footer'])

const json = location.search.slice(1)
BSFetch.get(`articles/${json}.json?${new Date().getTime()}`)
	.then(
		article => {
			BSXml.start(['article'], {
				dataset: {
					article
				},
				next() {
					$('#loading').remove()
					BSFetch.get(`articles/${$('#content').getAttribute('url')}.md?${new Date().getTime()}`, {
						restype: 'text'
					}).then(
						md => {
							Page.load(md)
						}
					).catch(e => {
						$('#content').innerHTML = '<center><h2>Oops! Try refresh</h2></center>'
						throw e
					})
					const banner_link = $('#header').getAttribute('url')
					if (banner_link) {
						BSFetch.get(banner_link, {
							restype: 'blob'
						}).then(
							img => {
								// hide image loading process
								Page.set_banner(img)
							}
						).catch(e => {
							throw e
						})
					}
					Animate.init()
				}
			})
		})
	.catch(
		e => {
			$('#loading').innerHTML = 'Page Not Found'
			throw e
		}
	)

class Page {
	static load(md) {
		// set title
		const title = $('#title').innerHTML
		document.title = `${title} | iHint`

		// write md
		$('#content').innerHTML = marked(md)

		// additional actions on the image
		new Array().forEach.call(
			$$('img'),
			image => {
				// add event of click to preview
				image.addEventListener(
					'click', () => {
						window.open(image.getAttribute('src'))
					}
				)

				// modify size
				// support setting the size of a image by the format of:
				//
				//    ![alt ={width}x{height}](url)
				//
				// Example:  ![alt =100x100](url)
				// Note:
				// 1. width and height must be an integer
				// 2. size setting must at the end of [...]
				const size = (image.alt.match(/ =[\d]+x[\d]+$/) || [])[0]
				if (size) {
					image.alt = image.alt.replace(/ =[\d]+x[\d]+$/, '')
					const [width, height] = size.slice(2).split('x')
					image.width = width
					image.height = height
				}
			}
		)

		// highlight code blocks
		new Array().forEach.call(
			$$('pre code'),
			code => {
				hljs.highlightBlock(code)
			}
		)

		// jump to the specified chapter through #?
		if (location.hash) {
			setTimeout(
				() => {
					location.href = location.href
				},
				1000
			);
		}
	}

	static set_banner(blob) {
		const reader = new FileReader();
		reader.onload = e => {
			// hide image loading process
			$('#header').style.backgroundImage = `url('${e.target.result}')`
		}
		reader.readAsDataURL(blob);
	}
}

class Animate {
	static init() {
		Animate.header = $('.header-container')
		Animate.position = window.scrollY === 0 ? 'top' : 'content'
		Animate.positionY = [0, 0]
		Animate.scroll()
		Animate.wheel()
	}

	// when desktop broswer try to get up but already at the top
	// show header
	static wheel() {
		window.addEventListener('wheel', e => {
			if (window.scrollY === 0 && e.deltaY < 0 && Animate.position === 'top') {
				if (header.classList.length === 1) {
					return
				}
				header.classList.remove('header-out')
				header.classList.add('header-in')
				Animate.position = 'top'
			}
		})
	}

	// https://developer.mozilla.org/zh-CN/docs/Web/Events/scroll
	static scroll() {
		Animate.ticking = false
		window.addEventListener('scroll', e => {
			Animate.positionY = [Animate.positionY[1], window.scrollY]
			if (!Animate.ticking) {
				// optimize for page re-rendering
				// https://developer.mozilla.org/zh-CN/docs/Web/API/Window/requestAnimationFrame
				window.requestAnimationFrame(() => {
					const [from, to] = Animate.positionY
					if (from === 0 && to > from && Animate.position === 'top') {
						// when all platforms scroll down
						// hide header
						header.classList.remove('header-in')
						header.classList.add('header-out')
						Animate.position = 'content'
					} else if (to === 0 && Animate.position === 'content') {
						// when desktop broswer back to the top
						// do nothing
						Animate.position = 'top'
					} else if (to > 0 && from > 0) {
						// when desktop broswer not at the top
						// do nothing
						Animate.position = 'content'
					} else if (from < 0 && to < 0 && Animate.position === 'top') {
						// when mobile safari bounce back from above of the top
						// show header
						header.classList.remove('header-out')
						header.classList.add('header-in')
						Animate.position = 'content'
					}
					Animate.ticking = false
				})
			}
			Animate.ticking = true
		})
	}
}