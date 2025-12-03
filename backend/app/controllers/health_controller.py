from flask import jsonify
from datetime import datetime
from backend.app.config import config, ENV
from backend.app.utils.logger import export_logger as logger

class HealthController:
    """健康检查控制器"""
    
    @staticmethod
    def health_check():
        """
        健康检查
        
        Returns:
            Response: JSON响应
        """
        try:
            logger.info("Health check requested")
            return jsonify({
                'status': 'ok',
                'app_name': config.APP_NAME,
                'env': ENV,
                'api_key_configured': bool(config.DEEPSEEK_API_KEY),
                'timestamp': datetime.utcnow().isoformat() + 'Z'
            })
        except Exception as e:
            logger.error(f"Health check failed: {str(e)}", exc_info=True)
            return jsonify({"status": "error", "message": str(e)}), 500

# 创建健康检查控制器实例
health_controller = HealthController()
