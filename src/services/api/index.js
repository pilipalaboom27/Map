import API_CONFIG, { getMergedApiConfig } from './config.js'
import { parseJSONConceptResponse, parseTextToConcepts } from './parser.js'
import { useLogger } from '@/core/logger.js'

const logger = useLogger('API')

// 获取知识
export const fetchKnowledge = async (topic, existingKnowledge, path = []) => {
  try {
    const cfg = getMergedApiConfig()
    if (cfg.url) {
      const requestBody = {
        topic: topic,
        path: path,
        existing_knowledge: existingKnowledge,
        // 传递模型参数给后端
        model: cfg.model,
        temperature: cfg.temperature,
        max_tokens: cfg.maxTokens
      }
      
      // 如果用户提供了API Key，传递给后端
      if (cfg.apiKey) {
        requestBody.api_key = cfg.apiKey
      }
      
      const headers = {
        'Content-Type': 'application/json'
      }

      const response = await fetch(cfg.url, {
        method: cfg.method || 'POST',
        headers: {
          ...headers
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(cfg.timeout || 30000)
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        logger.error('API请求失败:', errorData)
        throw new Error(errorData.error || `API请求失败: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (data.content) {
        // 首先尝试JSON格式
        const jsonResult = parseJSONConceptResponse(data.content, topic)
        if (jsonResult) {
          return jsonResult
        }
        
        // 如果JSON解析失败，尝试文本格式
        const textResult = parseTextToConcepts(data.content, topic)
        return textResult
      } else {
        logger.error('服务器返回格式错误：缺少content字段')
        throw new Error('服务器返回格式错误：缺少content字段')
      }
    } else {
      throw new Error('API URL 未配置')
    }
  } catch (error) {
    logger.error('API调用失败:', error)
    throw error
  }
}

/**
 * 预加载知识（后台请求，不阻塞用户操作）
 * @param {string} topic - 主题
 * @param {Object} existingKnowledge - 现有知识
 * @param {Array} path - 路径
 * @returns {Promise<Object|null>} 知识结果
 */
export const preloadKnowledge = async (topic, existingKnowledge, path = []) => {
  try {
    const cfg = getMergedApiConfig()
    if (cfg.url) {
      const requestBody = {
        topic: topic,
        path: path,
        existing_knowledge: existingKnowledge,
        model: cfg.model,
        temperature: cfg.temperature,
        max_tokens: cfg.maxTokens
      }
      
      // 如果用户提供了API Key，传递给后端
      if (cfg.apiKey) {
        requestBody.api_key = cfg.apiKey
      }
      
      // 预加载请求使用较短的超时时间，避免长时间占用连接
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 20000) // 20秒超时
      
      try {
        const headers = {
          'Content-Type': 'application/json'
        }

        const response = await fetch(cfg.url, {
          method: cfg.method || 'POST',
          headers: {
            ...headers
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (!response.ok) {
          return null // 预加载失败，静默返回null
        }
        
        const data = await response.json()
        
        if (data.content) {
          // 首先尝试JSON格式
          const jsonResult = parseJSONConceptResponse(data.content, topic)
          if (jsonResult) {
            return jsonResult
          }
          
          // 如果JSON解析失败，尝试文本格式
          return parseTextToConcepts(data.content, topic)
        }
        
        return null
      } catch (fetchError) {
        clearTimeout(timeoutId)
        // 网络错误或超时，静默处理
        return null
      }
    }
    return null
  } catch (error) {
    // 预加载失败不影响用户体验，静默处理
    return null
  }
}

/**
 * 生成 Python 应用案例代码
 * @param {string} topic - 节点主题
 * @param {Object} context - 节点上下文（summary, concepts）
 * @returns {Promise<Object>} 生成的代码
 */
export const generateCodeExample = async (topic, context) => {
  try {
    const cfg = getMergedApiConfig()
    if (!cfg.url) {
      throw new Error('API URL 未配置')
    }

    if (!topic) {
      throw new Error('主题不能为空')
    }

    const requestBody = {
      topic: topic,
      context: context || {},
      model: cfg.model,
      temperature: cfg.temperature,
      max_tokens: cfg.maxTokens
    }

    // 如果用户提供了API Key，传递给后端
    if (cfg.apiKey) {
      requestBody.api_key = cfg.apiKey
    }

    const headers = {
      'Content-Type': 'application/json'
    }

    // 构建 API URL（后端路由是 /api/generate-code-example）
    let apiUrl = cfg.url
    if (apiUrl.includes('/api/generate')) {
      apiUrl = apiUrl.replace('/api/generate', '/api/generate-code-example')
    } else if (apiUrl.includes('/generate')) {
      apiUrl = apiUrl.replace('/generate', '/generate-code-example')
    } else if (apiUrl.endsWith('/api')) {
      apiUrl = apiUrl + '/generate-code-example'
    } else {
      // 如果 URL 格式不标准，尝试添加 /api/generate-code-example
      const baseUrl = apiUrl.replace(/\/api\/.*$/, '').replace(/\/$/, '')
      apiUrl = baseUrl + '/api/generate-code-example'
    }

    logger.debug('代码生成请求:', {
      topic,
      hasContext: !!context,
      conceptsCount: context?.concepts?.length || 0
    })

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(cfg.timeout || 30000)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      logger.error('代码生成请求失败:', errorData)
      throw new Error(errorData.error || `API请求失败: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    if (data.content) {
      logger.debug('代码生成响应成功')
      return {
        content: data.content,
        model: data.model || cfg.model
      }
    } else {
      logger.error('服务器返回格式错误：缺少content字段')
      throw new Error('服务器返回格式错误：缺少content字段')
    }
  } catch (error) {
    logger.error('代码生成调用失败:', error)
    throw error
  }
}

/**
 * AI 深度追问
 * @param {string} topic - 节点主题
 * @param {Object} context - 节点上下文（summary, concepts）
 * @param {string} question - 用户问题
 * @param {Array} conversationHistory - 对话历史（可选）
 * @returns {Promise<Object>} AI 响应
 */
export const askAI = async (topic, context, question, conversationHistory = []) => {
  try {
    const cfg = getMergedApiConfig()
    if (!cfg.url) {
      throw new Error('API URL 未配置')
    }

    if (!topic || !question) {
      throw new Error('主题和问题不能为空')
    }

    const requestBody = {
      topic: topic,
      context: context || {},
      question: question,
      conversation_history: conversationHistory,
      model: cfg.model,
      temperature: cfg.temperature,
      max_tokens: cfg.maxTokens
    }

    // 如果用户提供了API Key，传递给后端
    if (cfg.apiKey) {
      requestBody.api_key = cfg.apiKey
    }

    const headers = {
      'Content-Type': 'application/json'
    }

    // 构建 API URL（后端路由是 /api/ask）
    let apiUrl = cfg.url
    if (apiUrl.includes('/api/generate')) {
      apiUrl = apiUrl.replace('/api/generate', '/api/ask')
    } else if (apiUrl.includes('/generate')) {
      apiUrl = apiUrl.replace('/generate', '/ask')
    } else if (apiUrl.endsWith('/api')) {
      apiUrl = apiUrl + '/ask'
    } else {
      // 如果 URL 格式不标准，尝试添加 /api/ask
      const baseUrl = apiUrl.replace(/\/api\/.*$/, '').replace(/\/$/, '')
      apiUrl = baseUrl + '/api/ask'
    }

    logger.debug('AI 追问请求:', {
      topic,
      question: question.substring(0, 50) + '...',
      historyLength: conversationHistory.length
    })

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(cfg.timeout || 30000)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      logger.error('AI 追问请求失败:', errorData)
      throw new Error(errorData.error || `API请求失败: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    if (data.content) {
      logger.debug('AI 追问响应成功')
      return {
        content: data.content,
        model: data.model || cfg.model,
        usage: data.usage || {}
      }
    } else {
      logger.error('服务器返回格式错误：缺少content字段')
      throw new Error('服务器返回格式错误：缺少content字段')
    }
  } catch (error) {
    logger.error('AI 追问调用失败:', error)
    throw error
  }
}

// 健康检查
export const healthCheck = async () => {
  try {
    if (!API_CONFIG.url) {
      throw new Error('API URL 未配置')
    }
    
    const response = await fetch(API_CONFIG.url.replace('/api/generate', '/health'), {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    })
    
    return response.ok
  } catch (error) {
    logger.error('健康检查失败:', error)
    return false
  }
}