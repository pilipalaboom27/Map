<template>
  <div class="knowledge-info-card" :style="cardStyle">
    <div class="info-card-title">{{ node.topic }}</div>
    <div class="info-card-body">{{ cardContent }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  node: {
    type: Object,
    required: true
  },
  position: {
    type: Object,
    default: () => ({ x: 0, y: 0 })
  }
})

// 计算卡片内容
const cardContent = computed(() => {
  if (props.node.summary && props.node.summary.trim()) {
    return props.node.summary.trim()
  } else if (props.node.description && props.node.description.trim()) {
    return props.node.description.trim()
  } else {
    return '暂无详细介绍。点击节点可展开查看更多关联知识。'
  }
})

// 计算卡片样式
const cardStyle = computed(() => {
  return {
    left: `${props.position.x}px`,
    top: `${props.position.y}px`
  }
})
</script>

<style scoped>
.knowledge-info-card {
  position: absolute;
  display: block;
  max-width: 320px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.9);
  color: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.3);
  font-size: 13px;
  line-height: 1.6;
  pointer-events: none;
  z-index: 1000;
  backdrop-filter: blur(10px);
}

.info-card-title {
  font-weight: bold;
  font-size: 15px;
  margin-bottom: 10px;
  color: #4facfe;
}

.info-card-body {
  color: rgba(255,255,255,0.9);
}
</style>