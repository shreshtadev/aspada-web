<script lang="ts">
  import pb from '$lib/pb'
  import type { VenturesResponse } from '$types/pocketbase-types'

  let { onSelect, activeId } = $props<{
    onSelect: (id: string) => void
    activeId: string | null
  }>()

  let ventures = $state<VenturesResponse[]>([])
  let newTitle = $state('')

  async function load() {
    ventures = await pb.collection('ventures').getFullList({ sort: '-created' })
  }

  async function createVenture() {
    if (!newTitle) return
    const slug = newTitle.toLowerCase().replace(/\s+/g, '-')
    await pb.collection('ventures').create({ title: newTitle, slug })
    newTitle = ''
    load()
  }

  async function deleteVenture(id: string, e: MouseEvent) {
    e.stopPropagation()
    if (confirm('Delete this venture?')) {
      await pb.collection('ventures').delete(id)
      load()
    }
  }

  $effect(() => {
    load()
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

  <div class="space-y-2">
    {#each ventures as v (v.id)}
      <button
        onclick={() => onSelect(v.id)}
        class="w-full flex justify-between items-center p-3 rounded-lg border transition-all
        {activeId === v.id
          ? 'border-blue-500 bg-blue-50 shadow-sm'
          : 'border-slate-100 hover:bg-slate-50'}"
      >
        <span class="font-medium text-slate-700">{v.title}</span>
        <span onclick={(e) => deleteVenture(v.id, e)} class="text-slate-300 hover:text-red-500 px-2"
          >×</span
        >
      </button>
    {/each}
  </div>
</div>
