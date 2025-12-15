// 导出功能使用 html-to-image，请确保已安装：npm install html-to-image
import { toPng, toSvg } from 'html-to-image'

const defaultSelector = '.graph-canvas-container'

function triggerDownload(dataUrl, filename) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  a.click()
}

export async function exportGraphAsPng(selector = defaultSelector) {
  const el = document.querySelector(selector)
  if (!el) throw new Error('Graph container not found')
  const url = await toPng(el, { cacheBust: true, pixelRatio: 2 })
  triggerDownload(url, 'knowledge-map.png')
}

export async function exportGraphAsSvg(selector = defaultSelector) {
  const el = document.querySelector(selector)
  if (!el) throw new Error('Graph container not found')
  const url = await toSvg(el, { cacheBust: true })
  triggerDownload(url, 'knowledge-map.svg')
}
