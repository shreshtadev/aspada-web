<script>
    import { deleteAttachment } from "../../lib/utils";

    let {
        label = "Files",
        attachmentIds = $bindable([]),
        maxFiles = 5,
        accept = "*",
        onFileSelect = null,
    } = $props();

    let fileInput = $state(null);
    let selectedFiles = $state([]);
    let uploading = $state(false);

    // Derived: how many slots are available
    let slotsAvailable = $derived(maxFiles - attachmentIds.length);
    let canUpload = $derived(slotsAvailable > 0);

    function handleFileChange(e) {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const filesArray = Array.from(files);

        // Check limit
        if (filesArray.length > slotsAvailable) {
            alert(
                `You can only upload ${slotsAvailable} more file(s). Maximum is ${maxFiles}.`,
            );
            if (fileInput) fileInput.value = "";
            return;
        }

        selectedFiles = filesArray;

        // Notify parent if callback provided
        if (onFileSelect) {
            onFileSelect(filesArray);
        }
    }

    function clearSelection() {
        selectedFiles = [];
        if (fileInput) fileInput.value = "";
    }

    async function removeAttachment(id) {
        if (!confirm("Delete this file?")) return;

        uploading = true;
        const success = await deleteAttachment(id);
        if (success) {
            attachmentIds = attachmentIds.filter((aid) => aid !== id);
        }
        uploading = false;
    }

    // Expose methods for parent to call
    export function getSelectedFiles() {
        return selectedFiles;
    }

    export function clearFiles() {
        clearSelection();
    }
</script>

<div class="block">
    <div class="flex justify-between items-center mb-2">
        <span class="text-sm font-bold text-slate-700">{label}</span>
        <span class="text-xs text-slate-500"
            >{attachmentIds.length} / {maxFiles} files</span
        >
    </div>

    <!-- Current Attachments -->
    {#if attachmentIds.length > 0}
        <div class="mb-3 space-y-2">
            {#each attachmentIds as id, idx}
                <div
                    class="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                >
                    <div class="flex items-center gap-2">
                        <span class="text-slate-400">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                ><path
                                    d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                                /><polyline points="14 2 14 8 20 8" /><line
                                    x1="16"
                                    y1="13"
                                    x2="8"
                                    y2="13"
                                /><line
                                    x1="16"
                                    y1="17"
                                    x2="8"
                                    y2="17"
                                /><polyline points="10 9 9 9 8 9" /></svg
                            >
                        </span>
                        <span class="text-sm text-slate-700 font-medium"
                            >Attachment {idx + 1}</span
                        >
                        <span class="text-xs text-slate-400 font-mono"
                            >{id.slice(0, 8)}...</span
                        >
                    </div>
                    <button
                        type="button"
                        onclick={() => removeAttachment(id)}
                        disabled={uploading}
                        class="text-red-500 hover:text-red-700 disabled:opacity-50 text-xs font-bold"
                    >
                        Remove
                    </button>
                </div>
            {/each}
        </div>
    {/if}

    <!-- File Input -->
    {#if canUpload}
        <div
            class="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors relative"
        >
            <input
                type="file"
                bind:this={fileInput}
                onchange={handleFileChange}
                {accept}
                multiple
                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div class="pointer-events-none">
                {#if selectedFiles.length > 0}
                    <div class="space-y-1">
                        {#each selectedFiles as file}
                            <div class="text-sm text-slate-900 font-medium">
                                {file.name}
                            </div>
                        {/each}
                    </div>
                {:else}
                    <div class="text-slate-500 text-sm">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            class="mx-auto mb-2 text-slate-400"
                            ><path
                                d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                            /><polyline points="17 8 12 3 7 8" /><line
                                x1="12"
                                y1="3"
                                x2="12"
                                y2="15"
                            /></svg
                        >
                        Click to select files ({slotsAvailable} remaining)
                    </div>
                {/if}
            </div>
        </div>

        {#if selectedFiles.length > 0}
            <button
                type="button"
                onclick={clearSelection}
                class="mt-2 text-xs text-red-600 hover:underline"
            >
                Clear selection
            </button>
        {/if}
    {:else}
        <div
            class="border border-slate-200 rounded-xl p-4 text-center bg-slate-50 text-slate-500 text-sm"
        >
            Maximum files reached ({maxFiles})
        </div>
    {/if}
</div>
