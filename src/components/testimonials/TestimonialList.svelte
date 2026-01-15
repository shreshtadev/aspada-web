<script>
  import TestimonialCard from "./TestimonialCard.svelte";

  let { testimonials = [] } = $props();
</script>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
  {#each testimonials as testimonial (testimonial.id)}
    <TestimonialCard {testimonial} />
  {/each}
</div>

{#if testimonials.length === 0}
  <div class="text-center py-20 text-slate-500">
    <p>No testimonials found.</p>
  </div>
{/if}
