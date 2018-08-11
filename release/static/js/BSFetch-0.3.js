/**
 * Browser-Simple-Fetch
 * @BlueSky
 *
 * Version Alpha, 0.3
 *
 * Last updated: 2018/8/7
 *
 */
import BSData from './BSData-0.1.js'

class Request {
  constructor(url = '', {} = {}) {
    this.url = url
    this.config = {}
    
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
}

class BSFetch {
  static init({basepath = '', port = 80} = {}) {
    BSFetch.basepath = basepath
    BSFetch.port = port
  }
  
  static async get(url = '', {data = {}, reqtype = 'body', restype = 'json', cookies = false} = {}) {
    return this.fetch(url, 'GET', {data, reqtype, restype, cookies})
  }
  
  static async post(url = '', {data = {}, reqtype = 'body', restype = 'json', cookies = false} = {}) {
    return this.fetch(url, 'POST', {data, reqtype, restype, cookies})
  }
  
  static async fetch(url = '', method = '', {
    data = {}, reqtype = 'body', restype = 'json', cookies = false
  } = {}) {
    const request = new Request(url)
    method = method.toLowerCase()
    if (fetchMethods.has(method)) {
      request.method = method.toUpperCase()
    } else {
      request.method = 'GET'
    }
    
    if (request.method === 'GET') {
      request.url += '?' + BSData.object_to_body(data)
    } else {
      if (reqtype === 'json') {
        request.body = BSData.object_to_json(data)
        request.headers = {
          'Content-Type': 'application/json'
        }
      } else {
        request.body = BSData.object_to_body(data)
        request.headers = {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    }
    
    if (restype) {
      restype = restype.toLowerCase()
      const responseTypes = new Set([
        'json', 'text', 'blob'
      ])
      if (responseTypes.has(restype)) {
        request.responseType = restype.toUpperCase()
      } else {
        request.responseType = 'JSON'
      }
    } else {
      request.responseType = 'JSON'
    }
    
    if (cookies) {
      request.credentials = 'include'
    }
    
    try {
      return doRequest(request)
    } catch (e) {
      throw e
    }
  }
  
  static URL(request = '') {
    BSFetch.basepath = this.basepath || location.hostname || ''
    BSFetch.port = this.port || location.port || '80'
    return `//${BSFetch.basepath}:${BSFetch.port}/${request}`
  }
}

const doRequest = (request = new Request()) => {
  return new Promise((resolve, reject) => {
    fetch(
        request.url, request.config
    ).then(
        response => {
          if (!response.ok) {
            throw new Error(`cannot fetch resource: ${response.status} - ${response.statusText}`)
          }
          switch (request.responseType) {
            case 'JSON':
              return response.json()
            case 'TEXT':
              return response.text()
            case 'BLOB':
              return response.blob()
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

// Reference: https://fetch.spec.whatwg.org/#methods
const fetchMethods = new Set([
  'delete', 'get', 'head', 'options', 'post', 'put'
])

export default BSFetch