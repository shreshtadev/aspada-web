<script lang="ts">
  import pb from '$lib/pb'
  import { ProcessesStatusOptions, type ProcessesResponse } from '$types/pocketbase-types'

  let { ventureId, onStepSelect, activeStepId } = $props<{
    ventureId: string
    onStepSelect: (id: string, title: string) => void
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
  let editingId = $state<string | null>(null)
  let editingTitle = $state('')

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

      const startSequence = (currentPage - 1) * perPage + 1

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

  function startEditing(step: ProcessesResponse, e: MouseEvent) {
    e.stopPropagation()
    editingId = step.id
    editingTitle = step.title
  }

  async function saveEdit() {
    if (!editingId || !editingTitle) {
      editingId = null
      return
    }
    processing = true
    try {
      await pb.collection('processes').update(editingId, { title: editingTitle })
      editingId = null
      await loadSteps(currentPage)
    } finally {
      processing = false
    }
  }

  function handleEditKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') saveEdit()
    if (e.key === 'Escape') editingId = null
  }

  $effect(() => {
    if (ventureId) loadSteps(currentPage)
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'bg-green-500'
      case 'in_progress':
        return 'bg-aspada-gold'
      case 'review':
        return 'bg-amber-500'
      default:
        return 'bg-slate-300'
    }
  }
</script>

<div class="space-y-6">
  <div class="flex gap-2">
    <input
      bind:value={stepTitle}
      placeholder="New step..."
      class="flex-1 bg-slate-50 border border-slate-200 p-3 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-aspada-gold/10 focus:border-aspada-gold/30 outline-none transition-all placeholder:text-slate-400"
    />
    <button
      type="button"
      onclick={addStep}
      class="bg-aspada-navy text-white px-5 py-3 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-aspada-gold hover:text-white transition-all active:scale-95 shadow-lg shadow-aspada-navy/10"
    >
      Add
    </button>
  </div>

  <div class="space-y-3" role="list">
    {#if loading && steps.length === 0}
      <div class="flex flex-col items-center justify-center py-12 text-slate-400">
        <span class="i-lucide-loader-2 text-2xl animate-spin mb-2"></span>
        <p class="text-[10px] font-bold uppercase tracking-widest font-mono">
          Loading Processes...
        </p>
      </div>
    {:else}
      {#each steps as step, i (step.id)}
        <div
          class="flex flex-col p-4 rounded-3xl border-2 transition-all duration-300 group
          {activeStepId === step.id
            ? 'border-aspada-gold bg-aspada-gold/5 shadow-lg'
            : 'border-slate-50 bg-slate-50/50 hover:border-slate-200 hover:bg-white'}
          {hoverIndex === i ? 'border-t-4 border-t-aspada-gold' : ''}
          {draggingIndex === i ? 'opacity-30 scale-95' : ''}"
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
          <div class="flex items-start gap-4">
            <div
              class="flex flex-col items-center justify-center text-slate-300 cursor-grab active:cursor-grabbing hover:text-slate-500 transition-colors pt-1"
            >
              <span class="i-lucide-grip-vertical text-xl"></span>
            </div>

            <div class="flex-1 text-left">
              <div
                class="flex justify-between items-center mb-1 cursor-pointer"
                onclick={() => onStepSelect(step.id, step.title)}
                role="button"
                tabindex="0"
                onkeydown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') onStepSelect(step.id, step.title)
                }}
              >
                <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest"
                  >Sequence {step.sequence}</span
                >
                <div
                  class="flex items-center gap-1.5 bg-white border border-slate-100 rounded-full px-2 py-0.5 shadow-sm"
                >
                  <div class="w-1.5 h-1.5 rounded-full {getStatusColor(step.status)}"></div>
                  <span class="text-[9px] font-black uppercase text-slate-500"
                    >{step.status.replace('_', ' ')}</span
                  >
                </div>
              </div>

              {#if editingId === step.id}
                <div
                  class="flex items-center gap-2 mb-4"
                  onclick={(e) => e.stopPropagation()}
                  role="presentation"
                >
                  <input
                    bind:value={editingTitle}
                    onkeydown={handleEditKeyDown}
                    class="flex-1 bg-white border-2 border-aspada-gold/30 px-3 py-1.5 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-aspada-gold/10"
                  />
                  <button
                    onclick={saveEdit}
                    class="text-green-600 hover:text-green-700 p-1.5 rounded-lg hover:bg-green-50 transition-all cursor-pointer"
                    title="Save Title"
                  >
                    <span class="i-lucide-check text-lg"></span>
                  </button>
                  <button
                    onclick={() => (editingId = null)}
                    class="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-50 transition-all cursor-pointer"
                    title="Cancel"
                  >
                    <span class="i-lucide-x text-lg"></span>
                  </button>
                </div>
              {:else}
                <div class="flex items-center justify-between mb-4 group/title">
                  <span
                    class="text-base font-black text-aspada-navy group-hover:text-aspada-gold transition-colors cursor-pointer"
                    onclick={() => onStepSelect(step.id, step.title)}
                    role="button"
                    tabindex="0"
                    onkeydown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') onStepSelect(step.id, step.title)
                    }}
                  >
                    {step.title}
                  </span>
                  <button
                    onclick={(e) => startEditing(step, e)}
                    class="text-slate-300 hover:text-aspada-gold p-1 rounded-lg hover:bg-aspada-gold/5 transition-all cursor-pointer opacity-0 group-hover/title:opacity-100"
                    title="Edit Title"
                  >
                    <span class="i-lucide-edit-2 text-sm"></span>
                  </button>
                </div>
              {/if}
              <div
                class="grid grid-cols-2 gap-2"
                onclick={(e) => e.stopPropagation()}
                role="presentation"
              >
                <select
                  value={step.status}
                  onchange={(e) =>
                    updateStatus(step.id, e.currentTarget.value as ProcessesStatusOptions)}
                  class="text-[10px] border-2 border-slate-100 rounded-xl bg-white px-3 py-2 font-black text-slate-600 cursor-pointer hover:border-slate-300 outline-none transition-all uppercase tracking-wider"
                >
                  {#each Object.values(ProcessesStatusOptions) as opt}
                    <option value={opt}>{opt.replace('_', ' ')}</option>
                  {/each}
                </select>

                <select
                  value={step.parent}
                  onchange={(e) => updateParent(step.id, e.currentTarget.value)}
                  class="text-[10px] border-2 border-slate-100 rounded-xl bg-white px-3 py-2 font-black text-slate-600 cursor-pointer hover:border-slate-300 outline-none transition-all uppercase tracking-wider"
                >
                  <option value={null}>No Parent</option>
                  {#each allSteps as parentStep}
                    {#if parentStep.id !== step.id}
                      <option value={parentStep.id}>{parentStep.title}</option>
                    {/if}
                  {/each}
                </select>
              </div>
            </div>
          </div>
        </div>
      {/each}
    {/if}
  </div>

  {#if totalPages > 1}
    <div class="mt-8 flex items-center justify-between px-2 pt-4 border-t border-slate-100">
      <button
        onclick={() => (currentPage -= 1)}
        disabled={currentPage === 1 || loading}
        class="p-2 rounded-xl border-2 border-slate-100 hover:bg-white hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
        aria-label="Previous page"
      >
        <span class="i-lucide-chevron-left text-lg"></span>
      </button>

      <div class="flex items-center gap-1.5">
        {#each Array(totalPages) as _, i}
          <button
            onclick={() => (currentPage = i + 1)}
            title={`Page ${i + 1}`}
            class="w-1.5 h-1.5 rounded-full transition-all {currentPage === i + 1
              ? 'bg-aspada-navy w-4'
              : 'bg-slate-200 hover:bg-slate-400'}"
          ></button>
        {/each}
      </div>

      <button
        onclick={() => (currentPage += 1)}
        disabled={currentPage === totalPages || loading}
        class="p-2 rounded-xl border-2 border-slate-100 hover:bg-white hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
        aria-label="Next page"
      >
        <span class="i-lucide-chevron-right text-lg"></span>
      </button>
    </div>
  {/if}
</div>
