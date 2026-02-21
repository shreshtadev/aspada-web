<script lang="ts">
  import pb from '$lib/pb'
  import { ProcessesStatusOptions, type ProcessesResponse } from '$types/pocketbase-types'

  let { ventureId, onStepSelect, activeStepId } = $props<{
    ventureId: string
    onStepSelect: (id: string) => void
    activeStepId: string | null
  }>()

  let steps = $state<ProcessesResponse[]>([])
  let allSteps = $state<ProcessesResponse[]>([])
  let stepTitle = $state('')
  let stepParent = $state<string | null>(null)
  let processing = $state(false)
  let currentPage = $state(1)
  let totalPages = $state(1)
  let perPage = $state(5)
  let loading = $state(false)

  async function loadSteps(page = currentPage) {
    loading = true
    try {
      const allRes = await pb.collection('processes').getList(1, 1000, {
        filter: `project = "${ventureId}"`,
        sort: 'sequence',
      })
      allSteps = allRes.items
      const res = await pb.collection('processes').getList(page, perPage, {
        filter: `project = "${ventureId}"`,
        sort: 'sequence',
      })
      steps = res.items
      currentPage = res.page
      totalPages = res.totalPages
    } finally {
      loading = false
    }
  }

  async function addStep() {
    if (!stepTitle) return
    await pb.collection('processes').create({
      title: stepTitle,
      project: ventureId,
      sequence: steps.length + 1,
      status: ProcessesStatusOptions.todo,
      parent: stepParent,
    })
    stepTitle = ''
    stepParent = null
    // Load last page to show the new step
    await loadSteps(totalPages)
  }

  let draggingIndex = $state<number | null>(null)
  let hoverIndex = $state<number | null>(null)

  function handleDragStart(index: number) {
    draggingIndex = index
  }

  function handleDragOver(e: DragEvent, index: number) {
    e.preventDefault()
    hoverIndex = index
  }

  async function handleDrop(index: number) {
    if (draggingIndex === null || draggingIndex === index || processing) {
      draggingIndex = null
      hoverIndex = null
      return
    }

    processing = true
    try {
      const newSteps = [...steps]
      const [draggedItem] = newSteps.splice(draggingIndex, 1)
      newSteps.splice(index, 0, draggedItem)

      // Calculate the starting sequence for this page
      const startSequence = (currentPage - 1) * perPage + 1

      // Update all items in the current view to have correct sequences
      await Promise.all(
        newSteps.map((step, idx) =>
          pb.collection('processes').update(step.id, {
            sequence: startSequence + idx,
          })
        )
      )

      await loadSteps()
    } finally {
      processing = false
      draggingIndex = null
      hoverIndex = null
    }
  }

  async function updateStatus(id: string, status: ProcessesStatusOptions) {
    await pb.collection('processes').update(id, { status })
    await loadSteps(currentPage)
  }

  async function updateParent(id: string, parent: string | null) {
    await pb.collection('processes').update(id, { parent })
    await loadSteps(currentPage)
  }

  $effect(() => {
    if (ventureId) loadSteps(currentPage)
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
    {#if loading && steps.length === 0}
      <div class="flex items-center justify-center py-8 text-slate-400">
        <span class="animate-pulse">Loading steps...</span>
      </div>
    {:else}
      {#each steps as step, i (step.id)}
        <div
          class="flex items-center gap-3 p-3 rounded-lg border transition-all cursor-move
          {activeStepId === step.id
            ? 'border-blue-500 bg-blue-50 shadow-sm'
            : 'border-slate-100 hover:border-slate-300'}
          {hoverIndex === i ? 'border-t-4 border-t-blue-500 !mt-[-4px]' : ''}
          {draggingIndex === i ? 'opacity-50' : ''}"
          role="listitem"
          draggable="true"
          ondragstart={() => handleDragStart(i)}
          ondragover={(e) => handleDragOver(e, i)}
          ondragleave={() => {
            if (hoverIndex === i) hoverIndex = null
          }}
          ondrop={() => handleDrop(i)}
          ondragend={() => {
            draggingIndex = null
            hoverIndex = null
          }}
        >
          <div class="flex flex-col items-center justify-center text-slate-300">
            <span class="i-lucide-grip-vertical text-lg"></span>
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
            </div>
            <div class="space-y-2">
              <span class="text-md font-semibold text-slate-700 block truncate">{step.title}</span>
              <section class="flex flex-row items-center gap-4">
                <select
                  value={step.status}
                  onchange={(e) =>
                    updateStatus(step.id, e.currentTarget.value as ProcessesStatusOptions)}
                  onclick={(e) => e.stopPropagation()}
                  class="text-sm border rounded bg-white px-2 py-1 font-bold text-slate-600 cursor-pointer hover:border-slate-400 outline-none"
                >
                  {#each Object.values(ProcessesStatusOptions) as opt}
                    <option value={opt}>{opt.toUpperCase()}</option>
                  {/each}
                </select>

                <select
                  value={step.parent}
                  onchange={(e) => updateParent(step.id, e.currentTarget.value)}
                  onclick={(e) => e.stopPropagation()}
                  class="text-sm border rounded bg-white px-2 py-1 font-bold text-slate-600 cursor-pointer hover:border-slate-400 outline-none"
                >
                  <option value={null}>No Parent</option>
                  {#each allSteps as parentStep}
                    {#if parentStep.id !== step.id}
                      <option value={parentStep.id}>{parentStep.title}</option>
                    {/if}
                  {/each}
                </select>
              </section>
            </div>
          </button>
        </div>
      {/each}
    {/if}
  </div>

  {#if totalPages > 1}
    <div class="mt-6 flex items-center justify-center gap-2 border-t pt-4">
      <button
        onclick={() => (currentPage -= 1)}
        disabled={currentPage === 1 || loading}
        class="p-2 rounded-lg border hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        aria-label="Previous page"
      >
        <span class="i-lucide-chevron-left text-lg"></span>
      </button>
      <span class="text-sm text-slate-600 font-medium">
        Page {currentPage} of {totalPages}
      </span>
      <button
        onclick={() => (currentPage += 1)}
        disabled={currentPage === totalPages || loading}
        class="p-2 rounded-lg border hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        aria-label="Next page"
      >
        <span class="i-lucide-chevron-right text-lg"></span>
      </button>
    </div>
  {/if}
</div>
