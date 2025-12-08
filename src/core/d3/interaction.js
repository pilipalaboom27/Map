/**
 * D3 交互处理
 * 处理缩放、平移等交互功能
 */

import * as d3 from 'd3'
import { getConfig } from '../config.js'

/**
 * 创建缩放和平移交互
 * @param {Object} svg - D3 SVG 选择器
 * @param {Object} g - D3 容器组选择器
 */
export function createZoomPan(svg, g) {
  const config = getConfig('interaction.zoom')

  // 设置缩放行为
  const zoom = d3.zoom()
    .scaleExtent([config.min, config.max])
    .filter((event) => {
      // 允许滚轮缩放
      if (event.type === 'wheel') {
        return true
      }
      // 允许左键拖拽空白区域平移画板
      if (event.type === 'mousedown' && event.button === 0) {
        const target = event.target
        if (target === svg.node() || target.tagName === 'svg' || 
            target.classList?.contains('links') || 
            (target.tagName === 'g' && target.classList?.contains('nodes'))) {
          return true
        }
        // 如果点击的是节点文字，不允许平移
        return false
      }
      return false
    })
    .on('zoom', (event) => {
      g.attr('transform', event.transform)
    })

  svg.call(zoom)

  // 设置鼠标样式
  svg.on('mousedown', function(event) {
    const target = event.target
    if (target === svg.node() || target.tagName === 'svg' || 
        target.classList?.contains('links') || 
        (target.tagName === 'g' && (target.classList?.contains('nodes') || target.classList?.contains('links')))) {
      svg.style('cursor', 'move')
    }
  })
  
  svg.on('mouseup', function() {
    svg.style('cursor', 'default')
  })
  
  svg.on('mouseleave', function() {
    svg.style('cursor', 'default')
  })

  return zoom
}

/**
 * 处理窗口大小变化
 * @param {Object} svg - D3 SVG 选择器
 * @param {number} width - 新宽度
 * @param {number} height - 新高度
 */
export function handleResize(svg, width, height) {
  if (svg) {
    svg.attr('width', width).attr('height', height)
  }
}

