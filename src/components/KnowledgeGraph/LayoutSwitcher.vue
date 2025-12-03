<template>
  <div class="layout-switcher">
    <div class="switcher-label">布局:</div>
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

const store = useGraphStore()

const layouts = [
  { 
    name: 'radial', 
    label: '径向', 
    icon: '🎯',
    description: '聚焦节点在中心，子节点圆形分布'
  },
  { 
    name: 'hierarchical', 
    label: '层次', 
    icon: '🌳',
    description: '层级化布局，清晰展示父子关系' 
  },
  { 
    name: 'force', 
    label: '力导向', 
    icon: '⚡',
    description: '节点自动分散，关系决定距离' 
  },
  { 
    name: 'circular', 
    label: '环形', 
    icon: '⭕',
    description: '节点环形排列' 
  }
]

const currentLayout = computed(() => store.layoutType)

const switchLayout = (name) => {
  store.switchLayout(name)
  console.log('🔄 切换布局:', name)
}
</script>

<style scoped>
.layout-switcher {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.switcher-label {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  margin-right: 4px;
}

.layout-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid transparent;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.layout-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.layout-btn.active {
  background: rgba(255, 255, 255, 0.3);
  border-color: #fff;
  box-shadow: 0 2px 8px rgba(255, 255, 255, 0.3);
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

