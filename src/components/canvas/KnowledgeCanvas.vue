<template>
  <div class="knowledge-canvas-wrapper">
    <CanvasContainer 
      ref="canvasContainer"
      :nodes="nodes"
      :connections="connections"
      :focused-node="focusedNode"
      @node-click="handleNodeClick"
      @node-expand="handleNodeExpand"
    />
    <ZoomControls 
      :zoom-level="zoomLevel"
      @zoom-in="zoomIn"
      @zoom-out="zoomOut"
      @reset-view="resetView"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import CanvasContainer from './CanvasContainer.vue'
import ZoomControls from '../common/ZoomControls.vue'

const props = defineProps({
  nodes: {
    type: Array,
    required: true
  },
  connections: {
    type: Array,
    required: true
  },
  focusedNode: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['node-click', 'node-expand'])

const canvasContainer = ref(null)
const zoomLevel = ref(100)

const handleNodeClick = (node) => {
  emit('node-click', node)
}

const handleNodeExpand = (node) => {
  emit('node-expand', node)
}

const zoomIn = () => {
  if (canvasContainer.value) {
    canvasContainer.value.zoomIn()
    updateZoomDisplay()
  }
}

const zoomOut = () => {
  if (canvasContainer.value) {
    canvasContainer.value.zoomOut()
    updateZoomDisplay()
  }
}

const resetView = () => {
  if (canvasContainer.value) {
    canvasContainer.value.resetView()
    updateZoomDisplay()
  }
}

const updateZoomDisplay = () => {
  if (canvasContainer.value) {
    zoomLevel.value = Math.round(canvasContainer.value.scale * 100)
  }
}

onMounted(() => {
  updateZoomDisplay()
})
</script>

<style scoped>
.knowledge-canvas-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}
</style>