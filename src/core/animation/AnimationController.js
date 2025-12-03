import gsap from 'gsap'

/**
 * 动画控制器 - 使用 GSAP 提供流畅的动画效果
 */
export class AnimationController {
  constructor() {
    this.timeline = gsap.timeline()
    this.activeAnimations = new Map()
  }

  /**
   * 节点移动到中心动画
   * @param {HTMLElement} element - DOM 元素
   * @param {Object} from - 起始位置 {x, y}
   * @param {Object} to - 目标位置 {x, y}
   * @param {number} duration - 持续时间（秒）
   */
  animateNodeToCenter(element, from, to, duration = 1.2) {
    return gsap.to(element, {
      attr: {
        transform: `translate(${to.x}, ${to.y})`
      },
      duration,
      ease: 'power2.inOut',
      onUpdate: () => {
        // 可以在这里触发回调以更新其他元素
      }
    })
  }

  /**
   * 节点缩放动画
   * @param {HTMLElement} element - DOM 元素
   * @param {number} scale - 目标缩放比例
   * @param {number} duration - 持续时间（秒）
   */
  animateNodeScale(element, scale, duration = 0.6) {
    return gsap.to(element, {
      scale,
      duration,
      ease: 'back.out(1.2)',
      transformOrigin: 'center center'
    })
  }

  /**
   * 节点出现动画（从小到大，带弹性）
   * @param {HTMLElement} element - DOM 元素
   * @param {Object} options - 配置选项
   */
  animateNodeEnter(element, options = {}) {
    const {
      delay = 0,
      duration = 0.8,
      from = { scale: 0, opacity: 0 },
      to = { scale: 1, opacity: 1 }
    } = options

    return gsap.fromTo(element, from, {
      ...to,
      duration,
      delay,
      ease: 'elastic.out(1, 0.5)',
      transformOrigin: 'center center'
    })
  }

  /**
   * 节点退出动画（缩小消失）
   * @param {HTMLElement} element - DOM 元素
   * @param {Object} options - 配置选项
   */
  animateNodeExit(element, options = {}) {
    const {
      duration = 0.4,
      to = { scale: 0, opacity: 0 }
    } = options

    return gsap.to(element, {
      ...to,
      duration,
      ease: 'power2.in',
      transformOrigin: 'center center'
    })
  }

  /**
   * 边绘制动画（线条从起点到终点）
   * @param {HTMLElement} element - 线条元素
   * @param {number} duration - 持续时间（秒）
   */
  animateEdgeDraw(element, duration = 0.8) {
    const length = element.getTotalLength()
    
    // 设置初始状态
    gsap.set(element, {
      strokeDasharray: length,
      strokeDashoffset: length
    })

    // 动画到完全显示
    return gsap.to(element, {
      strokeDashoffset: 0,
      duration,
      ease: 'power2.inOut'
    })
  }

  /**
   * 节点脉动动画（吸引注意力）
   * @param {HTMLElement} element - DOM 元素
   * @param {Object} options - 配置选项
   */
  animateNodePulse(element, options = {}) {
    const {
      scale = 1.1,
      duration = 1,
      repeat = -1
    } = options

    return gsap.to(element, {
      scale,
      duration,
      repeat,
      yoyo: true,
      ease: 'sine.inOut',
      transformOrigin: 'center center'
    })
  }

  /**
   * 创建粒子爆炸效果
   * @param {Object} position - 位置 {x, y}
   * @param {Object} options - 配置选项
   */
  createParticleEffect(position, options = {}) {
    const {
      count = 20,
      color = '#10b981',
      radius = 100,
      duration = 1
    } = options

    const particles = []

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const distance = radius + Math.random() * 50
      
      const particle = {
        x: position.x,
        y: position.y,
        targetX: position.x + Math.cos(angle) * distance,
        targetY: position.y + Math.sin(angle) * distance
      }

      particles.push(particle)

      // 创建粒子动画（这里只返回配置，实际DOM创建由调用者处理）
      gsap.to(particle, {
        x: particle.targetX,
        y: particle.targetY,
        duration,
        ease: 'power2.out',
        onComplete: () => {
          // 粒子消失
        }
      })
    }

    return particles
  }

  /**
   * 停止所有动画
   */
  killAll() {
    gsap.killTweensOf('*')
    this.activeAnimations.clear()
  }

  /**
   * 停止特定元素的动画
   * @param {HTMLElement} element - DOM 元素
   */
  kill(element) {
    gsap.killTweensOf(element)
  }

  /**
   * 创建时间线动画序列
   */
  createTimeline(options = {}) {
    return gsap.timeline(options)
  }

  /**
   * 编排多个节点的协调动画
   * @param {Array} nodes - 节点数组
   * @param {Function} animationFn - 动画函数
   * @param {number} stagger - 交错延迟
   */
  staggerAnimation(nodes, animationFn, stagger = 0.1) {
    const tl = gsap.timeline()
    
    nodes.forEach((node, index) => {
      tl.add(animationFn(node), index * stagger)
    })

    return tl
  }
}

