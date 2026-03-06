<script lang="ts">
  import pb from '../../lib/pb'
  import { downloadFile } from '../../lib/utils'
  import { Collections, type DocumentsResponse } from '../../types/pocketbase-types'
  import FileUploadTracker from './FileUploadTracker.svelte'

  let { stepId } = $props<{ stepId: string }>()

  // ─── State ────────────────────────────────────────────────────────────────
  let docs = $state<DocumentsResponse[]>([])
  let selectedId = $state<string | null>(null)
  let formTitle = $state('')
  let uploading = $state(false)
  let progress = $state(0)
  let currentPage = $state(1)
  let totalPages = $state(1)
  let perPage = $state(5)
  let loading = $state(false)

  let existingFileNames = $state<string[]>([])
  let trackerComponent = $state<ReturnType<typeof FileUploadTracker>>()

  // ─── Derived ──────────────────────────────────────────────────────────────
  let isNew = $derived(selectedId === null)

  // ─── Load ─────────────────────────────────────────────────────────────────
  async function load(page = currentPage) {
    loading = true
    try {
      const res = await pb
        .collection(Collections.Documents)
        .getList<DocumentsResponse>(page, perPage, {
          filter: `step = "${stepId}"`,
          sort: '-created',
        })
      docs = res.items
      currentPage = res.page
      totalPages = res.totalPages
    } finally {
      loading = false
    }
  }

  // ─── Selection ────────────────────────────────────────────────────────────
  function selectDoc(doc: DocumentsResponse) {
    selectedId = doc.id
    formTitle = doc.title
    existingFileNames = [...(doc.attachments ?? [])]
    trackerComponent?.clearFiles()
  }

  function newDoc() {
    selectedId = null
    formTitle = ''
    existingFileNames = []
    trackerComponent?.clearFiles()
  }

  // ─── Remove file ───────────────────────
  async function removeExistingFile(filename: string) {
    if (!selectedId) return
    if (!confirm(`Permanently remove "${filename}"?`)) return

    uploading = true
    try {
      const updated = await pb
        .collection(Collections.Documents)
        .update<DocumentsResponse>(selectedId, { 'attachments-': [filename] })

      existingFileNames = [...(updated.attachments ?? [])]
      await load(currentPage)
    } finally {
      uploading = false
    }
  }

  // ─── Save ───────────────────────────────────────────────
  async function handleSave(e: SubmitEvent) {
    e.preventDefault()
    if (!formTitle) return

    const newFiles = trackerComponent?.getSelectedFiles() ?? []
    if (isNew && newFiles.length === 0) return

    uploading = true
    progress = 0

    try {
      const data = new FormData()
      data.append('title', formTitle)
      data.append('step', stepId)
      data.append('slug', formTitle.toLowerCase().trim().replace(/\s+/g, '-'))
      const fileKey = isNew ? 'attachments' : 'attachments+'
      for (const file of newFiles) {
        data.append(fileKey, file)
      }

      const progressHandler = (ev: ProgressEvent) => {
        progress = Math.round((ev.loaded / ev.total) * 100)
      }

      if (isNew) {
        await pb.collection(Collections.Documents).create(data, {
          onProgress: progressHandler,
        })
      } else {
        const updated = await pb
          .collection(Collections.Documents)
          .update<DocumentsResponse>(selectedId!, data, {
            onProgress: progressHandler,
          })
        existingFileNames = [...(updated.attachments ?? [])]
      }

      trackerComponent?.clearFiles()
      if (isNew) {
        formTitle = ''
        existingFileNames = []
        selectedId = null
      }
      await load(isNew ? 1 : currentPage)
    } finally {
      uploading = false
      setTimeout(() => (progress = 0), 500)
    }
  }

  // ─── Delete ────────────────────────────────────────────────
  async function deleteDoc() {
    if (!selectedId) return
    if (!confirm('Delete this document and all files?')) return

    uploading = true
    try {
      await pb.collection(Collections.Documents).delete(selectedId)
      newDoc()
      await load(docs.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage)
    } finally {
      uploading = false
    }
  }

  $effect(() => {
    if (stepId) load(currentPage)
  })
</script>

<div class="space-y-8">
  <div class="flex items-center justify-between gap-4">
    <div class="flex-1">
      <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Step Assets</h3>
      <p class="text-sm font-bold text-slate-500">Manage required documentation</p>
    </div>
    <button
      type="button"
      onclick={newDoc}
      class="bg-aspada-navy text-white px-4 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-aspada-gold hover:text-white transition-all shadow-lg active:scale-95 flex items-center gap-2"
    >
      <span class="i-lucide-plus-circle text-base"></span>
      New
    </button>
  </div>

  <!-- ── Existing Documents List ──────────────────────────────── -->
  <div class="space-y-3">
    {#if loading && docs.length === 0}
      <div
        class="flex flex-col items-center justify-center py-12 text-slate-400 border-2 border-dashed rounded-3xl border-slate-100"
      >
        <span class="i-lucide-loader-2 text-2xl animate-spin mb-2"></span>
        <p class="text-[10px] font-bold uppercase tracking-widest">Querying Vault...</p>
      </div>
    {:else if docs.length > 0}
      <div class="grid grid-cols-1 gap-3">
        {#each docs as doc}
          <button
            type="button"
            onclick={() => selectDoc(doc)}
            class="group w-full flex items-center justify-between p-4 rounded-[1.5rem] border-2 transition-all duration-300
              {selectedId === doc.id
              ? 'border-aspada-gold bg-aspada-gold/5 shadow-md'
              : 'border-slate-50 bg-slate-50/50 hover:border-slate-200 hover:bg-white'}"
          >
            <div class="flex items-center gap-4 truncate">
              <div
                class="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-aspada-gold transition-colors shrink-0"
              >
                <span class="i-lucide-folder text-xl"></span>
              </div>
              <div class="truncate">
                <div
                  class="text-[13px] font-black text-slate-800 truncate group-hover:text-aspada-navy transition-colors"
                >
                  {doc.title}
                </div>
                <div class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                  {doc.attachments?.length ?? 0} Item{(doc.attachments?.length ?? 0) !== 1
                    ? 's'
                    : ''}
                </div>
              </div>
            </div>
            <span
              class="i-lucide-chevron-right text-slate-300 group-hover:text-aspada-gold transition-colors"
            ></span>
          </button>
        {/each}
      </div>

      {#if totalPages > 1}
        <div class="flex items-center justify-between px-2 pt-4">
          <button
            type="button"
            title="move-left"
            onclick={() => (currentPage -= 1)}
            disabled={currentPage === 1 || loading}
            class="p-2 rounded-xl border border-slate-100 hover:bg-white disabled:opacity-30 transition-all"
          >
            <span class="i-lucide-arrow-left text-sm"></span>
          </button>
          <span class="text-[10px] font-black uppercase text-slate-400"
            >Page {currentPage} / {totalPages}</span
          >
          <button
            type="button"
            title="move-right"
            onclick={() => (currentPage += 1)}
            disabled={currentPage === totalPages || loading}
            class="p-2 rounded-xl border border-slate-100 hover:bg-white disabled:opacity-30 transition-all"
          >
            <span class="i-lucide-arrow-right text-sm"></span>
          </button>
        </div>
      {/if}
    {:else}
      <div
        class="flex flex-col items-center justify-center py-12 text-slate-300 border-2 border-dashed rounded-3xl border-slate-100"
      >
        <span class="i-lucide-file-warning text-3xl mb-2 opacity-50"></span>
        <p class="text-[10px] font-bold uppercase tracking-widest italic">No assets registered</p>
      </div>
    {/if}
  </div>

  <!-- ── Form ──────────────────────────────────────────────────── -->
  <form
    onsubmit={handleSave}
    class="bg-slate-50/50 p-6 rounded-[2rem] border-2 border-slate-100 space-y-6"
  >
    <div class="flex items-center gap-3 mb-2">
      <div class="w-1.5 h-6 bg-aspada-gold rounded-full"></div>
      <p class="text-[11px] font-black text-aspada-navy uppercase tracking-widest">
        {isNew ? 'Register New Entry' : 'Modify Asset Entry'}
      </p>
    </div>

    <div class="space-y-2">
      <label
        for="doc-title"
        class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Label</label
      >
      <input
        id="doc-title"
        bind:value={formTitle}
        placeholder="e.g. KYC Documents, Site Photos..."
        required
        class="w-full bg-white border-2 border-slate-100 p-4 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-aspada-gold/10 focus:border-aspada-gold/30 outline-none transition-all"
      />
    </div>

    {#if !isNew && existingFileNames.length > 0}
      <div class="space-y-2">
        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
          Synchronized Files
        </p>
        <div class="grid grid-cols-1 gap-2">
          {#each existingFileNames as filename}
            <div
              class="flex items-center justify-between bg-white border border-slate-100 rounded-2xl px-4 py-3 shadow-sm group"
            >
              <div class="flex items-center gap-3 min-w-0">
                <span class="i-lucide-file-text text-slate-400 group-hover:text-aspada-gold"></span>
                <span class="text-xs text-slate-600 truncate font-bold">{filename}</span>
              </div>
              <div class="flex items-center gap-1">
                <button
                  type="button"
                  title="download-file"
                  onclick={() => {
                    const doc = docs.find((d) => d.id === selectedId)
                    if (doc) downloadFile(doc, filename)
                  }}
                  class="text-slate-400 hover:text-aspada-gold transition-colors p-1 cursor-pointer"
                >
                  <span class="i-lucide-download text-lg"></span>
                </button>
                <button
                  type="button"
                  title="close-x"
                  onclick={() => removeExistingFile(filename)}
                  disabled={uploading}
                  class="text-red-400 hover:text-red-600 disabled:opacity-40 transition-colors p-1 cursor-pointer"
                >
                  <span class="i-lucide-x-circle text-lg"></span>
                </button>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <div class="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
      <FileUploadTracker
        bind:this={trackerComponent}
        label={isNew ? 'Initial Attachments' : 'Append New Files'}
        maxFiles={10 - existingFileNames.length}
        accept="*/*"
      />
    </div>

    {#if uploading}
      <div class="space-y-2">
        <div class="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
          <div
            class="bg-aspada-navy h-full transition-all duration-300"
            style="width: {progress}%"
          ></div>
        </div>
        <div
          class="flex justify-between text-[10px] font-black text-aspada-navy uppercase tracking-widest"
        >
          <span>{progress}% Uploaded</span>
          <span class="animate-pulse">Transferring...</span>
        </div>
      </div>
    {/if}

    <div class="flex gap-3 pt-2">
      <button
        type="submit"
        disabled={uploading ||
          !formTitle ||
          (isNew && (trackerComponent?.getSelectedFiles()?.length ?? 0) === 0)}
        class="flex-1 bg-aspada-navy text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-aspada-gold transition-all shadow-xl active:scale-95 disabled:opacity-50 cursor-pointer"
      >
        {uploading ? 'Processing…' : isNew ? 'Submit Entry' : 'Sync Changes'}
      </button>

      {#if !isNew}
        <button
          type="button"
          onclick={deleteDoc}
          disabled={uploading}
          class="px-6 py-4 rounded-2xl border-2 border-red-50/50 text-red-400 hover:bg-red-50 hover:text-red-600 transition-all active:scale-95 cursor-pointer"
          aria-label="Delete Entry"
        >
          <span class="i-lucide-trash-2 text-lg"></span>
        </button>
      {/if}
    </div>
  </form>
</div>
