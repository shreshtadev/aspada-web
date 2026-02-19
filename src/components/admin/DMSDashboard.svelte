<script lang="ts">
  import VentureManager from './VentureManager.svelte'
  import ProcessManager from './ProcessManager.svelte'
  import DocumentManager from './DocumentManager.svelte'

  // Core navigation state using Runes
  let selectedVentureId = $state<string | null>(null)
  let selectedStepId = $state<string | null>(null)

  // Reset the step view whenever the active Venture changes
  $effect(() => {
    if (selectedVentureId) {
      selectedStepId = null
    }
  })
</script>

<div class="grid grid-cols-12 gap-6 p-6 bg-slate-50 min-h-screen">
  <div class="col-span-4">
    <VentureManager onSelect={(id) => (selectedVentureId = id)} activeId={selectedVentureId} />
  </div>

  <div class="col-span-4">
    {#if selectedVentureId}
      <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <h2 class="text-xl font-bold mb-4 text-slate-800">Steps</h2>
        <ProcessManager
          ventureId={selectedVentureId}
          onStepSelect={(id) => (selectedStepId = id)}
          activeStepId={selectedStepId}
        />
      </div>
    {:else}
      <div
        class="h-40 flex flex-col items-center justify-center border-2 border-dashed rounded-xl text-slate-400 bg-white/50"
      >
        <span class="text-2xl mb-2">←</span>
        <p class="text-sm">Select a venture to define steps</p>
      </div>
    {/if}
  </div>

  <div class="col-span-4">
    {#if selectedStepId}
      <DocumentManager stepId={selectedStepId} />
    {:else}
      <div
        class="h-40 flex items-center justify-center border-2 border-dashed rounded-xl text-slate-400 bg-white/50 text-center px-4"
      >
        <p class="text-sm italic">Select a step in the middle column to manage its attachments</p>
      </div>
    {/if}
  </div>
</div>
