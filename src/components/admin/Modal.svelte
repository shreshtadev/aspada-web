<script>
    let { show, title, onClose, children } = $props();
</script>

{#if show}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-all"
        role="dialog"
        aria-modal="true"
    >
        <!-- Backdrop click generic handler -->
        <div
            class="absolute inset-0"
            onclick={onClose}
            onkeydown={(e) => e.key === "Escape" && onClose()}
            role="button"
            tabindex="0"
        ></div>

        <!-- Panel -->
        <div
            class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
        >
            <div
                class="px-6 py-4 border-b flex justify-between items-center bg-slate-50"
            >
                <h3 class="font-bold text-slate-800 text-lg">{title}</h3>
                <button
                    onclick={onClose}
                    class="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors"
                >
                    ✕
                </button>
            </div>
            <div class="p-6 overflow-y-auto">
                {@render children()}
            </div>
        </div>
    </div>
{/if}
