/**
 * Python 示例代码生成工具
 * 基于节点信息生成 Python 示例代码
 */

/**
 * 基于节点信息生成Python示例代码
 * @param {Object} node - 节点对象
 * @returns {string} Python代码字符串
 */
export function generatePythonExample(node) {
  if (!node) {
    return generateDefaultExample()
  }

  const topic = node.topic || '未知主题'
  const summary = node.knowledge?.summary || ''
  const concepts = node.knowledge?.concepts || []
  const description = node.knowledge?.description || node.description || ''
  const model = node.knowledge?.model || null

  // 如果有概念列表，生成基于概念的示例
  if (concepts.length > 0) {
    return generateConceptBasedExample(topic, summary, concepts, model)
  }

  // 如果有摘要，生成基于摘要的示例
  if (summary) {
    return generateSummaryBasedExample(topic, summary, description, model)
  }

  // 默认示例
  return generateDefaultExample(topic)
}

/**
 * 基于概念列表生成示例
 */
function generateConceptBasedExample(topic, summary, concepts, model = null) {
  const topicVar = toSnakeCase(topic)
  const className = toPascalCase(topic)
  
  let code = `"""
${topic} - Python 示例代码

${summary || '基于知识图谱生成的示例代码'}
${model ? `\n生成模型: ${model}` : ''}
"""

`
  
  // 导入常用库
  code += `import numpy as np
import pandas as pd
from typing import List, Dict, Optional

`
  
  // 生成类定义
  code += `class ${className}:
    """
    ${topic} 示例类
    
    包含以下核心概念：
${concepts.map(c => `    - ${c.name}: ${c.description || '无描述'}`).join('\n')}
    """
    
    def __init__(self):
        """初始化 ${topic}"""
        self.topic = "${topic}"
        self.concepts = {
`
  
  // 添加概念属性
  concepts.forEach((concept, index) => {
    const conceptVar = toSnakeCase(concept.name)
    code += `            "${concept.name}": {
                "name": "${concept.name}",
                "description": "${concept.description || '无描述'}",
                "value": None  # 在此处设置实际值
            }`
    if (index < concepts.length - 1) {
      code += ',\n'
    } else {
      code += '\n'
    }
  })
  
  code += `        }
    
    def demonstrate(self):
        """演示 ${topic} 的核心概念"""
        print(f"主题: {self.topic}")
        print("=" * 50)
        
        for concept_name, concept_data in self.concepts.items():
            print(f"\\n概念: {concept_name}")
            print(f"  描述: {concept_data['description']}")
            # 在此处添加实际演示代码
            print(f"  示例值: {concept_data['value']}")
    
    def get_concept(self, name: str) -> Optional[Dict]:
        """获取指定概念的信息"""
        return self.concepts.get(name)
    
    def list_concepts(self) -> List[str]:
        """列出所有概念名称"""
        return list(self.concepts.keys())


# 使用示例
if __name__ == "__main__":
    # 创建 ${topic} 实例
    ${topicVar} = ${className}()
    
    # 演示核心概念
    ${topicVar}.demonstrate()
    
    # 获取特定概念
    print("\\n" + "=" * 50)
    print("概念列表:")
    for concept_name in ${topicVar}.list_concepts():
        concept = ${topicVar}.get_concept(concept_name)
        if concept:
            print(f"  - {concept_name}: {concept['description']}")
`

  return code
}

/**
 * 基于摘要生成示例
 */
function generateSummaryBasedExample(topic, summary, description, model = null) {
  const topicVar = toSnakeCase(topic)
  const funcName = toSnakeCase(topic)
  
  let code = `"""
${topic} - Python 示例代码

${summary}

${description ? `详细说明: ${description}` : ''}
${model ? `\n生成模型: ${model}` : ''}
"""

import numpy as np
from typing import Any, Optional

`
  
  code += `def ${funcName}_example():
    """
    ${topic} 示例函数
    
    ${summary}
    """
    print("=" * 50)
    print(f"${topic} 示例")
    print("=" * 50)
    print()
    print("${summary}")
    print()
    
    # 在此处添加实际示例代码
    # 示例数据结构
    data = {
        "topic": "${topic}",
        "summary": "${summary}",
        "description": "${description || '无描述'}"
    }
    
    print("数据结构:")
    for key, value in data.items():
        print(f"  {key}: {value}")
    
    return data


def ${funcName}_demo():
    """演示 ${topic} 的基本用法"""
    result = ${funcName}_example()
    print("\\n演示完成!")
    return result


# 使用示例
if __name__ == "__main__":
    # 运行示例
    ${funcName}_demo()
`

  return code
}

/**
 * 生成默认示例
 */
function generateDefaultExample(topic = '示例主题') {
  const topicVar = toSnakeCase(topic)
  
  return `"""
${topic} - Python 示例代码

这是一个基于知识图谱生成的示例代码模板。
"""

def ${topicVar}_example():
    """
    ${topic} 示例函数
    
    在此处添加实际的示例代码
    """
    print("=" * 50)
    print(f"${topic} 示例")
    print("=" * 50)
    print()
    print("这是一个示例函数，请根据实际需求修改代码。")
    print()
    
    # 示例代码
    example_data = {
        "topic": "${topic}",
        "status": "示例"
    }
    
    print("示例数据:")
    for key, value in example_data.items():
        print(f"  {key}: {value}")
    
    return example_data


# 使用示例
if __name__ == "__main__":
    result = ${topicVar}_example()
    print("\\n示例执行完成!")
`
}

/**
 * 转换为蛇形命名（snake_case）
 */
function toSnakeCase(str) {
  if (!str) return 'example'
  
  return str
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    || 'example'
}

/**
 * 转换为帕斯卡命名（PascalCase）
 */
function toPascalCase(str) {
  if (!str) return 'Example'
  
  return str
    .split(/[\s\-_]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('')
    .replace(/[^a-zA-Z0-9]/g, '')
    || 'Example'
}

