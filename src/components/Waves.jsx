import { useEffect, useRef } from 'react'
import { createNoise2D } from 'simplex-noise'

export function Waves({
    className = "",
    strokeColor = "#ffffff",
    backgroundColor = "#000000",
    pointerSize = 0.5,
}) {
    const containerRef = useRef(null)
    const svgRef = useRef(null)
    const mouseRef = useRef({ x: -10, y: 0, lx: 0, ly: 0, sx: 0, sy: 0, v: 0, vs: 0, a: 0, set: false })
    const pathsRef = useRef([])
    const linesRef = useRef([])
    const noiseRef = useRef(null)
    const rafRef = useRef(null)
    const boundingRef = useRef(null)
    const ripplesRef = useRef([])

    useEffect(() => {
        if (!containerRef.current || !svgRef.current) return

        noiseRef.current = createNoise2D()
        setSize()
        setLines()

        window.addEventListener('resize', onResize)
        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('click', onClickRipple)
        containerRef.current.addEventListener('touchmove', onTouchMove, { passive: false })

        rafRef.current = requestAnimationFrame(tick)

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
            window.removeEventListener('resize', onResize)
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('click', onClickRipple)
            containerRef.current?.removeEventListener('touchmove', onTouchMove)
        }
    }, [])

    const setSize = () => {
        if (!containerRef.current || !svgRef.current) return
        boundingRef.current = containerRef.current.getBoundingClientRect()
        const { width, height } = boundingRef.current
        svgRef.current.style.width = `${width}px`
        svgRef.current.style.height = `${height}px`
    }

    const setLines = () => {
        if (!svgRef.current || !boundingRef.current) return
        const { width, height } = boundingRef.current
        linesRef.current = []
        pathsRef.current.forEach(path => path.remove())
        pathsRef.current = []

        const xGap = 8
        const yGap = 8
        const oWidth = width + 200
        const oHeight = height + 30
        const totalLines = Math.ceil(oWidth / xGap)
        const totalPoints = Math.ceil(oHeight / yGap)
        const xStart = (width - xGap * totalLines) / 2
        const yStart = (height - yGap * totalPoints) / 2

        for (let i = 0; i < totalLines; i++) {
            const points = []
            for (let j = 0; j < totalPoints; j++) {
                points.push({
                    x: xStart + xGap * i,
                    y: yStart + yGap * j,
                    wave: { x: 0, y: 0 },
                    cursor: { x: 0, y: 0, vx: 0, vy: 0 },
                })
            }

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
            path.setAttribute('fill', 'none')
            path.setAttribute('stroke', strokeColor)
            path.setAttribute('stroke-width', '1')
            svgRef.current.appendChild(path)
            pathsRef.current.push(path)
            linesRef.current.push(points)
        }
    }

    const onResize = () => { setSize(); setLines() }

    const onMouseMove = (e) => updateMousePosition(e.pageX, e.pageY)

    const onTouchMove = (e) => {
        e.preventDefault()
        const touch = e.touches[0]
        updateMousePosition(touch.clientX, touch.clientY)
    }

    const onClickRipple = (e) => {
        if (!boundingRef.current) return
        ripplesRef.current.push({
            x: e.clientX - boundingRef.current.left,
            y: e.clientY - boundingRef.current.top,
            radius: 0,
            maxRadius: 250,
            strength: 40,
            born: performance.now(),
        })
    }

    const updateMousePosition = (x, y) => {
        if (!boundingRef.current) return
        const mouse = mouseRef.current
        mouse.x = x - boundingRef.current.left
        mouse.y = y - boundingRef.current.top + window.scrollY
        if (!mouse.set) {
            mouse.sx = mouse.x; mouse.sy = mouse.y
            mouse.lx = mouse.x; mouse.ly = mouse.y
            mouse.set = true
        }
        if (containerRef.current) {
            containerRef.current.style.setProperty('--x', `${mouse.sx}px`)
            containerRef.current.style.setProperty('--y', `${mouse.sy}px`)
        }
    }

    const movePoints = (time) => {
        const lines = linesRef.current
        const mouse = mouseRef.current
        const noise = noiseRef.current
        const ripples = ripplesRef.current
        if (!noise) return

        const now = performance.now()

        // advance ripple radii
        ripples.forEach(r => {
            const age = (now - r.born) / 1000
            r.radius = age * 800
        })
        // drop finished ripples
        ripplesRef.current = ripples.filter(r => r.radius < r.maxRadius + 60)

        lines.forEach((points) => {
            points.forEach((p) => {
                const move = noise((p.x + time * 0.008) * 0.003, (p.y + time * 0.003) * 0.002) * 8
                p.wave.x = Math.cos(move) * 12
                p.wave.y = Math.sin(move) * 6

                const dx = p.x - mouse.sx
                const dy = p.y - mouse.sy
                const d = Math.hypot(dx, dy)
                const l = Math.max(175, mouse.vs)

                if (d < l) {
                    const s = 1 - d / l
                    const f = Math.cos(d * 0.001) * s
                    p.cursor.vx += Math.cos(mouse.a) * f * l * mouse.vs * 0.00035
                    p.cursor.vy += Math.sin(mouse.a) * f * l * mouse.vs * 0.00035
                }

                // ripple forces
                ripplesRef.current.forEach(r => {
                    const rdx = p.x - r.x
                    const rdy = p.y - r.y
                    const rd = Math.hypot(rdx, rdy)
                    const ringWidth = 60
                    const dist = Math.abs(rd - r.radius)
                    if (dist < ringWidth) {
                        const falloff = (1 - dist / ringWidth) * (1 - r.radius / r.maxRadius)
                        const angle = Math.atan2(rdy, rdx)
                        p.cursor.vx += Math.cos(angle) * falloff * r.strength * 0.06
                        p.cursor.vy += Math.sin(angle) * falloff * r.strength * 0.06
                    }
                })

                p.cursor.vx += (0 - p.cursor.x) * 0.01
                p.cursor.vy += (0 - p.cursor.y) * 0.01
                p.cursor.vx *= 0.95
                p.cursor.vy *= 0.95
                p.cursor.x += p.cursor.vx
                p.cursor.y += p.cursor.vy
                p.cursor.x = Math.min(50, Math.max(-50, p.cursor.x))
                p.cursor.y = Math.min(50, Math.max(-50, p.cursor.y))
            })
        })
    }

    const moved = (point, withCursorForce = true) => ({
        x: point.x + point.wave.x + (withCursorForce ? point.cursor.x : 0),
        y: point.y + point.wave.y + (withCursorForce ? point.cursor.y : 0),
    })

    const drawLines = () => {
        linesRef.current.forEach((points, lIndex) => {
            if (points.length < 2 || !pathsRef.current[lIndex]) return
            const first = moved(points[0], false)
            let d = `M ${first.x} ${first.y}`
            for (let i = 1; i < points.length; i++) {
                const cur = moved(points[i])
                d += ` L ${cur.x} ${cur.y}`
            }
            pathsRef.current[lIndex].setAttribute('d', d)
        })
    }

    const tick = (time) => {
        const mouse = mouseRef.current
        mouse.sx += (mouse.x - mouse.sx) * 0.1
        mouse.sy += (mouse.y - mouse.sy) * 0.1

        const dx = mouse.x - mouse.lx
        const dy = mouse.y - mouse.ly
        const d = Math.hypot(dx, dy)
        mouse.v = d
        mouse.vs += (d - mouse.vs) * 0.1
        mouse.vs = Math.min(100, mouse.vs)
        mouse.lx = mouse.x
        mouse.ly = mouse.y
        mouse.a = Math.atan2(dy, dx)

        if (containerRef.current) {
            containerRef.current.style.setProperty('--x', `${mouse.sx}px`)
            containerRef.current.style.setProperty('--y', `${mouse.sy}px`)
        }

        movePoints(time)
        drawLines()
        rafRef.current = requestAnimationFrame(tick)
    }

    return (
        <div
            ref={containerRef}
            className={`waves-component ${className}`}
            style={{
                backgroundColor,
                position: 'absolute',
                top: 0, left: 0,
                margin: 0, padding: 0,
                width: '100%', height: '100%',
                overflow: 'hidden',
                zIndex: 0,
            }}
        >
            <svg ref={svgRef} xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', width: '100%', height: '100%' }} />
            <div
                style={{
                    position: 'absolute',
                    top: 0, left: 0,
                    width: `${pointerSize}rem`,
                    height: `${pointerSize}rem`,
                    background: strokeColor,
                    borderRadius: '50%',
                    transform: 'translate3d(calc(var(--x) - 50%), calc(var(--y) - 50%), 0)',
                    willChange: 'transform',
                }}
            />
        </div>
    )
}
