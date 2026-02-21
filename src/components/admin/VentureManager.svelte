<script lang="ts">
  import pb from '$lib/pb'
  import type { VenturesResponse } from '$types/pocketbase-types'

  let { onSelect, activeId } = $props<{
    onSelect: (id: string) => void
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
    if (confirm('Delete this venture?')) {
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
      deleteVenture(id, e)
    }
  }

  $effect(() => {
    load(currentPage)
  })
</script>

<div class="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
  <h2 class="text-xl font-bold mb-4 text-slate-800">Ventures</h2>

  <div class="flex gap-2 mb-4">
    <input
      bind:value={newTitle}
      placeholder="Venture name..."
      class="flex-1 border p-2 rounded-lg text-sm"
    />
    <button
      onclick={createVenture}
      class="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-medium">Add</button
    >
  </div>

  <div class="space-y-2 relative min-h-[100px]">
    {#if loading && ventures.length === 0}
      <div class="flex items-center justify-center py-8 text-slate-400">
        <span class="animate-pulse">Loading ventures...</span>
      </div>
    {:else}
      {#each ventures as v (v.id)}
        <button
          onclick={() => onSelect(v.id)}
          class="w-full flex justify-between items-center p-3 rounded-lg border transition-all cursor-pointer
        {activeId === v.id
            ? 'border-blue-500 bg-blue-50 shadow-sm'
            : 'border-slate-100 hover:bg-slate-50'}"
        >
          <span class="font-medium text-slate-700">{v.title}</span>
          <span
            role="button"
            tabindex="0"
            onclick={(e) => deleteVenture(v.id, e)}
            onkeydown={(e) => handleKeyDown(e, v.id)}
            class="text-slate-300 hover:text-red-500 px-2 cursor-pointer"
            aria-label="Delete Venture"
          >
            <span class="i-lucide-circle-x"></span>
          </span>
        </button>
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
