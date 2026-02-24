<script lang="ts">
  import VentureManager from './VentureManager.svelte'
  import ProcessManager from './ProcessManager.svelte'
  import DocumentManager from './DocumentManager.svelte'
  import ProcessFlow from './ProcessFlow.svelte'
  import Modal from './Modal.svelte'

  // Core navigation state using Runes
  let selectedVentureId = $state<string | null>(null)
  let selectedStepId = $state<string | null>(null)
  let showFlowModal = $state(false)

  // Mobile View Tracking
  let mobileView = $state<'ventures' | 'steps' | 'documents'>('ventures')

  // Labels for breadcrumbs
  let activeVentureTitle = $state('Venture')
  let activeStepTitle = $state('Step')

  // Reset logic
  $effect(() => {
    if (selectedVentureId) {
      if (!selectedStepId) mobileView = 'steps'
    } else {
      mobileView = 'ventures'
    }
  })

  function handleVentureSelect(id: string, title: string) {
    selectedVentureId = id
    activeVentureTitle = title
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

  function backTo(view: 'ventures' | 'steps') {
    mobileView = view
    if (view === 'ventures') {
      selectedVentureId = null
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
          onclick={() => backTo('steps')}
          class="text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap transition-colors max-w-[150px] truncate
          {mobileView === 'steps'
            ? 'bg-aspada-navy text-white shadow-md'
            : 'bg-slate-100 text-slate-500'}"
        >
          {activeVentureTitle}
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
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- Ventures Column -->
      <div
        class="lg:col-span-4 transition-all duration-300 {mobileView !== 'ventures'
          ? 'hidden lg:block lg:opacity-50'
          : 'block'}"
        id="ventures-column"
      >
        <div
          class="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
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
          <div class="p-4 lg:p-6">
            <VentureManager onSelect={handleVentureSelect} activeId={selectedVentureId} />
          </div>
        </div>
      </div>

      <!-- Steps Column -->
      <div
        class="lg:col-span-4 transition-all duration-300 {mobileView !== 'steps'
          ? 'hidden lg:block'
          : 'block'} {mobileView === 'documents' ? 'lg:opacity-50' : ''}"
        id="steps-column"
      >
        {#if selectedVentureId}
          <div
            class="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
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

            <div class="p-4 lg:p-6">
              <ProcessManager
                ventureId={selectedVentureId}
                onStepSelect={handleStepSelect}
                activeStepId={selectedStepId}
              />
            </div>
          </div>
        {:else}
          <div
            class="hidden lg:flex flex-col items-center justify-center p-12 border-4 border-dashed rounded-[2.5rem] text-slate-300 bg-white/40 min-h-[400px]"
          >
            <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <span class="i-lucide-arrow-left text-3xl"></span>
            </div>
            <p class="font-bold text-center">Select a venture to<br />view its process flow</p>
          </div>
        {/if}
      </div>

      <!-- Documents Column -->
      <div
        class="lg:col-span-4 transition-all duration-300 {mobileView !== 'documents'
          ? 'hidden lg:block'
          : 'block'}"
        id="documents-column"
      >
        {#if selectedStepId}
          <div
            class="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
          >
            <div class="bg-aspada-steel p-6 flex items-center justify-between">
              <div class="flex items-center gap-3 text-white">
                <span class="i-lucide-file-text text-2xl"></span>
                <h2 class="text-xl font-black uppercase tracking-tight">Documents</h2>
              </div>
            </div>
            <div class="p-4 lg:p-6">
              <DocumentManager stepId={selectedStepId} />
            </div>
          </div>
        {:else}
          <div
            class="hidden lg:flex flex-col items-center justify-center p-12 border-4 border-dashed rounded-[2.5rem] text-slate-300 bg-white/40 min-h-[400px]"
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
  >
    <div class="max-h-[80vh] overflow-y-auto custom-scrollbar p-1">
      <ProcessFlow
        ventureId={selectedVentureId}
        onStepSelect={(id, title) => {
          handleStepSelect(id, title)
          showFlowModal = false
        }}
        activeStepId={selectedStepId}
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
</style>
