<template>
  <div class="info-panel-container">
    <div class="info-panel" :class="{ minimized: isMinimized }">
      <div class="panel-header" @click="toggleMinimize">
        <div class="header-status">
          <div class="status-light"></div>
          <span>系统日志 // 终端</span>
        </div>
        <div class="toggle-btn">{{ isMinimized ? '▲' : '▼' }}</div>
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
  </div>
</template>

<script setup>
import { ref } from 'vue'

const isMinimized = ref(false)
const toggleMinimize = () => isMinimized.value = !isMinimized.value
</script>

<style scoped>
.info-panel-container {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  pointer-events: none; /* 让点击穿透到画布，除了面板本身 */
  z-index: 50;
  display: flex;
  justify-content: center;
}

.info-panel {
  pointer-events: auto;
  width: 90%;
  max-width: 1000px;
  background: rgba(2, 6, 23, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(6, 182, 212, 0.3);
  border-bottom: none;
  
  /* 切角设计 */
  clip-path: polygon(
    20px 0, 
    calc(100% - 20px) 0, 
    100% 20px, 
    100% 100%, 
    0 100%, 
    0 20px
  );
  
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateY(0);
}

.info-panel.minimized {
  transform: translateY(calc(100% - 32px)); /* 只露出标题栏 */
}

.panel-header {
  height: 32px;
  background: rgba(6, 182, 212, 0.1);
  border-bottom: 1px solid rgba(6, 182, 212, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  cursor: pointer;
  transition: background 0.2s;
}

.panel-header:hover {
  background: rgba(6, 182, 212, 0.2);
}

.header-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-family); /* 使用全局字体 */
  font-size: 12px; /* 从 11px 增加到 12px */
  color: var(--primary-color);
  letter-spacing: 1px;
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

.toggle-btn {
  color: var(--primary-color);
  font-size: 10px;
}

.panel-content {
  padding: 20px 30px 30px;
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