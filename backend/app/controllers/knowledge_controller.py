from flask import request, jsonify
from backend.app.services.prompt_service import prompt_service
from backend.app.services.llm_service import llm_service
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
            
            # 从请求中提取模型相关参数（如果提供）
            model = data.get('model')
            api_key = data.get('api_key')  # 用户自定义API Key
            temperature = data.get('temperature')
            max_tokens = data.get('max_tokens')
            
            # 同时使用 print 确保输出到控制台
            print("\n" + "=" * 60)
            print("=" * 15 + " 接收知识生成请求 " + "=" * 15)
            print("=" * 60)
            print(f"[Controller] 主题: {topic}")
            print(f"[Controller] 请求的模型: {model or '未指定（使用默认）'}")
            print(f"[Controller] Temperature: {temperature}")
            print(f"[Controller] Max Tokens: {max_tokens}")
            print(f"[Controller] 使用用户自定义 API Key: {'是' if api_key else '否（使用环境变量）'}")
            print("=" * 60 + "\n")
            
            logger.info("\n" + "=" * 60)
            logger.info("=" * 15 + " 接收知识生成请求 " + "=" * 15)
            logger.info("=" * 60)
            logger.info(f"[Controller] 主题: {topic}")
            logger.info(f"[Controller] 请求的模型: {model or '未指定（使用默认）'}")
            logger.info(f"[Controller] Temperature: {temperature}")
            logger.info(f"[Controller] Max Tokens: {max_tokens}")
            logger.info(f"[Controller] 使用用户自定义 API Key: {'是' if api_key else '否（使用环境变量）'}")
            logger.info("=" * 60 + "\n")
            
            # 生成提示（传递模型信息）
            prompt = prompt_service.generate_knowledge_prompt(topic, existing_knowledge, path, model=model)
            
            # 调用LLM API生成知识（支持动态参数）
            result = llm_service.generate_knowledge(
                topic, 
                prompt,
                model=model,
                api_key=api_key,
                temperature=temperature,
                max_tokens=max_tokens
            )
            
            return jsonify(result)
            
        except ValidationError as e:
            logger.error(f"Validation error: {str(e)}", exc_info=True)
            return jsonify({"error": e.message}), e.status_code
        except Exception as e:
            logger.error(f"Error generating knowledge: {str(e)}", exc_info=True)
            return jsonify({"error": "Internal server error"}), 500

# 创建知识控制器实例
knowledge_controller = KnowledgeController()
