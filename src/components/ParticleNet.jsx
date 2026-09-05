import { useEffect, useRef } from 'react'
import * as THREE from 'three'

/**
 * A floating, undulating 3D net of glowing points — an abstract dune of
 * dots drifting behind the foreground text, themed per-teacher via
 * `colorA` / `colorB` (the wave is coloured as a gradient between them
 * based on height + depth, so the net never reads as a flat single hue).
 */
export default function ParticleNet({ colorA = '#a78bfa', colorB = '#f472b6', bgColor = '#1a0b2e' }) {
  const mountRef = useRef(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    // Detect mobile/low-power devices for performance scaling
    const isMobile = window.innerWidth < 768 || navigator.maxTouchPoints > 0

    const width = mount.clientWidth
    const height = mount.clientHeight

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(bgColor, 0.045)

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100)
    camera.position.set(0, 3.4, 7.5)
    camera.lookAt(0, -0.6, -6)

    // Disable antialiasing on mobile to save GPU fill-rate
    const renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: true })
    renderer.setSize(width, height)
    // Cap pixel ratio to 1 on mobile — biggest single performance win
    renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2))
    mount.appendChild(renderer.domElement)

    // --- build the point grid -------------------------------------------------
    // Fewer particles on mobile: ~1260 vs ~7040 on desktop
    const cols = isMobile ? 45 : 110
    const rows = isMobile ? 28 : 64
    const spacing = 0.16
    const count = cols * rows

    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const baseColorA = new THREE.Color(colorA)
    const baseColorB = new THREE.Color(colorB)

    let i = 0
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = (c - cols / 2) * spacing
        const z = (r - rows / 2) * spacing
        positions[i * 3] = x
        positions[i * 3 + 1] = 0
        positions[i * 3 + 2] = z

        const mixT = r / rows
        const blended = baseColorA.clone().lerp(baseColorB, mixT)
        colors[i * 3] = blended.r
        colors[i * 3 + 1] = blended.g
        colors[i * 3 + 2] = blended.b
        i++
      }
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    // soft circular sprite so points glow instead of rendering as hard squares
    const spriteCanvas = document.createElement('canvas')
    spriteCanvas.width = 32
    spriteCanvas.height = 32
    const ctx = spriteCanvas.getContext('2d')
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
    grad.addColorStop(0, 'rgba(255,255,255,1)')
    grad.addColorStop(0.4, 'rgba(255,255,255,0.7)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 32, 32)
    const spriteTexture = new THREE.CanvasTexture(spriteCanvas)

    const material = new THREE.PointsMaterial({
      size: 0.045,
      map: spriteTexture,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0.85,
    })

    const points = new THREE.Points(geometry, material)
    scene.add(points)

    // --- animate ---------------------------------------------------------------
    const posAttr = geometry.getAttribute('position')
    const clock = new THREE.Clock()
    let rafId

    const animate = () => {
      const t = clock.getElapsedTime()
      let idx = 0
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = (c - cols / 2) * spacing
          const z = (r - rows / 2) * spacing
          const wave =
            Math.sin(x * 0.9 + t * 0.6) * 0.32 +
            Math.sin(z * 0.7 - t * 0.5) * 0.32 +
            Math.sin((x + z) * 0.4 + t * 0.3) * 0.18
          posAttr.setY(idx, wave)
          idx++
        }
      }
      posAttr.needsUpdate = true
      points.rotation.y = Math.sin(t * 0.05) * 0.06

      renderer.render(scene, camera)
      rafId = requestAnimationFrame(animate)
    }
    animate()

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
      geometry.dispose()
      material.dispose()
      spriteTexture.dispose()
      renderer.dispose()
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement)
      }
    }
  }, [colorA, colorB, bgColor])

  return <div ref={mountRef} className="absolute inset-0" aria-hidden="true" />
}