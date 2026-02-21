<script lang="ts">
  import pb from '$lib/pb'
  import { Collections, type DocumentsResponse } from '$types/pocketbase-types'
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

  // Files already saved on the selected document (their filenames)
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

  // ─── Remove an already-saved file from the document ───────────────────────
  async function removeExistingFile(filename: string) {
    if (!selectedId) return
    if (!confirm(`Remove "${filename}" from this document?`)) return

    uploading = true
    try {
      const updated = await pb
        .collection(Collections.Documents)
        .update<DocumentsResponse>(selectedId, { 'attachments-': [filename] })

      existingFileNames = [...(updated.attachments ?? [])]

      // Refresh list (attachment count badge)
      await load(currentPage)
    } catch (err) {
      console.error('Remove file failed:', err)
    } finally {
      uploading = false
    }
  }

  // ─── Save (create or update) ───────────────────────────────────────────────
  async function handleSave(e: SubmitEvent) {
    e.preventDefault()
    if (!formTitle) return

    const newFiles = trackerComponent?.getSelectedFiles() ?? []

    // For a new doc, we require at least one file
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

      // Re-select the saved doc so the UI reflects latest state
      if (!isNew && selectedId) {
        const refreshed = docs.find((d) => d.id === selectedId)
        if (refreshed) selectDoc(refreshed)
      }
    } catch (err) {
      console.error('Save failed:', err)
    } finally {
      uploading = false
      setTimeout(() => (progress = 0), 500)
    }
  }

  // ─── Delete entire document ────────────────────────────────────────────────
  async function deleteDoc() {
    if (!selectedId) return
    if (!confirm('Delete this document and all its files permanently?')) return

    uploading = true
    try {
      await pb.collection(Collections.Documents).delete(selectedId)
      newDoc()
      if (docs.length === 1 && currentPage > 1) {
        await load(currentPage - 1)
      } else {
        await load(currentPage)
      }
    } catch (err) {
      console.error('Delete failed:', err)
    } finally {
      uploading = false
    }
  }

  // ─── Effect ────────────────────────────────────────────────────────────────
  $effect(() => {
    if (stepId) load(currentPage)
  })
</script>

<div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6">
  <div class="flex items-center justify-between">
    <h2 class="text-xl font-bold text-slate-800">Step Documents</h2>
    <button
      type="button"
      onclick={newDoc}
      class="text-xs bg-slate-900 text-white px-4 py-2 rounded-full font-bold hover:bg-slate-700 transition-colors"
    >
      + New Document
    </button>
  </div>

  <!-- ── Existing Documents List ──────────────────────────────── -->
  {#if loading && docs.length === 0}
    <div class="flex items-center justify-center py-8 text-slate-400">
      <span class="animate-pulse">Loading documents...</span>
    </div>
  {:else if docs.length > 0}
    <div class="space-y-2 pb-4 border-b border-slate-100">
      <p class="text-xs font-bold text-slate-500 uppercase mb-2">Existing Documents</p>
      {#each docs as doc}
        <button
          type="button"
          onclick={() => selectDoc(doc)}
          class="w-full flex items-center justify-between text-left px-4 py-3 rounded-lg border-2 transition-all
            {selectedId === doc.id
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-slate-100 hover:border-slate-300 bg-slate-50'}"
        >
          <div>
            <div class="text-sm font-bold text-slate-800">{doc.title}</div>
            <div class="text-xs text-slate-400 mt-0.5">
              {doc.attachments?.length ?? 0} file{(doc.attachments?.length ?? 0) !== 1 ? 's' : ''}
            </div>
          </div>
          <!-- paperclip icon -->
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="text-slate-400 shrink-0"
          >
            <path
              d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"
            />
          </svg>
        </button>
      {/each}

      {#if totalPages > 1}
        <div class="mt-4 flex items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onclick={() => (currentPage -= 1)}
            disabled={currentPage === 1 || loading}
            class="p-1.5 rounded-lg border hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page"
          >
            <span class="i-lucide-chevron-left text-base"></span>
          </button>
          <span class="text-[11px] text-slate-600 font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            onclick={() => (currentPage += 1)}
            disabled={currentPage === totalPages || loading}
            class="p-1.5 rounded-lg border hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page"
          >
            <span class="i-lucide-chevron-right text-base"></span>
          </button>
        </div>
      {/if}
    </div>
  {:else}
    <div class="text-center py-6 text-sm text-slate-400 bg-slate-50 rounded-lg">
      No documents yet for this step.
    </div>
  {/if}

  <!-- ── Form ──────────────────────────────────────────────────── -->
  <form onsubmit={handleSave} class="space-y-4">
    <p class="text-xs font-bold text-slate-500 uppercase">
      {isNew ? 'New Document' : 'Edit Document'}
    </p>

    <!-- Title -->
    <div>
      <label for="doc-title" class="block text-sm font-bold text-slate-700 mb-1"
        >Document Title</label
      >
      <input
        id="doc-title"
        bind:value={formTitle}
        placeholder="Document name"
        required
        class="w-full border p-2 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
      />
    </div>

    <!-- Existing files on a saved document -->
    {#if !isNew && existingFileNames.length > 0}
      <div class="space-y-1">
        <p class="text-xs font-bold text-slate-500 uppercase mb-1">Saved Files</p>
        {#each existingFileNames as filename}
          <div
            class="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
          >
            <div class="flex items-center gap-2 min-w-0">
              <!-- file icon -->
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="text-slate-400 shrink-0"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span class="text-xs text-slate-700 truncate font-mono">{filename}</span>
            </div>
            <button
              type="button"
              onclick={() => removeExistingFile(filename)}
              disabled={uploading}
              class="text-red-500 hover:text-red-700 disabled:opacity-40 text-xs font-bold shrink-0 ml-2"
            >
              Remove
            </button>
          </div>
        {/each}
      </div>
    {/if}

    <!-- File picker for new files (shows only slot count based on existing) -->
    <FileUploadTracker
      bind:this={trackerComponent}
      label={isNew ? 'Attachments' : 'Add More Files'}
      maxFiles={10 - existingFileNames.length}
      accept="*/*"
    />

    <!-- Progress bar -->
    {#if uploading}
      <div class="space-y-1">
        <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            class="bg-indigo-600 h-full transition-all duration-200"
            style="width: {progress}%"
          ></div>
        </div>
        <div class="flex justify-between text-[10px] font-bold text-indigo-600 uppercase">
          <span>Uploading...</span>
          <span>{progress}%</span>
        </div>
      </div>
    {/if}

    <!-- Actions -->
    <div class="flex gap-3 pt-1">
      <button
        type="submit"
        disabled={uploading ||
          !formTitle ||
          (isNew && (trackerComponent?.getSelectedFiles()?.length ?? 0) === 0)}
        class="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors text-sm"
      >
        {#if uploading}
          Saving…
        {:else if isNew}
          Save Document
        {:else}
          Save Changes
        {/if}
      </button>

      {#if !isNew}
        <button
          type="button"
          onclick={deleteDoc}
          disabled={uploading}
          class="px-4 py-2 text-sm font-bold text-red-500 hover:text-red-700 disabled:opacity-40 transition-colors"
        >
          Delete
        </button>
      {/if}
    </div>
  </form>
</div>
