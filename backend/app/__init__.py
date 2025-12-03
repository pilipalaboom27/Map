from flask import Flask, send_from_directory
from flask_cors import CORS
from backend.app.config import config
from backend.app.routes import register_routes
from backend.app.utils.error_handler import register_error_handlers
from backend.app.utils.logger import export_logger as logger


def create_app():
    """
    创建和配置Flask应用
    
    Returns:
        Flask: Flask应用实例
    """
    try:
        # 创建Flask应用
        app = Flask(__name__, static_folder='../../', static_url_path='')
        
        # 配置应用
        app.config.from_object(config)
        
        # 初始化配置
        config.init_app(app)
        
        # 配置CORS
        CORS(app, origins=config.CORS_ORIGINS)
        
        # 注册路由
        register_routes(app)
        
        # 注册错误处理器
        register_error_handlers(app)
        
        # 配置静态文件服务
        @app.route('/')
        def serve_index():
            """服务首页"""
            return send_from_directory('.', 'index.html')
        
        @app.route('/<path:path>')
        def serve_static(path):
            """服务静态文件"""
            return send_from_directory('.', path)
        
        logger.info(f"Application '{config.APP_NAME}' created successfully")
        logger.info(f"Debug mode: {config.DEBUG}")
        logger.info(f"Port: {config.PORT}")
        
        return app
        
    except Exception as e:
        logger.error(f"Failed to create application: {str(e)}", exc_info=True)
        raise
