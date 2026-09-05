import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useSoundFx } from '../hooks/useSoundFx'

function makeSparkTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 32
  canvas.height = 32
  const ctx = canvas.getContext('2d')
  const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.35, 'rgba(255,255,255,0.85)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 32, 32)
  return new THREE.CanvasTexture(canvas)
}

function spawnBurst(scene, palette, sparkTexture) {
  const count = 130 + Math.floor(Math.random() * 40)
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(count * 3)
  const velocities = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)

  const origin = new THREE.Vector3(
    (Math.random() - 0.5) * 5.5,
    1.4 + Math.random() * 1.8,
    (Math.random() - 0.5) * 1.6
  )
  const c1 = new THREE.Color(palette[Math.floor(Math.random() * palette.length)])
  const c2 = new THREE.Color(palette[Math.floor(Math.random() * palette.length)])

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const speed = 1.1 + Math.random() * 1.6
    velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed
    velocities[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed + 0.4
    velocities[i * 3 + 2] = Math.cos(phi) * speed * 0.5

    positions[i * 3] = origin.x
    positions[i * 3 + 1] = origin.y
    positions[i * 3 + 2] = origin.z

    const blended = c1.clone().lerp(c2, Math.random())
    colors[i * 3] = blended.r
    colors[i * 3 + 1] = blended.g
    colors[i * 3 + 2] = blended.b
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const material = new THREE.PointsMaterial({
    size: 0.07,
    map: sparkTexture,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    opacity: 1,
  })

  const points = new THREE.Points(geometry, material)
  scene.add(points)

  return { points, geometry, material, velocities, born: performance.now(), life: 1500 + Math.random() * 500 }
}

export default function Finale({ teacher }) {
  const sectionRef = useRef(null)
  const mountRef = useRef(null)
  const headingRef = useRef(null)
  const [revealed, setRevealed] = useState(false)
  const activeRef = useRef(false)
  const { playFirework, playChime } = useSoundFx()

  const { bg, particle, particleAlt, accent, kind } = teacher.theme
  const bgStyle = kind === 'gradient' ? { background: `linear-gradient(200deg, ${bg[1]}, ${bg[0]})` } : { backgroundColor: bg[1] }

  // watch visibility: (re)start the show and replay the fanfare each time
  // the finale scrolls into view
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          activeRef.current = entry.isIntersecting
          if (entry.isIntersecting) {
            setRevealed(false)
            const t1 = setTimeout(() => setRevealed(true), 350)
            const t2 = setTimeout(() => playFirework(), 120)
            const t3 = setTimeout(() => playFirework(), 620)
            const t4 = setTimeout(() => playChime(), 850)
            el._timers = [t1, t2, t3, t4]
          } else if (el._timers) {
            el._timers.forEach(clearTimeout)
          }
        })
      },
      { threshold: 0.4 }
    )
    observer.observe(el)
    return () => {
      observer.disconnect()
      if (el._timers) el._timers.forEach(clearTimeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const width = mount.clientWidth
    const height = mount.clientHeight

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 50)
    camera.position.set(0, 1.5, 6)
    camera.lookAt(0, 1.3, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    mount.appendChild(renderer.domElement)

    const sparkTexture = makeSparkTexture()
    const palette = [particle, particleAlt, accent, '#ffe9a8', '#ffffff']

    let bursts = []
    let spawnTimer = 0
    let lastTime = performance.now()
    let rafId

    const animate = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05)
      lastTime = now

      if (activeRef.current) {
        spawnTimer -= dt
        if (spawnTimer <= 0) {
          bursts.push(spawnBurst(scene, palette, sparkTexture))
          spawnTimer = 0.55 + Math.random() * 0.7
        }
      }

      bursts = bursts.filter((b) => {
        const age = now - b.born
        if (age > b.life) {
          scene.remove(b.points)
          b.geometry.dispose()
          b.material.dispose()
          return false
        }
        const posAttr = b.geometry.attributes.position
        const arr = posAttr.array
        for (let i = 0; i < posAttr.count; i++) {
          const ix = i * 3
          b.velocities[ix + 1] -= 1.7 * dt
          arr[ix] += b.velocities[ix] * dt
          arr[ix + 1] += b.velocities[ix + 1] * dt
          arr[ix + 2] += b.velocities[ix + 2] * dt
        }
        posAttr.needsUpdate = true
        b.material.opacity = Math.max(0, 1 - age / b.life)
        return true
      })

      renderer.render(scene, camera)
      rafId = requestAnimationFrame(animate)
    }
    rafId = requestAnimationFrame(animate)

    const handleResize = () => {
      const w = mount.clientWidth
      const h = mount.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', handleResize)
      bursts.forEach((b) => {
        scene.remove(b.points)
        b.geometry.dispose()
        b.material.dispose()
      })
      sparkTexture.dispose()
      renderer.dispose()
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [particle, particleAlt, accent])

  return (
    <section ref={sectionRef} className="relative flex h-screen w-full items-center justify-center overflow-hidden text-white" style={bgStyle}>
      <div ref={mountRef} className="absolute inset-0" aria-hidden="true" />

      <div
        ref={headingRef}
        className="pointer-events-none relative z-10 px-6 text-center transition-all duration-[1100ms] ease-out"
        style={{
          opacity: revealed ? 1 : 0,
          transform: revealed ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.96)',
        }}
      >
        <h2
          className="text-[clamp(2.2rem,7vw,5rem)] leading-none"
          style={{
            fontFamily: "'Instrument Serif', serif",
            color: '#fff',
            textShadow: `0 0 40px ${accent}, 0 0 12px rgba(255,255,255,0.5)`,
          }}
        >
          Happyyy Teacherss Dayyy
        </h2>
        <p
          className="mt-5 text-[clamp(1.2rem,3.4vw,2rem)]"
          style={{ color: accent, fontFamily: "'Instrument Serif', serif" }}
        >
          {teacher.name}
        </p>
        <p className="mt-6 text-sm uppercase tracking-[0.3em] text-white/50">— with love, your students</p>
      </div>
    </section>
  )
}
