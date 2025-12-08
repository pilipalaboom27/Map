import requests
from backend.app.config import config
from backend.app.utils.logger import export_logger as logger
from backend.app.utils.error_handler import ThirdPartyAPIError

class LLMService:
    """LLM API服务（支持多种模型）"""
    
    # 模型配置映射
    MODEL_CONFIGS = {
        'deepseek-chat': {
            'url': config.DEEPSEEK_API_URL,
            'api_key': config.DEEPSEEK_API_KEY
        },
        'doubao-seed-1-6-251015': {
            'url': config.DOUBAO_API_URL,
            'api_key': config.DOUBAO_API_KEY
        },
        'qwen-flash': {
            'url': config.QWEN_API_URL,
            'api_key': config.QWEN_API_KEY
        }
    }
    
    def __init__(self):
        """初始化LLM服务"""
        # 保留默认配置用于向后兼容
        self.default_temperature = config.DEEPSEEK_TEMPERATURE
        self.default_max_tokens = config.DEEPSEEK_MAX_TOKENS
    
    def generate_knowledge(self, topic, prompt, model=None, api_key=None, temperature=None, max_tokens=None):
        """
        调用LLM API生成知识（支持动态参数）
        
        Args:
            topic (str): 主题
            prompt (str): 提示
            model (str, optional): 模型名称，如果提供则覆盖默认值
            api_key (str, optional): API密钥，如果提供则优先使用
            temperature (float, optional): 温度参数，如果提供则覆盖默认值
            max_tokens (int, optional): 最大token数，如果提供则覆盖默认值
            
        Returns:
            dict: 生成的知识
        """
        try:
            # 立即输出日志，确保代码执行到这里（使用 print 作为备用）
            print(f"\n[LLM Service] ========== generate_knowledge 方法被调用 ==========")
            print(f"[LLM Service] topic: {topic}, model: {model}")
            logger.info(f"[LLM Service] generate_knowledge 方法被调用 - topic: {topic}, model: {model}")
            
            # 确定使用的模型
            final_model = model or 'deepseek-chat'
            
            # 获取模型配置
            model_config = self.MODEL_CONFIGS.get(final_model)
            if not model_config:
                logger.error(f"[LLM Service] 不支持的模型: {final_model}")
                raise ValueError(f"Unsupported model: {final_model}. Supported models: {list(self.MODEL_CONFIGS.keys())}")
            
            # API Key优先级：用户传入 > 环境变量 > 代码默认值
            final_api_key = api_key or model_config['api_key']
            api_key_source = "用户提供" if api_key else "环境变量"
            if not final_api_key:
                logger.error(f"[LLM Service] API key 未配置 - 模型: {final_model}")
                raise ValueError(f"API key not configured for model: {final_model}")
            
            # API URL - 需要根据模型添加正确的端点路径
            base_url = model_config['url']
            base_url = base_url.rstrip('/')
            # 为不同的 API 添加正确的端点路径
            if 'ark.cn-beijing.volces.com' in base_url:
                # Doubao API 需要 /chat/completions 端点
                final_api_url = base_url + '/chat/completions'
            elif 'dashscope.aliyuncs.com' in base_url:
                # Qwen 兼容模式，直接使用 /chat/completions
                final_api_url = base_url + '/chat/completions'
            elif 'api.deepseek.com' in base_url:
                # DeepSeek 若未带 /v1/chat/completions 则补全
                if '/v1/chat/completions' not in base_url:
                    final_api_url = base_url + '/v1/chat/completions'
                else:
                    final_api_url = base_url
            else:
                # 默认添加 /chat/completions
                final_api_url = base_url + '/chat/completions'
            
            # 温度参数和最大token数
            final_temperature = temperature if temperature is not None else self.default_temperature
            final_max_tokens = max_tokens if max_tokens is not None else self.default_max_tokens
            
            # 详细日志：显示实际调用的 API 信息（同时使用 print 确保输出）
            print("\n" + "=" * 60)
            print("=" * 20 + " 调用 LLM API " + "=" * 20)
            print("=" * 60)
            print(f"[LLM Service] 模型名称: {final_model}")
            print(f"[LLM Service] API 地址: {final_api_url}")
            print(f"[LLM Service] API Key 来源: {api_key_source}")
            print(f"[LLM Service] Temperature: {final_temperature}")
            print(f"[LLM Service] Max Tokens: {final_max_tokens}")
            print(f"[LLM Service] 主题: {topic}")
            print("=" * 60 + "\n")
            
            logger.info("\n" + "=" * 60)
            logger.info("=" * 20 + " 调用 LLM API " + "=" * 20)
            logger.info("=" * 60)
            logger.info(f"[LLM Service] 模型名称: {final_model}")
            logger.info(f"[LLM Service] API 地址: {final_api_url}")
            logger.info(f"[LLM Service] API Key 来源: {api_key_source}")
            logger.info(f"[LLM Service] Temperature: {final_temperature}")
            logger.info(f"[LLM Service] Max Tokens: {final_max_tokens}")
            logger.info(f"[LLM Service] 主题: {topic}")
            logger.info("=" * 60 + "\n")
            
            headers = {
                'Authorization': f'Bearer {final_api_key}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                'model': final_model,
                'messages': [{'role': 'user', 'content': prompt}],
                'temperature': final_temperature,
                'max_tokens': final_max_tokens
            }
            
            # 记录请求开始时间
            import time
            start_time = time.time()
            
            print(f"[LLM Service] 正在向 {final_api_url} 发送请求...")
            print(f"[LLM Service] 请求 Payload: model={final_model}, temperature={final_temperature}, max_tokens={final_max_tokens}")
            logger.info(f"[LLM Service] 正在向 {final_api_url} 发送请求...")
            logger.info(f"[LLM Service] 请求 Payload: model={final_model}, temperature={final_temperature}, max_tokens={final_max_tokens}")
            
            # 拉长等待时间，避免大模型长响应导致超时
            response = requests.post(final_api_url, headers=headers, json=payload, timeout=60)
            response.raise_for_status()
            
            # 计算响应时间
            response_time = (time.time() - start_time) * 1000  # 转换为毫秒
            
            result = response.json()
            content = result['choices'][0]['message']['content']
            
            # 格式化完整响应 JSON
            import json
            full_response_json = json.dumps(result, ensure_ascii=False, indent=2)
            
            print("\n" + "=" * 60)
            print("=" * 20 + " LLM API 响应 " + "=" * 20)
            print("=" * 60)
            print(f"[LLM Service] 响应状态码: {response.status_code}")
            print(f"[LLM Service] 响应时间: {response_time:.2f}ms")
            print(f"[LLM Service] 响应内容长度: {len(content)} 字符")
            print("\n[LLM Service] ========== 完整响应 JSON ==========")
            print(full_response_json)
            print("\n[LLM Service] ========== 完整响应内容 ==========")
            print(content)
            print("=" * 60)
            print(f"[LLM Service] ✓ 成功生成知识 - 主题: {topic}, 模型: {final_model}")
            print("=" * 60 + "\n")
            
            logger.info("\n" + "=" * 60)
            logger.info("=" * 20 + " LLM API 响应 " + "=" * 20)
            logger.info("=" * 60)
            logger.info(f"[LLM Service] 响应状态码: {response.status_code}")
            logger.info(f"[LLM Service] 响应时间: {response_time:.2f}ms")
            logger.info(f"[LLM Service] 响应内容长度: {len(content)} 字符")
            logger.info("\n[LLM Service] ========== 完整响应 JSON ==========")
            logger.info(full_response_json)
            logger.info("\n[LLM Service] ========== 完整响应内容 ==========")
            logger.info(content)
            logger.info("=" * 60)
            logger.info(f"[LLM Service] ✓ 成功生成知识 - 主题: {topic}, 模型: {final_model}")
            logger.info("=" * 60 + "\n")
            return {
                'content': content,
                'topic': topic
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"LLM API request failed: {str(e)}", exc_info=True)
            raise ThirdPartyAPIError(f"LLM API request failed: {str(e)}") from e
        except ValueError as e:
            logger.error(f"Invalid LLM configuration: {str(e)}", exc_info=True)
            raise ValueError(f"Invalid LLM configuration: {str(e)}") from e
        except Exception as e:
            logger.error(f"Error generating knowledge: {str(e)}", exc_info=True)
            raise

# 创建LLM服务实例
llm_service = LLMService()

# 向后兼容：保留 deepseek_service 别名
deepseek_service = llm_service

