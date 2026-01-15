<script>
  import pb from "../../lib/pb";

  let { testimonial } = $props();

  // Safe default avatar
  let defaultAvatar = $derived(
    "https://i.pravatar.cc/150?u=" + (testimonial.id || "default")
  );

  let authorAvatar = $derived(testimonial.expand?.authorAvatar);
  // Construct image URL if avatar exists
  let avatarUrl = $derived(
    authorAvatar
      ? pb.files.getURL(authorAvatar, authorAvatar.attachment)
      : defaultAvatar
  );
</script>

<a
  href={`/testimonials/${testimonial.id}`}
  class="group block h-full bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-3xl hover:bg-white/10 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-xl hover:shadow-[#d4af37]/10"
>
  <div class="flex items-center gap-4 mb-6">
    <img
      src={avatarUrl}
      alt={testimonial.authorName}
      class="w-12 h-12 rounded-full object-cover border-2 border-[#d4af37]/30 group-hover:border-[#d4af37] transition-colors"
    />
    <div>
      <h3
        class="font-bold text-slate-800 text-lg group-hover:text-[#d4af37] transition-colors"
      >
        {testimonial.authorName}
      </h3>
      <div class="flex text-[#d4af37] text-xs gap-0.5 mt-0.5">
        {#each Array(testimonial.rating || 5) as _}
          <span>★</span>
        {/each}
        {#each Array(5 - (testimonial.rating || 5)) as _}
          <span class="opacity-30">★</span>
        {/each}
      </div>
    </div>
  </div>

  <div class="relative">
    <span
      class="absolute -top-3 -left-1 text-4xl text-[#d4af37]/10 font-serif leading-none"
      >“</span
    >
    <p
      class="text-slate-600 italic relative z-10 pl-2 leading-relaxed line-clamp-4"
    >
      {testimonial.content}
    </p>
  </div>

  <div
    class="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center"
  >
    <span
      class="text-xs font-bold text-[#d4af37] uppercase tracking-widest opacity-80 group-hover:opacity-100"
      >Read Story</span
    >
    <span
      class="w-8 h-8 rounded-full bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] group-hover:bg-[#d4af37] group-hover:text-white transition-all"
    >
      →
    </span>
  </div>
</a>
