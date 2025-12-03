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
            
            avoid = f"\n❌ 避免重复这些内容：{explored}" if explored else ""
            
            prompt = (
                f"你是知识分解专家。分析「{topic}」需要哪些基础知识。路径：{path_chain}\n\n"
                "严格按以下JSON格式返回（只输出JSON，无其他文字）：\n\n"
                
                "✅ 正确示例1（机器学习）：\n"
                '{"topic":"机器学习","summary":"机器学习是人工智能的核心分支...","concepts":['
                '{"name":"监督学习","description":"基于标注数据训练模型","status":"ongoing"},'
                '{"name":"无监督学习","description":"从无标注数据发现模式","status":"ongoing"},'
                '{"name":"特征工程","description":"数据预处理和特征提取","status":"ongoing"}'
                '],"notes":"这些是机器学习的核心基础"}\n\n'
                
                "✅ 正确示例2（支持向量机）：\n"
                '{"topic":"支持向量机","summary":"SVM是一种监督学习算法...","concepts":['
                '{"name":"最大间隔","description":"寻找最优分类超平面","status":"ongoing"},'
                '{"name":"核函数","description":"将数据映射到高维空间","status":"ongoing"},'
                '{"name":"拉格朗日乘子法","description":"求解优化问题的方法","status":"ongoing"}'
                '],"notes":"这些是SVM的理论基础"}\n\n'
                
                '❌ 错误示例（绝对禁止）：\n'
                '{"topic":"topic","summary":"summary","concepts":['
                '{"name":"name","description":"description","status":"ongoing"},'
                '{"name":"概念1","description":"说明1","status":"ongoing"}'
                ']}\n'
                '↑ 不要使用\"name\"、\"topic\"、\"概念1\"等占位词！\n\n'
                
                f"现在请为「{topic}」生成3-6个实际基础知识点：\n"
                f"- name字段：填写具体知识点名称（如「线性代数」「梯度下降」）\n"
                f"- description字段：用一句话说明该知识点的作用\n"
                f"- 如果「{topic}」已经是最基础概念，返回空数组：'concepts':[]"
                f"{avoid}\n\n"
                "记住：name必须是真实知识点，不要用字段名！只输出JSON，不要markdown标记。"
            )
            
            logger.debug(f"Generated knowledge prompt for topic: {topic}")
            return prompt
            
        except Exception as e:
            logger.error(f"Error generating knowledge prompt: {str(e)}", exc_info=True)
            raise

# 创建提示服务实例
prompt_service = PromptService()
