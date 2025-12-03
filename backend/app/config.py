import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

class Config:
    """基础配置类"""
    # 应用配置
    APP_NAME = "Knowledge Map Backend"
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-here')
    DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'
    PORT = int(os.getenv('PORT', 8000))
    
    # DeepSeek API配置
    DEEPSEEK_API_KEY = os.getenv('DEEPSEEK_API_KEY', '')
    DEEPSEEK_API_URL = os.getenv('DEEPSEEK_API_URL', 'https://api.deepseek.com/v1/chat/completions')
    DEEPSEEK_MODEL = os.getenv('DEEPSEEK_MODEL', 'deepseek-chat')
    DEEPSEEK_TEMPERATURE = float(os.getenv('DEEPSEEK_TEMPERATURE', 0.3))
    DEEPSEEK_MAX_TOKENS = int(os.getenv('DEEPSEEK_MAX_TOKENS', 1500))
    
    # 日志配置
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FORMAT = os.getenv('LOG_FORMAT', '%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    
    # CORS配置
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*').split(',')
    
    @staticmethod
    def init_app(app):
        """初始化应用配置"""
        pass

class DevelopmentConfig(Config):
    """开发环境配置"""
    DEBUG = True
    LOG_LEVEL = 'DEBUG'

class ProductionConfig(Config):
    """生产环境配置"""
    DEBUG = False
    LOG_LEVEL = 'ERROR'

# 配置映射
config_map = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}

# 获取当前环境的配置
ENV = os.getenv('FLASK_ENV', 'development')
config = config_map[ENV]()
