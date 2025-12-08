from backend.app.utils.logger import export_logger as logger

class PromptService:
    """提示生成服务"""
    
    @staticmethod
    def generate_knowledge_prompt(topic, existing_knowledge=None, path=None, model=None):
        """
        生成用于获取知识的提示
        
        Args:
            topic (str): 主题
            existing_knowledge (dict, optional): 现有知识
            path (list, optional): 路径
            model (str, optional): 使用的模型名称
            
        Returns:
            str: 生成的提示
        """
        try:
            path_chain = " > ".join(path or []) or topic
            model_info = f"（当前使用的模型：{model}）" if model else ""
            # 将路径中的父节点链路加入提示，便于模型保持上下文相关
            parents_text = ""
            if path and len(path) > 0:
                parents_text = "父节点链路：" + " > ".join(path) + "。请确保拆分结果与该链路保持前置关联。\n"
            
            prompt = (
                f"你是知识分解专家{model_info}。将「{topic}」拆分为学习它的前置基础知识，形成学习路线。\n\n"
                f"{parents_text}"
                "【判断优先级】先判定是否为基础知识；若是，直接返回基础知识结果，不再拆解；若不是，再进行拆解。\n\n"
                "基础知识判定条件（满足任一即可判定为基础知识，停止拆解）：\n"
                " - 小学三年级及以前课本/常识；或\n"
                " - 日常生活基本技能或常识（吃喝睡、洗漱卫生、安全常识）；或\n"
                " - 基础感知与计数（颜色、形状、方向、星期/月份、10以内加减、简单时间概念）。\n"
                "若判定为基础知识，直接返回："
                "{\"topic\":\"...\",\"summary\":\"已是基础知识，无需再拆分\",\"concepts\":[],\"model\":\"模型名称\"}\n\n"
                "若判定为“可拆解”（非基础知识），再遵循以下要求进行拆分：\n"
                f"1. 只拆分出比「{topic}」更基础、且直接支撑理解「{topic}」的概念，能回答“学会它才能更好理解/应用{topic}”\n"
                f"2. 拆分的知识点必须比「{topic}」更简单、更基础，不能更高级或无关；避免跑题与泛化\n"
                "3. 每个子概念必须是「{topic}」的直接/间接前置，避免无关常识\n"
                "4. 在 summary 中：\n"
                "   - 概括当前主题的核心概念是什么\n"
                "   - 说明子概念与「{topic}」及其父节点链路的关联与支撑作用\n"
                "5. 非基础知识时拆分3-6个基础概念\n"
                "6. 概念 name 限制长度：不超过 8 个汉字（或 20 个字符），保持简洁明确\n"
                "7. 必须在返回的JSON中包含\"model\"字段，值为当前使用的模型名称\n\n"
                "JSON格式（只输出JSON，无其他文字）：\n"
                '{"topic":"...","summary":"简要介绍，含与原主题的关联说明","model":"模型名称","concepts":[\n'
                '  {"name":"概念名（<=12汉字或<=20字符）","description":"一句话说明 + 为何能支撑原主题"}\n'
                ']}\n\n'
                "示例：\n"
                '{"topic":"机器学习","summary":"人工智能的核心分支，需要线性代数/概率论/微积分支撑","model":"deepseek-chat","concepts":[\n'
                '  {"name":"线性代数","description":"矩阵运算支撑特征表示与模型计算"},\n'
                '  {"name":"概率论","description":"支撑概率模型与损失函数"},\n'
                '  {"name":"微积分","description":"支撑梯度计算与优化"}\n'
                ']}\n\n'
                f"现在分析「{topic}」：\n"
                f"- name：具体知识点名称（如「线性代数」「梯度下降」），限制 <=12 汉字或 <=20 字符\n"
                f"- description：一句话说明该知识点的作用概念，并说明与「{topic}」及其父节点链路的关联/支撑性\n"
                f"- model：必须填写当前使用的模型名称（{model or '请填写实际使用的模型名称'}）\n"
                "注意：name必须是真实知识点，不要用占位词！只输出JSON，不要markdown标记。"
            )
            
            logger.debug(f"Generated knowledge prompt for topic: {topic}, model: {model}")
            return prompt
            
        except Exception as e:
            logger.error(f"Error generating knowledge prompt: {str(e)}", exc_info=True)
            raise

# 创建提示服务实例
prompt_service = PromptService()
