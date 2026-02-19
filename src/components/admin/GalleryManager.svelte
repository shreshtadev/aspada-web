<script lang="ts">
  import { onMount } from 'svelte'
  import pb from '../../lib/pb'
  import toast from 'svelte-french-toast'
  import {
    Collections,
    MetadataCategoryTypeOptions,
    type MetadataResponse,
    type ProjectsResponse,
  } from '../../types/pocketbase-types'
  import FileUploadTracker from './FileUploadTracker.svelte'
  import { uploadAttachment } from '../../lib/utils'

  // -----------------------------
  // STATE
  // -----------------------------

  // Sidebar filter state
  let selectedProjectFilter = $state<string>('')

  // Master list state
  let galleryItems = $state<MetadataResponse[]>([])
  let projects = $state<ProjectsResponse[]>([])

  // Detail form state
  let selectedId = $state<string | null>(null)
  let formTitle = $state('')
  let attachmentIds = $state<string[]>([])
  let formProject = $state<string>('')
  let initialProject = $state<string>('')
  let formLoading = $state(false)
  let fileTracker = $state<ReturnType<typeof FileUploadTracker>>()

  let isProjectSelected = $derived(formProject !== '')

  // -----------------------------
  // LOAD PROJECTS (ONCE)
  // -----------------------------

  async function loadProjects() {
    try {
      projects = await pb.collection(Collections.Projects).getFullList<ProjectsResponse>()
    } catch (err) {
      console.error('Failed to load projects:', err)
      toast.error('Failed to load projects')
    }
  }

  // -----------------------------
  // LOAD GALLERY (FILTERED)
  // -----------------------------

  async function loadGallery() {
    try {
      if (!selectedProjectFilter) {
        galleryItems = []
        return
      }

      const filter = `
        categoryType = "${MetadataCategoryTypeOptions.gallery}" &&
        summary = "${selectedProjectFilter}"
      `

      galleryItems = await pb.collection(Collections.Metadata).getFullList<MetadataResponse>({
        filter,
      })
    } catch (err) {
      console.error('Failed to load gallery items:', err)
      toast.error('Failed to load gallery items')
    }
  }

  onMount(async () => {
    await loadProjects()
  })

  // Reactively reload gallery when project filter changes
  $effect(() => {
    loadGallery()
  })

  // -----------------------------
  // SELECTION
  // -----------------------------

  function selectItem(item: MetadataResponse | null) {
    selectedId = item?.id ?? null
    formTitle = item?.title ?? ''
    formProject = item?.summary ?? ''
    initialProject = item?.summary ?? ''
    attachmentIds = item?.attachments ?? []

    if (fileTracker) fileTracker.clearFiles()
  }

  function newItem() {
    selectedId = null
    formTitle = ''
    formProject = selectedProjectFilter // auto-assign current filter
    initialProject = ''
    attachmentIds = []

    if (fileTracker) fileTracker.clearFiles()
  }

  // -----------------------------
  // SAVE
  // -----------------------------

  async function saveGalleryItem() {
    formLoading = true

    try {
      // 1️⃣ Upload new attachments
      let newAttachments: string[] = []
      const selectedFiles = fileTracker?.getSelectedFiles() || []

      if (selectedFiles.length > 0) {
        const uploadTitle = formTitle || 'Gallery Upload'
        const uploadedIds = await uploadAttachment(uploadTitle, selectedFiles)
        if (uploadedIds.length === 0) {
          throw new Error('File upload failed')
        }
        newAttachments = uploadedIds
      }

      const finalAttachmentIds = [...attachmentIds, ...newAttachments]

      const data: any = {
        title: formTitle || 'Temp Title',
        attachments: finalAttachmentIds,
        categoryType: MetadataCategoryTypeOptions.gallery,
        summary: formProject,
      }

      let record: MetadataResponse

      if (selectedId) {
        record = await pb
          .collection(Collections.Metadata)
          .update<MetadataResponse>(selectedId, data)

        toast.success('Gallery item updated successfully')
      } else {
        record = await pb.collection(Collections.Metadata).create<MetadataResponse>(data)

        if (!formTitle) {
          record = await pb
            .collection(Collections.Metadata)
            .update<MetadataResponse>(record.id, { title: record.id })
        }

        toast.success('Gallery item created successfully')
      }

      // 🔄 Reload filtered list
      await loadGallery()
      selectItem(record)
    } catch (err: any) {
      console.error('PocketBase error:', err?.response?.data || err)
      toast.error(err?.message ?? 'Save failed')
    } finally {
      formLoading = false
    }
  }

  // -----------------------------
  // DELETE
  // -----------------------------

  async function deleteItem(id: string) {
    if (!confirm('Delete this gallery item? This will NOT delete attachments.')) return

    try {
      await pb.collection(Collections.Metadata).delete(id)

      if (selectedId === id) newItem()

      await loadGallery()
      toast.success('Gallery item deleted successfully')
    } catch (err: any) {
      toast.error(err?.message ?? 'Delete failed')
    }
  }
</script>

<!-- ============================= -->
<!-- UI -->
<!-- ============================= -->

<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
  <!-- LEFT SIDEBAR -->
  <div class="md:col-span-1">
    <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl sticky top-6">
      <div class="flex items-center justify-between mb-6">
        <h3 class="font-bold text-slate-900">Gallery Library</h3>

        <button
          onclick={newItem}
          disabled={!selectedProjectFilter}
          class="text-xs text-white bg-slate-900 px-4 py-2 rounded-full font-bold disabled:opacity-40"
        >
          + Create New
        </button>
      </div>

      <!-- PROJECT FILTER -->
      <div class="mb-6">
        <label for="select-project" class="block text-xs font-bold text-slate-500 uppercase mb-2">
          Select Project First
        </label>

        <select
          id="select-project"
          bind:value={selectedProjectFilter}
          class="w-full p-3 rounded-2xl border-2 border-slate-100 focus:border-[#d4af37] outline-none"
        >
          <option value="">-- Choose Project --</option>
          {#each projects as project}
            <option value={project.id}>
              {project.title}
            </option>
          {/each}
        </select>
      </div>

      <!-- GALLERY LIST -->
      {#if selectedProjectFilter}
        <div class="space-y-3 max-h-[70vh] overflow-auto pr-2">
          {#each galleryItems as item}
            <button
              type="button"
              class="w-full text-left p-4 rounded-2xl border-2 cursor-pointer transition-all"
              class:bg-slate-50={selectedId === item.id}
              class:border-[#d4af37]={selectedId === item.id}
              class:border-transparent={selectedId !== item.id}
              onclick={() => selectItem(item)}
            >
              <div class="font-bold text-sm truncate">
                {item.title || 'Untitled Gallery'}
              </div>

              <div class="text-[10px] mt-2 text-[#d4af37] font-bold uppercase">
                {item.attachments?.length || 0} Assets
              </div>
            </button>
          {:else}
            <div class="text-center py-12 text-sm text-slate-400">
              No galleries for this project
            </div>
          {/each}
        </div>
      {:else}
        <div class="text-center py-12 text-sm text-slate-400">
          Select a project to view galleries
        </div>
      {/if}
    </div>
  </div>

  <!-- RIGHT PANEL -->
  <div class="md:col-span-2">
    <div class="bg-white rounded-3xl border border-slate-200 shadow-2xl p-8 space-y-8">
      <!-- Project Assignment -->
      <section>
        <h4 class="text-sm font-bold uppercase mb-3">Assign Project</h4>

        <select
          bind:value={formProject}
          class="w-full p-4 border-2 border-slate-100 rounded-2xl focus:border-[#d4af37]"
        >
          <option value="">-- Choose Project --</option>
          {#each projects as project}
            <option value={project.id}>{project.title}</option>
          {/each}
        </select>
      </section>

      <!-- Title -->
      <section>
        <label for="gallery-title" class="block text-xs font-bold uppercase mb-2">
          Gallery Title
        </label>
        <input
          id="gallery-title"
          bind:value={formTitle}
          class="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-[#d4af37]"
          placeholder="Enter gallery title"
        />
      </section>

      <!-- Upload -->
      <FileUploadTracker
        bind:this={fileTracker}
        label="Upload Media"
        bind:attachmentIds
        maxFiles={10}
        accept="image/*"
      />

      <!-- Actions -->
      <div class="flex gap-4 pt-4">
        <button
          onclick={saveGalleryItem}
          disabled={formLoading || !formProject}
          class="bg-[#d4af37] text-white px-8 py-3 rounded-2xl font-bold disabled:opacity-40"
        >
          {formLoading ? 'Processing…' : selectedId ? 'Save Changes' : 'Publish'}
        </button>

        <button onclick={newItem} class="px-6 py-3 text-slate-500"> Cancel </button>

        {#if selectedId}
          <button onclick={() => deleteItem(selectedId!)} class="text-red-500 ml-auto">
            Delete Permanently
          </button>
        {/if}
      </div>
    </div>
  </div>
</div>
