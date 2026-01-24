<script lang="ts">
  import useEmblaCarousel from 'embla-carousel-svelte'
  import type { ProjectExpand } from '../types'
  import type { ProjectsResponse } from '../types/pocketbase-types'
  import ProjectCard from './projects/ProjectCard.svelte'
  import ProjectList from './projects/ProjectList.svelte'

  const props = $props<{
    projects: ProjectsResponse<ProjectExpand>[]
  }>()

  const options = {
    align: 'start',
    dragFree: true,
    containScroll: 'trimSnaps',
  }
</script>

<section class="bg-transparent py-30">
  <div class="max-w-7xl mx-auto px-6 overflow-x-visible">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-end mb-6 gap-6">
      <div class="font-display">
        <span class="text-aspada-gold font-bold uppercase tracking-[0.2em] text-xs">
          Offering the Whole Range of Properties.
        </span>
        <h2 class="text-4xl md:text-6xl font-bold mt-2 text-aspada-navy uppercase tracking-tighter">
          Ongoing <span class="text-aspada-gold/70 italic font-light">Projects</span>
        </h2>
      </div>
    </div>

    <!-- Embla -->
    <div class="embla overflow-hidden">
      <div class="embla__viewport overflow-hidden" use:useEmblaCarousel={{ options }}>
        <div class="embla__container flex">
          <ProjectList projects={props.projects} layout="embla" variant="medium" />
        </div>
      </div>
    </div>
  </div>
</section>
