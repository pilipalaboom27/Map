from flask import Blueprint
from backend.app.controllers.health_controller import health_controller

# 创建健康检查蓝图
health_bp = Blueprint('health', __name__, url_prefix='/')

# 注册路由
@health_bp.route('/health', methods=['GET'])
def health_check():
    """健康检查"""
    return health_controller.health_check()
