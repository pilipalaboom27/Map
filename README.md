# 知识探索画板

一个基于Vue 3和D3.js的交互式知识探索工具，通过点击节点来生成和探索相关概念知识。

## 功能特点

- 🎨 **可视化画板**：在画布上展示知识节点和它们之间的关系
- 🔗 **知识扩展**：点击节点自动生成相关概念
- 🖱️ **交互操作**：支持拖拽节点、连续点击探索、缩放和平移
- 🎯 **智能布局**：基于D3力导向布局自动排列节点
- 🌈 **美观界面**：现代化的UI设计和流畅的动画效果
- 📱 **响应式设计**：适配不同屏幕尺寸
- 🔒 **安全后端**：使用Python服务器保护API密钥
- 📊 **模块化架构**：清晰的代码结构，易于扩展

## 技术栈

### 前端
- Vue 3.5 - 渐进式JavaScript框架
- D3.js 7.9 - 数据驱动的文档可视化库
- Vite 6.0 - 下一代前端构建工具
- CSS变量 - 主题样式管理

### 后端
- Python 3.7+
- Flask - Web框架
- Flask-CORS - 跨域支持
- python-dotenv - 环境变量管理
- requests - HTTP请求

## 项目结构

```
map/
├── src/                      # 前端源代码
│   ├── components/           # Vue组件
│   │   ├── canvas/          # 画布相关组件
│   │   ├── common/          # 通用组件
│   │   └── layout/          # 布局组件
│   ├── services/            # 服务层
│   │   ├── api/             # API服务
│   │   ├── node/            # 节点管理服务
│   │   └── env.js           # 环境配置管理
│   ├── store/               # 状态管理
│   │   ├── mapStore.js      # 地图状态管理
│   │   └── configStore.js   # 配置状态管理
│   ├── styles/              # 样式文件
│   │   ├── variables.css    # CSS变量
│   │   └── global.css       # 全局样式
│   ├── types/               # 类型定义
│   ├── utils/               # 工具函数
│   ├── App.vue              # 根组件
│   └── main.js              # 入口文件
├── server.py                # Python Flask后端服务器
├── requirements.txt         # Python依赖
├── .env                    # 环境变量（包含API密钥，不提交到Git）
├── index.html              # 前端主页面
├── package.json            # Node.js依赖
├── vite.config.js          # Vite配置
├── test-runner.js          # 测试运行器
├── tests/                  # 测试文件
└── README.md               # 说明文档
```

## 快速开始

### 1. 安装依赖

#### 安装Python依赖

```bash
pip install -r requirements.txt
```

#### 安装Node.js依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env` 文件（如果不存在），并设置你的DeepSeek API密钥：

```env
DEEPSEEK_API_KEY=your_api_key_here
PORT=8000
```

### 3. 启动服务

#### 启动Python服务器

```bash
python server.py
```

服务器将在 `http://localhost:8000` 启动。

#### 启动前端开发服务器

```bash
npm run dev
```

前端应用将在 `http://localhost:3000` 启动。

### 4. 访问应用

在浏览器中打开 `http://localhost:3000` 即可访问应用。

## 使用方法

1. **添加主题**
   - 在输入框中输入要学习的主题（如：SVM）
   - 点击"添加主题"按钮或按回车键

2. **探索知识**
   - 点击画板中的节点
   - 系统会自动调用DeepSeek API生成相关知识
   - 新生成的概念会以子节点的形式显示
   - 可以连续点击节点来探索更多知识

3. **调整视图**
   - 拖拽节点可以调整位置
   - 使用鼠标滚轮或缩放控件缩放画布
   - 按住右键/中键或空格+左键平移视图
   - 点击"重置视图"按钮恢复默认视图

4. **管理画布**
   - 点击"清空画板"按钮重置画布
   - 悬停节点查看详细信息

## API配置

### 默认配置

应用默认使用本地Python服务器作为API代理，API密钥存储在 `.env` 文件中，更加安全。

### 自定义API配置

你可以在 `src/services/api/config.js` 中修改API配置：

```javascript
const API_CONFIG = {
  url: 'http://localhost:8000/api/generate',
  method: 'POST',
  timeout: 30000
};
```

### 环境变量

| 变量名 | 描述 | 默认值 |
| --- | --- | --- |
| DEEPSEEK_API_KEY | DeepSeek API密钥 | - |
| PORT | Python服务器端口 | 8000 |
| API_URL | API服务地址 | http://localhost:8000/api/generate |
| API_TIMEOUT | API请求超时时间 | 30000 |
| APP_ENV | 应用环境 | development |

## 开发指南

### 组件开发

组件分为三个主要类别：

- **canvas/**：画布相关组件，负责渲染和交互
- **common/**：通用组件，如信息卡片、缩放控件等
- **layout/**：布局组件，如头部、信息面板等

### 状态管理

应用使用Vue 3的组合式API和响应式系统进行状态管理：

- **mapStore**：管理地图节点和连接数据
- **configStore**：管理应用配置

### 服务层

服务层负责处理业务逻辑：

- **api/**：处理API请求和响应
- **node/**：处理节点管理和尺寸计算
- **env.js**：处理环境变量

### 工具函数

工具函数分为多个模块：

- **string.js**：字符串处理
- **array.js**：数组处理
- **object.js**：对象处理
- **event.js**：事件处理（防抖、节流等）

### 测试

应用包含简单的测试框架，运行测试：

```bash
npm run test
```

### 构建生产版本

```bash
npm run build
```

构建后的文件将输出到 `dist/` 目录。

## 浏览器支持

- Chrome/Edge (推荐)
- Firefox
- Safari
- 移动端浏览器

## 注意事项

- 确保Python服务器正在运行（`http://localhost:8000`）
- API密钥存储在 `.env` 文件中，不要提交到Git仓库
- 如果服务器未启动，前端会显示错误提示
- 节点显示格式为"概念名"，悬停时显示详细信息

## 故障排除

### 服务器无法启动
- 检查是否安装了所有依赖：`pip install -r requirements.txt`
- 检查端口8000是否被占用
- 查看控制台错误信息

### API调用失败
- 检查 `.env` 文件中的API密钥是否正确
- 检查Python服务器是否正在运行
- 打开浏览器开发者工具查看网络请求

### 前端应用无法访问
- 检查前端开发服务器是否正在运行：`npm run dev`
- 检查端口3000是否被占用
- 查看浏览器控制台错误信息

## 开发计划

- [ ] 支持导出知识图谱
- [ ] 添加节点搜索功能
- [ ] 支持自定义节点样式
- [ ] 添加知识节点编辑功能
- [ ] 支持保存和加载知识图谱
- [ ] 添加API响应缓存
- [ ] 支持多种大模型API
- [ ] 添加深色模式
- [ ] 支持键盘快捷键

## 贡献指南

欢迎提交Issue和Pull Request！

### 开发流程

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开Pull Request

## 许可证

MIT License

## 联系方式

如有问题或建议，请通过以下方式联系：

- 提交Issue
- 发送邮件

## 更新日志

### v1.0.0

- 基于Vue 3和D3.js的全新架构
- 模块化组件设计
- 改进的状态管理
- 支持缩放和平移
- 响应式设计
- 现代化的UI
- 完整的开发文档

