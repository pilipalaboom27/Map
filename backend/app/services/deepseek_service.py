import requests
from backend.app.config import config
from backend.app.utils.logger import export_logger as logger
from backend.app.utils.error_handler import ThirdPartyAPIError

class DeepSeekService:
    """DeepSeek API服务"""
    
    def __init__(self):
        """初始化DeepSeek服务"""
        self.api_key = config.DEEPSEEK_API_KEY
        self.api_url = config.DEEPSEEK_API_URL
        self.model = config.DEEPSEEK_MODEL
        self.temperature = config.DEEPSEEK_TEMPERATURE
        self.max_tokens = config.DEEPSEEK_MAX_TOKENS
    
    def generate_knowledge(self, topic, prompt):
        """
        调用DeepSeek API生成知识
        
        Args:
            topic (str): 主题
            prompt (str): 提示
            
        Returns:
            dict: 生成的知识
        """
        try:
            if not self.api_key:
                logger.error("DeepSeek API key not configured")
                raise ValueError("DeepSeek API key not configured")
            
            headers = {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                'model': self.model,
                'messages': [{'role': 'user', 'content': prompt}],
                'temperature': self.temperature,
                'max_tokens': self.max_tokens
            }
            
            logger.debug(f"Calling DeepSeek API for topic: {topic}")
            response = requests.post(self.api_url, headers=headers, json=payload)
            response.raise_for_status()
            
            result = response.json()
            content = result['choices'][0]['message']['content']
            
            logger.info(f"Successfully generated knowledge for topic: {topic}")
            return {
                'content': content,
                'topic': topic
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"DeepSeek API request failed: {str(e)}", exc_info=True)
            raise ThirdPartyAPIError(f"DeepSeek API request failed: {str(e)}") from e
        except ValueError as e:
            logger.error(f"Invalid DeepSeek configuration: {str(e)}", exc_info=True)
            raise ValueError(f"Invalid DeepSeek configuration: {str(e)}") from e
        except Exception as e:
            logger.error(f"Error generating knowledge: {str(e)}", exc_info=True)
            raise

# 创建DeepSeek服务实例
deepseek_service = DeepSeekService()
