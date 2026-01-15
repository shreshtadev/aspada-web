<script lang="ts">
  import { onMount } from "svelte";

  let { title, shareUrl, shareUrlType, index } = $props<{
    title: string;
    shareUrl: string;
    shareUrlType: "instagram" | "youtube" | "facebook";
    index: number;
  }>();

  onMount(() => {
    // Only load Instagram embed if we actually render it
    if (shareUrl && shareUrlType === "instagram" && index === 0) {
      if (!(window as any).instgrm) {
        const script = document.createElement("script");
        script.src = "https://www.instagram.com/embed.js";
        script.async = true;
        document.body.appendChild(script);
        script.onload = () => {
          (window as any).instgrm?.Embeds?.process();
        };
      } else {
        (window as any).instgrm.Embeds.process();
      }
    }
  });
</script>

<section
  class="w-full max-w-xl mx-auto rounded-2xl
         border border-slate-200 bg-white
         shadow-sm overflow-hidden my-2"
>
  <!-- Header -->
  <header class="p-4 border-b border-slate-100">
    <h3 class="text-sm font-semibold text-slate-900">
      {title}
    </h3>
    <p class="text-xs text-slate-500">Follow us on social media</p>
  </header>

  <!-- Content -->
  <div class="p-4 space-y-6">
    <!-- Instagram (latest post embed) -->
    {#if shareUrlType === "instagram" && index === 0}
      <div>
        <p
          class="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500"
        >
          Latest on Instagram
        </p>

        <blockquote
          class="instagram-media w-full"
          data-instgrm-permalink={shareUrl}
          data-instgrm-version="14"
        >
          <a href={shareUrl}>View on Instagram</a>
        </blockquote>
      </div>
    {:else}
      <a
        href={shareUrl}
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center justify-between
                 rounded-xl border border-slate-200
                 px-4 py-3 text-sm
                 hover:bg-aspada-steel/10 hover:underline transition"
      >
        <span class="font-medium text-slate-800">{title}</span>
      </a>
    {/if}

    <!-- Other platforms (links only) -->
    <div class="space-y-3">
      {#if shareUrlType === "youtube"}
        <a
          href={shareUrl}
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center justify-between
                 rounded-xl border border-slate-200
                 px-4 py-3 text-sm
                 hover:bg-aspada-steel/10 hover:underline transition"
        >
          <span class="font-medium text-slate-800">YouTube</span>
          <span class="text-slate-500">Visit channel →</span>
        </a>
      {/if}

      {#if shareUrlType === "facebook"}
        <a
          href={shareUrl}
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center justify-between
                 rounded-xl border border-slate-200
                 px-4 py-3 text-sm
                 hover:bg-aspada-steel/30 hover:underline transition"
        >
          <span class="font-medium text-slate-800">{title}</span>
        </a>
      {/if}
    </div>
  </div>
</section>
