<script lang="ts">
  import pb from '$lib/pb'
  import type { VenturesResponse } from '$types/pocketbase-types'

  let { onSelect, activeId } = $props<{
    onSelect: (id: string, title: string) => void
    activeId: string | null
  }>()

  let ventures = $state<VenturesResponse[]>([])
  let newTitle = $state('')
  let currentPage = $state(1)
  let totalPages = $state(1)
  let perPage = $state(5)
  let loading = $state(false)

  async function load(page = currentPage) {
    loading = true
    try {
      const res = await pb.collection('ventures').getList(page, perPage, { sort: '-created' })
      ventures = res.items
      currentPage = res.page
      totalPages = res.totalPages
    } finally {
      loading = false
    }
  }

  async function createVenture() {
    if (!newTitle) return
    const slug = newTitle.toLowerCase().replace(/\s+/g, '-')
    await pb.collection('ventures').create({ title: newTitle, slug })
    newTitle = ''
    load(1)
  }

  async function deleteVenture(id: string, e: MouseEvent) {
    e.stopPropagation()
    if (confirm('Delete this venture? This will affect its processes and documents.')) {
      await pb.collection('ventures').delete(id)
      if (ventures.length === 1 && currentPage > 1) {
        load(currentPage - 1)
      } else {
        load(currentPage)
      }
    }
  }

  const handleKeyDown = (e: KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      deleteVenture(id, e as any)
    }
  }

  $effect(() => {
    load(currentPage)
    $inspect(ventures)
  })
</script>

<div class="space-y-4">
  <div class="flex gap-2">
    <input
      bind:value={newTitle}
      placeholder="New venture name..."
      class="flex-1 bg-slate-50 border border-slate-200 p-3 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-aspada-gold/10 focus:border-aspada-gold/30 outline-none transition-all placeholder:text-slate-400"
    />
    <button
      onclick={createVenture}
      class="bg-aspada-navy text-white px-5 py-3 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-aspada-gold hover:text-white transition-all active:scale-95 shadow-lg shadow-aspada-navy/10 cursor-pointer"
    >
      Add
    </button>
  </div>

  <div class="space-y-3 relative min-h-[200px]">
    {#if loading && ventures.length === 0}
      <div class="flex flex-col items-center justify-center py-12 text-slate-400">
        <span class="i-lucide-loader-2 text-2xl animate-spin mb-2"></span>
        <p class="text-[10px] font-bold uppercase tracking-widest font-mono">Loading Ventures...</p>
      </div>
    {:else}
      <div class="grid grid-cols-1 gap-3">
        {#each ventures as v (v.id)}
          <button
            onclick={() => onSelect(v.id, v.title)}
            class="group w-full flex justify-between items-center p-4 rounded-[1.25rem] border-2 transition-all duration-300 text-left
            {activeId === v.id
              ? 'border-aspada-gold bg-aspada-gold/5 shadow-md scale-[1.02]'
              : 'border-slate-50 bg-slate-50/50 hover:border-slate-200 hover:bg-white'}"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-1.5 h-1.5 rounded-full transition-all {activeId === v.id
                  ? 'bg-aspada-gold scale-[2]'
                  : 'bg-slate-300 group-hover:bg-slate-400'}"
              ></div>
              <span
                class="font-bold text-slate-700 transition-colors {activeId === v.id
                  ? 'text-aspada-navy'
                  : 'group-hover:text-slate-900'}">{v.title}</span
              >
            </div>
            <span
              role="button"
              tabindex="0"
              onclick={(e) => deleteVenture(v.id, e)}
              onkeydown={(e) => handleKeyDown(e, v.id)}
              class="text-slate-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
              aria-label="Delete Venture"
            >
              <span class="i-lucide-trash-2 text-lg"></span>
            </span>
          </button>
        {/each}
      </div>
    {/if}
  </div>

  {#if totalPages > 1}
    <div class="mt-8 flex items-center justify-between px-2 pt-4 border-t border-slate-100">
      <button
        onclick={() => (currentPage -= 1)}
        disabled={currentPage === 1 || loading}
        class="p-2 rounded-xl border-2 border-slate-100 hover:bg-white hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
        aria-label="Previous Page"
      >
        <span class="i-lucide-chevron-left text-lg"></span>
      </button>

      <div class="flex items-center gap-1.5">
        {#each Array(totalPages) as _, i}
          <button
            type="button"
            title={`Page ${i + 1}`}
            onclick={() => (currentPage = i + 1)}
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
        aria-label="Next Page"
      >
        <span class="i-lucide-chevron-right text-lg"></span>
      </button>
    </div>
  {/if}
</div>
