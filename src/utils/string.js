// 字符串处理工具

/**
 * 生成唯一ID
 * @returns {string} 唯一ID
 */
export const generateId = () => {
  return Date.now() + Math.random().toString(36).substring(2, 10)
}

/**
 * 截取字符串，超过长度显示省略号
 * @param {string} str - 原始字符串
 * @param {number} maxLength - 最大长度
 * @returns {string} 截取后的字符串
 */
export const truncate = (str, maxLength) => {
  if (!str || str.length <= maxLength) return str
  return str.substring(0, maxLength) + '...'
}

/**
 * 清理字符串中的特殊字符
 * @param {string} str - 原始字符串
 * @returns {string} 清理后的字符串
 */
export const cleanString = (str) => {
  return str.replace(/[^\w\s.,!?;:\-_]/g, '')
}

/**
 * 将字符串转换为驼峰命名
 * @param {string} str - 原始字符串
 * @returns {string} 驼峰命名字符串
 */
export const toCamelCase = (str) => {
  return str.replace(/[-_.\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '')
}

/**
 * 将字符串转换为标题命名
 * @param {string} str - 原始字符串
 * @returns {string} 标题命名字符串
 */
export const toTitleCase = (str) => {
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  })
}