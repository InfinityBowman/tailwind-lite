import { useEffect, useRef } from 'react'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { createScene } from '../render/scene'
import {
  createRiverPoCMesh,
  POC_GRID_WIDTH,
  POC_GRID_HEIGHT,
  RIVER_POC_VARIANT_LABELS,
  RIVER_POC_VARIANTS,
} from '../render/river-poc'

const COLS = 3
const ROWS = 2
const GAP = 4

export function RiverPoC() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let disposed = false
    let cleanup: (() => void) | null = null

    createScene(canvas).then((ctx) => {
      if (disposed) {
        ctx.dispose()
        return
      }

      const cellW = POC_GRID_WIDTH + GAP
      const cellH = POC_GRID_HEIGHT + GAP

      const meshes = RIVER_POC_VARIANTS.map((variant, i) => {
        const col = i % COLS
        const row = Math.floor(i / COLS)
        const xOffset = (col - (COLS - 1) / 2) * cellW
        const zOffset = (row - (ROWS - 1) / 2) * cellH
        const m = createRiverPoCMesh(variant, xOffset, zOffset)
        ctx.scene.add(m.mesh)
        ctx.scene.add(m.water)
        return m
      })

      const controls = new OrbitControls(ctx.camera, canvas)
      controls.enableDamping = true

      const span = Math.max(cellW * COLS, cellH * ROWS)
      ctx.camera.position.set(span * 0.4, span * 0.7, span * 0.9)
      ctx.camera.far = Math.max(2000, span * 5)
      ctx.camera.updateProjectionMatrix()
      controls.target.set(0, 0, 0)
      controls.update()

      const half = span * 0.7
      ctx.sun.position.set(span * 0.5, span * 1.0, -span * 0.3)
      ctx.sun.target.position.set(0, 0, 0)
      ctx.sun.target.updateMatrixWorld()
      ctx.sun.shadow.camera.left = -half
      ctx.sun.shadow.camera.right = half
      ctx.sun.shadow.camera.top = half
      ctx.sun.shadow.camera.bottom = -half
      ctx.sun.shadow.camera.near = 1
      ctx.sun.shadow.camera.far = span * 4
      ctx.sun.shadow.camera.updateProjectionMatrix()

      const onResize = () => {
        const w = canvas.clientWidth
        const h = canvas.clientHeight
        ctx.renderer.setSize(w, h, false)
        ctx.camera.aspect = w / h
        ctx.camera.updateProjectionMatrix()
      }
      window.addEventListener('resize', onResize)
      onResize()

      let raf = 0
      const tick = () => {
        controls.update()
        ctx.renderer.renderAsync(ctx.scene, ctx.camera)
        raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)

      cleanup = () => {
        cancelAnimationFrame(raf)
        window.removeEventListener('resize', onResize)
        controls.dispose()
        for (const m of meshes) {
          ctx.scene.remove(m.mesh)
          ctx.scene.remove(m.water)
          m.dispose()
        }
        ctx.dispose()
      }
    })

    return () => {
      disposed = true
      cleanup?.()
    }
  }, [])

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="block w-full h-full" />
      <div className="absolute top-4 left-4 right-4 grid grid-cols-3 gap-2 pointer-events-none">
        {RIVER_POC_VARIANTS.map((v) => (
          <div
            key={v}
            className="text-zinc-100 text-xs bg-zinc-900/80 px-3 py-1.5 rounded backdrop-blur"
          >
            {RIVER_POC_VARIANT_LABELS[v]}
          </div>
        ))}
      </div>
    </div>
  )
}
