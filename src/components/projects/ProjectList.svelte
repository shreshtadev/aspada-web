<script lang="ts">
  import ProjectCard from './ProjectCard.svelte'
  import type { ProjectExpand } from '../../types'
  import type { ProjectsResponse } from '../../types/pocketbase-types'
  import useEmblaCarousel from 'embla-carousel-svelte'

  const {
    projects,
    layout = 'grid', // 'grid' | 'embla' | 'masonry'
    variant = 'medium',
  } = $props<{
    projects: ProjectsResponse<ProjectExpand>[]
    layout?: 'grid' | 'embla' | 'masonry'
    variant?: 'small' | 'medium' | 'large'
  }>()
</script>

{#if layout === 'embla'}
  <!-- EMBLA MODE -->
  <div class="embla overflow-hidden" use:useEmblaCarousel>
    <div class="flex gap-6">
      {#each projects as project (project.id)}
        <div class="flex-shrink-0 w-[85vw] sm:w-[45vw] lg:w-[30vw]">
          <ProjectCard {project} {variant} />
        </div>
      {/each}
    </div>
  </div>
{:else if layout === 'masonry'}
  <!-- MASONRY MODE -->
  <section
    class="
      columns-1
      sm:columns-2
      lg:columns-3
      gap-8
    "
  >
    {#each projects as project (project.id)}
      <div class="mb-8 break-inside-avoid">
        <ProjectCard {project} {variant} />
      </div>
    {/each}
  </section>
{:else}
  <!-- GRID MODE (AUTO VARIANT BY BREAKPOINT) -->
  <section
    class="
      grid
      grid-cols-1
      md:grid-cols-2
      lg:grid-cols-3
      gap-8
    "
  >
    {#each projects as project (project.id)}
      <ProjectCard {project} {variant} />
    {/each}
  </section>
{/if}
