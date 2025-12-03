// API服务配置
import { getApiConfig } from '../env.js'

const apiConfig = getApiConfig()

const API_CONFIG = {
  url: apiConfig.url,
  method: 'POST',
  timeout: apiConfig.timeout,
  deepseekApiKey: apiConfig.deepseekApiKey
}

export default API_CONFIG