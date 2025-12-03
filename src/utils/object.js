// 对象处理工具

/**
 * 深拷贝对象
 * @param {Object} obj - 原始对象
 * @returns {Object} 深拷贝后的对象
 */
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj))
}

/**
 * 合并对象
 * @param {Object} target - 目标对象
 * @param {...Object} sources - 源对象
 * @returns {Object} 合并后的对象
 */
export const merge = (target, ...sources) => {
  if (!sources.length) return target
  const source = sources.shift()

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} })
        merge(target[key], source[key])
      } else {
        Object.assign(target, { [key]: source[key] })
      }
    }
  }

  return merge(target, ...sources)
}

/**
 * 检查值是否为对象
 * @param {*} value - 要检查的值
 * @returns {boolean} 是否为对象
 */
export const isObject = (value) => {
  return value && typeof value === 'object' && value.constructor === Object
}

/**
 * 获取对象的指定路径的值
 * @param {Object} obj - 目标对象
 * @param {string} path - 路径字符串，如 'a.b.c'
 * @param {*} defaultValue - 默认值
 * @returns {*} 路径对应的值
 */
export const get = (obj, path, defaultValue = undefined) => {
  const keys = path.split('.')
  let result = obj

  for (const key of keys) {
    if (result === null || result === undefined) {
      return defaultValue
    }
    result = result[key]
  }

  return result === undefined ? defaultValue : result
}

/**
 * 设置对象的指定路径的值
 * @param {Object} obj - 目标对象
 * @param {string} path - 路径字符串，如 'a.b.c'
 * @param {*} value - 要设置的值
 * @returns {Object} 更新后的对象
 */
export const set = (obj, path, value) => {
  const keys = path.split('.')
  let current = obj

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (!isObject(current[key])) {
      current[key] = {}
    }
    current = current[key]
  }

  current[keys[keys.length - 1]] = value
  return obj
}

/**
 * 删除对象的指定路径的属性
 * @param {Object} obj - 目标对象
 * @param {string} path - 路径字符串，如 'a.b.c'
 * @returns {boolean} 是否删除成功
 */
export const unset = (obj, path) => {
  const keys = path.split('.')
  let current = obj

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (!isObject(current[key])) {
      return false
    }
    current = current[key]
  }

  const lastKey = keys[keys.length - 1]
  if (current.hasOwnProperty(lastKey)) {
    delete current[lastKey]
    return true
  }

  return false
}