<script lang="ts">
  import { onMount } from 'svelte'
  import toast from 'svelte-french-toast'
  import pb from '../../lib/pb'
  import { downloadFile } from '../../lib/utils'
  import {
    Collections,
    type DocumentsResponse,
    type ProcessesResponse,
    ProcessesStatusOptions,
    type VenturesResponse,
  } from '../../types/pocketbase-types'
  import FileUploadTracker from './FileUploadTracker.svelte'
  import Modal from './Modal.svelte'

  let { onVentureSelect } = $props<{ onVentureSelect?: (id: string | null) => void }>()

  // --- State ---
  type ExplorerItem = {
    id: string
    type: 'venture' | 'process' | 'document'
    title: string
    data: any
  }

  let currentPath = $state<{ id: string; title: string; type: 'root' | 'venture' | 'process' }[]>([
    { id: 'root', title: 'Home', type: 'root' },
  ])
  let items = $state<ExplorerItem[]>([])
  let loading = $state(false)
  let viewMode = $state<'grid' | 'list'>('grid')
  let searchQuery = $state('')

  // Context Menu State
  let contextMenu = $state<{
    x: number
    y: number
    visible: boolean
    targetItem: ExplorerItem | null
  }>({
    x: 0,
    y: 0,
    visible: false,
    targetItem: null,
  })

  // Modal States
  let showCreateModal = $state(false)
  let modalType = $state<'venture' | 'process' | 'document'>('venture')
  let modalTitle = $state('')
  let newTitle = $state('')
  let trackerComponent = $state<ReturnType<typeof FileUploadTracker>>()
  let showFilesModal = $state(false)
  let selectedDocument = $state<DocumentsResponse | null>(null)

  // --- Derived ---
  let currentLocation = $derived(currentPath[currentPath.length - 1])
  let filteredItems = $derived(
    searchQuery
      ? items.filter((i) => i.title.toLowerCase().includes(searchQuery.toLowerCase()))
      : items
  )

  // --- Navigation & Loading ---
  async function loadItems() {
    loading = true
    const loc = currentLocation
    const requestKey = `load-${loc.id}` // Prevent race conditions

    try {
      let newItems: ExplorerItem[] = []

      if (loc.type === 'root') {
        const res = await pb.collection(Collections.Ventures).getList<VenturesResponse>(1, 100, {
          sort: '-created',
          fields: 'id,title,slug,created,updated',
          requestKey,
        })
        newItems = res.items.map((v) => ({ id: v.id, type: 'venture' as const, title: v.title, data: v }))
      } else if (loc.type === 'venture') {
        const res = await pb.collection(Collections.Processes).getList<ProcessesResponse>(1, 100, {
          filter: `project = "${loc.id}" && (parent = "" || parent = null)`,
          sort: 'sequence',
          fields: 'id,title,project,parent,sequence,status,created,updated',
          requestKey,
        })
        newItems = res.items.map((p) => ({
          id: p.id,
          type: 'process' as const,
          title: p.title || 'Untitled Process',
          data: p,
        }))
      } else if (loc.type === 'process') {
        const [subProcesses, docs] = await Promise.all([
          pb.collection(Collections.Processes).getList<ProcessesResponse>(1, 100, {
            filter: `parent = "${loc.id}"`,
            sort: 'sequence',
            fields: 'id,title,project,parent,sequence,status,created,updated',
            requestKey: `${requestKey}-proc`,
          }),
          pb.collection(Collections.Documents).getList<DocumentsResponse>(1, 100, {
            filter: `step = "${loc.id}"`,
            sort: '-created',
            fields: 'id,title,slug,step,attachments,created,updated',
            requestKey: `${requestKey}-docs`,
          }),
        ])

        newItems = [
          ...subProcesses.items.map((p) => ({
            id: p.id,
            type: 'process' as const,
            title: p.title || 'Untitled Process',
            data: p,
          })),
          ...docs.items.map((d) => ({
            id: d.id,
            type: 'document' as const,
            title: d.title,
            data: d,
          })),
        ]
      }

      items = newItems
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Failed to load items:', err)
        toast.error('Failed to load items')
      }
    } finally {
      loading = false
    }
  }

  function navigateTo(id: string, title: string, type: 'root' | 'venture' | 'process') {
    if (type === 'root') {
      currentPath = [{ id: 'root', title: 'Home', type: 'root' }]
      if (onVentureSelect) onVentureSelect(null)
    } else {
      const idx = currentPath.findIndex((p) => p.id === id)
      if (idx !== -1) {
        currentPath = currentPath.slice(0, idx + 1)
      } else {
        currentPath = [...currentPath, { id, title, type }]
      }

      const venture = currentPath.find((p) => p.type === 'venture')
      if (onVentureSelect) onVentureSelect(venture?.id || null)
    }
    loadItems()
  }

  function handleItemClick(item: ExplorerItem) {
    if (item.type === 'venture') {
      navigateTo(item.id, item.title, 'venture')
    } else if (item.type === 'process') {
      navigateTo(item.id, item.title, 'process')
    } else if (item.type === 'document') {
      const doc = item.data as DocumentsResponse
      if (doc.attachments && doc.attachments.length > 1) {
        selectedDocument = doc
        showFilesModal = true
      } else if (doc.attachments && doc.attachments.length === 1) {
        downloadFile(doc, doc.attachments[0])
      }
    }
  }

  // --- Context Menu Handlers ---
  function onContextMenu(e: MouseEvent, item: ExplorerItem | null = null) {
    e.preventDefault()
    contextMenu = {
      x: e.clientX,
      y: e.clientY,
      visible: true,
      targetItem: item,
    }
  }

  function closeContextMenu() {
    contextMenu.visible = false
  }

  // --- CRUD Actions ---
  function openCreateModal(type: 'venture' | 'process' | 'document') {
    modalType = type
    newTitle = ''
    modalTitle =
      type === 'venture' ? 'New Venture' : type === 'process' ? 'New Subfolder' : 'Upload File'
    showCreateModal = true
    closeContextMenu()
  }

  async function handleCreate() {
    if (!newTitle && modalType !== 'document') return

    loading = true
    try {
      if (modalType === 'venture') {
        const slug = newTitle.toLowerCase().replace(/\s+/g, '-')
        await pb.collection(Collections.Ventures).create({ title: newTitle, slug })
        toast.success('Venture created')
      } else if (modalType === 'process') {
        const ventureId = currentPath.find((p) => p.type === 'venture')?.id
        const parentId = currentLocation.type === 'process' ? currentLocation.id : null

        await pb.collection(Collections.Processes).create({
          title: newTitle,
          project: ventureId,
          parent: parentId,
          status: ProcessesStatusOptions.todo,
          sequence: items.filter((i) => i.type === 'process').length + 1,
        })
        toast.success('Subfolder created')
      } else if (modalType === 'document') {
        const processId = currentLocation.id
        if (currentLocation.type !== 'process')
          throw new Error('Must be in a subfolder to upload files')

        const files = trackerComponent?.getSelectedFiles() ?? []
        if (files.length === 0) throw new Error('No files selected')

        const data = new FormData()
        data.append('title', newTitle || files[0].name)
        data.append('step', processId)
        data.append('slug', (newTitle || files[0].name).toLowerCase().trim().replace(/\s+/g, '-'))

        for (const file of files) {
          data.append('attachments', file)
        }

        await pb.collection(Collections.Documents).create(data)
        toast.success('File uploaded')
      }

      showCreateModal = false
      loadItems()
    } catch (err: any) {
      toast.error(err.message || 'Action failed')
    } finally {
      loading = false
    }
  }

  async function handleDelete(item: ExplorerItem) {
    if (!confirm(`Delete ${item.title}?`)) return

    try {
      if (item.type === 'venture') {
        await pb.collection(Collections.Ventures).delete(item.id)
      } else if (item.type === 'process') {
        await pb.collection(Collections.Processes).delete(item.id)
      } else if (item.type === 'document') {
        await pb.collection(Collections.Documents).delete(item.id)
      }
      toast.success('Deleted successfully')
      loadItems()
    } catch (err) {
      toast.error('Failed to delete')
    }
    closeContextMenu()
  }

  onMount(() => {
    loadItems()
    window.addEventListener('click', closeContextMenu)
    return () => window.removeEventListener('click', closeContextMenu)
  })
</script>

<div
  role="main"
  aria-label="DMS Explorer"
  class="flex flex-col h-[calc(100vh-10rem)] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100"
  oncontextmenu={(e) => onContextMenu(e, null)}
>
  <!-- Header / Breadcrumbs -->
  <div class="bg-aspada-navy p-4 sm:p-6 flex flex-col gap-6">
    <!-- Top Row: Title & Actions -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <!-- Title Section -->
      <div class="flex items-center gap-3 text-white">
        <span class="i-lucide-folder-tree text-2xl text-aspada-gold"></span>
        <h2 class="text-xl font-black uppercase tracking-tight">DMS Explorer</h2>
      </div>

      <!-- Actions Toolbar -->
      <div class="flex items-center gap-2 sm:gap-4 ml-auto sm:ml-0">
        {#if currentPath.find((p) => p.type === 'venture')}
          {@const venture = currentPath.find((p) => p.type === 'venture')}
          <button
            onclick={() =>
              window.dispatchEvent(
                new CustomEvent('open-flow', { detail: { ventureId: venture?.id } })
              )}
            class="text-[10px] bg-white/10 text-white px-3 py-2 rounded-full font-black hover:bg-white/20 transition-all flex items-center gap-1.5 uppercase border border-white/5"
          >
            <span class="i-lucide-git-graph text-sm"></span>
            <span>Map</span>
          </button>
        {/if}

        <div class="h-6 w-px bg-white/10 hidden sm:block"></div>

        <!-- Search Bar -->
        <div class="relative group hidden md:block">
          <span
            class="i-lucide-search absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-aspada-gold transition-colors"
          ></span>
          <input
            type="text"
            bind:value={searchQuery}
            placeholder="Search vault..."
            class="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs font-bold text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-aspada-gold/40 focus:bg-white/10 transition-all w-48 focus:w-64"
          />
        </div>

        <!-- View Toggle -->
        <div class="flex bg-white/5 p-1 rounded-xl border border-white/10">
          <button
            title="Grid View Toggle"
            onclick={() => (viewMode = 'grid')}
            class="p-1.5 rounded-lg transition-all {viewMode === 'grid'
              ? 'bg-aspada-gold text-aspada-navy'
              : 'text-white/50 hover:text-white'}"
          >
            <span class="i-lucide-layout-grid text-lg"></span>
          </button>
          <button
            title="List View Toggle"
            onclick={() => (viewMode = 'list')}
            class="p-1.5 rounded-lg transition-all {viewMode === 'list'
              ? 'bg-aspada-gold text-aspada-navy'
              : 'text-white/50 hover:text-white'}"
          >
            <span class="i-lucide-list text-lg"></span>
          </button>
        </div>
      </div>
    </div>

    <!-- Bottom Row: Breadcrumbs -->
    <nav class="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 mask-fade-right">
      {#each currentPath as part, i}
        {#if i > 0}
          <span class="i-lucide-chevron-right text-white/20 text-xs shrink-0"></span>
        {/if}
        <button
          onclick={() => navigateTo(part.id, part.title, part.type)}
          aria-current={i === currentPath.length - 1 ? 'page' : undefined}
          class="text-[11px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap transition-all border
        {i === currentPath.length - 1
            ? 'bg-aspada-gold border-aspada-gold text-aspada-navy shadow-lg shadow-aspada-gold/10'
            : 'bg-white/5 border-white/5 text-white/70 hover:text-white hover:bg-white/10'}"
        >
          {part.title}
        </button>
      {/each}
    </nav>
  </div>

  <!-- Content Area -->
  <div class="flex-1 overflow-y-auto p-8 relative min-h-[400px]">
    {#if loading && items.length === 0}
      <div class="flex flex-col items-center justify-center h-full text-slate-400">
        <span class="i-lucide-loader-2 text-4xl animate-spin mb-4 text-aspada-gold"></span>
        <p class="text-sm font-black uppercase tracking-widest animate-pulse">Syncing Vault...</p>
      </div>
    {:else if filteredItems.length === 0}
      <div
        class="flex flex-col items-center justify-center h-full text-slate-300 opacity-50 border-4 border-dashed border-slate-50 rounded-[3rem]"
      >
        <span class="i-lucide-search-x text-6xl mb-4"></span>
        <p class="text-lg font-bold italic">No matches found</p>
        <p class="text-xs font-medium uppercase tracking-tighter mt-1">
          Try a different search term
        </p>
      </div>
    {:else}
      <div
        class={viewMode === 'grid'
          ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6'
          : 'flex flex-col gap-2'}
      >
        {#each filteredItems as item (item.id)}
          <div
            class="group relative flex flex-col items-center p-4 rounded-3xl transition-all duration-300 cursor-pointer border-2
            {viewMode === 'grid'
              ? 'hover:bg-slate-50 hover:border-aspada-gold/20 hover:shadow-xl'
              : 'flex-row gap-4 border-transparent hover:border-slate-100 hover:bg-slate-50'}"
            onclick={() => handleItemClick(item)}
            onkeydown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') handleItemClick(item)
            }}
            oncontextmenu={(e) => {
              e.stopPropagation()
              onContextMenu(e, item)
            }}
            role="button"
            tabindex="0"
          >
            <!-- Icon -->
            <div
              class="shrink-0 flex items-center justify-center transition-transform group-hover:scale-110
              {viewMode === 'grid' ? 'w-16 h-16 mb-3 rounded-[1.5rem]' : 'w-10 h-10 rounded-xl'}
              {item.type === 'venture' ? 'bg-blue-50 text-blue-500' : ''}
              {item.type === 'process' ? 'bg-amber-50 text-amber-500' : ''}
              {item.type === 'document' ? 'bg-emerald-50 text-emerald-500' : ''}"
            >
              {#if item.type === 'venture'}
                <span class="i-lucide-folder-root {viewMode === 'grid' ? 'text-3xl' : 'text-xl'}"
                ></span>
              {:else if item.type === 'process'}
                <span class="i-lucide-folder {viewMode === 'grid' ? 'text-3xl' : 'text-xl'}"></span>
              {:else}
                <span class="i-lucide-file-text {viewMode === 'grid' ? 'text-3xl' : 'text-xl'}"
                ></span>
              {/if}
            </div>

            <!-- Labels -->
            <div class={viewMode === 'grid' ? 'text-center w-full px-2' : 'flex-1 min-w-0'}>
              <p
                class="text-sm font-bold text-slate-700 truncate group-hover:text-aspada-navy transition-colors"
              >
                {item.title}
              </p>
              {#if viewMode === 'list'}
                <div
                  class="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400"
                >
                  <span>{item.type}</span>
                  {#if item.type === 'document'}
                    <span>{item.data.attachments?.length || 0} files</span>
                  {/if}
                </div>
              {/if}
            </div>

            <!-- Hover Action Menu (Visible on hover) -->
            <div
              class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <button
                onclick={(e) => {
                  e.stopPropagation()
                  onContextMenu(e, item)
                }}
                aria-label="Item Options"
                class="p-1.5 rounded-lg bg-white shadow-sm border border-slate-100 text-slate-400 hover:text-aspada-gold transition-colors"
              >
                <span class="i-lucide-more-vertical text-sm"></span>
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<!-- Context Menu -->
{#if contextMenu.visible}
  <div
    class="fixed z-[100] bg-white border border-slate-100 shadow-2xl rounded-2xl py-2 min-w-[200px] animate-in fade-in zoom-in-95 duration-100"
    style="left: {contextMenu.x}px; top: {contextMenu.y}px;"
    role="menu"
    tabindex="-1"
    onkeydown={(e) => {
      if (e.key === 'Escape') closeContextMenu()
    }}
  >
    {#if !contextMenu.targetItem}
      <!-- Root Menu -->
      {#if currentLocation.type === 'root'}
        <button
          onclick={() => openCreateModal('venture')}
          class="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-aspada-navy flex items-center gap-3"
        >
          <span class="i-lucide-folder-plus text-blue-500"></span>
          New Venture
        </button>
      {:else if currentLocation.type === 'venture' || currentLocation.type === 'process'}
        <button
          onclick={() => openCreateModal('process')}
          class="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-aspada-navy flex items-center gap-3"
        >
          <span class="i-lucide-folder-plus text-amber-500"></span>
          New Subfolder
        </button>
        {#if currentLocation.type === 'process'}
          <button
            onclick={() => openCreateModal('document')}
            class="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-aspada-navy flex items-center gap-3"
          >
            <span class="i-lucide-file-up text-emerald-500"></span>
            Upload File
          </button>
        {/if}
      {/if}
      <div class="h-px bg-slate-50 my-1"></div>
      <button
        onclick={() => loadItems()}
        class="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-aspada-navy flex items-center gap-3"
      >
        <span class="i-lucide-refresh-cw text-slate-400"></span>
        Refresh
      </button>
    {:else}
      <!-- Item Menu -->
      <button
        onclick={() => handleItemClick(contextMenu.targetItem!)}
        class="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-aspada-navy flex items-center gap-3"
      >
        <span
          class={contextMenu.targetItem.type === 'document'
            ? 'i-lucide-download text-emerald-500'
            : 'i-lucide-eye text-blue-500'}
        ></span>
        {contextMenu.targetItem.type === 'document' ? 'Download' : 'Open'}
      </button>

      {#if contextMenu.targetItem.type === 'venture'}
        <button
          onclick={() => {
            handleItemClick(contextMenu.targetItem!)
            openCreateModal('process')
          }}
          class="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-aspada-navy flex items-center gap-3"
        >
          <span class="i-lucide-folder-plus text-amber-500"></span>
          Create Subfolder
        </button>
      {:else if contextMenu.targetItem.type === 'process'}
        <button
          onclick={() => {
            handleItemClick(contextMenu.targetItem!)
            openCreateModal('document')
          }}
          class="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-aspada-navy flex items-center gap-3"
        >
          <span class="i-lucide-file-up text-emerald-500"></span>
          Add File
        </button>
      {/if}

      <div class="h-px bg-slate-50 my-1"></div>
      <button
        onclick={() => handleDelete(contextMenu.targetItem!)}
        class="w-full px-4 py-2.5 text-left text-sm font-bold text-red-400 hover:bg-red-50 hover:text-red-600 flex items-center gap-3"
      >
        <span class="i-lucide-trash-2 text-red-400"></span>
        Delete
      </button>
    {/if}
  </div>
{/if}

<!-- Modals -->
<Modal show={showCreateModal} title={modalTitle} onClose={() => (showCreateModal = false)}>
  <div class="space-y-6">
    <div class="space-y-2">
      <label
        class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1"
        for="item-name"
      >
        {modalType === 'document' ? 'File Label (Optional)' : 'Name'}
      </label>
      <input
        id="item-name"
        bind:value={newTitle}
        placeholder={modalType === 'document' ? 'e.g. Identity Proof, Site Plan' : 'Enter name...'}
        class="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-aspada-gold/10 focus:border-aspada-gold/30 outline-none transition-all"
        onkeydown={(e) => e.key === 'Enter' && handleCreate()}
      />
    </div>

    {#if modalType === 'document'}
      <FileUploadTracker
        bind:this={trackerComponent}
        label="Attachments"
        maxFiles={10}
        accept="*/*"
      />
    {/if}

    <div class="flex gap-3 pt-4">
      <button
        onclick={() => (showCreateModal = false)}
        class="flex-1 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
      >
        Cancel
      </button>
      <button
        onclick={handleCreate}
        disabled={loading}
        class="flex-1 bg-aspada-navy text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-aspada-gold transition-all shadow-xl active:scale-95 disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Confirm'}
      </button>
    </div>
  </div>
</Modal>

<Modal
  show={showFilesModal}
  title="Download Attachments"
  onClose={() => (showFilesModal = false)}
>
  <div class="space-y-6">
    <div class="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-2">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
          <span class="i-lucide-folder-open text-aspada-gold text-xl"></span>
        </div>
        <div class="min-w-0">
          <p class="text-xs font-black text-aspada-navy uppercase tracking-tight truncate">
            {selectedDocument?.title}
          </p>
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {selectedDocument?.attachments?.length || 0} Files
          </p>
        </div>
      </div>
    </div>

    <div class="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
      {#if selectedDocument?.attachments}
        {#each selectedDocument.attachments as filename}
          <div
            class="flex items-center justify-between bg-white border border-slate-100 rounded-2xl px-4 py-3 shadow-sm group hover:border-aspada-gold/30 transition-all"
          >
            <div class="flex items-center gap-3 min-w-0">
              <span class="i-lucide-file-text text-slate-300 group-hover:text-aspada-gold"></span>
              <span class="text-xs text-slate-600 truncate font-bold">{filename}</span>
            </div>
            <button
              onclick={() => downloadFile(selectedDocument!, filename)}
              class="text-slate-400 hover:text-aspada-gold hover:bg-aspada-gold/5 transition-all p-2 rounded-lg"
              title="Download"
            >
              <span class="i-lucide-download text-lg"></span>
            </button>
          </div>
        {/each}
      {/if}
    </div>

    <div class="pt-2">
      <button
        onclick={() => (showFilesModal = false)}
        class="w-full bg-aspada-navy text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-aspada-gold transition-all shadow-xl active:scale-95"
      >
        Close
      </button>
    </div>
  </div>
</Modal>

<style>
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
</style>
