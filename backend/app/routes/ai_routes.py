from flask import Blueprint
from backend.app.controllers.ai_controller import ai_controller

# 创建 AI 追问蓝图
ai_bp = Blueprint('ai', __name__, url_prefix='/api')

# 注册路由
@ai_bp.route('/ask', methods=['POST'])
def ask_ai():
    """AI 深度追问"""
    return ai_controller.ask_ai()

@ai_bp.route('/generate-code-example', methods=['POST'])
def generate_code_example():
    """生成 Python 应用案例代码"""
    return ai_controller.generate_code_example()

