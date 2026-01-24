<script lang="ts">
  import useEmblaCarousel from 'embla-carousel-svelte'
  import Autoplay from 'embla-carousel-autoplay'
  import type { MetadataResponse } from '../../types/pocketbase-types'

  const { amenities } = $props<{
    amenities: MetadataResponse[]
  }>()

  let canScrollPrev = $state(false)
  let canScrollNext = $state(false)

  const options = {
    align: 'start',
    dragFree: true,
    containScroll: 'trimSnaps',
    loop: true,
  }

  const plugins = [
    Autoplay({
      delay: 3000,
      stopOnInteraction: false,
      playOnInit: true,
    }),
  ]

  let emblaApi: any

  function onInit(event: CustomEvent) {
    emblaApi = event.detail
    updateButtons()
    emblaApi.on('select', updateButtons)
    emblaApi.on('reInit', updateButtons)
  }

  function updateButtons() {
    if (!emblaApi) return
    canScrollPrev = emblaApi.canScrollPrev()
    canScrollNext = emblaApi.canScrollNext()
  }

  function scrollPrev() {
    if (emblaApi) emblaApi.scrollPrev()
  }

  function scrollNext() {
    if (emblaApi) emblaApi.scrollNext()
  }
</script>

<div class="relative group/carousel">
  <!-- Left Navigation Button -->
  {#if canScrollPrev}
    <button
      onclick={scrollPrev}
      class="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white shadow-xl border border-slate-200 flex items-center justify-center text-aspada-navy opacity-0 group-hover/carousel:opacity-100 transition-all hover:bg-aspada-gold hover:text-white active:scale-95 hover:scale-110 cursor-pointer"
      aria-label="Previous"
    >
      <span class="i-lucide-chevron-left text-xl md:text-2xl"></span>
    </button>
  {/if}

  <!-- Right Navigation Button -->
  {#if canScrollNext}
    <button
      onclick={scrollNext}
      class="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white shadow-xl border border-slate-200 flex items-center justify-center text-aspada-navy opacity-0 group-hover/carousel:opacity-100 transition-all hover:bg-aspada-gold hover:text-white active:scale-95 hover:scale-110 cursor-pointer"
      aria-label="Next"
    >
      <span class="i-lucide-chevron-right text-xl md:text-2xl"></span>
    </button>
  {/if}

  <div class="embla overflow-hidden -mx-4 px-4 sm:mx-0 sm:px-0 cursor-grab">
    <div
      class="embla__viewport overflow-hidden"
      use:useEmblaCarousel={{ options, plugins }}
      onemblainit={onInit}
    >
      <div class="embla__container flex gap-6">
        {#each amenities as item}
          <div
            class="embla__slide flex-none w-[200px] group p-6 bg-transparent transition-all snap-start flex flex-col items-center text-center"
          >
            <div
              class="w-24 h-24 rounded-2xl flex items-center justify-center text-aspada-steel mb-4 group-hover:scale-110 transition-transform active:cursor-grabbing"
            >
              {#if item.attachments && item.attachments[0]}
                <img src={item.attachments[0]} alt={item.title} class="w-20 h-20 object-contain" />
              {:else}
                <span class="i-lucide-check text-2xl"></span>
              {/if}
            </div>
            <h3
              class="font-bold text-aspada-navy group-hover:text-aspada-gold transition-colors text-sm"
            >
              {item.title}
            </h3>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  .embla {
    overflow: visible;
  }

  .embla__container {
    display: flex;
  }

  .embla__slide {
    flex: 0 0 auto;
  }
</style>
