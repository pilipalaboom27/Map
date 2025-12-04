/**
 * 知识图谱API服务 - 处理知识生成、实体关系等相关API
 */

import { apiClient } from './client.js'
import { parseJSONConceptResponse, parseTextToConcepts } from './parser.js'

/**
 * 知识图谱API服务类
 */
export class KnowledgeGraphApi {
  constructor(client = apiClient) {
    this.client = client
  }

  /**
   * 生成知识
   * @param {string} topic - 主题
   * @param {Object} existingKnowledge - 现有知识
   * @param {Array} path - 路径
   * @returns {Promise<Object>} - 知识结果
   */
  async generateKnowledge(topic, existingKnowledge = null, path = []) {
    try {
      const requestBody = {
        topic,
        path,
        existing_knowledge: existingKnowledge
      }

      const response = await this.client.post('', requestBody)
      
      if (response.content) {
        // 首先尝试JSON格式
        const jsonResult = parseJSONConceptResponse(response.content, topic)
        if (jsonResult) {
          return jsonResult
        }
        
        // 如果JSON解析失败，尝试文本格式
        return parseTextToConcepts(response.content, topic)
      }
      
      throw new Error('服务器返回格式错误：缺少content字段')
    } catch (error) {
      console.error('生成知识失败:', error)
      throw error
    }
  }

  /**
   * 获取实体详情
   * @param {string} entityId - 实体ID
   * @returns {Promise<Object>} - 实体详情
   */
  async getEntityDetails(entityId) {
    return this.client.get(`/entities/${entityId}`)
  }

  /**
   * 创建实体
   * @param {Object} entityData - 实体数据
   * @returns {Promise<Object>} - 创建的实体
   */
  async createEntity(entityData) {
    return this.client.post('/entities', entityData)
  }

  /**
   * 更新实体
   * @param {string} entityId - 实体ID
   * @param {Object} entityData - 实体数据
   * @returns {Promise<Object>} - 更新的实体
   */
  async updateEntity(entityId, entityData) {
    return this.client.put(`/entities/${entityId}`, entityData)
  }

  /**
   * 删除实体
   * @param {string} entityId - 实体ID
   * @returns {Promise<Object>} - 删除结果
   */
  async deleteEntity(entityId) {
    return this.client.delete(`/entities/${entityId}`)
  }

  /**
   * 获取实体关系
   * @param {string} entityId - 实体ID
   * @returns {Promise<Array>} - 实体关系列表
   */
  async getEntityRelations(entityId) {
    return this.client.get(`/entities/${entityId}/relations`)
  }

  /**
   * 创建实体关系
   * @param {Object} relationData - 关系数据
   * @returns {Promise<Object>} - 创建的关系
   */
  async createRelation(relationData) {
    return this.client.post('/relations', relationData)
  }

  /**
   * 删除实体关系
   * @param {string} relationId - 关系ID
   * @returns {Promise<Object>} - 删除结果
   */
  async deleteRelation(relationId) {
    return this.client.delete(`/relations/${relationId}`)
  }

  /**
   * 搜索实体
   * @param {string} keyword - 搜索关键词
   * @param {Object} options - 搜索选项
   * @returns {Promise<Array>} - 搜索结果
   */
  async searchEntities(keyword, options = {}) {
    return this.client.get('/entities/search', { keyword, ...options })
  }
}

// 创建默认实例
export const knowledgeGraphApi = new KnowledgeGraphApi()