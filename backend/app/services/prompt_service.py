from backend.app.utils.logger import export_logger as logger

class PromptService:
    """提示生成服务"""
    
    @staticmethod
    def generate_knowledge_prompt(topic, existing_knowledge=None, path=None):
        """
        生成用于获取知识的提示
        
        Args:
            topic (str): 主题
            existing_knowledge (dict, optional): 现有知识
            path (list, optional): 路径
            
        Returns:
            str: 生成的提示
        """
        try:
            path_chain = " > ".join(path or []) or topic
            explored = ""
            
            if existing_knowledge and existing_knowledge.get('concepts'):
                names = [c.get('name', c) if isinstance(c, dict) else c 
                        for c in existing_knowledge['concepts']]
                explored = '、'.join(names[:3])
            
            avoid = f"\n避免重复：{explored}" if explored else ""
            
            prompt = (
                f"你是知识层级拆解专家。分析「{topic}」(路径：{path_chain})，将其向下拆解为更基础的知识点，形成层级关系。\n"
                "严格按以下JSON格式返回，只输出JSON：\n"
                '{"topic":"主题名","summary":"主题简述（20字内）","concepts":[{"name":"知识点名","description":"一句话说明作用","status":"ongoing"}],"notes":"备注"}'
                f"\n\n要求：\n"
                f"1. 生成3-6个直接相关的基础知识概念\n"
                f"2. 从高等级知识逐步拆解到更基础的知识\n"
                f"3. name必须是具体知识点，拒绝占位词\n"
                f"4. 若{topic}已是最基础概念，concepts返回空数组{avoid}\n"
                "只输出JSON，无其他内容。"
            )
            
            logger.debug(f"Generated knowledge prompt for topic: {topic}")
            return prompt
            
        except Exception as e:
            logger.error(f"Error generating knowledge prompt: {str(e)}", exc_info=True)
            raise

# 创建提示服务实例
prompt_service = PromptService()
