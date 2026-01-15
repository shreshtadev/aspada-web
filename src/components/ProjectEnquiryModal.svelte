<script lang="ts">
  import AspadaForm from "./AspadaForm.svelte";
  import LeafMap from "./LeafMap.svelte";

  let { projectTitle, latitude, longitude } = $props<{
    projectTitle: string;
    latitude: number;
    longitude: number;
  }>();

  let isOpen = $state(false);

  function toggleModal() {
    isOpen = !isOpen;
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }

  function portal(node: HTMLElement) {
    document.body.appendChild(node);
    return {
      destroy() {
        if (node.parentNode) node.parentNode.removeChild(node);
      },
    };
  }
</script>

<button
  onclick={toggleModal}
  class="w-full mt-8 bg-aspada-navy text-aspada-cream py-4 rounded-xl font-bold hover:scale-105 transition-transform shadow-lg shadow-aspada-navy/20 cursor-pointer"
>
  Enquire Now
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
      onkeydown={(e) => e.key === "Escape" && toggleModal()}
    ></div>

    <div
      class="relative w-full max-w-6xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300 flex flex-col md:flex-row max-h-[90vh]"
    >
      <!-- Close Button -->
      <button
        onclick={toggleModal}
        aria-label="Close modal"
        class="absolute top-6 right-6 z-[110] w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-aspada-navy hover:bg-aspada-gold hover:text-white transition-all shadow-lg"
      >
        <span class="i-lucide-x text-xl"></span>
      </button>

      <!-- Map Side -->
      <div class="hidden md:block md:w-1/2 relative min-h-[400px]">
        <LeafMap {latitude} {longitude} />
      </div>

      <!-- Form Side -->
      <div
        class="w-full md:w-1/2 p-8 lg:p-12 overflow-y-auto bg-slate-50 flex flex-col justify-center"
      >
        <div class="relative z-10">
          <span
            class="text-aspada-gold text-[10px] uppercase tracking-[0.3em] font-black mb-2 block"
          >
            Priority Request
          </span>
          <h2
            class="text-3xl font-black text-aspada-navy mb-2 uppercase tracking-tighter"
          >
            Enquire for <span class="text-aspada-gold">{projectTitle}</span>
          </h2>
          <p class="text-slate-500 mb-8 text-sm font-medium">
            Fill out the form below and our project consultant will get back to
            you within 24 hours.
          </p>

          <AspadaForm {projectTitle} />
        </div>
      </div>
    </div>
  </div>
{/if}
