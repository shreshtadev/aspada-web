<script lang="ts">
  import useEmblaCarousel from 'embla-carousel-svelte'
  import Autoplay, { type AutoplayType } from 'embla-carousel-autoplay'
  import pb from '../lib/pb'
  import type { ProjectExpand } from '../types'
  import type { ProjectsResponse } from '../types/pocketbase-types'

  const props = $props<{
    projects: ProjectsResponse<ProjectExpand>[]
    durationPerImage?: number
  }>()

  const durationPerImage = $derived(props.durationPerImage ?? 5000)

  let emblaApi: any
  let activeIndex = $state(0)

  // Use a derived state for projects to ensure reactivity and clean mapping
  const projects = $derived(
    props.projects.map((project) => {
      const cover = project.expand?.coverImage
      const coverImageUrl = cover?.attachment
        ? pb.files.getURL(cover, cover.attachment, { thumb: '1200', quality: 90 })
        : null

      return {
        ...project,
        coverImageUrl,
      }
    })
  )

  const autoplay = Autoplay({
    delay: durationPerImage,
    stopOnInteraction: false,
    stopOnMouseEnter: false,
  })

  function goToPrev() {
    if (!emblaApi) return
    emblaApi.scrollPrev()
  }

  function goToNext() {
    if (!emblaApi) return
    emblaApi.scrollNext()
  }

  function onInit(e: CustomEvent) {
    emblaApi = e.detail
    if (!emblaApi) return

    const updateIndex = () => {
      activeIndex = emblaApi.selectedScrollSnap()
    }

    emblaApi.on('select', updateIndex)
    emblaApi.on('reInit', updateIndex)
    updateIndex()
  }

  const options = {
    loop: true,
    duration: 30, // Faster transition for better sync with fade
  }
</script>

<section class="relative h-[110vh] w-full bg-transparent overflow-hidden">
  <!-- EMBLA ROOT -->
  <div class="absolute inset-0 embla">
    <!-- EMBLA VIEWPORT (THIS WAS MISSING) -->
    <div
      class="embla__viewport h-full"
      use:useEmblaCarousel={{ options, plugins: [autoplay] }}
      onemblaInit={onInit}
    >
      <div class="embla__container flex h-full">
        {#each projects as project, index}
          <div
            class={`embla__slide flex-[0_0_100%] relative ${
              index === activeIndex ? 'is-active' : ''
            }`}
          >
            {#if project.coverImageUrl}
              <img
                src={project.coverImageUrl}
                alt={project.slug || project.title || `Project ${index + 1}`}
                loading={index === 0 ? 'eager' : 'lazy'}
                decoding="async"
                class="absolute inset-0 w-full h-full object-cover"
              />
            {:else}
              <div
                class="absolute inset-0 w-full h-full bg-aspada-navy flex items-center justify-center text-white"
              >
                <p>No image available for {project.title}</p>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
    <!-- PREVIOUS -->
    <button
      class="embla__prev absolute left-10 top-1/2 left-1/2 -translate-y-1/2 z-20
            hover:text-4xl text-aspada-cream
           rounded-full w-20 h-20 flex items-center justify-center cursor-pointer text-3xl"
      onclick={goToPrev}
      aria-label="Previous slide"
    >
      <span class="i-lucide-chevron-left"></span>
    </button>

    <!-- NEXT -->
    <button
      class="embla__next absolute right-10 top-1/2 -translate-y-1/2 z-20
            hover:text-4xl text-aspada-cream
           rounded-full w-20 h-20 flex items-center justify-center cursor-pointer text-3xl"
      onclick={goToNext}
      aria-label="Next slide"
    >
      <span class="i-lucide-chevron-right"></span>
    </button>
  </div>

  <!-- Progress Indicators -->
  <div class="absolute bottom-6 left-10 -translate-x-1/2 z-20 flex gap-3">
    {#each projects as _, i}
      <div class="h-[2px] w-12 bg-white/30 overflow-hidden rounded">
        {#if i === activeIndex}
          <div
            class="progress-bar h-full bg-white origin-left"
            style={`animation-duration: ${durationPerImage}ms`}
          ></div>
        {/if}
      </div>
    {/each}
  </div>
</section>

<style>
  /* Fade transition */
  .embla__slide {
    opacity: 0;
    transition: opacity 1.2s ease-in-out;
  }

  .embla__slide.is-active {
    opacity: 1;
    pointer-events: auto;
  }

  /* Progress bar */
  .progress-bar {
    animation: progress linear forwards;
  }

  @keyframes progress {
    from {
      transform: scaleX(0);
    }
    to {
      transform: scaleX(1);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .embla__slide {
      transition: none;
    }
    .progress-bar {
      animation: none;
    }
  }
</style>
