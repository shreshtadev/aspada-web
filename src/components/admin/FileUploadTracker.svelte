<script>
  import toast from 'svelte-french-toast'
  let {
    label = 'Files',
    attachmentIds = $bindable([]),
    maxFiles = 5,
    accept = '*',
    onFileSelect = null,
  } = $props()

  let fileInput = $state(null)
  let selectedFiles = $state([])

  let slotsAvailable = $derived(maxFiles - attachmentIds.length)
  let canUpload = $derived(slotsAvailable > 0)

  function handleFileChange(e) {
    const files = e.target.files
    if (!files || files.length === 0) return

    const filesArray = Array.from(files)

    if (filesArray.length > slotsAvailable) {
      toast.info(`You can only upload ${slotsAvailable} more file(s).`)
      if (fileInput) fileInput.value = ''
      return
    }

    selectedFiles = filesArray
    if (onFileSelect) onFileSelect(filesArray)
  }

  function clearSelection() {
    selectedFiles = []
    if (fileInput) fileInput.value = ''
  }

  export function getSelectedFiles() {
    return selectedFiles
  }

  export function clearFiles() {
    clearSelection()
  }
</script>

<div class="space-y-3">
  <div class="flex justify-between items-center px-1">
    <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    <span class="text-[10px] font-black text-aspada-navy/40 uppercase tracking-widest"
      >{attachmentIds.length} / {maxFiles} Capacity</span
    >
  </div>

  {#if canUpload}
    <div
      class="border-4 border-dashed border-slate-100 rounded-3xl p-8 text-center hover:bg-slate-50 hover:border-aspada-gold/20 transition-all relative group"
    >
      <input
        type="file"
        bind:this={fileInput}
        onchange={handleFileChange}
        {accept}
        multiple
        class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />

      <div class="pointer-events-none relative z-0">
        {#if selectedFiles.length > 0}
          <div class="space-y-2">
            <div
              class="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-500 mx-auto mb-3 shadow-sm shadow-green-200"
            >
              <span class="i-lucide-check-circle text-2xl"></span>
            </div>
            <p class="text-xs font-black text-aspada-navy uppercase tracking-widest">
              {selectedFiles.length} file(s) staged
            </p>
            <div class="flex flex-wrap justify-center gap-1.5 mt-2">
              {#each selectedFiles as file}
                <div
                  class="px-3 py-1 bg-white border border-slate-100 rounded-full text-[10px] font-bold text-slate-500 shadow-sm max-w-[150px] truncate"
                >
                  {file.name}
                </div>
              {/each}
            </div>
          </div>
        {:else}
          <div class="text-slate-400">
            <div
              class="w-16 h-16 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:bg-white group-hover:shadow-xl transition-all duration-500 border-2 border-transparent group-hover:border-aspada-gold/20"
            >
              <span
                class="i-lucide-upload-cloud text-3xl group-hover:text-aspada-gold transition-colors"
              ></span>
            </div>
            <p class="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Tap to browse or drop here
            </p>
            <p class="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-tighter">
              Support for multiple file uploads
            </p>
          </div>
        {/if}
      </div>
    </div>

    {#if selectedFiles.length > 0}
      <button
        type="button"
        onclick={clearSelection}
        class="flex items-center gap-2 text-[10px] font-black text-red-400 hover:text-red-600 uppercase tracking-widest pl-1 transition-colors"
      >
        <span class="i-lucide-trash-2"></span>
        Reset Selection
      </button>
    {/if}
  {:else}
    <div
      class="border-2 border-slate-100 rounded-3xl p-6 text-center bg-slate-50/50 text-slate-400"
    >
      <div
        class="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm"
      >
        <span class="i-lucide-info text-slate-300"></span>
      </div>
      <p class="text-[10px] font-black uppercase tracking-widest">Maximum file capacity reached</p>
    </div>
  {/if}
</div>
