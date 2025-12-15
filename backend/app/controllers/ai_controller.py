from flask import request, jsonify
from backend.app.services.prompt_service import prompt_service
from backend.app.services.llm_service import llm_service
from backend.app.utils.logger import export_logger as logger
from backend.app.utils.error_handler import ValidationError

class AIController:
    """AI 深度追问控制器"""
    
    @staticmethod
    def ask_ai():
        """
        AI 深度追问
        
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
            
            question = data.get('question', '').strip()
            if not question:
                raise ValidationError("Question is required")
            
            context = data.get('context', {})
            conversation_history = data.get('conversation_history', [])
            
            # 从请求中提取模型相关参数（如果提供）
            model = data.get('model')
            api_key = data.get('api_key')
            temperature = data.get('temperature')
            max_tokens = data.get('max_tokens')
            
            logger.info("=" * 60)
            logger.info("=" * 15 + " 接收 AI 追问请求 " + "=" * 15)
            logger.info("=" * 60)
            logger.info(f"[Controller] 主题: {topic}")
            logger.info(f"[Controller] 问题: {question[:50]}...")
            logger.info(f"[Controller] 对话历史轮数: {len(conversation_history)}")
            logger.info(f"[Controller] 请求的模型: {model or '未指定（使用默认）'}")
            logger.info("=" * 60 + "\n")
            
            # 生成追问提示词
            prompt = prompt_service.generate_ai_question_prompt(
                topic=topic,
                context=context,
                question=question,
                conversation_history=conversation_history,
                model=model
            )
            
            # 调用LLM API获取响应
            result = llm_service.generate_knowledge(
                topic,
                prompt,
                model=model,
                api_key=api_key,
                temperature=temperature,
                max_tokens=max_tokens
            )
            
            # 返回响应（格式与知识生成保持一致）
            return jsonify(result)
            
        except ValidationError as e:
            logger.error(f"Validation error: {str(e)}", exc_info=True)
            return jsonify({"error": e.message}), e.status_code
        except Exception as e:
            logger.error(f"Error in AI question: {str(e)}", exc_info=True)
            return jsonify({"error": "Internal server error"}), 500
    
    @staticmethod
    def generate_code_example():
        """
        生成 Python 应用案例代码
        
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
            
            context = data.get('context', {})
            
            # 从请求中提取模型相关参数（如果提供）
            model = data.get('model')
            api_key = data.get('api_key')
            temperature = data.get('temperature')
            max_tokens = data.get('max_tokens')
            
            logger.info("=" * 60)
            logger.info("=" * 15 + " 接收代码生成请求 " + "=" * 15)
            logger.info("=" * 60)
            logger.info(f"[Controller] 主题: {topic}")
            logger.info(f"[Controller] 请求的模型: {model or '未指定（使用默认）'}")
            logger.info(f"[Controller] 上下文概念数: {len(context.get('concepts', [])) if context else 0}")
            logger.info("=" * 60 + "\n")
            
            # 生成代码生成提示词
            prompt = prompt_service.generate_code_example_prompt(
                topic=topic,
                context=context,
                model=model
            )
            
            # 调用LLM API生成代码
            result = llm_service.generate_knowledge(
                topic,
                prompt,
                model=model,
                api_key=api_key,
                temperature=temperature,
                max_tokens=max_tokens
            )
            
            # 返回响应（格式与知识生成保持一致）
            return jsonify(result)
            
        except ValidationError as e:
            logger.error(f"Validation error: {str(e)}", exc_info=True)
            return jsonify({"error": e.message}), e.status_code
        except Exception as e:
            logger.error(f"Error generating code example: {str(e)}", exc_info=True)
            return jsonify({"error": "Internal server error"}), 500

# 创建 AI 控制器实例
ai_controller = AIController()

