/**
 * Browser-Simple-DataHandler
 * @BlueSky
 *
 * Version Alpha, 0.1
 *
 * Last updated: 2018/8/6
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
}

export default BSData