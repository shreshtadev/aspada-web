<script lang="ts">
  import DMSExplorer from './DMSExplorer.svelte'
  import Modal from './Modal.svelte'
  import ProcessFlow from './ProcessFlow.svelte'

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

  // function handleVentureSelect(id: string, title: string) {
  //   selectedVentureId = id
  //   activeVentureTitle = title
  //   selectedParentProcessId = null
  //   selectedStepId = null
  //   mobileView = 'parentProcesses'

  //   if (typeof window !== 'undefined' && window.innerWidth < 1024) {
  //     window.scrollTo({ top: 0, behavior: 'smooth' })
  //   }
  // }

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

  function handleVentureSelect(id: string | null) {
    selectedVentureId = id
    if (!id) {
      selectedParentProcessId = null
      selectedStepId = null
    }
  }

  // Listen for open-flow event from Explorer
  if (typeof window !== 'undefined') {
    window.addEventListener('open-flow', (e: any) => {
      selectedVentureId = e.detail.ventureId
      showFlowModal = true
    })
  }

  function backTo(view: 'ventures' | 'parentProcesses' | 'steps') {
    // This function is mostly legacy now but keeping it for mobile logic if needed
    if (view === 'ventures') {
      selectedVentureId = null
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

  <div class="max-w-[1600px] mx-auto p-4 lg:p-8 h-[calc(100vh-4rem)]">
    <DMSExplorer onVentureSelect={handleVentureSelect} />
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
