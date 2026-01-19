<script lang="ts">
  import { fade, scale } from 'svelte/transition'

  interface Image {
    url: string
    title?: string
  }

  let {
    images = [],
    projectTitle = '',
    layout = 'grid',
  } = $props<{
    images: Image[]
    projectTitle: string
    layout?: 'grid' | 'scroll'
  }>()

  let selectedIndex = $state(-1)
  let isOpen = $derived(selectedIndex !== -1)

  function openLightbox(index: number) {
    selectedIndex = index
    document.body.style.overflow = 'hidden'
  }

  function closeLightbox() {
    selectedIndex = -1
    document.body.style.overflow = 'auto'
  }

  function next() {
    if (selectedIndex < images.length - 1) {
      selectedIndex++
    } else {
      selectedIndex = 0
    }
  }

  function prev() {
    if (selectedIndex > 0) {
      selectedIndex--
    } else {
      selectedIndex = images.length - 1
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!isOpen) return
    if (e.key === 'Escape') closeLightbox()
    if (e.key === 'ArrowRight') next()
    if (e.key === 'ArrowLeft') prev()
  }
  let scrollerEl = $state<HTMLElement | null>(null)
  let canScrollLeft = $state(false)
  let canScrollRight = $state(false)

  function updateScrollButtons() {
    if (!scrollerEl) return
    canScrollLeft = scrollerEl.scrollLeft > 5
    canScrollRight = scrollerEl.scrollLeft + scrollerEl.clientWidth < scrollerEl.scrollWidth - 5
  }

  function scrollScroller(direction: 'left' | 'right') {
    if (!scrollerEl) return
    const amount = scrollerEl.clientWidth * 0.7
    scrollerEl.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  $effect(() => {
    if (layout === 'scroll' && scrollerEl) {
      updateScrollButtons()
      scrollerEl.addEventListener('scroll', updateScrollButtons)
      window.addEventListener('resize', updateScrollButtons)
      return () => {
        scrollerEl?.removeEventListener('scroll', updateScrollButtons)
        window.removeEventListener('resize', updateScrollButtons)
      }
    }
  })
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="relative group/scroller">
  {#if layout === 'scroll'}
    <button
      onclick={() => scrollScroller('left')}
      class="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/95 shadow-lg border border-slate-200 flex items-center justify-center text-aspada-navy md:opacity-0 md:group-hover/scroller:opacity-100 transition-all hover:bg-aspada-gold hover:text-white active:scale-95 md:hover:scale-110 disabled:pointer-events-none disabled:opacity-0 cursor-pointer"
      disabled={!canScrollLeft}
      aria-label="Previous"
    >
      <span class="i-lucide-chevron-left text-xl md:text-2xl"></span>
    </button>

    <button
      onclick={() => scrollScroller('right')}
      class="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/95 shadow-lg border border-slate-200 flex items-center justify-center text-aspada-navy md:opacity-0 md:group-hover/scroller:opacity-100 transition-all hover:bg-aspada-gold hover:text-white active:scale-95 md:hover:scale-110 disabled:pointer-events-none disabled:opacity-0 cursor-pointer"
      disabled={!canScrollRight}
      aria-label="Next"
    >
      <span class="i-lucide-chevron-right text-xl md:text-2xl"></span>
    </button>
  {/if}

  <div
    bind:this={scrollerEl}
    class={layout === 'grid'
      ? 'grid grid-cols-1 md:grid-cols-2 gap-6'
      : 'flex overflow-x-auto no-scrollbar snap-x snap-mandatory gap-6 pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth'}
  >
    {#each images as img, i}
      <button
        onclick={() => openLightbox(i)}
        class="rounded-2xl overflow-hidden aspect-video group cursor-zoom-in relative text-left shrink-0 snap-start {layout ===
        'scroll'
          ? 'w-[85vw] md:w-[600px]'
          : ''}"
      >
        <div
          class="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10"
        ></div>
        <img
          src={img.url}
          alt={`${projectTitle} view ${i + 1}`}
          class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        {#if img.title}
          <div
            class="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/60 to-transparent z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            <p class="text-white text-lg sm:text-2xl font-medium">
              {(img.title as string).indexOf('-') ? (img.title as string).split('-')[1] : img.title}
            </p>
          </div>
        {/if}
      </button>
    {/each}
  </div>
</div>

{#if isOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    transition:fade={{ duration: 200 }}
    class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 backdrop-blur-sm p-4 sm:p-10"
    onclick={closeLightbox}
  >
    <!-- Close Button -->
    <button
      onclick={closeLightbox}
      class="absolute top-6 right-6 z-[110] text-white/70 hover:text-white transition-colors"
      aria-label="Close"
    >
      <span class="i-lucide-x text-3xl sm:text-4xl"></span>
    </button>

    <!-- Navigation Buttons -->
    <button
      onclick={(e) => {
        e.stopPropagation()
        prev()
      }}
      class="absolute left-4 sm:left-10 z-[110] text-white/50 hover:text-white transition-colors p-2"
      aria-label="Previous image"
    >
      <span class="i-lucide-chevron-left text-4xl sm:text-6xl"></span>
    </button>

    <button
      onclick={(e) => {
        e.stopPropagation()
        next()
      }}
      class="absolute right-4 sm:right-10 z-[110] text-white/50 hover:text-white transition-colors p-2"
      aria-label="Next image"
    >
      <span class="i-lucide-chevron-right text-4xl sm:text-6xl"></span>
    </button>

    <!-- Main Image -->
    <div
      class="relative max-w-7xl w-full h-full flex flex-col items-center justify-center"
      onclick={(e) => e.stopPropagation()}
    >
      {#key selectedIndex}
        <div
          in:scale={{ duration: 300, start: 0.95, opacity: 0 }}
          class="flex flex-col items-center justify-center w-full h-full"
        >
          <img
            src={images[selectedIndex].url}
            alt={images[selectedIndex].title || `${projectTitle} image ${selectedIndex + 1}`}
            class="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
          />

          {#if images[selectedIndex].title}
            <p class="mt-6 text-white text-lg sm:text-2xl font-medium text-center px-4">
              {images[selectedIndex].title}
            </p>
          {/if}

          <p class="mt-2 text-white/40 text-sm font-medium">
            {selectedIndex + 1} / {images.length}
          </p>
        </div>
      {/key}
    </div>
  </div>
{/if}

<style>
  :global(body.overflow-hidden) {
    overflow: hidden;
  }
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
</style>
