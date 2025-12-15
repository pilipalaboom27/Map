/**
 * 表格导出工具
 * 支持导出为 CSV 和 Excel 格式
 */

/**
 * 将表格数据转换为 CSV 格式字符串
 * @param {Array} data - 表格数据数组
 * @param {Array} columns - 列定义数组
 * @returns {string} CSV 格式字符串
 */
function convertToCSV(data, columns) {
  if (!data || data.length === 0) {
    return ''
  }

  // 获取列标题
  const headers = columns.map(col => col.title || col.key).join(',')
  
  // 转换数据行
  const rows = data.map(row => {
    return columns.map(col => {
      const value = row[col.key] || ''
      // 处理包含逗号、引号或换行符的值
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    }).join(',')
  })

  // 添加 BOM 以支持中文 Excel 正确显示
  const BOM = '\uFEFF'
  return BOM + [headers, ...rows].join('\n')
}

/**
 * 触发文件下载
 * @param {string} content - 文件内容
 * @param {string} filename - 文件名
 * @param {string} mimeType - MIME 类型
 */
function triggerDownload(content, filename, mimeType = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * 导出表格为 CSV
 * @param {Array} data - 表格数据数组
 * @param {Array} columns - 列定义数组
 * @param {string} filename - 文件名（不含扩展名）
 */
export function exportTableToCSV(data, columns, filename = 'knowledge-table') {
  try {
    const csvContent = convertToCSV(data, columns)
    if (!csvContent) {
      throw new Error('没有数据可导出')
    }
    triggerDownload(csvContent, `${filename}.csv`)
  } catch (error) {
    console.error('导出 CSV 失败:', error)
    throw error
  }
}

/**
 * 导出表格为 Excel（实际为 CSV 格式，可被 Excel 打开）
 * @param {Array} data - 表格数据数组
 * @param {Array} columns - 列定义数组
 * @param {string} filename - 文件名（不含扩展名）
 */
export function exportTableToExcel(data, columns, filename = 'knowledge-table') {
  try {
    const csvContent = convertToCSV(data, columns)
    if (!csvContent) {
      throw new Error('没有数据可导出')
    }
    // 使用 .xlsx 扩展名，但实际是 CSV 格式（Excel 可以打开）
    // 如果需要真正的 Excel 格式，需要使用 xlsx 库
    triggerDownload(csvContent, `${filename}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  } catch (error) {
    console.error('导出 Excel 失败:', error)
    throw error
  }
}


