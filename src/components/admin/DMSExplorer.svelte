<script lang="ts">
  import { onMount, tick } from 'svelte'
  import pb from '../../lib/pb'
  import { Collections, type VenturesResponse, type ProcessesResponse, type DocumentsResponse, ProcessesStatusOptions } from '../../types/pocketbase-types'
  import { downloadFile } from '../../lib/utils'
  import FileUploadTracker from './FileUploadTracker.svelte'
  import Modal from './Modal.svelte'
  import toast from 'svelte-french-toast'

  let { onVentureSelect } = $props<{ onVentureSelect?: (id: string | null) => void }>()

  // --- State ---
  type ExplorerItem = {
    id: string
    type: 'venture' | 'process' | 'document'
    title: string
    data: any
  }

  let currentPath = $state<{ id: string; title: string; type: 'root' | 'venture' | 'process' }[]>([{ id: 'root', title: 'Home', type: 'root' }])
  let items = $state<ExplorerItem[]>([])
  let loading = $state(false)
  let viewMode = $state<'grid' | 'list'>('grid')
  let searchQuery = $state('')

  // Context Menu State
  let contextMenu = $state<{ x: number; y: number; visible: boolean; targetItem: ExplorerItem | null }>({
    x: 0,
    y: 0,
    visible: false,
    targetItem: null
  })

  // Modal States
  let showCreateModal = $state(false)
  let modalType = $state<'venture' | 'process' | 'document'>('venture')
  let modalTitle = $state('')
  let newTitle = $state('')
  let trackerComponent = $state<ReturnType<typeof FileUploadTracker>>()

  // --- Derived ---
  let currentLocation = $derived(currentPath[currentPath.length - 1])
  let filteredItems = $derived(
    searchQuery 
      ? items.filter(i => i.title.toLowerCase().includes(searchQuery.toLowerCase()))
      : items
  )

  // --- Navigation & Loading ---
  async function loadItems() {
    loading = true
    const loc = currentLocation
    const commonParams = {
      sort: loc.type === 'process' ? 'sequence' : '-created',
      fields: 'id,title,data,attachments,project,parent,step,created,updated',
      requestKey: `load-${loc.id}` // Prevent race conditions
    }

    try {
      let newItems: ExplorerItem[] = []

      if (loc.type === 'root') {
        const res = await pb.collection(Collections.Ventures).getList<VenturesResponse>(1, 100, { 
          ...commonParams,
          sort: '-created'
        })
        newItems = res.items.map(v => ({ id: v.id, type: 'venture', title: v.title, data: v }))
      } else if (loc.type === 'venture') {
        const res = await pb.collection(Collections.Processes).getList<ProcessesResponse>(1, 100, {
          ...commonParams,
          filter: `project = "${loc.id}" && (parent = "" || parent = null)`,
          sort: 'sequence'
        })
        newItems = res.items.map(p => ({ id: p.id, type: 'process', title: p.title || 'Untitled Process', data: p }))
      } else if (loc.type === 'process') {
        const [subProcesses, docs] = await Promise.all([
          pb.collection(Collections.Processes).getList<ProcessesResponse>(1, 100, {
            ...commonParams,
            filter: `parent = "${loc.id}"`,
            sort: 'sequence'
          }),
          pb.collection(Collections.Documents).getList<DocumentsResponse>(1, 100, {
            ...commonParams,
            filter: `step = "${loc.id}"`,
            sort: '-created'
          })
        ])

        newItems = [
          ...subProcesses.items.map(p => ({ id: p.id, type: 'process', title: p.title || 'Untitled Process', data: p })),
          ...docs.items.map(d => ({ id: d.id, type: 'document', title: d.title, data: d }))
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
      const idx = currentPath.findIndex(p => p.id === id)
      if (idx !== -1) {
        currentPath = currentPath.slice(0, idx + 1)
      } else {
        currentPath = [...currentPath, { id, title, type }]
      }
      
      const venture = currentPath.find(p => p.type === 'venture')
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
      if (item.data.attachments && item.data.attachments.length > 0) {
        downloadFile(item.data, item.data.attachments[0])
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
      targetItem: item
    }
  }

  function closeContextMenu() {
    contextMenu.visible = false
  }

  // --- CRUD Actions ---
  function openCreateModal(type: 'venture' | 'process' | 'document') {
    modalType = type
    newTitle = ''
    modalTitle = type === 'venture' ? 'New Venture' : type === 'process' ? 'New Subfolder' : 'Upload File'
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
        const ventureId = currentPath.find(p => p.type === 'venture')?.id
        const parentId = currentLocation.type === 'process' ? currentLocation.id : null
        
        await pb.collection(Collections.Processes).create({
          title: newTitle,
          project: ventureId,
          parent: parentId,
          status: ProcessesStatusOptions.todo,
          sequence: items.filter(i => i.type === 'process').length + 1
        })
        toast.success('Subfolder created')
      } else if (modalType === 'document') {
        const processId = currentLocation.id
        if (currentLocation.type !== 'process') throw new Error('Must be in a subfolder to upload files')

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

<div class="flex flex-col h-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100" oncontextmenu={(e) => onContextMenu(e, null)}>
  <!-- Header / Breadcrumbs -->
  <div class="bg-aspada-navy p-6 flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3 text-white">
        <span class="i-lucide-folder-tree text-2xl"></span>
        <h2 class="text-xl font-black uppercase tracking-tight">DMS Explorer</h2>
      </div>
      <div class="flex items-center gap-2">
        {#if currentPath.some(p => p.type === 'venture')}
          <button 
            onclick={() => {
              const venture = currentPath.find(p => p.type === 'venture');
              if (venture) window.dispatchEvent(new CustomEvent('open-flow', { detail: { ventureId: venture.id } }));
            }}
            class="mr-4 text-[10px] bg-white/10 text-white px-3 py-1.5 rounded-full font-black hover:bg-white/20 transition-all flex items-center gap-1.5 uppercase"
          >
            <span class="i-lucide-git-graph text-sm"></span>
            Map
          </button>
        {/if}
      <div class="flex items-center gap-4">
        <!-- Search Bar -->
        <div class="relative group hidden sm:block">
          <span class="i-lucide-search absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-aspada-gold transition-colors"></span>
          <input 
            type="text" 
            bind:value={searchQuery}
            placeholder="Search vault..."
            class="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs font-bold text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-aspada-gold/50 focus:bg-white/10 transition-all min-w-[200px]"
          />
        </div>

        <button 
          onclick={() => viewMode = 'grid'} 
          aria-label="Grid View"
          class="p-2 rounded-lg transition-colors {viewMode === 'grid' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'}"
        >
          <span class="i-lucide-layout-grid text-lg"></span>
        </button>
        <button 
          onclick={() => viewMode = 'list'} 
          aria-label="List View"
          class="p-2 rounded-lg transition-colors {viewMode === 'list' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'}"
        >
          <span class="i-lucide-list text-lg"></span>
        </button>
      </div>
    </div>

    <!-- Breadcrumbs -->
    <nav class="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
      {#each currentPath as part, i}
        {#if i > 0}
          <span class="i-lucide-chevron-right text-white/30 text-xs shrink-0"></span>
        {/if}
        <button
          onclick={() => navigateTo(part.id, part.title, part.type)}
          aria-current={i === currentPath.length - 1 ? 'page' : undefined}
          class="text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap transition-all
          {i === currentPath.length - 1
            ? 'bg-aspada-gold text-aspada-navy shadow-lg'
            : 'bg-white/10 text-white/80 hover:bg-white/20'}"
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
      <div class="flex flex-col items-center justify-center h-full text-slate-300 opacity-50 border-4 border-dashed border-slate-50 rounded-[3rem]">
        <span class="i-lucide-search-x text-6xl mb-4"></span>
        <p class="text-lg font-bold italic">No matches found</p>
        <p class="text-xs font-medium uppercase tracking-tighter mt-1">Try a different search term</p>
      </div>
    {:else}
      <div class={viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6' : 'flex flex-col gap-2'}>
        {#each filteredItems as item (item.id)}
          <div
            class="group relative flex flex-col items-center p-4 rounded-3xl transition-all duration-300 cursor-pointer border-2
            {viewMode === 'grid' 
              ? 'hover:bg-slate-50 hover:border-aspada-gold/20 hover:shadow-xl' 
              : 'flex-row gap-4 border-transparent hover:border-slate-100 hover:bg-slate-50'}"
            onclick={() => handleItemClick(item)}
            onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleItemClick(item) }}
            oncontextmenu={(e) => { e.stopPropagation(); onContextMenu(e, item); }}
            role="button"
            tabindex="0"
          >
            <!-- Icon -->
            <div class="shrink-0 flex items-center justify-center transition-transform group-hover:scale-110
              {viewMode === 'grid' ? 'w-16 h-16 mb-3 rounded-[1.5rem]' : 'w-10 h-10 rounded-xl'}
              {item.type === 'venture' ? 'bg-blue-50 text-blue-500' : ''}
              {item.type === 'process' ? 'bg-amber-50 text-amber-500' : ''}
              {item.type === 'document' ? 'bg-emerald-50 text-emerald-500' : ''}"
            >
              {#if item.type === 'venture'}
                <span class="i-lucide-folder-root {viewMode === 'grid' ? 'text-3xl' : 'text-xl'}"></span>
              {:else if item.type === 'process'}
                <span class="i-lucide-folder {viewMode === 'grid' ? 'text-3xl' : 'text-xl'}"></span>
              {:else}
                <span class="i-lucide-file-text {viewMode === 'grid' ? 'text-3xl' : 'text-xl'}"></span>
              {/if}
            </div>

            <!-- Labels -->
            <div class={viewMode === 'grid' ? 'text-center w-full px-2' : 'flex-1 min-w-0'}>
              <p class="text-sm font-bold text-slate-700 truncate group-hover:text-aspada-navy transition-colors">
                {item.title}
              </p>
              {#if viewMode === 'list'}
                <div class="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span>{item.type}</span>
                  {#if item.type === 'document'}
                    <span>{item.data.attachments?.length || 0} files</span>
                  {/if}
                </div>
              {/if}
            </div>

            <!-- Hover Action Menu (Visible on hover) -->
            <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
               <button 
                 onclick={(e) => { e.stopPropagation(); onContextMenu(e, item); }}
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
    onkeydown={(e) => { if (e.key === 'Escape') closeContextMenu() }}
  >
    {#if !contextMenu.targetItem}
      <!-- Root Menu -->
      {#if currentLocation.type === 'root'}
        <button onclick={() => openCreateModal('venture')} class="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-aspada-navy flex items-center gap-3">
          <span class="i-lucide-folder-plus text-blue-500"></span>
          New Venture
        </button>
      {:else if currentLocation.type === 'venture' || currentLocation.type === 'process'}
        <button onclick={() => openCreateModal('process')} class="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-aspada-navy flex items-center gap-3">
          <span class="i-lucide-folder-plus text-amber-500"></span>
          New Subfolder
        </button>
        {#if currentLocation.type === 'process'}
          <button onclick={() => openCreateModal('document')} class="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-aspada-navy flex items-center gap-3">
            <span class="i-lucide-file-up text-emerald-500"></span>
            Upload File
          </button>
        {/if}
      {/if}
      <div class="h-px bg-slate-50 my-1"></div>
      <button onclick={() => loadItems()} class="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-aspada-navy flex items-center gap-3">
        <span class="i-lucide-refresh-cw text-slate-400"></span>
        Refresh
      </button>
    {:else}
      <!-- Item Menu -->
      <button onclick={() => handleItemClick(contextMenu.targetItem!)} class="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-aspada-navy flex items-center gap-3">
        <span class="i-lucide-eye text-blue-500"></span>
        Open
      </button>
      
      {#if contextMenu.targetItem.type === 'venture'}
        <button onclick={() => { handleItemClick(contextMenu.targetItem!); openCreateModal('process'); }} class="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-aspada-navy flex items-center gap-3">
          <span class="i-lucide-folder-plus text-amber-500"></span>
          Create Subfolder
        </button>
      {:else if contextMenu.targetItem.type === 'process'}
        <button onclick={() => { handleItemClick(contextMenu.targetItem!); openCreateModal('document'); }} class="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-aspada-navy flex items-center gap-3">
          <span class="i-lucide-file-up text-emerald-500"></span>
          Add File
        </button>
      {/if}

      <div class="h-px bg-slate-50 my-1"></div>
      <button onclick={() => handleDelete(contextMenu.targetItem!)} class="w-full px-4 py-2.5 text-left text-sm font-bold text-red-400 hover:bg-red-50 hover:text-red-600 flex items-center gap-3">
        <span class="i-lucide-trash-2 text-red-400"></span>
        Delete
      </button>
    {/if}
  </div>
{/if}

<!-- Modals -->
<Modal show={showCreateModal} title={modalTitle} onClose={() => showCreateModal = false}>
  <div class="space-y-6">
    <div class="space-y-2">
      <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1" for="item-name">
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
        onclick={() => showCreateModal = false}
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

<style>
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
</style>
