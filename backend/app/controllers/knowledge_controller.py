from flask import request, jsonify
from backend.app.services.prompt_service import prompt_service
from backend.app.services.deepseek_service import deepseek_service
from backend.app.utils.logger import export_logger as logger
from backend.app.utils.error_handler import ValidationError

class KnowledgeController:
    """知识生成控制器"""
    
    @staticmethod
    def generate_knowledge():
        """
        生成知识
        
        Returns:
            Response: JSON响应
        """
        try:
            data = request.json
            if not data:
                raise ValidationError("Request body is required")
            
            topic = data.get('topic', '').strip()
            if not topic:
                raise ValidationError("Topic is required")
            
            existing_knowledge = data.get('existing_knowledge')
            path = data.get('path', [])
            
            logger.info(f"Generating knowledge for topic: {topic}")
            
            # 生成提示
            prompt = prompt_service.generate_knowledge_prompt(topic, existing_knowledge, path)
            
            # 调用DeepSeek API生成知识
            result = deepseek_service.generate_knowledge(topic, prompt)
            
            return jsonify(result)
            
        except ValidationError as e:
            logger.error(f"Validation error: {str(e)}", exc_info=True)
            return jsonify({"error": e.message}), e.status_code
        except Exception as e:
            logger.error(f"Error generating knowledge: {str(e)}", exc_info=True)
            return jsonify({"error": "Internal server error"}), 500

# 创建知识控制器实例
knowledge_controller = KnowledgeController()
