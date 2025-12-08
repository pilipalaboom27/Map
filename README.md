# 知识探索画板

一个基于 Vue 3 + D3.js 的交互式知识探索工具，支持多模型 LLM 生成知识节点，并提供拖拽、缩放、平移等可视化操作。

## 功能亮点
- 🎨 画布交互：拖拽、缩放、平移、重置视图
- 🔗 知识扩展：点击节点自动生成相关概念，可连续探索
- 🧠 多模型：支持 DeepSeek / 豆包 / 通义千问（可配置）
- 🛡️ 安全代理：后端代理 API，保护密钥
- 📦 模块化：清晰的前后端分层，方便扩展

## 技术栈
- 前端：Vue 3、Vite、D3.js、Naive UI、GSAP、Graphology
- 后端：Python 3.10+、Flask、Flask-CORS、requests、python-dotenv

## 项目结构（简版）
```
.
├── backend/               # Flask 后端
│   ├── app/
│   │   ├── config.py      # 配置与环境变量
│   │   ├── controllers/   # 控制器
│   │   ├── routes/        # 路由注册
│   │   ├── services/      # LLM 服务封装
│   │   └── utils/         # 日志、异常等工具
│   └── __init__.py
├── src/                   # 前端源码（Vue 3）
├── server.py              # 后端入口
├── requirements.txt       # Python 依赖
├── package.json           # Node 依赖与脚本
├── vite.config.js         # Vite 配置
└── README.md
```

## 快速开始
1) 环境准备  
   - Node.js ≥ 18，npm ≥ 9  
   - Python ≥ 3.10

2) 安装依赖  
```bash
# 后端
pip install -r requirements.txt

# 前端
npm install
```

3) 配置环境变量  
在项目根目录创建 `.env`：
```env
# 通用
PORT=8000
LOG_LEVEL=INFO
CORS_ORIGINS=*

# DeepSeek
DEEPSEEK_API_KEY=your_deepseek_key
DEEPSEEK_API_URL=https://api.deepseek.com
DEEPSEEK_TEMPERATURE=0.7
DEEPSEEK_MAX_TOKENS=1024

# 豆包（可选）
DOUBAO_API_KEY=
DOUBAO_API_URL=https://ark.cn-beijing.volces.com/api/v3

# 通义千问（可选）
QWEN_API_KEY=
QWEN_API_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
```

4) 启动服务  
```bash
# 后端（默认 8000 端口）
python server.py

# 前端（默认 3000 端口）
npm run dev
```
浏览器访问 `http://localhost:3000`。

## 常用命令
- 前端开发：`npm run dev`
- 前端打包：`npm run build`（产物在 `dist/`）
- 后端本地：`python server.py`

## 环境变量说明
| 变量名 | 作用 | 默认 |
| --- | --- | --- |
| PORT | Flask 服务端口 | 8000 |
| LOG_LEVEL | 日志级别 | INFO |
| CORS_ORIGINS | 允许的跨域来源，逗号分隔 | * |
| DEEPSEEK_API_KEY | DeepSeek 密钥 | - |
| DEEPSEEK_API_URL | DeepSeek 基础地址 | https://api.deepseek.com |
| DEEPSEEK_TEMPERATURE | 默认温度 | 0.7 |
| DEEPSEEK_MAX_TOKENS | 默认最大 tokens | 1024 |
| DOUBAO_API_KEY / URL | 豆包配置 | - / https://ark.cn-beijing.volces.com/api/v3 |
| QWEN_API_KEY / URL | 通义千问配置 | - / https://dashscope.aliyuncs.com/compatible-mode/v1 |

## 使用小贴士
- 先启动后端，再启动前端，避免跨域或 5xx。
- API 密钥只放在 `.env`，勿提交到仓库。
- 如果请求超时，可在 `src/services/api/config.js` 调整 `timeout`。

## 许可证
MIT License

