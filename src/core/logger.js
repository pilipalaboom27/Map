/**
 * 统一日志系统
 * 替换所有 console.log，支持日志级别和生产环境控制
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4
}

class Logger {
  constructor() {
    this.level = import.meta.env.DEV ? LOG_LEVELS.DEBUG : LOG_LEVELS.INFO
    this.enabled = true
    this.history = []
    this.maxHistory = 100
  }

  /**
   * 设置日志级别
   * @param {string} level - 'debug' | 'info' | 'warn' | 'error' | 'none'
   */
  setLevel(level) {
    this.level = LOG_LEVELS[level.toUpperCase()] || LOG_LEVELS.INFO
  }

  /**
   * 启用/禁用日志
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this.enabled = enabled
  }

  /**
   * 记录日志
   * @private
   */
  _log(level, prefix, ...args) {
    if (!this.enabled || level < this.level) {
      return
    }

    const timestamp = new Date().toISOString()
    const message = `[${timestamp}] [${prefix}]`

    // 添加到历史记录
    this.history.push({
      timestamp,
      level: prefix,
      message: args.join(' '),
      data: args
    })

    // 限制历史记录大小
    if (this.history.length > this.maxHistory) {
      this.history.shift()
    }

    // 输出到控制台
    switch (prefix) {
      case 'DEBUG':
        console.debug(message, ...args)
        break
      case 'INFO':
        console.info(message, ...args)
        break
      case 'WARN':
        console.warn(message, ...args)
        break
      case 'ERROR':
        console.error(message, ...args)
        break
      default:
        console.log(message, ...args)
    }
  }

  debug(...args) {
    this._log(LOG_LEVELS.DEBUG, 'DEBUG', ...args)
  }

  info(...args) {
    this._log(LOG_LEVELS.INFO, 'INFO', ...args)
  }

  warn(...args) {
    this._log(LOG_LEVELS.WARN, 'WARN', ...args)
  }

  error(...args) {
    this._log(LOG_LEVELS.ERROR, 'ERROR', ...args)
  }

  /**
   * 获取历史记录
   * @param {number} limit - 限制数量
   */
  getHistory(limit = 50) {
    return this.history.slice(-limit)
  }

  /**
   * 清空历史记录
   */
  clearHistory() {
    this.history = []
  }
}

// 单例模式
export const logger = new Logger()

// Vue composable
export function useLogger(prefix = '') {
  return {
    debug: (...args) => logger.debug(prefix ? `[${prefix}]` : '', ...args),
    info: (...args) => logger.info(prefix ? `[${prefix}]` : '', ...args),
    warn: (...args) => logger.warn(prefix ? `[${prefix}]` : '', ...args),
    error: (...args) => logger.error(prefix ? `[${prefix}]` : '', ...args)
  }
}

