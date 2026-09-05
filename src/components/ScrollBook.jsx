import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useSoundFx } from '../hooks/useSoundFx'

const clamp = (v, min, max) => Math.max(min, Math.min(max, v))
const smoothstep = (edge0, edge1, x) => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}
const lerp = (a, b, t) => a + (b - a) * t

// builds a page-shaped plane, gently curled so it lifts off the table near
// the spine edge (x = width) and lies flat at the free outer edge (x = 0),
// matching the way an open book's pages arch in the reference photo.
function makePageGeometry(width, height, curl, segments = 28) {
  const geo = new THREE.PlaneGeometry(width, height, segments, 1)
  geo.translate(width / 2, 0, 0) // local x now runs 0 -> width
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const t = x / width
    const lift = Math.sin(t * (Math.PI / 2)) * curl
    pos.setZ(i, pos.getZ(i) + lift)
  }
  geo.computeVertexNormals()
  return geo
}

function makeWoodTexture(baseHex, isMobile) {
  const size = isMobile ? 128 : 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = baseHex
  ctx.fillRect(0, 0, size, size)
  const lineCount = isMobile ? 40 : 90
  for (let i = 0; i < lineCount; i++) {
    const y = Math.random() * size
    ctx.strokeStyle = `rgba(0,0,0,${0.03 + Math.random() * 0.06})`
    ctx.lineWidth = 0.6 + Math.random() * 1.6
    ctx.beginPath()
    ctx.moveTo(0, y)
    for (let x = 0; x <= size; x += 16) {
      ctx.lineTo(x, y + Math.sin(x * 0.05 + i) * 4)
    }
    ctx.stroke()
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(1.6, 1.6)
  return tex
}

function makeGlowTexture(colorHex) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  const grad = ctx.createRadialGradient(256, 256, 0, 256, 256, 256)
  const c = new THREE.Color(colorHex)
  const rgb = `${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)}`
  grad.addColorStop(0, `rgba(${rgb},0.55)`)
  grad.addColorStop(0.5, `rgba(${rgb},0.18)`)
  grad.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 512, 512)
  return new THREE.CanvasTexture(canvas)
}

function renderHighlighted(text, highlights) {
  if (!highlights || highlights.length === 0) return text
  const pattern = new RegExp(`(${highlights.join('|')})`, 'gi')
  const parts = text.split(pattern)
  return parts.map((part, i) =>
    highlights.some((h) => h.toLowerCase() === part.toLowerCase()) ? (
      <span key={i} className="font-semibold" style={{ color: 'inherit', textDecoration: 'underline', textDecorationColor: 'currentColor', textUnderlineOffset: '3px' }}>
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    )
  )
}

function makePageTexture(text, highlights, colorHex, isMobile) {
  const canvas = document.createElement('canvas')
  // On mobile use half-size canvas to save memory and GPU upload time
  const cw = isMobile ? 512 : 1024
  const ch = isMobile ? 668 : 1336
  canvas.width = cw
  canvas.height = ch
  const ctx = canvas.getContext('2d')
  
  ctx.fillStyle = colorHex
  ctx.fillRect(0, 0, cw, ch)

  ctx.fillStyle = '#2b2013'
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  
  const fontSize = isMobile ? 36 : 56
  const maxWidth = isMobile ? 420 : 800

  const words = text.split(' ')
  const lines = []
  let currentLine = []
  let currentWidth = 0

  words.forEach(w => {
    const clean = w.replace(/[^a-zA-Z0-9]/g, '')
    const isHigh = highlights && highlights.some(h => h.toLowerCase() === clean.toLowerCase())
    ctx.font = isHigh ? `italic bold ${fontSize}px "Instrument Serif", serif` : `italic ${fontSize}px "Instrument Serif", serif`
    const metric = ctx.measureText(w + ' ')
    if (currentWidth + metric.width > maxWidth && currentLine.length > 0) {
      lines.push({ words: currentLine, width: currentWidth })
      currentLine = [{ text: w, isHigh, width: metric.width }]
      currentWidth = metric.width
    } else {
      currentLine.push({ text: w, isHigh, width: metric.width })
      currentWidth += metric.width
    }
  })
  if (currentLine.length > 0) {
    lines.push({ words: currentLine, width: currentWidth })
  }

  const lineHeight = isMobile ? 50 : 76
  const totalHeight = lines.length * lineHeight
  let startY = ch / 2 - totalHeight / 2 + lineHeight / 2

  lines.forEach(line => {
    let currentX = cw / 2 - line.width / 2
    line.words.forEach(pw => {
      ctx.font = pw.isHigh ? `italic bold ${fontSize}px "Instrument Serif", serif` : `italic ${fontSize}px "Instrument Serif", serif`
      ctx.fillText(pw.text, currentX, startY)
      if (pw.isHigh) {
        ctx.fillRect(currentX, startY + fontSize * 0.5, pw.width - ctx.measureText(' ').width, 2)
      }
      currentX += pw.width
    })
    startY += lineHeight
  })

  const tex = new THREE.CanvasTexture(canvas)
  tex.anisotropy = isMobile ? 1 : 4
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export default function ScrollBook({ teacher }) {
  const sectionRef = useRef(null)
  const mountRef = useRef(null)
  const hintRef = useRef(null)
  const { playThud, playPageFlip, playChime } = useSoundFx()

  const { accent, bg, kind } = teacher.theme
  const bgStyle = kind === 'gradient' ? { background: `linear-gradient(200deg, ${bg[1]}, ${bg[0]})` } : { backgroundColor: bg[1] }

  useEffect(() => {
    const mount = mountRef.current
    const section = sectionRef.current
    if (!mount || !section) return

    // Detect mobile for performance scaling
    const isMobile = window.innerWidth < 768 || navigator.maxTouchPoints > 0

    const width = mount.clientWidth
    const height = mount.clientHeight

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100)

    const renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2))
    mount.appendChild(renderer.domElement)

    // --- lighting ---------------------------------------------------------
    const ambient = new THREE.AmbientLight(0xffffff, 0.55)
    scene.add(ambient)
    const key = new THREE.DirectionalLight(0xfff3e0, 1.1)
    key.position.set(2.4, 4, 3)
    scene.add(key)
    const rim = new THREE.DirectionalLight(accent, 0.5)
    rim.position.set(-3, 2, -2)
    scene.add(rim)

    // --- backdrop glow ------------------------------------------------------
    const glowTex = makeGlowTexture(accent)
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }))
    glow.scale.set(8, 8, 1)
    glow.position.set(0, 0.6, -2.2)
    scene.add(glow)

    // --- table / stage --------------------------------------------------
    const woodTex = makeWoodTexture('#3b2417', isMobile)
    const table = new THREE.Mesh(
      new THREE.CircleGeometry(2.6, 48),
      new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.85, metalness: 0.05, transparent: true, opacity: 0.9 })
    )
    table.rotation.x = -Math.PI / 2
    table.position.y = -0.02
    scene.add(table)

    const leatherColor = new THREE.Color('#5a3420').lerp(new THREE.Color(accent), 0.18)
    const pageColor = new THREE.Color('#f4efe3')

    // --- closed book (idle showcase) ---------------------------------------
    const closedGroup = new THREE.Group()
    const coverW = 1.15
    const coverH = 1.6
    const coverT = 0.16

    const coverMat = new THREE.MeshStandardMaterial({ color: leatherColor, roughness: 0.55, metalness: 0.08, transparent: true })
    const cover = new THREE.Mesh(new THREE.BoxGeometry(coverW, coverT, coverH), coverMat)
    cover.position.y = coverT / 2
    closedGroup.add(cover)

    const pagesEdgeMat = new THREE.MeshStandardMaterial({ color: pageColor, roughness: 0.9, transparent: true })
    const pagesEdge = new THREE.Mesh(new THREE.BoxGeometry(coverW * 0.94, coverT * 0.72, coverH * 0.94), pagesEdgeMat)
    pagesEdge.position.set(0, coverT + (coverT * 0.72) / 2, 0)
    closedGroup.add(pagesEdge)

    const spineMat = new THREE.MeshStandardMaterial({ color: leatherColor.clone().multiplyScalar(0.75), roughness: 0.5, transparent: true })
    const spine = new THREE.Mesh(new THREE.BoxGeometry(coverW * 1.02, coverT * 1.9, 0.1), spineMat)
    spine.position.set(0, coverT * 0.9, -coverH / 2)
    closedGroup.add(spine)

    closedGroup.position.y = 0.02
    scene.add(closedGroup)

    // --- open book -----------------------------------------------------
    const openGroup = new THREE.Group()

    const baseMat = new THREE.MeshStandardMaterial({ color: leatherColor, roughness: 0.55, metalness: 0.06, transparent: true, opacity: 0 })
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.06, 1.55), baseMat)
    base.position.y = 0.02
    openGroup.add(base)

    const pageW = 1.15
    const pageH = 1.5
    
    // Base material for the left page and back sides
    const leftPageMat = new THREE.MeshStandardMaterial({ color: pageColor, roughness: 0.92, side: THREE.DoubleSide, transparent: true, opacity: 0 })
    
    // Texture material for the right page front — font size scales for mobile
    const pageTex = makePageTexture(teacher.bookLine || '', teacher.bookHighlights || [], '#f4efe3', isMobile)
    const rightPageMat = new THREE.MeshStandardMaterial({ map: pageTex, roughness: 0.92, side: THREE.DoubleSide, transparent: true, opacity: 0 })

    const rightPivot = new THREE.Group()
    rightPivot.position.set(0, 0.07, 0)
    // Fewer segments on mobile = less geometry to process per frame
    const pageSegments = isMobile ? 10 : 28
    const rightPageGeo = makePageGeometry(pageW, pageH, 0.16, pageSegments)
    const rightPage = new THREE.Mesh(rightPageGeo, rightPageMat)
    rightPivot.add(rightPage)
    openGroup.add(rightPivot)

    const leftPivot = new THREE.Group()
    leftPivot.position.set(0, 0.07, 0)
    leftPivot.scale.x = -1
    const leftPageGeo = makePageGeometry(pageW, pageH, 0.16, pageSegments)
    const leftPage = new THREE.Mesh(leftPageGeo, leftPageMat)
    leftPivot.add(leftPage)
    openGroup.add(leftPivot)

    const creaseMat = new THREE.MeshStandardMaterial({ color: leatherColor.clone().multiplyScalar(0.6), roughness: 0.6, transparent: true, opacity: 0 })
    const crease = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, pageH * 0.98), creaseMat)
    crease.position.set(0, 0.08, 0)
    openGroup.add(crease)

    openGroup.scale.set(0.85, 0.85, 0.85)
    scene.add(openGroup)

    // --- camera + resize ---------------------------------------------------
    const handleResize = () => {
      const w = mount.clientWidth
      const h = mount.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    // --- scroll-driven animation loop --------------------------------------
    const clock = new THREE.Clock()
    let smoothed = 0
    const played = { thud: false, flip1: false, flip2: false, chime: false }
    let rafId

    const animate = () => {
      const t = clock.getElapsedTime()

      const rect = section.getBoundingClientRect()
      const vh = window.innerHeight
      const total = rect.height - vh
      const raw = total > 0 ? clamp(-rect.top / total, 0, 1) : 0
      smoothed = lerp(smoothed, raw, 0.09)

      // sound + reveal thresholds (use raw progress so they fire predictably)
      if (raw > 0.16 && !played.thud) {
        playThud()
        played.thud = true
      }
      if (raw > 0.28 && !played.flip1) {
        playPageFlip(0)
        played.flip1 = true
      }
      if (raw > 0.4 && !played.flip2) {
        playPageFlip(1)
        played.flip2 = true
      }
      if (raw > 0.64 && !played.chime) {
        playChime()
        played.chime = true
      }
      if (raw < 0.1) {
        played.thud = false
        played.flip1 = false
        played.flip2 = false
      }
      if (raw < 0.55) {
        played.chime = false
      }

      // closed book: idle spin, fades out as book opens
      const closeAmount = 1 - smoothstep(0.1, 0.42, smoothed)
      closedGroup.visible = closeAmount > 0.01
      closedGroup.rotation.y = t * 0.45 * closeAmount + smoothstep(0.1, 0.42, smoothed) * 1.2
      closedGroup.scale.setScalar(lerp(0.7, 1, closeAmount) * closeAmount + 0.001)
      coverMat.opacity = closeAmount
      pagesEdgeMat.opacity = closeAmount
      spineMat.opacity = closeAmount

      // open book: fades/scales in, pages swing open
      const openAmount = smoothstep(0.14, 0.5, smoothed)
      openGroup.visible = openAmount > 0.01
      openGroup.scale.setScalar(lerp(0.82, 1, openAmount))
      openGroup.position.y = lerp(-0.15, 0, openAmount)
      openGroup.rotation.y = lerp(0.5, 0, smoothstep(0.14, 0.6, smoothed))

      baseMat.opacity = openAmount * 0.98
      leftPageMat.opacity = openAmount * 0.98
      rightPageMat.opacity = openAmount * 0.98
      creaseMat.opacity = openAmount * 0.9

      const spread = smoothstep(0.16, 0.55, smoothed)
      const pivotAngle = lerp(1.35, 0.06, spread)
      rightPivot.rotation.z = -pivotAngle
      leftPivot.rotation.z = -pivotAngle

      // gentle idle breathing once open
      const breathe = openAmount > 0.9 ? Math.sin(t * 0.6) * 0.01 : 0
      rightPage.rotation.z = breathe
      leftPage.rotation.z = breathe

      // camera path: orbit around the closed book, settle to a top-down
      // "reading" angle over the open spread once the pages appear
      const orbitR = 3.4
      const orbitAngle = t * 0.12
      const camClosed = new THREE.Vector3(Math.sin(orbitAngle) * orbitR, 1.6, Math.cos(orbitAngle) * orbitR)
      const camOpen = new THREE.Vector3(0, 2.5, 2.6)
      const camT = smoothstep(0.08, 0.5, smoothed)
      camera.position.lerpVectors(camClosed, camOpen, camT)
      const lookClosed = new THREE.Vector3(0, 0.5, 0)
      const lookOpen = new THREE.Vector3(0, 0.05, -0.1)
      const look = lookClosed.lerp(lookOpen, camT)
      camera.lookAt(look)

      glow.position.y = 0.6 + Math.sin(t * 0.4) * 0.08
      if (hintRef.current) {
        const hintOpacity = 1 - smoothstep(0.02, 0.12, smoothed)
        hintRef.current.style.opacity = String(hintOpacity)
      }

      renderer.render(scene, camera)
      rafId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', handleResize)
      ;[cover, pagesEdge, spine, base, rightPage, leftPage, crease, table].forEach((m) => m.geometry?.dispose())
      ;[coverMat, pagesEdgeMat, spineMat, baseMat, leftPageMat, rightPageMat, creaseMat].forEach((m) => m.dispose())
      woodTex.dispose()
      glowTex.dispose()
      pageTex.dispose()
      renderer.dispose()
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accent])

  return (
    <section ref={sectionRef} className="relative w-full" style={{ height: '260vh', ...bgStyle }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <div ref={mountRef} className="absolute inset-0" aria-hidden="true" />

        <div
          ref={hintRef}
          className="pointer-events-none absolute bottom-10 left-1/2 -translate-x-1/2 text-center text-[10px] uppercase tracking-[0.3em] text-white/50 bg-black/30 px-4 py-2 rounded-full backdrop-blur"
        >
          <div className="mb-1 animate-bounce text-sm">↓</div>
          scroll to see the animation
        </div>
      </div>
    </section>
  )
}
