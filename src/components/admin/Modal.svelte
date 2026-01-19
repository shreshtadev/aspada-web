<script>
  let { show, title, onClose, children } = $props()
</script>

{#if show}
  <div class="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
    <!-- Backdrop -->
    <div
      class="fixed inset-0 bg-black/50 backdrop-blur-sm transition-all"
      onclick={onClose}
      role="button"
      tabindex="0"
      onkeydown={(e) => e.key === 'Escape' && onClose()}
    ></div>

    <!-- Scrollable Wrapper for centering -->
    <div class="flex min-h-full items-center justify-center p-4">
      <!-- Panel -->
      <div
        class="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-lg md:max-w-5xl lg:max-w-6xl animate-in fade-in zoom-in-95 duration-200"
      >
        <div
          class="px-6 py-4 border-b flex justify-between items-center bg-aspada-gold/80 rounded-t-2xl"
        >
          <h3 class="font-bold text-aspada-navy text-lg">{title}</h3>
          <button
            onclick={onClose}
            class="text-aspada-navy hover:text-aspada-cream w-8 h-8 flex items-center justify-center rounded-full hover:bg-aspada-steel transition-colors"
          >
            ✕
          </button>
        </div>
        <div class="p-6">
          {@render children()}
        </div>
      </div>
    </div>
  </div>
{/if}
