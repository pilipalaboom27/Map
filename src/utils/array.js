// 数组处理工具

/**
 * 从数组中查找唯一值
 * @param {Array} arr - 原始数组
 * @param {string} [key] - 用于比较的键名
 * @returns {Array} 唯一值数组
 */
export const unique = (arr, key) => {
  if (!key) {
    return [...new Set(arr)]
  }
  const seen = new Set()
  return arr.filter(item => {
    const value = item[key]
    if (seen.has(value)) {
      return false
    }
    seen.add(value)
    return true
  })
}

/**
 * 深拷贝数组
 * @param {Array} arr - 原始数组
 * @returns {Array} 深拷贝后的数组
 */
export const deepClone = (arr) => {
  return JSON.parse(JSON.stringify(arr))
}

/**
 * 打乱数组顺序
 * @param {Array} arr - 原始数组
 * @returns {Array} 打乱顺序后的数组
 */
export const shuffle = (arr) => {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/**
 * 按指定字段排序数组
 * @param {Array} arr - 原始数组
 * @param {string} field - 排序字段
 * @param {boolean} [ascending=true] - 是否升序
 * @returns {Array} 排序后的数组
 */
export const sortBy = (arr, field, ascending = true) => {
  return [...arr].sort((a, b) => {
    if (a[field] < b[field]) return ascending ? -1 : 1
    if (a[field] > b[field]) return ascending ? 1 : -1
    return 0
  })
}

/**
 * 查找数组中符合条件的第一个元素的索引
 * @param {Array} arr - 原始数组
 * @param {Function} predicate - 条件函数
 * @returns {number} 元素索引，未找到返回-1
 */
export const findIndex = (arr, predicate) => {
  for (let i = 0; i < arr.length; i++) {
    if (predicate(arr[i], i, arr)) {
      return i
    }
  }
  return -1
}

/**
 * 批量删除数组中的元素
 * @param {Array} arr - 原始数组
 * @param {Function} predicate - 条件函数
 * @returns {Array} 删除后的数组
 */
export const remove = (arr, predicate) => {
  const result = []
  for (let i = 0; i < arr.length; i++) {
    if (!predicate(arr[i], i, arr)) {
      result.push(arr[i])
    }
  }
  return result
}