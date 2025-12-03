// 环境配置管理

// 环境变量映射
const envVars = {
  // API配置
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/generate',
  API_TIMEOUT: import.meta.env.VITE_API_TIMEOUT || 30000,
  
  // DeepSeek API配置
  DEEPSEEK_API_KEY: import.meta.env.VITE_DEEPSEEK_API_KEY || '',
  
  // 应用配置
  APP_ENV: import.meta.env.VITE_APP_ENV || 'development',
  PORT: import.meta.env.VITE_PORT || 3000,
  
  // 日志配置
  LOG_LEVEL: import.meta.env.VITE_LOG_LEVEL || 'info'
}

/**
 * 获取环境变量值
 * @param {string} key - 环境变量键名
 * @param {*} defaultValue - 默认值
 * @returns {*} 环境变量值
 */
export const getEnv = (key, defaultValue = undefined) => {
  return envVars[key] ?? defaultValue
}

/**
 * 检查是否为开发环境
 * @returns {boolean} 是否为开发环境
 */
export const isDevelopment = () => {
  return getEnv('APP_ENV') === 'development'
}

/**
 * 检查是否为生产环境
 * @returns {boolean} 是否为生产环境
 */
export const isProduction = () => {
  return getEnv('APP_ENV') === 'production'
}

/**
 * 检查是否为测试环境
 * @returns {boolean} 是否为测试环境
 */
export const isTest = () => {
  return getEnv('APP_ENV') === 'test'
}

/**
 * 获取API配置
 * @returns {Object} API配置
 */
export const getApiConfig = () => {
  return {
    url: getEnv('API_URL'),
    timeout: getEnv('API_TIMEOUT'),
    deepseekApiKey: getEnv('DEEPSEEK_API_KEY')
  }
}