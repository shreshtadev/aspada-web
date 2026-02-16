<script lang="ts">
  import pb from '../../lib/pb'
  import toast from 'svelte-french-toast'
  import {
    Collections,
    MetadataCategoryTypeOptions,
    type MetadataResponse,
  } from '../../types/pocketbase-types'

  const MAX_STATS = 4

  // Master list state
  let stats = $state<MetadataResponse[]>([])

  // Detail form state
  let selectedId = $state<string | null>(null)
  let formTitle = $state('')
  let formSummary = $state('')
  let formLoading = $state(false)

  async function loadStats() {
    try {
      const statsList = await pb.collection(Collections.Metadata).getFullList<MetadataResponse>({
        filter: `categoryType = "${MetadataCategoryTypeOptions.statsSettings}"`,
      })
      stats = statsList
    } catch (err) {
      console.error('Failed to load stats:', err)
      toast.error('Failed to load stats')
    }
  }

  $effect(() => {
    loadStats()
  })

  function selectStat(stat: MetadataResponse | null) {
    selectedId = stat?.id ?? null
    formTitle = stat?.title ?? ''
    formSummary = stat?.summary ?? ''
  }

  function newStat() {
    selectedId = null
    formTitle = ''
    formSummary = ''
  }

  async function saveStat() {
    if (!formTitle || !formSummary) {
      toast.error('Title and summary are required')
      return
    }

    // Check if we're creating a new stat and already have 4
    if (!selectedId && stats.length >= MAX_STATS) {
      toast.error(`Maximum of ${MAX_STATS} stats allowed.`)
      return
    }

    formLoading = true

    const data = {
      title: formTitle,
      summary: formSummary,
      categoryType: MetadataCategoryTypeOptions.statsSettings,
    }

    try {
      let record: MetadataResponse
      if (selectedId) {
        record = await pb
          .collection(Collections.Metadata)
          .update<MetadataResponse>(selectedId, data)
        stats = stats.map((s) => (s.id === record.id ? record : s))
        toast.success('Stat updated successfully')
      } else {
        record = await pb.collection(Collections.Metadata).create<MetadataResponse>(data)
        stats = [...stats, record]
        toast.success('Stat created successfully')
      }
      selectStat(record)
    } catch (err: any) {
      console.error('PocketBase error:', err?.response?.data || err)
      toast.error(err?.message ?? 'Save failed')
    } finally {
      formLoading = false
    }
  }

  async function deleteStat(id: string) {
    if (!confirm('Delete this stat? This action cannot be undone.')) return

    try {
      await pb.collection(Collections.Metadata).delete(id)
      stats = stats.filter((s) => s.id !== id)
      if (selectedId === id) newStat()
      toast.success('Stat deleted successfully')
    } catch (err: any) {
      toast.error(err?.message ?? 'Delete failed')
    }
  }

  const canAddNew = $derived(stats.length < MAX_STATS)
</script>

<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
  <!-- Master: list -->
  <div class="md:col-span-1">
    <div class="bg-white p-6 rounded-3xl border border-[#d4af37]/20 shadow-xl">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="font-bold text-slate-900">Stats Settings</h3>
          <p class="text-xs text-slate-500 mt-1">
            {stats.length} / {MAX_STATS} stats
          </p>
        </div>
        <button
          onclick={newStat}
          disabled={!canAddNew}
          class="text-sm text-white bg-[#d4af37] px-3 py-1 rounded font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#b8941f] transition-colors"
        >
          + New
        </button>
      </div>

      {#if !canAddNew}
        <div class="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p class="text-xs text-amber-800">
            Maximum of {MAX_STATS} stats reached.
          </p>
        </div>
      {/if}

      <div class="space-y-2 max-h-[60vh] overflow-auto">
        {#each stats as stat}
          <div
            class="p-3 rounded-lg cursor-pointer hover:bg-slate-50 transition-all border"
            class:bg-slate-100={selectedId === stat.id}
            class:border-[#d4af37]={selectedId === stat.id}
            class:border-transparent={selectedId !== stat.id}
            role="button"
            tabindex="0"
            onclick={() => selectStat(stat)}
            onkeydown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                selectStat(stat)
              }
            }}
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1 min-w-0">
                <div class="font-bold text-slate-900 text-sm mb-1">
                  {stat.title}
                </div>
                <div class="text-xs text-slate-600 line-clamp-2">
                  {stat.summary}
                </div>
              </div>
            </div>
            <!-- <button
              onclick={(e) => {
                e.stopPropagation()
                deleteStat(stat.id)
              }}
              class="text-red-500 text-xs mt-2 hover:underline"
            >
              Delete
            </button> -->
          </div>
        {:else}
          <div class="text-center py-8 text-slate-400">
            <p class="text-sm">No stats yet</p>
            <p class="text-xs mt-1">Click "+ New" to create one</p>
          </div>
        {/each}
      </div>
    </div>
  </div>

  <!-- Detail: form -->
  <div class="md:col-span-2">
    <div class="bg-white p-6 rounded-3xl border border-[#d4af37]/20 shadow-xl">
      <h3 class="font-bold text-slate-900 text-lg mb-6">
        {selectedId ? 'Edit Stat' : 'Create Stat'}
      </h3>

      <div class="space-y-4">
        <label class="block">
          <span class="text-sm font-bold text-slate-700">Title</span>
          <input
            bind:value={formTitle}
            class="w-full mt-1 p-3 border rounded-xl focus:ring-2 focus:ring-[#d4af37]/50 outline-none"
            placeholder="e.g., Years of Experience"
            maxlength="100"
          />
          <p class="text-xs text-slate-500 mt-1">Short descriptive label for the stat</p>
        </label>

        <label class="block">
          <span class="text-sm font-bold text-slate-700">Summary</span>
          <input
            bind:value={formSummary}
            class="w-full mt-1 p-3 border rounded-xl focus:ring-2 focus:ring-[#d4af37]/50 outline-none text-2xl font-bold text-[#d4af37]"
            placeholder="e.g., 25+"
            maxlength="50"
          />
          <p class="text-xs text-slate-500 mt-1">
            The main value/number to display (e.g., "25+", "500+", "100%")
          </p>
        </label>

        <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
          <p class="text-xs font-bold text-slate-700 mb-2">Preview</p>
          <div class="text-center">
            <div class="text-3xl font-extrabold text-[#d4af37]">
              {formSummary || '---'}
            </div>
            <div class="text-sm text-slate-600 mt-1 uppercase tracking-wide">
              {formTitle || 'Title'}
            </div>
          </div>
        </div>
      </div>

      <div class="flex gap-3 mt-6">
        <button
          onclick={saveStat}
          disabled={formLoading || !formTitle || !formSummary}
          class="bg-slate-900 text-aspada-cream px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {formLoading ? 'Saving...' : selectedId ? 'Update Stat' : 'Create Stat'}
        </button>

        <!-- {#if selectedId}
          <button
            onclick={() => deleteStat(selectedId!)}
            class="bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 cursor-pointer"
          >
            Delete
          </button>
        {/if} -->

        <button
          onclick={newStat}
          class="bg-slate-100 px-6 py-3 rounded-xl font-bold text-aspada-steel cursor-pointer hover:scale-105 transition-transform"
        >
          Clear
        </button>
      </div>
    </div>
  </div>
</div>
