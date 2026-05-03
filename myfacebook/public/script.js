// ============================================
// 粒子背景
// ============================================
const canvas = document.getElementById('particles')
const ctx = canvas.getContext('2d')
let particles = []
let mouseX = -1000, mouseY = -1000

function resizeCanvas() {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}
resizeCanvas()
window.addEventListener('resize', resizeCanvas)

class Particle {
  constructor() { this.reset() }
  reset() {
    this.x = Math.random() * canvas.width
    this.y = Math.random() * canvas.height
    this.size = Math.random() * 2 + 0.5
    this.speedX = (Math.random() - 0.5) * 0.5
    this.speedY = (Math.random() - 0.5) * 0.5
    this.opacity = Math.random() * 0.5 + 0.1
  }
  update() {
    this.x += this.speedX
    this.y += this.speedY
    if (this.x < 0 || this.x > canvas.width) this.speedX *= -1
    if (this.y < 0 || this.y > canvas.height) this.speedY *= -1
  }
  draw() {
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(0, 200, 255, ${this.opacity})`
    ctx.fill()
  }
}

// 初始化粒子
const particleCount = Math.min(80, Math.floor(canvas.width * canvas.height / 15000))
for (let i = 0; i < particleCount; i++) particles.push(new Particle())

// 连线
function drawLines() {
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x
      const dy = particles[i].y - particles[j].y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 150) {
        ctx.beginPath()
        ctx.moveTo(particles[i].x, particles[i].y)
        ctx.lineTo(particles[j].x, particles[j].y)
        ctx.strokeStyle = `rgba(0, 200, 255, ${0.06 * (1 - dist / 150)})`
        ctx.lineWidth = 0.5
        ctx.stroke()
      }
    }
  }
}

// 鼠标交互
document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX
  mouseY = e.clientY
})

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  particles.forEach(p => { p.update(); p.draw() })
  drawLines()
  requestAnimationFrame(animate)
}
animate()

// ============================================
// 打字效果
// ============================================
const texts = ['商城管理部经理', '商业运营专家', '招商管理达人']
let textIdx = 0
let charIdx = 0
let isDeleting = false
const typedEl = document.querySelector('.typed-text')

function typeEffect() {
  const current = texts[textIdx]
  if (!isDeleting) {
    typedEl.textContent = current.substring(0, charIdx + 1)
    charIdx++
    if (charIdx === current.length) {
      isDeleting = true
      setTimeout(typeEffect, 2000)
      return
    }
  } else {
    typedEl.textContent = current.substring(0, charIdx - 1)
    charIdx--
    if (charIdx === 0) {
      isDeleting = false
      textIdx = (textIdx + 1) % texts.length
    }
  }
  setTimeout(typeEffect, isDeleting ? 60 : 100)
}
typeEffect()

// ============================================
// 滚动动画 (reveal)
// ============================================
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible')
    }
  })
}, { threshold: 0.1 })

document.querySelectorAll('.glass, .skill-tag, .timeline-item, .stat-item, .format-item, .project-details, .project-hero, .metric').forEach(el => {
  el.classList.add('reveal')
  observer.observe(el)
})

// ============================================
// 数字递增动画
// ============================================
const statObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target
      const target = parseInt(el.dataset.target)
      animateNumber(el, target)
      statObserver.unobserve(el)
    }
  })
}, { threshold: 0.5 })

document.querySelectorAll('.stat-num').forEach(el => statObserver.observe(el))

function animateNumber(el, target) {
  let current = 0
  const step = Math.ceil(target / 40)
  const timer = setInterval(() => {
    current += step
    if (current >= target) {
      current = target
      clearInterval(timer)
    }
    el.textContent = current
  }, 30)
}

// ============================================
// 导航高亮
// ============================================
const sections = document.querySelectorAll('section')
const navLinks = document.querySelectorAll('.nav-links a')

window.addEventListener('scroll', () => {
  // navbar 背景
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 60)

  // 当前 section 高亮
  let current = ''
  sections.forEach(section => {
    const top = section.offsetTop - 200
    if (window.scrollY >= top) current = section.id
  })
  navLinks.forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === `#${current}`)
  })
})

// ============================================
// 移动端菜单
// ============================================
function toggleMenu() {
  document.querySelector('.nav-links').classList.toggle('open')
}

document.querySelectorAll('.nav-links a').forEach(a => {
  a.addEventListener('click', () => {
    document.querySelector('.nav-links').classList.remove('open')
  })
})

// ============================================
// 入口遮罩
// ============================================
let siteEntered = false
let musicStarted = false

function enterSite() {
  if (siteEntered) return
  siteEntered = true
  document.getElementById('entry-overlay').classList.add('hidden')
  document.body.style.overflow = ''
  // 尝试播放音乐
  tryPlayMusic()
}

// ============================================
// 背景音乐
// ============================================
const bgm = document.getElementById('bgm')
const musicBtn = document.getElementById('music-btn')

function tryPlayMusic() {
  if (musicStarted) return
  bgm.currentTime = 0
  bgm.play().then(() => {
    musicStarted = true
    musicBtn.classList.add('playing')
  }).catch(() => {
    // 浏览器阻止了自动播放，用户再次点击时重试
  })
}

// 页面加载后提前开始缓冲音频（不播放）
document.addEventListener('DOMContentLoaded', () => {
  bgm.load()
})

// 用户首次触摸/点击页面任意位置时尝试播放（兜底，针对移动端）
const firstTouch = () => {
  if (!musicStarted) tryPlayMusic()
  document.removeEventListener('touchstart', firstTouch)
  document.removeEventListener('click', firstTouch)
}
document.addEventListener('touchstart', firstTouch, { once: true })
document.addEventListener('click', firstTouch, { once: true })

function pauseBgm() {
  bgm.pause()
  musicBtn.classList.remove('playing')
}

function toggleMusic() {
  if (bgm.paused) {
    tryPlayMusic()
  } else {
    pauseBgm()
  }
}

// 点击页面任意位置尝试播放（兜底策略）
document.addEventListener('click', () => {
  if (!musicStarted && siteEntered) {
    tryPlayMusic()
  }
}, { once: false })

// 音乐按钮
musicBtn.addEventListener('click', toggleMusic)

// ============================================
// 表单提交
// ============================================
function handleSubmit(e) {
  e.preventDefault()
  const btn = e.target.querySelector('button')
  const original = btn.innerHTML
  btn.innerHTML = '<i class="fas fa-check"></i> 已发送'
  btn.style.background = 'linear-gradient(135deg, #00c896, #00c8ff)'
  setTimeout(() => {
    btn.innerHTML = original
    btn.style.background = ''
    e.target.reset()
  }, 2000)
}
