<template>
  <div class="zoom-controls">
    <div class="zoom-btn-group">
      <button class="control-btn" type="button" title="放大" @click="$emit('zoom-in')">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      </button>
      <div class="zoom-display">{{ Math.round(zoomLevel) }}%</div>
      <button class="control-btn" type="button" title="缩小" @click="$emit('zoom-out')">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      </button>
    </div>
    
    <button class="control-btn reset-btn" type="button" title="重置视图" @click="$emit('reset-view')">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
    </button>
  </div>
</template>

<script setup>
defineProps({
  zoomLevel: {
    type: Number,
    default: 100
  }
})

defineEmits(['zoom-in', 'zoom-out', 'reset-view'])
</script>

<style scoped>
.zoom-controls {
  position: absolute;
  bottom: 120px; /* 避开底部面板 */
  right: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 10;
}

.zoom-btn-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(30, 30, 30, 0.6);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.control-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--primary-color);
  transform: scale(1.1);
}

.control-btn:active {
  transform: scale(0.95);
}

.reset-btn {
  background: rgba(30, 30, 30, 0.6);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: 44px; /* 稍微大一点 */
  height: 44px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.zoom-display {
  font-family: var(--font-family); /* 使用全局字体 */
  font-size: 10px;
  color: var(--text-muted);
  padding: 4px 0;
  min-width: 30px;
  text-align: center;
  user-select: none;
}
</style>