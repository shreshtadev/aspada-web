<script lang="ts">
    let { title, shareUrl, shareUrlType } = $props<{
        title: string;
        shareUrl: string;
        shareUrlType: "instagram" | "youtube" | "facebook";
    }>();

    // Effect to handle Instagram embed processing
    $effect(() => {
        if (shareUrlType === "instagram") {
            // Instagram requires re-processing
            if ((window as any).instgrm?.Embeds) {
                (window as any).instgrm.Embeds.process();
            }
        }
    });
</script>

<div
    class="w-full max-w-xl mx-auto rounded-xl border border-neutral-800 bg-neutral-900 p-4 space-y-3"
>
    <h3 class="text-base font-semibold text-neutral-100">
        {title}
    </h3>

    {#if shareUrlType === "youtube" && shareUrl}
        <!-- YouTube -->
        <div class="relative w-full aspect-video rounded-lg overflow-hidden">
            <iframe
                class="absolute inset-0 w-full h-full"
                src={shareUrl}
                title="YouTube video"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
            >
            </iframe>
        </div>
    {:else if shareUrlType === "instagram"}
        <!-- Instagram -->
        <blockquote
            class="instagram-media w-full"
            data-instgrm-permalink={shareUrl}
            data-instgrm-version="14"
        ></blockquote>
    {:else if shareUrlType === "facebook"}
        <!-- Facebook -->
        <div class="fb-post w-full" data-href={shareUrl} data-width="500"></div>
    {:else}
        <!-- Fallback -->
        <a
            class="text-sm text-blue-400 underline break-all"
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
        >
            View post
        </a>
    {/if}
</div>

<svelte:head>
    <!-- Instagram SDK -->
    <script async src="https://www.instagram.com/embed.js"></script>

    <!-- Facebook SDK -->
    <script
        async
        defer
        crossorigin="anonymous"
        src="https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v19.0"
    >
    </script>
</svelte:head>
