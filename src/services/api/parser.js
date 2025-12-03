// 解析文本为概念
export const parseTextToConcepts = (text, topic) => {
  if (!text) return { topic, concepts: [], description: '' }
  
  const lines = text.split('\n').filter(line => line.trim())
  const concepts = []
  
  lines.forEach(line => {
    const trimmedLine = line.trim()
    
    let match = trimmedLine.match(/^[-•\d.]*\s*(.+?)\s*[-–—:：]\s*(.+)$/)
    if (match) {
      const name = match[1].trim().replace(/^["']|["']$/g, '')
      const description = match[2].trim().replace(/^["']|["']$/g, '')
      if (name && name.length > 0) {
        concepts.push({
          name: name,
          description: description || ''
        })
      }
    } else {
      match = trimmedLine.match(/^[-•\d.]+\s*(.+)$/)
      if (match) {
        const name = match[1].trim().replace(/^["']|["']$/g, '')
        if (name && name.length > 0) {
          concepts.push({
            name: name,
            description: ''
          })
        }
      } else if (trimmedLine.match(/^[^:：]+[:：]/)) {
        const parts = trimmedLine.split(/[:：]/)
        const name = parts[0].trim()
        const description = parts.slice(1).join(':').trim()
        if (name && name.length > 0) {
          concepts.push({
            name: name,
            description: description
          })
        }
      } else if (trimmedLine.length > 2 && trimmedLine.length < 30 && !trimmedLine.includes('。') && !trimmedLine.includes('.')) {
        concepts.push({
          name: trimmedLine,
          description: ''
        })
      }
    }
  })
  
  // 去重
  const uniqueConcepts = []
  const seenNames = new Set()
  concepts.forEach(concept => {
    if (!seenNames.has(concept.name)) {
      seenNames.add(concept.name)
      uniqueConcepts.push(concept)
    }
  })
  
  return {
    topic: topic,
    concepts: uniqueConcepts.slice(0, 10),
    description: text
  }
}

// 标准化JSON概念
const normalizeJSONConcept = (concept) => {
  if (!concept || !concept.name) return null
  const name = String(concept.name).trim()
  if (!name) return null
  const parts = []
  if (concept.description) {
    parts.push(String(concept.description).trim())
  }
  if (concept.status && String(concept.status).toLowerCase() === 'terminal') {
    parts.push('状态：已到基础层级')
  }
  return {
    name,
    description: parts.join(' | ')
  }
}

// 解析JSON概念响应
export const parseJSONConceptResponse = (text, topic) => {
  if (!text) return null
  let payload = text.trim()
  const fenceMatch = payload.match(/```(?:json)?([\s\S]*?)```/i)
  if (fenceMatch) {
    payload = fenceMatch[1].trim()
  }
  try {
    const data = JSON.parse(payload)
    if (!data || !Array.isArray(data.concepts)) {
      return null
    }
    const parsedConcepts = data.concepts
      .map(concept => normalizeJSONConcept(concept))
      .filter(Boolean)
    if (parsedConcepts.length === 0) {
      return null
    }
    return {
      topic: data.topic || topic,
      concepts: parsedConcepts,
      description: data.notes || '',
      summary: data.summary || ''
    }
  } catch (error) {
    return null
  }
}