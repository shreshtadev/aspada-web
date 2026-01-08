<script lang="ts">
    let { title, shareUrl } = $props<{
        title: string;
        shareUrl: string;
    }>();
</script>

<div
    class="w-full max-w-xl mx-auto rounded-xl border border-aspada-silver/20 bg-aspada-silver/10 p-4 space-y-3 mb-4"
>
    <h3 class="text-base font-semibold text-aspada-steel">
        {title}
    </h3>
    <a
        href={shareUrl}
        target="_blank"
        rel="noopener noreferrer"
        class="text-sm text-aspada-steel hover:text-aspada-steel/80 underline break-all"
    >
        View Post
    </a>
</div>
