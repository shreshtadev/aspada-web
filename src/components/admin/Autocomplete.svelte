<script>
  let {
    label = "",
    options = [],
    selected = $bindable([]),
    placeholder = "Select...",
    allowCreate = false,
    oncreate = () => {},
  } = $props();

  let isOpen = $state(false);
  let search = $state("");
  let container = $state(null);

  // Derived filtered options
  let filteredOptions = $derived(
    options.filter((opt) =>
      opt.title.toLowerCase().includes(search.toLowerCase()),
    ),
  );

  // Derived selected items for display
  let selectedItems = $derived(
    selected.map((id) => options.find((o) => o.id === id)).filter(Boolean),
  );

  function select(opt) {
    if (!selected.includes(opt.id)) {
      selected = [...selected, opt.id];
    }
    search = "";
  }

  function remove(id) {
    selected = selected.filter((s) => s !== id);
  }

  function handleCreate() {
    oncreate();
    isOpen = false;
  }

  function handleOutsideClick(e) {
    if (container && !container.contains(e.target)) {
      isOpen = false;
    }
  }
</script>

<svelte:window onclick={handleOutsideClick} />

<div class="block relative" bind:this={container}>
  {#if label}
    <span class="text-sm font-bold text-slate-700 mb-1 block">{label}</span>
  {/if}

  <div
    class="bg-white border focus-within:ring-2 focus-within:ring-aspada-gold/50 focus-within:border-aspada-gold border-slate-300 rounded-xl p-2 min-h-[46px] flex flex-wrap gap-2 items-center cursor-text transition-all"
    role="button"
    tabindex="0"
    onclick={() => (isOpen = true)}
    onkeydown={(e) => e.key === "Enter" && (isOpen = !isOpen)}
  >
    {#each selectedItems as item}
      <span
        class="bg-aspada-silver/30 text-aspada-navy text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 border border-aspada-steel/90"
      >
        {item.title} - {item.summary ? item.summary.slice(0, 50) + "..." : ""}
        <button
          onclick={(e) => {
            e.stopPropagation();
            remove(item.id);
          }}
          class="hover:text-red-500 rounded-full w-4 h-4 flex items-center justify-center font-bold"
        >
          &times;
        </button>
      </span>
    {/each}

    <input
      name="multiSelector"
      type="text"
      bind:value={search}
      {placeholder}
      class="bg-transparent border-none outline-none text-sm flex-1 min-w-[60px]"
      onfocus={() => (isOpen = true)}
    />
  </div>

  {#if isOpen}
    <div
      class="absolute left-0 mt-2 w-full bg-white rounded-xl shadow-xl border z-50 max-h-60 overflow-auto overflow-x-hidden"
    >
      {#if filteredOptions.length > 0}
        {#each filteredOptions as opt}
          <button
            class="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center justify-between group {selected.includes(
              opt.id,
            )
              ? 'bg-slate-50 text-[#d4af37] font-bold'
              : 'text-slate-700'}"
            onclick={() => select(opt)}
            type="button"
          >
            <span>{opt.title}</span>
            {#if selected.includes(opt.id)}
              <span class="text-[#d4af37]">✓</span>
            {/if}
          </button>
        {/each}
      {:else if search}
        <div class="px-4 py-3 text-sm text-slate-500 text-center">
          No matches found.
        </div>
      {/if}

      {#if allowCreate}
        <div class="border-t p-1">
          <button
            class="w-full text-left px-4 py-2 text-sm text-aspada-gold font-bold hover:bg-aspada-gold/10 rounded-lg flex items-center gap-2"
            onclick={handleCreate}
            type="button"
          >
            <span class="text-lg">+</span> Create "{search || "New"}"
          </button>
        </div>
      {/if}
    </div>
  {/if}
</div>
