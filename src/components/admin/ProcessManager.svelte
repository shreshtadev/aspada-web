<script lang="ts">
  import pb from '$lib/pb'
  import { ProcessesStatusOptions, type ProcessesResponse } from '$types/pocketbase-types'

  let { ventureId, onStepSelect, activeStepId } = $props<{
    ventureId: string
    onStepSelect: (id: string) => void
    activeStepId: string | null
  }>()

  let steps = $state<ProcessesResponse[]>([])
  let stepTitle = $state('')
  let stepDescription = $state('')
  let processing = $state(false)

  async function loadSteps() {
    // Fetch steps sorted by the sequence field [cite: 1]
    steps = await pb.collection('processes').getFullList({
      filter: `project = "${ventureId}"`,
      sort: 'sequence',
    })
  }

  async function addStep() {
    if (!stepTitle) return
    await pb.collection('processes').create({
      title: stepTitle,
      project: ventureId,
      sequence: steps.length + 1,
      status: ProcessesStatusOptions.todo,
    })
    stepTitle = ''
    await loadSteps()
  }

  async function moveStep(index: number, direction: 'up' | 'down') {
    if (processing) return
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= steps.length) return

    processing = true
    try {
      const currentStep = steps[index]
      const targetStep = steps[targetIndex]

      await Promise.all([
        pb.collection('processes').update(currentStep.id, { sequence: targetStep.sequence }),
        pb.collection('processes').update(targetStep.id, { sequence: currentStep.sequence }),
      ])
      await loadSteps()
    } finally {
      processing = false
    }
  }

  async function updateStatus(id: string, status: ProcessesStatusOptions) {
    await pb.collection('processes').update(id, { status })
    await loadSteps()
  }

  $effect(() => {
    if (ventureId) loadSteps()
  })
</script>

<div class="space-y-4">
  <div class="flex gap-2">
    <input
      bind:value={stepTitle}
      placeholder="New step..."
      class="flex-1 border p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
    />

    <button
      type="button"
      onclick={addStep}
      class="bg-blue-600 text-white px-4 py-1 rounded-lg text-sm font-bold hover:bg-blue-700"
    >
      Add
    </button>
  </div>

  <div class="space-y-2" role="list">
    {#each steps as step, i (step.id)}
      <div
        class="flex items-center gap-3 p-3 rounded-lg border transition-all
        {activeStepId === step.id
          ? 'border-blue-500 bg-blue-50 shadow-sm'
          : 'border-slate-100 hover:border-slate-300'}"
        role="listitem"
      >
        <div class="flex flex-col gap-1">
          <button
            type="button"
            onclick={() => moveStep(i, 'up')}
            disabled={i === 0 || processing}
            aria-label="Move step up"
            class="text-slate-400 hover:text-blue-600 disabled:opacity-20 cursor-pointer"
          >
            ▲
          </button>
          <button
            type="button"
            onclick={() => moveStep(i, 'down')}
            disabled={i === steps.length - 1 || processing}
            aria-label="Move step down"
            class="text-slate-400 hover:text-blue-600 disabled:opacity-20 cursor-pointer"
          >
            ▼
          </button>
        </div>

        <button
          type="button"
          onclick={() => onStepSelect(step.id)}
          class="flex-1 text-left overflow-hidden focus:outline-none"
        >
          <div class="flex justify-between items-center mb-1">
            <span class="text-[10px] font-mono text-slate-400 uppercase"
              >Sequence {step.sequence}</span
            >
            <select
              value={step.status}
              onchange={(e) =>
                updateStatus(step.id, e.currentTarget.value as ProcessesStatusOptions)}
              onclick={(e) => e.stopPropagation()}
              class="text-md border rounded bg-white px-1 font-bold text-slate-600 cursor-pointer"
            >
              {#each Object.values(ProcessesStatusOptions) as opt}
                <option value={opt}>{opt.toUpperCase()}</option>
              {/each}
            </select>
          </div>
          <span class="text-sm font-semibold text-slate-700 block truncate">{step.title}</span>
        </button>
      </div>
    {/each}
  </div>
</div>
