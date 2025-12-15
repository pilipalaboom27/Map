<template>
  <div 
    class="ai-floating-button" 
    :class="{ dragging: isDragging }"
    :style="buttonStyle"
    @mousedown="startDrag"
    @touchstart="startDrag"
    @click="handleClick"
    title="AI 深度追问"
  >
    <span class="icon">🤖</span>
    <span class="text">AI追问</span>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useAIPanelStore } from '@/stores/aiPanelStore'

const store = useAIPanelStore()

// 按钮位置（绝对坐标，从左上角开始）
const position = ref({ x: window.innerWidth - 280, y: 400 })
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
const dragStartPos = ref({ x: 0, y: 0 })

// 按钮样式
const buttonStyle = computed(() => ({
  left: `${position.value.x}px`,
  top: `${position.value.y}px`
}))

// 从 localStorage 加载位置
const loadPosition = () => {
  try {
    const saved = localStorage.getItem('ai-fab-position')
    if (saved) {
      const pos = JSON.parse(saved)
      position.value = pos
    }
  } catch (error) {
    console.warn('加载悬浮按钮位置失败:', error)
  }
}

// 保存位置到 localStorage
const savePosition = () => {
  try {
    localStorage.setItem('ai-fab-position', JSON.stringify(position.value))
  } catch (error) {
    console.warn('保存悬浮按钮位置失败:', error)
  }
}

// 开始拖拽
const startDrag = (e) => {
  const clientX = e.touches ? e.touches[0].clientX : e.clientX
  const clientY = e.touches ? e.touches[0].clientY : e.clientY
  
  dragStartPos.value = { x: clientX, y: clientY }
  
  // 计算鼠标点击位置与按钮左上角的偏移
  dragOffset.value = {
    x: clientX - position.value.x,
    y: clientY - position.value.y
  }
  
  // 添加全局移动和释放事件
  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', endDrag)
  window.addEventListener('touchmove', onDrag, { passive: false })
  window.addEventListener('touchend', endDrag)
}

// 拖拽中
const onDrag = (e) => {
  const clientX = e.touches ? e.touches[0].clientX : e.clientX
  const clientY = e.touches ? e.touches[0].clientY : e.clientY
  
  // 计算移动距离，如果移动超过 5px 才认为是拖拽
  const moveDistance = Math.sqrt(
    Math.pow(clientX - dragStartPos.value.x, 2) + 
    Math.pow(clientY - dragStartPos.value.y, 2)
  )
  
  if (moveDistance > 5) {
    isDragging.value = true
    e.preventDefault()
    
    // 计算新位置（从左上角开始的绝对坐标）
    const newX = clientX - dragOffset.value.x
    const newY = clientY - dragOffset.value.y
    
    // 限制在可视区域内
    const buttonWidth = 100
    const buttonHeight = 48
    const minX = 12
    const maxX = window.innerWidth - buttonWidth - 12
    const minY = 80 // 预留 header 空间
    const maxY = window.innerHeight - buttonHeight - 12
    
    position.value = {
      x: Math.max(minX, Math.min(maxX, newX)),
      y: Math.max(minY, Math.min(maxY, newY))
    }
  }
}

// 结束拖拽
const endDrag = (e) => {
  // 移除全局事件
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', endDrag)
  window.removeEventListener('touchmove', onDrag)
  window.removeEventListener('touchend', endDrag)
  
  if (isDragging.value) {
    // 拖拽结束后延迟重置状态，避免触发点击事件
    setTimeout(() => {
      isDragging.value = false
    }, 100)
    
    // 保存位置
    savePosition()
  }
}

// 点击按钮
const handleClick = (e) => {
  // 如果正在拖拽，不触发点击
  if (isDragging.value) {
    e.stopPropagation()
    return
  }
  
  // 打开 AI 面板
  store.openLatestOrHint()
}

onMounted(() => {
  loadPosition()
})
</script>

<style scoped>
.ai-floating-button {
  position: fixed;
  width: 100px;
  height: 48px;
  background: rgba(6, 182, 212, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(6, 182, 212, 0.4);
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: grab;
  transition: background 0.2s, border-color 0.2s, box-shadow 0.2s, transform 0.2s;
  z-index: 500;
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
}

.ai-floating-button:hover {
  background: rgba(6, 182, 212, 0.3);
  border-color: var(--primary-color);
  box-shadow: 0 4px 20px rgba(6, 182, 212, 0.4);
  transform: scale(1.05);
}

.ai-floating-button.dragging {
  cursor: grabbing;
  box-shadow: 0 8px 30px rgba(6, 182, 212, 0.6);
  transform: scale(1.08);
}

.ai-floating-button .icon {
  font-size: 24px;
  line-height: 1;
  filter: drop-shadow(0 0 5px rgba(6, 182, 212, 0.5));
}

.ai-floating-button .text {
  font-family: var(--font-family);
  font-size: 14px;
  font-weight: 600;
  color: var(--primary-color);
  letter-spacing: 0.5px;
}

.ai-floating-button:active {
  transform: scale(0.98);
}

@media (max-width: 768px) {
  .ai-floating-button {
    width: 48px;
    height: 48px;
    border-radius: 50%;
  }
  
  .ai-floating-button .text {
    display: none;
  }
}
</style>

