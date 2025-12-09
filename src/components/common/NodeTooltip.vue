<template>
  <Transition name="fade">
    <div 
      v-if="visible && node && content"
      ref="tooltipRef"
      class="node-tooltip"
      :style="tooltipStyle"
    >
      <div class="tooltip-inner">
        <div class="tooltip-title">{{ node.topic }}</div>
        <div class="tooltip-content">{{ content }}</div>
      </div>
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
  max-width: 320px;
  min-width: 220px;
  padding: 1px; /* 用于边框渐变 */
  
  /* Cyber Glass Style */
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.3), rgba(139, 92, 246, 0.3)); /* 边框渐变色 */
  border-radius: 8px;
  
  font-size: 13px;
  line-height: 1.6;
  pointer-events: none;
  z-index: 10000;
  
  /* 阴影 */
  box-shadow: 
    0 0 20px rgba(6, 182, 212, 0.2),
    0 10px 40px rgba(0, 0, 0, 0.5);
    
  /* 独特的切角遮罩 (可选，如果不想太复杂可以去掉 clip-path) */
  clip-path: polygon(
    10px 0, 100% 0, 
    100% calc(100% - 10px), calc(100% - 10px) 100%, 
    0 100%, 0 10px
  );
}

.node-tooltip::before {
  content: '';
  position: absolute;
  inset: 1px; /* 内部背景层，稍微缩小以露出边框 */
  background: rgba(2, 6, 23, 0.9);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 7px;
  z-index: -1;
  clip-path: polygon(
    10px 0, 100% 0, 
    100% calc(100% - 10px), calc(100% - 10px) 100%, 
    0 100%, 0 10px
  );
}

/* 内容容器 */
.tooltip-inner {
  padding: 16px;
  position: relative;
  z-index: 1;
}

.tooltip-title {
  font-family: var(--font-family); /* 使用全局字体 */
  font-weight: 700;
  font-size: 14px;
  margin-bottom: 12px;
  color: var(--primary-color);
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.1);
  padding-bottom: 8px;
}

.tooltip-title::before {
  content: '';
  display: block;
  width: 6px;
  height: 6px;
  background: var(--primary-color);
  box-shadow: 0 0 8px var(--primary-color);
}

.tooltip-content {
  color: #e2e8f0;
  font-family: system-ui, -apple-system, sans-serif;
  text-align: justify;
}

/* 淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px) scale(0.95);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.95);
}
</style>

