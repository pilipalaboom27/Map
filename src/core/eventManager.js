/**
 * 统一事件管理器
 * 管理所有全局事件监听器，避免内存泄漏
 */

class EventManager {
  constructor() {
    this.listeners = new Map()
    this.namespaces = new Map()
  }

  /**
   * 注册事件监听器
   * @param {string} event - 事件名称
   * @param {Function} handler - 事件处理函数
   * @param {Object} options - 选项 { namespace, priority, target, once }
   */
  on(event, handler, options = {}) {
    const {
      namespace = 'default',
      priority = 0,
      target = window,
      once = false
    } = options

    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }

    const listener = {
      handler,
      namespace,
      priority,
      target,
      once,
      id: `${namespace}-${Date.now()}-${Math.random()}`
    }

    const listeners = this.listeners.get(event)
    listeners.push(listener)
    
    // 按优先级排序
    listeners.sort((a, b) => b.priority - a.priority)

    // 绑定事件
    target.addEventListener(event, handler, options)

    // 记录命名空间
    if (!this.namespaces.has(namespace)) {
      this.namespaces.set(namespace, [])
    }
    this.namespaces.get(namespace).push({ event, listener })

    return listener.id
  }

  /**
   * 移除事件监听器
   * @param {string} event - 事件名称
   * @param {Function|string} handlerOrId - 处理函数或监听器ID
   * @param {Object} options - 选项 { namespace, target }
   */
  off(event, handlerOrId, options = {}) {
    const { namespace, target = window } = options

    if (!this.listeners.has(event)) {
      return
    }

    const listeners = this.listeners.get(event)
    const index = listeners.findIndex(listener => {
      if (typeof handlerOrId === 'string') {
        return listener.id === handlerOrId
      }
      return listener.handler === handlerOrId && 
             (!namespace || listener.namespace === namespace) &&
             (!target || listener.target === target)
    })

    if (index !== -1) {
      const listener = listeners[index]
      listener.target.removeEventListener(event, listener.handler)
      listeners.splice(index, 1)

      // 清理命名空间记录
      if (namespace && this.namespaces.has(namespace)) {
        const namespaceListeners = this.namespaces.get(namespace)
        const nsIndex = namespaceListeners.findIndex(
          item => item.event === event && item.listener.id === listener.id
        )
        if (nsIndex !== -1) {
          namespaceListeners.splice(nsIndex, 1)
        }
      }
    }
  }

  /**
   * 移除命名空间下的所有监听器
   * @param {string} namespace - 命名空间
   */
  clearNamespace(namespace) {
    if (!this.namespaces.has(namespace)) {
      return
    }

    const namespaceListeners = this.namespaces.get(namespace)
    namespaceListeners.forEach(({ event, listener }) => {
      listener.target.removeEventListener(event, listener.handler)
      const listeners = this.listeners.get(event)
      if (listeners) {
        const index = listeners.findIndex(l => l.id === listener.id)
        if (index !== -1) {
          listeners.splice(index, 1)
        }
      }
    })

    this.namespaces.delete(namespace)
  }

  /**
   * 移除所有事件监听器
   */
  clearAll() {
    this.listeners.forEach((listeners, event) => {
      listeners.forEach(listener => {
        listener.target.removeEventListener(event, listener.handler)
      })
    })
    this.listeners.clear()
    this.namespaces.clear()
  }

  /**
   * 触发事件（用于自定义事件）
   * @param {string} event - 事件名称
   * @param {*} data - 事件数据
   */
  emit(event, data) {
    if (!this.listeners.has(event)) {
      return
    }

    const listeners = this.listeners.get(event)
    listeners.forEach(listener => {
      try {
        listener.handler(data)
        if (listener.once) {
          this.off(event, listener.id)
        }
      } catch (error) {
        console.error(`事件 ${event} 处理失败:`, error)
      }
    })
  }
}

// 单例模式
export const eventManager = new EventManager()

// Vue composable
export function useEventManager() {
  const namespace = `component-${Date.now()}-${Math.random()}`

  const on = (event, handler, options = {}) => {
    return eventManager.on(event, handler, { ...options, namespace })
  }

  const off = (event, handlerOrId, options = {}) => {
    return eventManager.off(event, handlerOrId, { ...options, namespace })
  }

  const clear = () => {
    eventManager.clearNamespace(namespace)
  }

  return {
    on,
    off,
    clear,
    namespace
  }
}

