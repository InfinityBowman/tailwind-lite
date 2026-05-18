import { useCallback, useMemo, useState } from 'react'
import { TerrainCanvas } from './components/TerrainCanvas'
import { PipelinePanel } from './components/PipelinePanel'
import { SlopePoC } from './components/SlopePoC'
import { RiverPoC } from './components/RiverPoC'
import { createHexGrid } from './terrain/grid'
import { runPipeline } from './terrain/pipeline'
import { registry } from './terrain/registry'
import { fbmHeightmap } from './terrain/algorithms/heightmap/fbm'
import { hydraulicParticle } from './terrain/algorithms/erosion/hydraulic-particle'
import { planchonDarboux } from './terrain/algorithms/sink-fill/planchon-darboux'
import { flowAccumulation } from './terrain/algorithms/rivers/flow-accumulation'
import { windAdvected } from './terrain/algorithms/moisture/wind-advected'
import { latitudeLapse } from './terrain/algorithms/temperature/latitude-lapse'
import { whittakerBiomes } from './terrain/algorithms/biomes/whittaker'
import type { PipelineStep } from './terrain/types'

const INITIAL_STEPS: PipelineStep[] = [
  {
    kind: 'heightmap',
    algorithmId: fbmHeightmap.id,
    params: { ...fbmHeightmap.defaultParams },
    enabled: true,
  },
  {
    kind: 'erosion',
    algorithmId: hydraulicParticle.id,
    params: { ...hydraulicParticle.defaultParams },
    enabled: true,
  },
  {
    kind: 'sink-fill',
    algorithmId: planchonDarboux.id,
    params: { ...planchonDarboux.defaultParams },
    enabled: true,
  },
  {
    kind: 'rivers',
    algorithmId: flowAccumulation.id,
    params: { ...flowAccumulation.defaultParams },
    enabled: true,
  },
  {
    kind: 'moisture',
    algorithmId: windAdvected.id,
    params: { ...windAdvected.defaultParams },
    enabled: true,
  },
  {
    kind: 'temperature',
    algorithmId: latitudeLapse.id,
    params: { ...latitudeLapse.defaultParams },
    enabled: true,
  },
  {
    kind: 'biomes',
    algorithmId: whittakerBiomes.id,
    params: { ...whittakerBiomes.defaultParams },
    enabled: true,
  },
]

type View = 'terrain' | 'slope-poc' | 'river-poc'

export default function App() {
  const [seed, setSeed] = useState(12345)
  const [size, setSize] = useState(160)
  const [steps, setSteps] = useState<PipelineStep[]>(INITIAL_STEPS)
  const [view, setView] = useState<View>('terrain')

  const grid = useMemo(() => {
    const g = createHexGrid(size, size, 'pointy-top')
    runPipeline(g, steps, registry, seed)
    return g
  }, [seed, size, steps])

  const updateStep = useCallback((i: number, step: PipelineStep) => {
    setSteps((prev) => prev.map((x, j) => (j === i ? step : x)))
  }, [])

  return (
    <div className="flex flex-col h-screen bg-zinc-950">
      <div className="flex gap-1 px-3 py-2 border-b border-zinc-800 bg-zinc-900">
        <ViewTab active={view === 'terrain'} onClick={() => setView('terrain')}>
          Terrain
        </ViewTab>
        <ViewTab
          active={view === 'slope-poc'}
          onClick={() => setView('slope-poc')}
        >
          Slope PoC
        </ViewTab>
        <ViewTab
          active={view === 'river-poc'}
          onClick={() => setView('river-poc')}
        >
          River PoC
        </ViewTab>
      </div>
      <div className="flex flex-1 min-h-0">
        {view === 'terrain' ? (
          <>
            <PipelinePanel
              steps={steps}
              registry={registry}
              seed={seed}
              size={size}
              onSeedChange={setSeed}
              onSizeChange={setSize}
              onStepChange={updateStep}
            />
            <div className="flex-1 relative">
              <TerrainCanvas grid={grid} />
            </div>
          </>
        ) : view === 'slope-poc' ? (
          <div className="flex-1 relative">
            <SlopePoC />
          </div>
        ) : (
          <div className="flex-1 relative">
            <RiverPoC />
          </div>
        )}
      </div>
    </div>
  )
}

function ViewTab({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 text-sm rounded ${
        active
          ? 'bg-zinc-700 text-zinc-100'
          : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
      }`}
    >
      {children}
    </button>
  )
}
