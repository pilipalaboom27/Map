// API服务配置（支持用户覆盖+localStorage持久化）
import { getApiConfig } from '../env.js'

const STORAGE_KEY = 'km_api_config'

// 默认配置（来自环境变量）
const defaultConfig = (() => {
  const envCfg = getApiConfig()
  return {
    url: envCfg.url, // 后端API地址，用户不需要配置
    method: 'POST',
    timeout: envCfg.timeout,
    apiKey: '', // 用户可选的自定义API Key
    model: 'deepseek-chat',
    temperature: 0.3,
    maxTokens: 1500
  }
})()

// 读取用户配置
export function loadUserConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) || {}
  } catch (e) {
    console.warn('读取用户API配置失败', e)
    return {}
  }
}

// 保存用户配置
export function saveUserConfig(cfg) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg || {}))
  } catch (e) {
    console.warn('保存用户API配置失败', e)
  }
}

// 获取合并后的配置（默认 + 用户）
export function getMergedApiConfig() {
  const user = loadUserConfig()
  
  // 确保 URL 始终是后端地址，不允许用户覆盖
  // 如果用户在 localStorage 中保存了 LLM API 地址，需要清除它
  let finalUrl = defaultConfig.url
  
  // 检查用户配置中是否有 LLM API 地址（不应该有）
  if (user.url) {
    const userUrl = user.url
    const isLLMUrl = userUrl.includes('api.deepseek.com') ||
                     userUrl.includes('ark.cn-beijing.volces.com') ||
                     userUrl.includes('dashscope.aliyuncs.com') ||
                     userUrl.includes('/v1/chat/completions') ||
                     userUrl.includes('/api/v3')
    
    if (isLLMUrl) {
      console.warn('检测到用户配置了 LLM API 地址，已自动清除。请使用后端 API 地址。')
      // 清除错误的 URL 配置
      const cleanedUserConfig = { ...user }
      delete cleanedUserConfig.url
      saveUserConfig(cleanedUserConfig)
    } else {
      // 如果不是 LLM API 地址，可能是其他后端地址，允许使用
      finalUrl = userUrl
    }
  }
  
  return {
    ...defaultConfig,
    ...user,
    // URL始终使用后端地址
    url: finalUrl,
    // 校正数值
    temperature: clamp(Number(user.temperature ?? defaultConfig.temperature), 0, 1),
    maxTokens: Math.max(1, Number(user.maxTokens ?? defaultConfig.maxTokens) || defaultConfig.maxTokens),
    timeout: Math.max(5000, Number(user.timeout ?? defaultConfig.timeout) || defaultConfig.timeout)
  }
}

function clamp(v, min, max) {
  if (Number.isNaN(v)) return min
  return Math.min(max, Math.max(min, v))
}

// 兼容旧导出
const API_CONFIG = getMergedApiConfig()
export default API_CONFIG