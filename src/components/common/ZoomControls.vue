<template>
  <div class="zoom-controls">
    <button id="zoomInBtn" type="button" title="放大" @click="$emit('zoom-in')">+</button>
    <button id="zoomOutBtn" type="button" title="缩小" @click="$emit('zoom-out')">−</button>
    <button id="resetViewBtn" type="button" title="重置视图" @click="$emit('reset-view')">⌂</button>
    <span id="zoomDisplay">{{ zoomLevel }}%</span>
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
  bottom: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  background-color: white;
  padding: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.zoom-controls button {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 4px;
  background-color: #e2e8f0;
  color: #4a5568;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.zoom-controls button:hover {
  background-color: #cbd5e0;
}

#zoomDisplay {
  font-size: 14px;
  color: #4a5568;
  min-width: 50px;
  text-align: center;
}
</style>