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
                "【判断优先级】先判定是否为小学基础知识；若是，直接返回基础知识结果，不再拆解；若不是，再进行拆解。\n\n"
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
    
    @staticmethod
    def generate_ai_question_prompt(topic, context=None, question=None, conversation_history=None, model=None):
        """
        生成用于 AI 深度追问的提示
        
        Args:
            topic (str): 节点主题
            context (dict, optional): 节点上下文（包含 summary 和 concepts）
            question (str): 用户问题
            conversation_history (list, optional): 对话历史
            model (str, optional): 使用的模型名称
            
        Returns:
            str: 生成的提示
        """
        try:
            model_info = f"（当前使用的模型：{model}）" if model else ""
            
            # 构建上下文信息
            context_text = ""
            if context:
                summary = context.get('summary', '')
                concepts = context.get('concepts', [])
                
                if summary:
                    context_text += f"【主题概述】\n{summary}\n\n"
                
                if concepts and len(concepts) > 0:
                    context_text += "【核心概念】\n"
                    for idx, concept in enumerate(concepts, 1):
                        name = concept.get('name', '')
                        desc = concept.get('description', '')
                        context_text += f"{idx}. {name}"
                        if desc:
                            context_text += f": {desc}"
                        context_text += "\n"
                    context_text += "\n"
            
            # 构建对话历史
            history_text = ""
            if conversation_history and len(conversation_history) > 0:
                history_text = "【对话历史】\n"
                for msg in conversation_history[-5:]:  # 只保留最近5轮对话
                    role = msg.get('role', '')
                    content = msg.get('content', '')
                    if role == 'user':
                        history_text += f"用户: {content}\n"
                    elif role == 'assistant':
                        history_text += f"AI: {content}\n"
                history_text += "\n"
            
            # 构建完整提示
            prompt = (
                f"你是知识图谱助手{model_info}，专门帮助用户深入理解知识图谱中的概念。\n\n"
                f"【当前主题】\n{topic}\n\n"
            )
            
            if context_text:
                prompt += context_text
            
            if history_text:
                prompt += history_text
            
            prompt += (
                "【回答要求】\n"
                "1. 基于提供的主题和上下文信息回答问题\n"
                "2. 如果对话历史存在，请保持回答的连贯性，参考之前的对话内容\n"
                "3. 回答要准确、详细，但不要超出主题范围\n"
                "4. 如果问题涉及概念之间的关系，请结合上下文中的概念列表进行说明\n"
                "5. 使用清晰的结构和适当的例子来帮助理解\n"
                "6. 如果问题无法基于当前上下文回答，请礼貌地说明\n\n"
                f"【用户问题】\n{question}\n\n"
                "请基于以上信息回答用户的问题："
            )
            
            logger.debug(f"Generated AI question prompt for topic: {topic}, question length: {len(question) if question else 0}")
            return prompt
            
        except Exception as e:
            logger.error(f"Error generating AI question prompt: {str(e)}", exc_info=True)
            raise
    
    @staticmethod
    def generate_code_example_prompt(topic, context=None, model=None):
        """
        生成用于生成 Python 应用案例代码的提示
        
        Args:
            topic (str): 节点主题
            context (dict, optional): 节点上下文（包含 summary 和 concepts）
            model (str, optional): 使用的模型名称
            
        Returns:
            str: 生成的提示
        """
        try:
            model_info = f"（当前使用的模型：{model}）" if model else ""
            
            # 构建上下文信息
            context_text = ""
            if context:
                summary = context.get('summary', '')
                concepts = context.get('concepts', [])
                
                if summary:
                    context_text += f"【主题概述】\n{summary}\n\n"
                
                if concepts and len(concepts) > 0:
                    context_text += "【核心概念】\n"
                    for idx, concept in enumerate(concepts, 1):
                        name = concept.get('name', '')
                        desc = concept.get('description', '')
                        context_text += f"{idx}. {name}"
                        if desc:
                            context_text += f": {desc}"
                        context_text += "\n"
                    context_text += "\n"
            
            # 构建完整提示
            prompt = (
                f"你是Python编程专家{model_info}。请为「{topic}」生成一个简单、易懂、具有代表性的Python使用案例代码。\n"
                f"要求代码简洁明了，初学者能轻松理解，不需要是完整的实际应用项目，只需要展示「{topic}」的基本使用方法即可。\n\n"
            )
            
            if context_text:
                prompt += context_text
            
            prompt += (
                f"【代码要求】\n"
                f"1. 代码必须简单易懂，初学者能轻松理解\n"
                f"2. 代码要简洁，不要过于复杂，控制在50行以内\n"
                f"3. 代码要具有代表性，能清晰展示「{topic}」的核心概念和使用方法\n"
                f"4. 不需要是完整的实际应用项目，只需要简单的使用案例即可\n"
                f"5. 使用基础的Python语法和常用库（如需要，优先使用标准库）\n"
                f"6. 包含简单的示例数据，使代码可以直接运行并看到结果\n"
                f"7. 代码要有清晰的注释，解释关键步骤，帮助初学者理解\n"
                f"8. 如果提供了概念列表，代码应简单展示这些概念的基本用法\n"
                f"9. 避免使用高级特性或复杂的编程模式\n"
                f"10. 代码应该是一个简洁的、有代表性的示例，能帮助初学者理解主题\n\n"
                f"【代码结构要求】\n"
                f"- 代码开头必须包含一个多行注释块（使用三引号），介绍这个使用案例：\n"
                f"  * 说明这个案例是做什么的\n"
                f"  * 展示了「{topic}」的什么概念或用法\n"
                f"  * 这个案例能帮助理解什么\n"
                f"  * 如何运行这个代码\n"
                f"- 代码中的函数或类要有文档字符串（docstring），说明其作用\n"
                f"- 关键步骤要有行内注释，解释在做什么\n\n"
                f"【输出要求】\n"
                f"- 只输出Python代码，不要任何其他说明文字\n"
                f"- 不要使用markdown代码块标记（如 ```python）\n"
                f"- 代码应该可以直接复制运行\n"
                f"- 确保代码语法正确，可以执行\n"
                f"- 保持代码简洁，避免冗余\n"
                f"- 代码开头必须包含介绍性注释\n\n"
                f"现在为「{topic}」生成一个简单、易懂、具有代表性的Python使用案例："
            )
            
            logger.debug(f"Generated code example prompt for topic: {topic}, has concepts: {bool(context and context.get('concepts'))}")
            return prompt
            
        except Exception as e:
            logger.error(f"Error generating code example prompt: {str(e)}", exc_info=True)
            raise

# 创建提示服务实例
prompt_service = PromptService()
