import type { Registry } from '../terrain/pipeline'
import type { ParamSchema, PipelineStep } from '../terrain/types'

interface Props {
  steps: ReadonlyArray<PipelineStep>
  registry: Registry
  seed: number
  size: number
  onSeedChange: (seed: number) => void
  onSizeChange: (size: number) => void
  onStepChange: (i: number, step: PipelineStep) => void
}

export function PipelinePanel({
  steps,
  registry,
  seed,
  size,
  onSeedChange,
  onSizeChange,
  onStepChange,
}: Props) {
  return (
    <div className="w-80 h-screen overflow-y-auto bg-zinc-900 text-zinc-100 p-4 flex flex-col gap-4 border-r border-zinc-800">
      <div className="flex flex-col gap-2">
        <h1 className="text-lg font-semibold">dnd-world</h1>
        <p className="text-xs text-zinc-400">terrain generation poc</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] uppercase tracking-wider text-zinc-400">
          Seed
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            value={seed}
            onChange={(e) => onSeedChange(Number(e.target.value))}
            className="flex-1 bg-zinc-800 px-2 py-1.5 rounded text-sm font-mono"
          />
          <button
            onClick={() => onSeedChange(Math.floor(Math.random() * 1e9))}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-sm"
            title="Randomize seed"
          >
            ↻
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-[10px] uppercase tracking-wider text-zinc-400">
          <span>Map size</span>
          <span className="text-zinc-200 tabular-nums normal-case">
            {size}×{size}
            <span className="text-zinc-500 ml-1">
              ({(size * size).toLocaleString()} cells)
            </span>
          </span>
        </div>
        <input
          type="range"
          min={32}
          max={320}
          step={16}
          value={size}
          onChange={(e) => onSizeChange(parseInt(e.target.value, 10))}
          className="w-full accent-emerald-500"
        />
      </div>

      <div className="flex flex-col gap-3">
        {steps.map((step, i) => (
          <StepCard
            key={`${step.kind}-${i}`}
            step={step}
            registry={registry}
            onChange={(s) => onStepChange(i, s)}
          />
        ))}
      </div>
    </div>
  )
}

function StepCard({
  step,
  registry,
  onChange,
}: {
  step: PipelineStep
  registry: Registry
  onChange: (s: PipelineStep) => void
}) {
  const algorithms = registry[step.kind] ?? {}
  const algo = algorithms[step.algorithmId]

  return (
    <div className="bg-zinc-800/40 rounded p-3 flex flex-col gap-3 border border-zinc-700/50">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-zinc-400">
          {step.kind}
        </span>
        <label className="flex items-center gap-1.5 text-xs text-zinc-400">
          <input
            type="checkbox"
            checked={step.enabled}
            onChange={(e) => onChange({ ...step, enabled: e.target.checked })}
          />
          enabled
        </label>
      </div>
      <select
        value={step.algorithmId}
        onChange={(e) => {
          const next = algorithms[e.target.value]
          if (!next) return
          onChange({
            ...step,
            algorithmId: next.id,
            params: { ...next.defaultParams },
          })
        }}
        className="bg-zinc-900 px-2 py-1.5 rounded text-sm"
      >
        {Object.values(algorithms).map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>
      {algo && step.enabled && (
        <ParamControls
          schema={algo.paramSchema}
          values={step.params}
          onChange={(params) => onChange({ ...step, params })}
        />
      )}
    </div>
  )
}

function ParamControls({
  schema,
  values,
  onChange,
}: {
  schema: ParamSchema
  values: Record<string, unknown>
  onChange: (values: Record<string, unknown>) => void
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {Object.entries(schema).map(([key, spec]) => {
        const v = values[key] ?? spec.default
        if (spec.type === 'bool') {
          return (
            <label
              key={key}
              className="flex items-center gap-2 text-sm text-zinc-300"
            >
              <input
                type="checkbox"
                checked={Boolean(v)}
                onChange={(e) =>
                  onChange({ ...values, [key]: e.target.checked })
                }
              />
              {spec.label ?? key}
            </label>
          )
        }
        const numV = Number(v)
        const decimals = spec.type === 'int' ? 0 : 2
        return (
          <div key={key} className="flex flex-col gap-1">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">{spec.label ?? key}</span>
              <span className="text-zinc-200 tabular-nums">
                {numV.toFixed(decimals)}
              </span>
            </div>
            <input
              type="range"
              min={spec.min}
              max={spec.max}
              step={spec.type === 'int' ? 1 : (spec.step ?? 0.01)}
              value={numV}
              onChange={(e) =>
                onChange({
                  ...values,
                  [key]:
                    spec.type === 'int'
                      ? parseInt(e.target.value, 10)
                      : parseFloat(e.target.value),
                })
              }
              className="w-full accent-emerald-500"
            />
          </div>
        )
      })}
    </div>
  )
}
