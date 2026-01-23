<script lang="ts">
  import type { MetadataResponse } from '../types/pocketbase-types'

  const { stats } = $props<{
    stats: MetadataResponse[]
  }>()
</script>

<section class="relative z-20 -mt-20 px-4">
  <div class="max-w-6xl mx-auto">
    <div
      class="bg-white/90 border-2 border-aspada-gold backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden"
    >
      <div
        class="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-aspada-gold/20"
      >
        {#each stats as stat}
          <div
            class="p-8 sm:p-12 flex flex-col items-center justify-center text-center group hover:bg-aspada-gold/5 transition-colors duration-500"
          >
            <span
              class="text-4xl sm:text-5xl font-black text-aspada-gold mb-2 tracking-tighter group-hover:scale-110 transition-transform duration-500"
            >
              {stat.summary}
            </span>
            <span
              class="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] text-aspada-navy/60"
            >
              {stat.title}
            </span>
          </div>
        {/each}
      </div>
    </div>
  </div>
</section>
