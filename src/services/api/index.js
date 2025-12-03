import API_CONFIG from './config.js'
import { parseJSONConceptResponse, parseTextToConcepts } from './parser.js'

// 获取知识
export const fetchKnowledge = async (topic, existingKnowledge, path = []) => {
  try {
    if (API_CONFIG.url && API_CONFIG.url.includes('localhost:8000')) {
      const requestBody = {
        topic: topic,
        path: path,
        existing_knowledge: existingKnowledge
      }
      
      const response = await fetch(API_CONFIG.url, {
        method: API_CONFIG.method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(API_CONFIG.timeout)
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `API请求失败: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('========== API原始响应 ==========')
      console.log('完整响应数据:', data)
      console.log('响应内容长度:', data.content?.length || 0)
      console.log('响应内容:', data.content)
      
      if (data.content) {
        // 首先尝试JSON格式
        const jsonResult = parseJSONConceptResponse(data.content, topic)
        if (jsonResult) {
          console.log('✓ 使用JSON格式解析')
          console.log('解析结果 - 概念数量:', jsonResult.concepts?.length || 0)
          console.log('解析结果 - 概念列表:', jsonResult.concepts)
          return jsonResult
        }
        
        // 如果JSON解析失败，尝试文本格式
        console.log('JSON解析失败，尝试文本格式解析')
        const textResult = parseTextToConcepts(data.content, topic)
        console.log('✓ 使用文本格式解析')
        console.log('解析结果 - 概念数量:', textResult.concepts?.length || 0)
        console.log('解析结果 - 概念列表:', textResult.concepts)
        return textResult
      } else {
        throw new Error('服务器返回格式错误：缺少content字段')
      }
    } else {
      throw new Error('请配置使用Python服务器 (http://localhost:8000/api/generate)')
    }
  } catch (error) {
    console.error('API调用失败:', error)
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
    console.error('健康检查失败:', error)
    return false
  }
}