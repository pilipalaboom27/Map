<template>
  <div class="layout-switcher">
    <button 
      v-for="layout in layouts" 
      :key="layout.name"
      :class="['layout-btn', { active: currentLayout === layout.name }]"
      @click="switchLayout(layout.name)"
      :title="layout.description"
    >
      <span class="layout-icon">{{ layout.icon }}</span>
      <span class="layout-label">{{ layout.label }}</span>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGraphStore } from '@/stores/graphStore'
import { useLogger } from '@/core/logger.js'

const store = useGraphStore()
const logger = useLogger('LayoutSwitcher')

const layouts = [
  { 
    name: 'radial', 
    label: '径向', 
    description: '聚焦节点在中心，子节点圆形分布'
  },
  { 
    name: 'hierarchical', 
    label: '层次', 
    description: '层级化布局，清晰展示父子关系' 
  }
]

const currentLayout = computed(() => store.layoutType)

const switchLayout = (name) => {
  store.switchLayout(name)
  logger.debug('切换布局:', name)
}
</script>

<style scoped>
.layout-switcher {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: var(--card-bg);
  border-radius: 0;
  box-shadow: var(--shadow-sm);
}

.switcher-label {
  font-size: 20px;
  font-weight: 600;
  margin-right: 4px;
}

.layout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  background: var(--bg-color);
  border-radius: 0;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}

.layout-btn:hover {
  background: var(--primary-color);
  color: #fff;
  border-color: var(--primary-color);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.layout-btn.active {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: #000;
  box-shadow: var(--shadow-md);
}

.layout-icon {
  font-size: 16px;
}

.layout-label {
  white-space: nowrap;
}

@media (max-width: 768px) {
  .layout-label {
    display: none;
  }
  
  .layout-btn {
    padding: 8px;
  }
}
</style>

