/**
 * 基础API客户端 - 封装通用的HTTP请求逻辑
 */

import API_CONFIG from './config.js'

// 默认请求超时时间
const DEFAULT_TIMEOUT = 30000

// 基础错误处理
class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

/**
 * 基础API客户端类
 */
export class ApiClient {
  constructor(config = {}) {
    this.config = {
      baseUrl: API_CONFIG.url,
      timeout: API_CONFIG.timeout || DEFAULT_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      },
      ...config
    }
  }

  /**
   * 发送请求
   * @param {string} endpoint - API端点
   * @param {Object} options - 请求选项
   * @returns {Promise<any>} - 请求结果
   */
  async request(endpoint, options = {}) {
    const url = this._buildUrl(endpoint)
    const requestOptions = this._buildRequestOptions(options)
    
    try {
      // 发送请求
      const response = await fetch(url, requestOptions)
      
      // 处理响应
      return await this._handleResponse(response)
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new ApiError('请求超时', 408)
      }
      throw new ApiError(error.message, null, error)
    }
  }

  /**
   * GET请求
   * @param {string} endpoint - API端点
   * @param {Object} params - 查询参数
   * @param {Object} options - 额外选项
   * @returns {Promise<any>} - 请求结果
   */
  async get(endpoint, params = {}, options = {}) {
    const url = this._buildUrl(endpoint, params)
    return this.request(url, { method: 'GET', ...options })
  }

  /**
   * POST请求
   * @param {string} endpoint - API端点
   * @param {Object} data - 请求数据
   * @param {Object} options - 额外选项
   * @returns {Promise<any>} - 请求结果
   */
  async post(endpoint, data = {}, options = {}) {
    return this.request(endpoint, { method: 'POST', body: JSON.stringify(data), ...options })
  }

  /**
   * PUT请求
   * @param {string} endpoint - API端点
   * @param {Object} data - 请求数据
   * @param {Object} options - 额外选项
   * @returns {Promise<any>} - 请求结果
   */
  async put(endpoint, data = {}, options = {}) {
    return this.request(endpoint, { method: 'PUT', body: JSON.stringify(data), ...options })
  }

  /**
   * DELETE请求
   * @param {string} endpoint - API端点
   * @param {Object} options - 额外选项
   * @returns {Promise<any>} - 请求结果
   */
  async delete(endpoint, options = {}) {
    return this.request(endpoint, { method: 'DELETE', ...options })
  }

  /**
   * 构建URL
   * @param {string} endpoint - API端点
   * @param {Object} params - 查询参数
   * @returns {string} - 完整URL
   */
  _buildUrl(endpoint, params = {}) {
    const url = new URL(endpoint, this.config.baseUrl)
    
    // 添加查询参数
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        url.searchParams.append(key, value)
      }
    })
    
    return url.toString()
  }

  /**
   * 构建请求选项
   * @param {Object} options - 请求选项
   * @returns {Object} - 完整请求选项
   */
  _buildRequestOptions(options) {
    const { headers = {}, method = 'GET', body = null, ...rest } = options
    
    return {
      method,
      headers: {
        ...this.config.headers,
        ...headers
      },
      body,
      signal: AbortSignal.timeout(this.config.timeout),
      ...rest
    }
  }

  /**
   * 处理响应
   * @param {Response} response - HTTP响应
   * @returns {Promise<any>} - 解析后的响应数据
   */
  async _handleResponse(response) {
    let data
    
    try {
      data = await response.json()
    } catch (error) {
      // 如果响应不是JSON格式
      data = await response.text()
    }
    
    if (!response.ok) {
      throw new ApiError(
        data.error || `API请求失败: ${response.status} ${response.statusText}`,
        response.status,
        data
      )
    }
    
    return data
  }
}

// 创建默认API客户端实例
export const apiClient = new ApiClient()