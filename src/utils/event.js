// 事件处理工具

/**
 * 节流函数
 * @param {Function} func - 要执行的函数
 * @param {number} limit - 时间限制（毫秒）
 * @returns {Function} 节流后的函数
 */
export const throttle = (func, limit) => {
  let inThrottle
  return function(...args) {
    const context = this
    if (!inThrottle) {
      func.apply(context, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * 防抖函数
 * @param {Function} func - 要执行的函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
export const debounce = (func, wait) => {
  let timeout
  return function(...args) {
    const context = this
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(context, args), wait)
  }
}

/**
 * 添加事件监听器
 * @param {Element} element - 元素
 * @param {string} event - 事件名称
 * @param {Function} handler - 事件处理函数
 * @param {Object} [options] - 事件选项
 */
export const addEventListener = (element, event, handler, options = {}) => {
  element.addEventListener(event, handler, options)
}

/**
 * 移除事件监听器
 * @param {Element} element - 元素
 * @param {string} event - 事件名称
 * @param {Function} handler - 事件处理函数
 * @param {Object} [options] - 事件选项
 */
export const removeEventListener = (element, event, handler, options = {}) => {
  element.removeEventListener(event, handler, options)
}