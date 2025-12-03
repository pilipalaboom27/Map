from flask import Blueprint
from backend.app.controllers.knowledge_controller import knowledge_controller

# 创建知识生成蓝图
knowledge_bp = Blueprint('knowledge', __name__, url_prefix='/api')

# 注册路由
@knowledge_bp.route('/generate', methods=['POST'])
def generate_knowledge():
    """生成知识"""
    return knowledge_controller.generate_knowledge()
