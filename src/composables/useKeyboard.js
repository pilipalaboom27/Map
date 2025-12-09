import { onMounted, onUnmounted } from 'vue'

export function useKeyboard(handlers) {
  const { onZoomIn, onZoomOut, onResetView, onEnter } = handlers

  const handleKeydown = (e) => {
    // 忽略在输入框中的按键（除了 Enter）
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      if (e.key === 'Enter' && onEnter) {
        // onEnter(e) // 暂时不在输入框内触发通用 Enter 逻辑，交给输入框自己的事件
      }
      return
    }

    switch (e.key) {
      case '=':
      case '+':
        e.preventDefault()
        if (onZoomIn) onZoomIn()
        break
      case '-':
      case '_':
        e.preventDefault()
        if (onZoomOut) onZoomOut()
        break
      case ' ': // Space bar
      case '0':
        e.preventDefault()
        if (onResetView) onResetView()
        break
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
  })
}


