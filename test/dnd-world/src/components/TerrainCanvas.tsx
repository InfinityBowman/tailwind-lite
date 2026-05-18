import { useEffect, useRef } from 'react'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { createScene } from '../render/scene'
import type { SceneContext } from '../render/scene'
import { createHexMesh } from '../render/hex-mesh'
import type { HexMesh } from '../render/hex-mesh'
import { createRiverMesh } from '../render/river-mesh'
import type { RiverMesh } from '../render/river-mesh'
import type { HexGrid } from '../terrain/grid'
import { gridCenter, gridSpan } from '../terrain/grid'

interface Props {
  grid: HexGrid
}

interface MeshRefs {
  current: { hex: HexMesh; river: RiverMesh } | null
}

function frameCamera(
  ctx: SceneContext,
  controls: OrbitControls,
  grid: HexGrid,
): void {
  const [cx, cz] = gridCenter(grid)
  const span = gridSpan(grid)
  ctx.camera.position.set(cx + span * 0.4, span * 0.7, cz + span * 0.9)
  ctx.camera.far = Math.max(2000, span * 5)
  ctx.camera.updateProjectionMatrix()
  controls.target.set(cx, 0, cz)
  controls.update()

  const half = span * 0.65
  ctx.sun.position.set(cx + span * 0.5, span * 1.0, cz - span * 0.3)
  ctx.sun.target.position.set(cx, 0, cz)
  ctx.sun.target.updateMatrixWorld()
  ctx.sun.shadow.camera.left = -half
  ctx.sun.shadow.camera.right = half
  ctx.sun.shadow.camera.top = half
  ctx.sun.shadow.camera.bottom = -half
  ctx.sun.shadow.camera.near = 1
  ctx.sun.shadow.camera.far = span * 4
  ctx.sun.shadow.camera.updateProjectionMatrix()
}

export function TerrainCanvas({ grid }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<SceneContext | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const meshRef: MeshRefs = useRef(null)

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
      sceneRef.current = ctx

      const controls = new OrbitControls(ctx.camera, canvas)
      controls.enableDamping = true
      controlsRef.current = controls

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
        if (meshRef.current) {
          ctx.scene.remove(meshRef.current.hex.mesh)
          ctx.scene.remove(meshRef.current.river.mesh)
          meshRef.current.hex.dispose()
          meshRef.current.river.dispose()
          meshRef.current = null
        }
        ctx.dispose()
        sceneRef.current = null
        controlsRef.current = null
      }
    })

    return () => {
      disposed = true
      cleanup?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const ctx = sceneRef.current
    const controls = controlsRef.current
    if (!ctx || !controls) {
      let raf = 0
      const retry = () => {
        if (sceneRef.current && controlsRef.current) {
          syncMesh(sceneRef.current, controlsRef.current, grid, meshRef)
        } else {
          raf = requestAnimationFrame(retry)
        }
      }
      raf = requestAnimationFrame(retry)
      return () => cancelAnimationFrame(raf)
    }
    syncMesh(ctx, controls, grid, meshRef)
  }, [grid])

  return <canvas ref={canvasRef} className="block w-full h-full" />
}

function syncMesh(
  ctx: SceneContext,
  controls: OrbitControls,
  grid: HexGrid,
  meshRef: MeshRefs,
): void {
  const existing = meshRef.current
  if (
    existing &&
    existing.hex.width === grid.width &&
    existing.hex.height === grid.height
  ) {
    existing.hex.update(grid)
    existing.river.update(grid)
    return
  }
  if (existing) {
    ctx.scene.remove(existing.hex.mesh)
    ctx.scene.remove(existing.river.mesh)
    existing.hex.dispose()
    existing.river.dispose()
  }
  const hex = createHexMesh(grid)
  const river = createRiverMesh(grid)
  meshRef.current = { hex, river }
  ctx.scene.add(hex.mesh)
  ctx.scene.add(river.mesh)
  frameCamera(ctx, controls, grid)
}
