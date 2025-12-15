<template>
  <!-- 右下角图标按钮 -->
  <div 
    class="info-panel-icon-btn" 
    :class="{ hidden: !isMinimized }"
    @click="toggleMinimize"
    title="使用指南"
  >
    <span class="icon">📖</span>
  </div>

  <!-- 遮罩层 -->
  <div 
    class="panel-overlay" 
    v-if="!isMinimized"
    @click="toggleMinimize"
  ></div>

  <!-- 展开的面板 -->
  <div class="info-panel" :class="{ minimized: isMinimized }" v-if="!isMinimized">
    <div class="panel-header">
      <div class="header-status">
        <div class="status-light"></div>
        <span>使用指南</span>
      </div>
      <div class="close-btn" @click.stop="toggleMinimize" title="关闭">×</div>
    </div>
    
    <div class="panel-content">
        <div class="log-grid">
          <div class="log-column">
            <h4 class="column-title">
              <span class="icon">➜</span> 探索流程
            </h4>
            <div class="terminal-text">
              <p>> 输入指令: 设定核心探索目标。</p>
              <p>> 节点交互: 点击展开子节点/父节点。</p>
              <p>> 自动聚焦: 视觉中心自动锁定。</p>
              <p>> 布局模式: 径向 / 层级自适应切换。</p>
            </div>
          </div>
          
          <div class="log-column">
            <h4 class="column-title">
              <span class="icon">➜</span> 操作手册
            </h4>
            <div class="terminal-text">
              <p>> 导航: 左键拖拽 | 滚轮缩放</p>
              <p>> 信息: 悬停节点查看数据流。</p>
              <p>> 配置: 右侧面板调整核心参数。</p>
              <p>> 快捷键: 空格=重置 | +/-=缩放</p>
            </div>
          </div>
          
          <div class="log-column">
            <h4 class="column-title">
              <span class="icon">➜</span> 系统提示
            </h4>
            <div class="terminal-text">
              <p>> AI核心: 自动检测知识边界。</p>
              <p>> 状态: <span class="green">绿色</span>=已展开 | <span class="cyan">青色</span>=当前聚焦</p>
              <p>> 优化建议: 切换模型以获得多维视角。</p>
            </div>
          </div>
        </div>
      </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const isMinimized = ref(true) // 默认关闭
const toggleMinimize = () => isMinimized.value = !isMinimized.value
</script>

<style scoped>
/* 右下角图标按钮 */
.info-panel-icon-btn {
  position: absolute;
  right: 136px; /* 在 ConfigSidebar 左侧，80px + 48px + 8px */
  bottom: 24px;
  width: 48px;
  height: 48px;
  background: rgba(6, 182, 212, 0.2);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 50;
}

.info-panel-icon-btn:hover {
  background: rgba(6, 182, 212, 0.4);
  box-shadow: 0 0 15px rgba(6, 182, 212, 0.5);
  transform: scale(1.05);
}

.info-panel-icon-btn .icon {
  font-size: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  filter: drop-shadow(0 0 5px rgba(6, 182, 212, 0.5));
}

.info-panel-icon-btn:hover .icon {
  transform: scale(1.1);
  filter: drop-shadow(0 0 10px rgba(6, 182, 212, 0.8));
}

.info-panel-icon-btn.hidden {
  display: none;
}

/* 遮罩层 */
.panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 999;
  animation: fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 展开的面板 */
.info-panel:not(.minimized) {
  position: fixed;
  left: 50%;
  top: calc(50% + 24px); /* 避开顶部 Header */
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 1000px;
  background: rgba(2, 6, 23, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(6, 182, 212, 0.4);
  border-radius: 8px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
  max-height: calc(80vh - 64px); /* 预留顶部空间 */
  overflow: hidden;
  display: flex;
  flex-direction: column;
  z-index: 1000;
  animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

.panel-header {
  height: 48px;
  background: rgba(6, 182, 212, 0.15);
  border-bottom: 1px solid rgba(6, 182, 212, 0.3);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.header-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-family);
  font-size: 16px;
  font-weight: 700;
  color: var(--primary-color);
  letter-spacing: 1px;
}

.close-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-color);
  font-size: 24px;
  font-weight: 300;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  line-height: 1;
}

.close-btn:hover {
  background: rgba(6, 182, 212, 0.2);
  color: #ffffff;
  transform: scale(1.1);
}

.status-light {
  width: 6px;
  height: 6px;
  background: var(--primary-color);
  border-radius: 50%;
  box-shadow: 0 0 5px var(--primary-color);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.panel-content {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.log-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.column-title {
  font-family: var(--font-family); /* 使用全局字体 */
  font-size: 13px; /* 从 12px 增加到 13px */
  color: var(--secondary-color);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px dashed rgba(139, 92, 246, 0.3);
  padding-bottom: 4px;
}

.terminal-text {
  font-family: var(--font-family); /* 使用全局字体 */
  font-size: 12px; /* 从 11px 增加到 12px */
  line-height: 1.9; /* 从 1.8 增加到 1.9，增加行距 */
  color: var(--text-secondary);
}

.terminal-text p {
  margin: 0;
  position: relative;
  padding-left: 10px;
}

.terminal-text p::before {
  content: '';
  position: absolute;
  left: 0;
  top: 6px;
  width: 2px;
  height: 2px;
  background: var(--text-muted);
}

.green { color: #10b981; }
.cyan { color: #06b6d4; }

/* 响应式 */
@media (max-width: 768px) {
  .log-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .info-panel {
    width: 100%;
    clip-path: none;
    border-radius: 12px 12px 0 0;
  }
}
</style>