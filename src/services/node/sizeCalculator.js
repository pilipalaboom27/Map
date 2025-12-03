// 节点尺寸计算服务

// 计算节点大小
export const calculateNodeSize = (topic, description) => {
  // 创建临时canvas用于测量文本宽度
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const titleFontSize = 14
  const padding = 15
  const maxWidth = 200
  const minWidth = 100
  const titleLineHeight = 20
  
  if (!ctx) return { width: minWidth, height: 50 }
  
  ctx.font = `bold ${titleFontSize}px Microsoft YaHei`
  ctx.textAlign = 'left'
  
  const topicWords = topic.split('')
  const topicLines = []
  let currentLine = ''
  
  for (let i = 0; i < topicWords.length; i++) {
    const testLine = currentLine + topicWords[i]
    const metrics = ctx.measureText(testLine)
    
    if (metrics.width > maxWidth - padding * 2 && currentLine !== '') {
      topicLines.push(currentLine)
      currentLine = topicWords[i]
    } else {
      currentLine = testLine
    }
  }
  if (currentLine) topicLines.push(currentLine)
  
  let maxLineWidth = 0
  topicLines.forEach(line => {
    ctx.font = `bold ${titleFontSize}px Microsoft YaHei`
    const width = ctx.measureText(line).width
    if (width > maxLineWidth) maxLineWidth = width
  })
  
  const titleHeight = topicLines.length * titleLineHeight
  const totalHeight = titleHeight
  
  const width = Math.max(minWidth, Math.min(maxWidth, maxLineWidth + padding * 2))
  const height = Math.max(50, totalHeight + padding * 2)
  
  return { width, height }
}

// 更新节点尺寸
export const updateNodeDimensions = (node) => {
  const size = calculateNodeSize(node.topic, node.description)
  node.width = size.width
  node.height = size.height
}

// 批量更新节点尺寸
export const batchUpdateNodeDimensions = (nodes) => {
  nodes.forEach(node => {
    updateNodeDimensions(node)
  })
}