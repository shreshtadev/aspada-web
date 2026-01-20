<script lang="ts">
  import AspadaForm from './AspadaForm.svelte'
  import LeafMap from './LeafMap.svelte'

  let { projectTitle, latitude, longitude } = $props<{
    projectTitle: string
    latitude: number
    longitude: number
  }>()

  let isOpen = $state(false)

  function toggleModal() {
    isOpen = !isOpen
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }

  function portal(node: HTMLElement) {
    document.body.appendChild(node)
    return {
      destroy() {
        if (node.parentNode) node.parentNode.removeChild(node)
      },
    }
  }
</script>

<button
  onclick={toggleModal}
  class="w-full mt-8 bg-aspada-navy text-white hover:bg-aspada-steel py-4.5 rounded-2xl font-display font-extrabold uppercase tracking-widest text-xs transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-aspada-navy/10 cursor-pointer relative overflow-hidden group"
>
  <div
    class="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"
  ></div>
  <span class="relative z-10 flex items-center justify-center gap-2">
    Enquire Now
    <span class="i-lucide-arrow-right text-sm"></span>
  </span>
</button>

{#if isOpen}
  <div
    use:portal
    class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-aspada-navy/60 backdrop-blur-md animate-in fade-in duration-300"
  >
    <!-- Close on backdrop click -->
    <div
      class="absolute inset-0"
      onclick={toggleModal}
      role="button"
      tabindex="0"
      onkeydown={(e) => e.key === 'Escape' && toggleModal()}
    ></div>

    <div
      class="relative w-full max-w-6xl bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300 flex flex-col md:flex-row max-h-[95vh] md:max-h-[90vh] font-sans"
    >
      <!-- Close Button -->
      <button
        onclick={toggleModal}
        aria-label="Close modal"
        class="absolute top-3 right-3 md:top-6 md:right-6 z-[120] w-9 h-9 md:w-11 md:h-11 bg-white/90 backdrop-blur-xl rounded-full flex items-center justify-center text-aspada-navy hover:bg-aspada-gold hover:text-white transition-all shadow-xl border border-slate-200"
      >
        <span class="i-lucide-x text-lg md:text-xl"></span>
      </button>

      <!-- Map Side -->
      <div
        class="w-full md:w-1/2 relative h-[180px] md:h-auto min-h-[180px] md:min-h-[400px] shrink-0"
      >
        <LeafMap {latitude} {longitude} />
        <!-- Map Overlay Gradient for mobile -->
        <div
          class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent md:hidden pointer-events-none"
        ></div>
        <div class="absolute bottom-4 left-4 md:hidden">
          <span
            class="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-white border border-white/20"
          >
            Project Location
          </span>
        </div>
      </div>

      <!-- Form Side -->
      <div
        class="w-full md:w-1/2 p-5 sm:p-10 lg:p-14 overflow-y-auto bg-gradient-to-b from-slate-50 to-white flex flex-col justify-center relative scrollbar-hide"
      >
        <!-- Decorative elements -->
        <div
          class="absolute top-0 right-0 w-32 h-32 bg-aspada-gold/5 rounded-full blur-3xl -mr-16 -mt-16 hidden md:block"
        ></div>
        <div
          class="absolute bottom-0 left-0 w-32 h-32 bg-aspada-navy/5 rounded-full blur-3xl -ml-16 -mb-16 hidden md:block"
        ></div>

        <div class="relative z-10 w-full max-w-md mx-auto">
          <div class="flex items-center gap-3 mb-4">
            <div
              class="flex items-center justify-center w-6 h-6 rounded-full bg-aspada-gold/10 text-aspada-gold shadow-sm shadow-aspada-gold/20"
            >
              <span class="i-lucide-award text-xs"></span>
            </div>
            <span class="text-aspada-gold text-[10px] uppercase tracking-[0.3em] font-black block">
              Priority Request
            </span>
          </div>

          <h2
            class="text-2xl sm:text-3xl font-display font-extrabold text-aspada-navy mb-3 uppercase tracking-tighter leading-tight italic"
          >
            Enquire for <br />
            <span class="text-aspada-gold not-italic">{projectTitle}</span>
          </h2>

          <p class="text-slate-500 mb-6 md:mb-8 text-xs md:text-sm font-medium leading-relaxed">
            Fill out the form below and our project consultant will <span
              class="text-aspada-navy font-bold">get back to you within 24 hours.</span
            >
          </p>

          <div class="pb-2">
            <AspadaForm {projectTitle} isModal={true} />
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
