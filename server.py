#!/usr/bin/env python3
"""
知识图谱后端服务入口
"""

import os
from backend.app import create_app

# 创建Flask应用
app = create_app()

if __name__ == '__main__':
    # 从配置中获取端口和调试模式
    port = app.config.get('PORT', 8000)
    debug = app.config.get('DEBUG', False)
    
    # 启动Flask应用
    app.run(host='0.0.0.0', port=port, debug=debug)