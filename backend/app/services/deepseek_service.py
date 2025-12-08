# 向后兼容：从新的 LLMService 导入
# 此文件保留用于向后兼容，新代码应使用 llm_service
from backend.app.services.llm_service import llm_service as deepseek_service

# 为了向后兼容，保留 DeepSeekService 类名（作为别名）
DeepSeekService = type('DeepSeekService', (), {
    'generate_knowledge': lambda self, topic, prompt, **kwargs: deepseek_service.generate_knowledge(
        topic, prompt, model='deepseek-chat', **kwargs
    )
})()
