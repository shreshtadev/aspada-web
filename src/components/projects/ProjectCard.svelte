<script lang="ts">
  import pb from '../../lib/pb'
  import type { ProjectExpand } from '../../types'
  import type { ProjectsResponse } from '../../types/pocketbase-types'

  const { project, variant = 'medium' } = $props<{
    project: ProjectsResponse<ProjectExpand>
    variant?: 'small' | 'medium' | 'large'
  }>()

  const city = $derived(project.city ?? 'Unknown')
  const district = $derived(project.district ?? 'Unknown')
  const location = $derived(`${city}, ${district}`)
  const status = $derived(project.status ?? 'Ongoing')
  const coverImageUrl = $derived(
    pb.files.getURL(project.expand?.coverImage, project.expand?.coverImage?.attachment, {
      thumb: '1200',
      quality: 80,
    })
  )

  const variants = $derived(
    {
      small: {
        aspect: 'aspect-[4/3]',
        padding: 'p-4',
        title: 'text-sm',
        meta: 'text-[10px]',
        cta: 'w-8 h-8 text-sm',
      },
      medium: {
        aspect: 'aspect-[16/10]',
        padding: 'p-6',
        title: 'text-base',
        meta: 'text-xs',
        cta: 'w-10 h-10 text-lg',
      },
      large: {
        aspect: 'aspect-[3/4]',
        padding: 'p-8',
        title: 'text-lg sm:text-xl',
        meta: 'text-sm',
        cta: 'w-12 h-12 text-xl',
      },
    }[variant]
  )
</script>

<a
  href={`/projects/${project.category}/${project.id}`}
  target="_blank"
  aria-label={`View details for ${project.title}`}
  class="
    group
    relative
    flex
    flex-col
    rounded-xl
    overflow-hidden
    border border-aspada-steel/30
    bg-transparent
    shadow-sm
    hover:shadow-xl
    transition-shadow
    duration-500
  "
>
  <!-- Image -->
  <div class={`relative ${variants.aspect} overflow-hidden`}>
    {#if project.coverImage}
      <img
        src={coverImageUrl}
        alt={project.title}
        loading="lazy"
        decoding="async"
        class="
          w-full h-full object-cover
          transition-transform duration-700
          group-hover:scale-105
        "
      />
    {/if}

    <div class="absolute top-3 left-3">
      <span
        class="
          bg-aspada-navy
          px-3 py-1
          text-aspada-cream/80
          text-[10px]
          font-bold
          uppercase
          tracking-wider
          rounded-sm
        "
      >
        {status}
      </span>
    </div>
  </div>

  <!-- Content -->
  <div class={`flex flex-col flex-grow ${variants.padding}`}>
    <span class={`text-aspada-navy/60 font-bold uppercase tracking-widest mb-3 ${variants.meta}`}>
      {project.category}
    </span>

    <h3
      class={`
        font-bold
        text-aspada-navy
        leading-tight
        mb-2
        transition-colors
        group-hover:text-aspada-steel
        ${variants.title}
      `}
    >
      {project.title}
    </h3>

    <div class={`flex items-center gap-1 text-aspada-navy/50 uppercase ${variants.meta}`}>
      <span class="i-lucide-map-pin text-sm"></span>
      {location}
    </div>

    <div class="mt-auto pt-5 border-t border-aspada-steel/20 flex justify-between items-center">
      <span class="text-xs font-bold uppercase tracking-widest opacity-70"> View Details </span>

      <div
        class={`
          flex items-center justify-center
          rounded-lg
          bg-aspada-navy
          text-white
          transition-colors
          group-hover:bg-aspada-steel
          ${variants.cta}
        `}
      >
        <span class="i-lucide-arrow-right"></span>
      </div>
    </div>
  </div>
</a>
