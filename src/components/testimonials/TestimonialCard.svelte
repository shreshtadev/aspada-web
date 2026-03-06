<script>
  let { testimonial } = $props()

  // Initials logic
  let initials = $derived(
    (testimonial.authorName || 'VC')
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  )

  // Star rating logic
  let rating = $derived(testimonial.rating || 5)
</script>

<a
  href={`/testimonials/${testimonial.id}`}
  class="group relative block h-full overflow-hidden rounded-[2.5rem] bg-aspada-cream/40 p-1 backdrop-blur-xl transition-all duration-700 hover:-translate-y-3"
>
  <!-- Brand Gradient Aura -->
  <div
    class="absolute inset-0 bg-gradient-to-br from-aspada-gold/20 via-transparent to-aspada-navy/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
  ></div>

  <div
    class="relative h-full flex flex-col p-8 bg-white/70 rounded-[2.3rem] border border-white/80 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] group-hover:shadow-[0_40px_80px_-20px_rgba(212,175,55,0.2)] transition-all duration-700"
  >
    <!-- Decorative Background Element -->
    <div
      class="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity duration-700"
    >
      <div class="i-lucide-flower-2 w-32 h-32 rotate-12"></div>
    </div>

    <!-- Author Section -->
    <div class="flex items-center gap-5 mb-8 relative z-10">
      <div class="relative flex-shrink-0">
        <!-- Avatar Ring & Glow -->
        <div
          class="absolute inset-0 rounded-full bg-aspada-gold/40 blur-xl group-hover:blur-2xl scale-90 transition-all duration-700"
        ></div>

        <div
          class="relative w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-aspada-gold to-aspada-cream shadow-lg transition-transform duration-700 group-hover:scale-110 group-hover:rotate-3 flex items-center justify-center text-2xl font-display font-black text-aspada-navy border-4 border-white"
        >
          {initials}
        </div>

        <!-- Verified Badge -->
        <div
          class="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-aspada-navy flex items-center justify-center text-white border-4 border-white shadow-xl transition-all duration-500 group-hover:bg-aspada-gold group-hover:scale-110"
        >
          <div class="i-lucide-check w-3.5 h-3.5"></div>
        </div>
      </div>

      <div>
        <h3
          class="font-display font-black text-aspada-navy text-2xl tracking-tight leading-none mb-1.5 transition-colors duration-300 group-hover:text-aspada-gold"
        >
          {testimonial.authorName}
        </h3>

        {#if testimonial.authorRole}
          <p class="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">
            {testimonial.authorRole}
          </p>
        {/if}

        <div class="flex items-center gap-3">
          <div class="flex text-aspada-gold gap-0.5">
            {#each Array(5) as _, i}
              <div
                class={i < rating
                  ? 'i-lucide-star w-4 h-4 fill-current'
                  : 'i-lucide-star w-4 h-4 opacity-20'}
              ></div>
            {/each}
          </div>
        </div>
      </div>
    </div>

    <!-- Quote Content -->
    <div class="relative flex-grow mb-10">
      <div
        class="absolute -top-10 -left-6 text-8xl text-aspada-gold/10 font-serif italic select-none"
      >
        “
      </div>
      <p
        class="font-sans text-slate-600 font-medium italic relative z-10 leading-relaxed text-xl line-clamp-5 group-hover:text-aspada-navy transition-colors duration-500"
      >
        {testimonial.content}
      </p>
    </div>

    <!-- Footer Action -->
    <div
      class="mt-auto pt-8 border-t border-slate-100/80 flex justify-between items-end group/footer"
    >
      <div class="flex flex-col gap-1">
        <span class="text-[10px] font-black uppercase tracking-[0.2em] text-aspada-gold/60"
          >Success Story</span
        >
        <span
          class="text-sm font-black text-aspada-navy flex items-center gap-2 group-hover:gap-3 transition-all duration-300"
        >
          View Details <span
            class="w-1.5 h-1.5 bg-aspada-gold rounded-full transition-all group-hover:w-4"
          ></span>
        </span>
      </div>

      <div class="relative flex items-center justify-center">
        <!-- Glow on button hover -->
        <div
          class="absolute inset-0 bg-aspada-gold/0 rounded-2xl blur-lg transition-all duration-500 group-hover:bg-aspada-gold/30"
        ></div>

        <div
          class="relative w-14 h-14 rounded-2xl bg-aspada-navy flex items-center justify-center text-aspada-cream transition-all duration-700 group-hover:bg-aspada-gold group-hover:rounded-[1.5rem] group-hover:rotate-6 group-hover:shadow-[0_10px_30px_-5px_#D4AF37]"
        >
          <div class="i-lucide-arrow-right w-7 h-7"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- Subtle Outer Border on Hover -->
  <div
    class="absolute inset-0 rounded-[2.5rem] border-2 border-transparent group-hover:border-aspada-gold/20 transition-all duration-700 pointer-events-none"
  ></div>
</a>
