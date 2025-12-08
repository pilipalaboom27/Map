<template>
  <Transition name="fade">
    <div 
      v-if="visible && node && content"
      ref="tooltipRef"
      class="node-tooltip"
      :style="tooltipStyle"
    >
      <div class="tooltip-title">{{ node.topic }}</div>
      <div class="tooltip-content">{{ content }}</div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  node: {
    type: Object,
    default: null
  },
  position: {
    type: Object,
    default: () => ({ x: 0, y: 0 })
  }
})

const tooltipRef = ref(null)
const tooltipStyle = ref({})

// 计算卡片内容（优先使用 knowledge.summary，其次使用 knowledge.description，最后使用 node.description）
const content = computed(() => {
  if (!props.node) return ''
  
  // 优先使用 knowledge.summary
  if (props.node.knowledge?.summary && props.node.knowledge.summary.trim()) {
    return props.node.knowledge.summary.trim()
  }
  
  // 其次使用 knowledge.description
  if (props.node.knowledge?.description && props.node.knowledge.description.trim()) {
    return props.node.knowledge.description.trim()
  }
  
  // 最后使用 node.description
  if (props.node.description && props.node.description.trim()) {
    return props.node.description.trim()
  }
  
  return '暂无详细介绍。点击节点可展开查看更多关联知识。'
})

// 更新工具提示位置
const updatePosition = async () => {
  if (!props.visible || !tooltipRef.value) return
  
  await nextTick()
  
  const tooltip = tooltipRef.value
  const tooltipRect = tooltip.getBoundingClientRect()
  const offset = 15 // 距离鼠标的偏移量
  
  let x = props.position.x + offset
  let y = props.position.y + offset
  
  // 确保工具提示不会超出视口
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  
  // 右边界检查
  if (x + tooltipRect.width > viewportWidth) {
    x = props.position.x - tooltipRect.width - offset
  }
  
  // 下边界检查
  if (y + tooltipRect.height > viewportHeight) {
    y = props.position.y - tooltipRect.height - offset
  }
  
  // 左边界检查
  if (x < 0) {
    x = offset
  }
  
  // 上边界检查
  if (y < 0) {
    y = offset
  }
  
  tooltipStyle.value = {
    left: `${x}px`,
    top: `${y}px`
  }
}

watch([() => props.visible, () => props.position], () => {
  if (props.visible) {
    updatePosition()
  }
}, { immediate: true, deep: true })
</script>

<style scoped>
.node-tooltip {
  position: fixed;
  max-width: 360px;
  min-width: 200px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.85);
  color: #fff;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  font-size: 13px;
  line-height: 1.6;
  pointer-events: none;
  z-index: 10000;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(95, 219, 111, 0.3);
}

.tooltip-title {
  font-weight: 700;
  font-size: 15px;
  margin-bottom: 10px;
  color: rgb(95, 219, 111);
  border-bottom: 1px solid rgba(95, 219, 111, 0.2);
  padding-bottom: 8px;
}

.tooltip-content {
  color: rgba(255, 255, 255, 0.9);
  word-wrap: break-word;
  word-break: break-word;
}

/* 淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(-5px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
</style>

