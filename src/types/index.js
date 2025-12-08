/**
 * 知识概念节点类型
 * @typedef {Object} Node
 * @property {number} id - 节点唯一标识符
 * @property {string} topic - 节点主题
 * @property {string} description - 节点描述
 * @property {number} x - 节点x坐标
 * @property {number} y - 节点y坐标
 * @property {number} width - 节点宽度
 * @property {number} height - 节点高度
 * @property {number} padding - 节点内边距
 * @property {string} color - 节点颜色
 * @property {number|null} parentId - 父节点ID
 * @property {number} level - 节点层级
 * @property {Knowledge|null} knowledge - 节点知识数据
 * @property {boolean} expanding - 节点是否正在展开
 * @property {boolean} expanded - 节点是否已展开
 * @property {Object|null} cachedChildren - 预缓存的子节点数据
 * @property {boolean} preloading - 是否正在预加载
 */

/**
 * 节点连接类型
 * @typedef {Object} Connection
 * @property {number} from - 源节点ID
 * @property {number} to - 目标节点ID
 */

/**
 * 知识概念类型
 * @typedef {Object} Concept
 * @property {string} name - 概念名称
 * @property {string} description - 概念描述
 */

/**
 * 知识数据类型
 * @typedef {Object} Knowledge
 * @property {string} topic - 知识主题
 * @property {Concept[]} concepts - 关联概念列表
 * @property {string} description - 知识描述
 * @property {string} summary - 知识摘要
 */

/**
 * 画布配置类型
 * @typedef {Object} CanvasConfig
 * @property {number} minScale - 最小缩放比例
 * @property {number} maxScale - 最大缩放比例
 * @property {number} defaultScale - 默认缩放比例
 * @property {number} animationDuration - 动画持续时间
 */

/**
 * 节点配置类型
 * @typedef {Object} NodeConfig
 * @property {number} minWidth - 节点最小宽度
 * @property {number} maxWidth - 节点最大宽度
 * @property {number} minHeight - 节点最小高度
 * @property {number} padding - 节点内边距
 * @property {number} fontSize - 节点字体大小
 */

/**
 * 力导向布局配置类型
 * @typedef {Object} ForceLayoutConfig
 * @property {number} linkDistance - 连接线距离
 * @property {number} chargeStrength - 电荷强度
 * @property {number} collisionRadius - 碰撞半径
 */

/**
 * 颜色配置类型
 * @typedef {Object} ColorConfig
 * @property {string[]} palette - 颜色调色板
 */

/**
 * 应用配置类型
 * @typedef {Object} Config
 * @property {CanvasConfig} canvas - 画布配置
 * @property {NodeConfig} node - 节点配置
 * @property {ForceLayoutConfig} forceLayout - 力导向布局配置
 * @property {ColorConfig} colors - 颜色配置
 */

/**
 * API请求体类型
 * @typedef {Object} ApiRequest
 * @property {string} topic - 知识主题
 * @property {string[]} path - 知识路径
 * @property {Knowledge|null} existing_knowledge - 现有知识数据
 */

/**
 * API响应类型
 * @typedef {Object} ApiResponse
 * @property {string} content - API响应内容
 * @property {string} [error] - 错误信息
 */

/**
 * 导出数据类型
 * @typedef {Object} ExportData
 * @property {Node[]} nodes - 节点数据
 * @property {Connection[]} connections - 连接数据
 * @property {string} exportTime - 导出时间
 */

/**
 * 导入数据类型
 * @typedef {ExportData} ImportData
 */

/**
 * 布局类型
 * @typedef {'radial' | 'hierarchical'} LayoutType
 */

/**
 * 图谱服务类型
 * @typedef {Object} GraphService
 * @property {Function} addTopic - 添加主题节点
 * @property {Function} clearCanvas - 清空画布
 * @property {Function} handleNodeClick - 处理节点点击
 * @property {Function} updateNode - 更新节点
 * @property {Function} deleteNode - 删除节点
 */

/**
 * 节点操作 Composable 返回类型
 * @typedef {Object} NodeOperations
 * @property {import('vue').Ref<boolean>} showEntityEditor - 是否显示实体编辑器
 * @property {import('vue').Ref<Object|null>} currentEditingEntity - 当前编辑的实体
 * @property {Function} addTopic - 添加主题
 * @property {Function} clearCanvas - 清空画布
 * @property {Function} handleNodeClick - 处理节点点击
 * @property {Function} handleEntitySave - 处理实体保存
 * @property {Function} openEntityEditor - 打开实体编辑器
 * @property {Function} closeEntityEditor - 关闭实体编辑器
 */

/**
 * 节点展开 Composable 返回类型
 * @typedef {Object} NodeExpansion
 * @property {import('vue').Ref<boolean>} loading - 是否正在加载
 * @property {Function} expandNode - 展开节点
 */

/**
 * 事件管理器类型
 * @typedef {Object} EventManager
 * @property {Function} on - 注册事件监听器
 * @property {Function} off - 移除事件监听器
 * @property {Function} clearNamespace - 清除命名空间下的所有监听器
 * @property {Function} clearAll - 清除所有监听器
 * @property {Function} emit - 触发事件
 */

/**
 * 日志系统类型
 * @typedef {Object} Logger
 * @property {Function} debug - 调试日志
 * @property {Function} info - 信息日志
 * @property {Function} warn - 警告日志
 * @property {Function} error - 错误日志
 * @property {Function} setLevel - 设置日志级别
 * @property {Function} setEnabled - 启用/禁用日志
 */

/**
 * D3 布局引擎函数类型
 * @typedef {Function} LayoutFunction
 * @param {Node[]} nodes - 节点数组
 * @param {Node} focusedNode - 聚焦节点
 * @param {number} width - 画布宽度
 * @param {number} height - 画布高度
 * @returns {void}
 */

/**
 * D3 渲染器函数类型
 * @typedef {Function} RenderFunction
 * @param {Object} g - D3 选择器（容器组）
 * @param {Array} data - 数据数组
 * @param {Function} [callback] - 回调函数
 * @returns {Object} D3 选择器
 */

// 导出类型定义
export {}