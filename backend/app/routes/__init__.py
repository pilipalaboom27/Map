from backend.app.routes.knowledge_routes import knowledge_bp
from backend.app.routes.health_routes import health_bp
from backend.app.routes.ai_routes import ai_bp

def register_routes(app):
    """
    注册所有路由
    
    Args:
        app (Flask): Flask应用实例
    """
    app.register_blueprint(knowledge_bp)
    app.register_blueprint(health_bp)
    app.register_blueprint(ai_bp)
