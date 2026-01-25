<script lang="ts">
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

  async function loadGallery() {
    try {
      const items = await pb.collection(Collections.Metadata).getFullList<MetadataResponse>({
        filter: `categoryType = "${MetadataCategoryTypeOptions.gallery}"`,
      })
      galleryItems = items

      const projectList = await pb.collection(Collections.Projects).getFullList<ProjectsResponse>()
      projects = projectList
    } catch (err) {
      console.error('Failed to load gallery items:', err)
      toast.error('Failed to load gallery items')
    }
  }

  $effect(() => {
    loadGallery()
  })

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
    formProject = ''
    initialProject = ''
    attachmentIds = []
    if (fileTracker) fileTracker.clearFiles()
  }

  async function saveGalleryItem() {
    formLoading = true
    try {
      // 1. Handle New Uploads first
      let newAttachments: string[] = []
      const selectedFiles = fileTracker?.getSelectedFiles() || []

      if (selectedFiles.length > 0) {
        // Use formTitle or a placeholder for attachment titles
        const uploadTitle = formTitle || 'Gallery Upload'
        const uploadedIds = await uploadAttachment(uploadTitle, selectedFiles)
        if (uploadedIds.length === 0) {
          throw new Error('File upload failed')
        }
        newAttachments = uploadedIds
      }

      // 2. Prepare Metadata Record
      const finalAttachmentIds = [...attachmentIds, ...newAttachments]

      const data: any = {
        title: formTitle || 'Temp Title', // Placeholder if empty
        attachments: finalAttachmentIds,
        categoryType: MetadataCategoryTypeOptions.gallery,
        summary: formProject,
      }

      let record: MetadataResponse
      if (selectedId) {
        // Update
        if (!formTitle) {
          data.title = selectedId // fallback to ID if empty on update
        }
        record = await pb
          .collection(Collections.Metadata)
          .update<MetadataResponse>(selectedId, data)
        galleryItems = galleryItems.map((item) => (item.id === record.id ? record : item))
        toast.success('Gallery item updated successfully')
      } else {
        // Create
        record = await pb.collection(Collections.Metadata).create<MetadataResponse>(data)

        // If title was empty, update it with the ID
        if (!formTitle) {
          record = await pb
            .collection(Collections.Metadata)
            .update<MetadataResponse>(record.id, { title: record.id })
        }

        // Project linking is handled after this block

        galleryItems = [record, ...galleryItems]
        toast.success('Gallery item created successfully')
      }

      // Handle Project Relationship Sync (moved outside to handle both Create and Update)
      const oldProjectId = initialProject
      const newProjectId = formProject
      const galleryId = record.id

      // Only proceed if the project selection has changed
      if (oldProjectId !== newProjectId) {
        // 1. Unlink from Old Project if it existed
        if (oldProjectId) {
          try {
            const oldProject = await pb
              .collection(Collections.Projects)
              .getOne<ProjectsResponse>(oldProjectId)
            const existingDetails = oldProject.projectDetails || []
            if (existingDetails.includes(galleryId)) {
              const updatedDetails = existingDetails.filter((id) => id !== galleryId)
              await pb.collection(Collections.Projects).update(oldProjectId, {
                projectDetails: updatedDetails,
              })
            }
          } catch (err) {
            console.error('Failed to unlink from old project:', err)
          }
        }

        // 2. Link to New Project if one is selected
        if (newProjectId) {
          try {
            const newProject = await pb
              .collection(Collections.Projects)
              .getOne<ProjectsResponse>(newProjectId)
            const existingDetails = newProject.projectDetails || []
            if (!existingDetails.includes(galleryId)) {
              existingDetails.push(galleryId)
              await pb.collection(Collections.Projects).update(newProjectId, {
                projectDetails: existingDetails,
              })
            }
            toast.success('Gallery linked to project successfully')
          } catch (err) {
            console.error('Failed to link to new project:', err)
            toast.error('Gallery saved, but failed to link to project')
          }
        }
      }

      selectItem(record)
    } catch (err: any) {
      console.error('PocketBase error:', err?.response?.data || err)
      toast.error(err?.message ?? 'Save failed')
    } finally {
      formLoading = false
    }
  }

  async function deleteItem(id: string) {
    if (!confirm('Delete this gallery item? This will NOT delete the actual image attachments.'))
      return

    try {
      await pb.collection(Collections.Metadata).delete(id)
      galleryItems = galleryItems.filter((item) => item.id !== id)
      if (selectedId === id) newItem()
      toast.success('Gallery item deleted successfully')
    } catch (err: any) {
      toast.error(err?.message ?? 'Delete failed')
    }
  }
</script>

<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
  <!-- Master: list -->
  <div class="md:col-span-1">
    <div class="bg-white p-6 rounded-3xl border border-[#d4af37]/20 shadow-xl">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-bold text-slate-900">Gallery Items</h3>
        <button
          onclick={newItem}
          class="text-sm text-white bg-[#d4af37] px-3 py-1 rounded font-bold hover:bg-[#b8941f] transition-colors"
        >
          + New
        </button>
      </div>

      <div class="space-y-2 max-h-[60vh] overflow-auto">
        {#each galleryItems as item}
          <div
            class="p-3 rounded-lg cursor-pointer hover:bg-slate-50 transition-all border"
            class:bg-slate-100={selectedId === item.id}
            class:border-[#d4af37]={selectedId === item.id}
            class:border-transparent={selectedId !== item.id}
            role="button"
            tabindex="0"
            onclick={() => selectItem(item)}
            onkeydown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                selectItem(item)
              }
            }}
          >
            <div class="flex items-center gap-3">
              <div class="flex-1 min-w-0">
                <div class="font-bold text-slate-900 text-sm truncate">
                  {item.title}
                </div>
                <div class="text-xs text-slate-500">
                  {item.attachments?.length || 0} images
                </div>
              </div>
            </div>
            <button
              onclick={(e) => {
                e.stopPropagation()
                deleteItem(item.id)
              }}
              class="text-red-500 text-xs mt-2 hover:underline"
            >
              Delete
            </button>
          </div>
        {:else}
          <div class="text-center py-8 text-slate-400">
            <p class="text-sm">No gallery items yet</p>
          </div>
        {/each}
      </div>
    </div>
  </div>

  <!-- Detail: form -->
  <div class="md:col-span-2">
    <div class="bg-white p-6 rounded-3xl border border-[#d4af37]/20 shadow-xl">
      <h3 class="font-bold text-slate-900 text-lg mb-6">
        {selectedId ? 'Edit Gallery Item' : 'Create Gallery Item'}
      </h3>

      <div class="space-y-6">
        <label class="block">
          <span class="text-sm font-bold text-slate-700">Title</span>
          <input
            bind:value={formTitle}
            class="w-full mt-1 p-3 border rounded-xl focus:ring-2 focus:ring-[#d4af37]/50 outline-none"
            placeholder="Auto-generated if left empty"
          />
          <p class="text-xs text-slate-500 mt-1">Descriptive name for this gallery group</p>
        </label>

        <FileUploadTracker
          bind:this={fileTracker}
          label="Gallery Images"
          bind:attachmentIds
          maxFiles={5}
          accept="image/*"
        />

        <label class="block">
          <span class="text-sm font-bold text-slate-700">Project</span>
          <select bind:value={formProject} class="w-full mt-1 p-3 border rounded-xl">
            <option value="">Select Project</option>
            {#each projects as project}
              <option value={project.id}>{project.title}</option>
            {/each}
          </select>
        </label>

        <div class="flex gap-3 mt-8">
          <button
            onclick={saveGalleryItem}
            disabled={formLoading}
            class="bg-slate-900 text-aspada-cream px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform disabled:opacity-50 cursor-pointer"
          >
            {formLoading ? 'Saving...' : selectedId ? 'Update Gallery' : 'Create Gallery'}
          </button>

          {#if selectedId}
            <button
              onclick={() => deleteItem(selectedId!)}
              class="bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 cursor-pointer"
            >
              Delete
            </button>
          {/if}

          <button
            onclick={newItem}
            class="bg-slate-100 px-6 py-3 rounded-xl font-bold text-aspada-steel cursor-pointer hover:scale-105 transition-transform"
          >
            Clear / New
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
