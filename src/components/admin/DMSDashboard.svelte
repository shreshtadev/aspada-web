<script lang="ts">
  import DocumentManager from './DocumentManager.svelte'
  import Modal from './Modal.svelte'
  import ProcessFlow from './ProcessFlow.svelte'
  import ProcessManager from './ProcessManager.svelte'
  import VentureManager from './VentureManager.svelte'

  // Core navigation state using Runes
  let selectedVentureId = $state<string | null>(null)
  let selectedStepId = $state<string | null>(null)
  let selectedParentProcessId = $state<string | null>(null)
  let showFlowModal = $state(false)

  // Mobile View Tracking
  let mobileView = $state<'ventures' | 'parentProcesses' | 'steps' | 'documents'>('ventures')

  // Labels for breadcrumbs
  let activeVentureTitle = $state('Venture')
  let activeParentProcessTitle = $state('Process Group')
  let activeStepTitle = $state('Step')

  // Reset logic
  $effect(() => {
    if (selectedVentureId) {
      if (!selectedParentProcessId) mobileView = 'parentProcesses'
      else if (!selectedStepId) mobileView = 'steps'
    } else {
      mobileView = 'ventures'
    }
  })

  function handleVentureSelect(id: string, title: string) {
    selectedVentureId = id
    activeVentureTitle = title
    selectedParentProcessId = null
    selectedStepId = null
    mobileView = 'parentProcesses'

    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  function handleParentProcessSelect(id: string, title: string) {
    if (selectedParentProcessId === id) return
    selectedParentProcessId = id
    activeParentProcessTitle = title
    selectedStepId = null
    mobileView = 'steps'

    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  function handleStepSelect(id: string, title: string) {
    selectedStepId = id
    activeStepTitle = title
    mobileView = 'documents'

    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  function backTo(view: 'ventures' | 'parentProcesses' | 'steps') {
    mobileView = view
    if (view === 'ventures') {
      selectedVentureId = null
      selectedParentProcessId = null
    }
    if (view === 'parentProcesses') {
      selectedParentProcessId = null
    }
    selectedStepId = null
  }
</script>

<div class="min-h-screen bg-aspada-silver/20 pb-20 lg:pb-0">
  <!-- Mobile Header / Breadcrumbs -->
  <div
    class="lg:hidden sticky top-0 z-30 bg-white border-b border-aspada-steel/10 px-4 py-3 shadow-sm"
  >
    <div class="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
      <button
        onclick={() => backTo('ventures')}
        class="text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap transition-colors
        {mobileView === 'ventures'
          ? 'bg-aspada-navy text-white shadow-md'
          : 'bg-slate-100 text-slate-500'}"
      >
        Ventures
      </button>

      {#if selectedVentureId}
        <span class="i-lucide-chevron-right text-slate-300 text-xs shrink-0"></span>
        <button
          onclick={() => backTo('parentProcesses')}
          class="text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap transition-colors max-w-[150px] truncate
          {mobileView === 'parentProcesses'
            ? 'bg-aspada-navy text-white shadow-md'
            : 'bg-slate-100 text-slate-500'}"
        >
          {activeVentureTitle}
        </button>
      {/if}

      {#if selectedParentProcessId}
        <span class="i-lucide-chevron-right text-slate-300 text-xs shrink-0"></span>
        <button
          onclick={() => backTo('steps')}
          class="text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap transition-colors max-w-[150px] truncate
          {mobileView === 'steps'
            ? 'bg-aspada-navy text-white shadow-md'
            : 'bg-slate-100 text-slate-500'}"
        >
          {activeParentProcessTitle}
        </button>
      {/if}

      {#if selectedStepId}
        <span class="i-lucide-chevron-right text-slate-300 text-xs shrink-0"></span>
        <div
          class="text-xs font-bold px-3 py-1.5 rounded-full bg-aspada-navy text-white shadow-md whitespace-nowrap max-w-[150px] truncate"
        >
          {activeStepTitle}
        </div>
      {/if}
    </div>
  </div>

  <div class="max-w-[1600px] mx-auto p-4 lg:p-8">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start h-[calc(100vh-10rem)]">
      <!-- Left Column: Ventures & Process Groups -->
      <div
        class="h-full transition-all duration-300 flex flex-col gap-6 {mobileView !== 'ventures' &&
        mobileView !== 'parentProcesses'
          ? 'hidden lg:flex lg:opacity-50'
          : 'flex'}"
        id="navigation-column"
      >
        <!-- Ventures -->
        <div
          class="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col flex-1"
        >
          <div class="bg-aspada-navy p-6 flex items-center justify-between">
            <div class="flex items-center gap-3 text-white">
              <span class="i-lucide-briefcase text-2xl"></span>
              <h2 class="text-xl font-black uppercase tracking-tight">Ventures</h2>
            </div>
            {#if mobileView !== 'ventures' && typeof window !== 'undefined' && window.innerWidth >= 1024}
              <button
                onclick={() => backTo('ventures')}
                class="text-[10px] font-bold bg-white/10 hover:bg-white/20 px-2 py-1 rounded transition-colors text-white uppercase"
                >Change</button
              >
            {/if}
          </div>
          <div class="p-4 lg:p-6 overflow-y-auto custom-scrollbar flex-1">
            <VentureManager onSelect={handleVentureSelect} activeId={selectedVentureId} />
          </div>
        </div>

        <!-- Process Groups -->
        <div
          class="h-full transition-all duration-300 flex flex-col flex-1 {mobileView === 'steps' ||
          mobileView === 'documents'
            ? 'lg:opacity-50'
            : ''}"
        >
          {#if selectedVentureId}
            <div
              class="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col h-full"
            >
              <div
                class="bg-aspada-emerald p-6 flex items-center justify-between"
                style="background-color: #10B981;"
              >
                <div class="flex items-center gap-3 text-white">
                  <span class="i-lucide-folder-tree text-2xl"></span>
                  <h2 class="text-xl font-black uppercase tracking-tight text-white">Groups</h2>
                </div>
                <button
                  onclick={() => (showFlowModal = true)}
                  class="text-[10px] bg-white text-emerald-600 px-3 py-1.5 rounded-full font-black hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 uppercase shadow-lg shadow-emerald-900/20"
                >
                  <span class="i-lucide-git-graph text-sm"></span>
                  Map
                </button>
              </div>

              <div class="p-4 lg:p-6 overflow-y-auto custom-scrollbar flex-1">
                <ProcessManager
                  ventureId={selectedVentureId}
                  onStepSelect={handleParentProcessSelect}
                  activeStepId={selectedParentProcessId}
                  mode="parents"
                />
              </div>
            </div>
          {:else}
            <div
              class="hidden lg:flex flex-col items-center justify-center p-6 border-4 border-dashed rounded-[2.5rem] text-slate-300 bg-white/40 h-full"
            >
              <div
                class="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4"
              >
                <span class="i-lucide-arrow-left text-2xl"></span>
              </div>
              <p class="font-bold text-center text-xs">
                Select a venture to<br />view its process groups
              </p>
            </div>
          {/if}
        </div>
      </div>

      <!-- Specific Process Steps Column -->
      <div
        class="h-full transition-all duration-300 flex flex-col {mobileView !== 'steps'
          ? 'hidden lg:flex'
          : 'flex'} {mobileView === 'documents' ? 'lg:opacity-50' : ''}"
        id="steps-column"
      >
        {#if selectedParentProcessId}
          <div
            class="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col h-full"
          >
            <div class="bg-aspada-gold p-6 flex items-center justify-between">
              <div class="flex items-center gap-3 text-aspada-navy">
                <span class="i-lucide-list-checks text-2xl"></span>
                <h2 class="text-xl font-black uppercase tracking-tight text-aspada-navy">
                  Processes
                </h2>
              </div>
              <button
                onclick={() => (showFlowModal = true)}
                class="text-[10px] bg-aspada-navy text-white px-3 py-1.5 rounded-full font-black hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 uppercase shadow-lg shadow-aspada-navy/20"
              >
                <span class="i-lucide-git-graph text-sm"></span>
                Map
              </button>
            </div>

            <div class="p-4 lg:p-6 overflow-y-auto custom-scrollbar flex-1">
              <ProcessManager
                ventureId={selectedVentureId}
                onStepSelect={handleStepSelect}
                activeStepId={selectedStepId}
                mode="children"
                parentProcessId={selectedParentProcessId}
              />
            </div>
          </div>
        {:else}
          <div
            class="hidden lg:flex flex-col items-center justify-center p-12 border-4 border-dashed rounded-[2.5rem] text-slate-300 bg-white/40 h-full"
          >
            <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <span class="i-lucide-arrow-left text-3xl"></span>
            </div>
            <p class="font-bold text-center">
              Select a process group to<br />view its specific steps
            </p>
          </div>
        {/if}
      </div>

      <!-- Documents Column -->
      <div
        class="h-full transition-all duration-300 flex flex-col {mobileView !== 'documents'
          ? 'hidden lg:flex'
          : 'flex'}"
        id="documents-column"
      >
        {#if selectedStepId}
          <div
            class="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col h-full"
          >
            <div class="bg-aspada-steel p-6 flex items-center justify-between">
              <div class="flex items-center gap-3 text-white">
                <span class="i-lucide-file-text text-2xl"></span>
                <h2 class="text-xl font-black uppercase tracking-tight">Documents</h2>
              </div>
            </div>
            <div class="p-4 lg:p-6 overflow-y-auto custom-scrollbar flex-1">
              <DocumentManager stepId={selectedStepId} />
            </div>
          </div>
        {:else}
          <div
            class="hidden lg:flex flex-col items-center justify-center p-12 border-4 border-dashed rounded-[2.5rem] text-slate-300 bg-white/40 h-full"
          >
            <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <span class="i-lucide-files text-3xl"></span>
            </div>
            <p class="font-bold italic text-center text-sm">
              Select a process step to<br />manage associated files
            </p>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

{#if selectedVentureId}
  <Modal
    show={showFlowModal}
    title="Process Flow Visualization"
    onClose={() => (showFlowModal = false)}
    maxWidth="max-w-[95vw]"
  >
    <div class="h-[85vh] p-1">
      <ProcessFlow
        ventureId={selectedVentureId}
        onStepSelect={(id, title) => {
          // If we click a node in the flow, we want to select it in the dashboard.
          // We need to know if this ID is a parent or a child.
          // For now, let's assume if it has no parent in the database it's a group,
          // but we don't have that info easily here.
          // However, we can just try to set it as a step selection if we are already in a group.
          if (selectedParentProcessId) {
            selectedStepId = id
            activeStepTitle = title
          } else {
            handleParentProcessSelect(id, title)
          }
          showFlowModal = false
        }}
        activeStepId={selectedStepId || selectedParentProcessId}
        baseProcessId={selectedStepId || selectedParentProcessId}
      />
    </div>
  </Modal>
{/if}

<style>
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #e2e8f0;
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #cbd5e1;
  }
</style>
