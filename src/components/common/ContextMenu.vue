<template>
  <Transition name="fade">
    <div
      v-if="visible"
      class="context-menu"
      :style="{ left: position.x + 'px', top: position.y + 'px' }"
      @contextmenu.prevent
    >
      <div 
        v-for="(item, index) in menuItems" 
        :key="index"
        class="menu-item"
        :class="{ 'is-divider': item.type === 'divider', 'is-disabled': item.disabled }"
        @click="handleItemClick(item)"
      >
        <template v-if="item.type !== 'divider'">
          <span class="icon" v-if="item.icon">{{ item.icon }}</span>
          <span class="label">{{ item.label }}</span>
          <span class="shortcut" v-if="item.shortcut">{{ item.shortcut }}</span>
        </template>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  position: {
    type: Object,
    default: () => ({ x: 0, y: 0 })
  },
  menuItems: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:visible', 'select'])

// 点击外部关闭
const handleClickOutside = (e) => {
  if (props.visible && !e.target.closest('.context-menu')) {
    emit('update:visible', false)
  }
}

// 处理右键点击外部关闭（延迟执行，避免与显示菜单的事件冲突）
let contextMenuTimeout = null
const handleContextMenuOutside = (e) => {
  // 延迟检查，避免与显示菜单的事件冲突
  if (contextMenuTimeout) {
    clearTimeout(contextMenuTimeout)
  }
  contextMenuTimeout = setTimeout(() => {
    if (props.visible && !e.target.closest('.context-menu')) {
      emit('update:visible', false)
    }
  }, 100)
}

const handleItemClick = (item) => {
  if (item.disabled || item.type === 'divider') return
  emit('select', item)
  emit('update:visible', false)
}

onMounted(() => {
  window.addEventListener('click', handleClickOutside)
  window.addEventListener('contextmenu', handleContextMenuOutside) // 右键点击其他地方也关闭
})

onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside)
  window.removeEventListener('contextmenu', handleContextMenuOutside)
  if (contextMenuTimeout) {
    clearTimeout(contextMenuTimeout)
  }
})
</script>

<style scoped>
.context-menu {
  position: fixed;
  z-index: 9999;
  min-width: 180px;
  background: rgba(2, 6, 23, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(6, 182, 212, 0.3);
  border-radius: 4px;
  padding: 4px 0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
  /* 赛博切角 */
  clip-path: polygon(
    0 0, 
    100% 0, 
    100% calc(100% - 10px), 
    calc(100% - 10px) 100%, 
    0 100%
  );
}

.menu-item {
  padding: 8px 16px;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-primary);
  font-family: var(--font-family);
  font-size: 13px;
  user-select: none;
}

.menu-item:hover:not(.is-disabled):not(.is-divider) {
  background: rgba(6, 182, 212, 0.15);
  color: var(--primary-color);
  padding-left: 20px; /* 悬停轻微移动效果 */
}

.menu-item.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.menu-item.is-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 4px 0;
  padding: 0;
  cursor: default;
}

.icon {
  margin-right: 8px;
  font-size: 14px;
  width: 16px;
  text-align: center;
}

.label {
  flex: 1;
}

.shortcut {
  font-size: 10px;
  color: var(--text-muted);
  font-family: 'JetBrains Mono', monospace;
  margin-left: 12px;
}

/* 动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>



