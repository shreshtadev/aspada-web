<script lang="ts">
  import pb from '../../lib/pb'
  import { uploadAttachment, deleteAttachment } from '../../lib/utils'
  import Modal from './Modal.svelte'
  import MilkdownEditor from '../MilkdownEditor.svelte'
  import Autocomplete from './Autocomplete.svelte'
  import FileUploadTracker from './FileUploadTracker.svelte'
  import toast from 'svelte-french-toast'
  import {
    Collections,
    MetadataCategoryTypeOptions,
    ProjectsCategoryOptions,
    ProjectsStatusOptions,
    type ProjectsResponse,
    type MetadataResponse,
    type SocialsResponse,
  } from '../../types/pocketbase-types'
  // Master list state
  let projects = $state([])
  let currentPage = $state(1)
  let totalPages = $state(0)
  let totalItems = $state(0)
  let perPage = $state(10)
  let loading = $state(true)

  // Options state
  let allSocials = $state<SocialsResponse[]>([])
  let allAmenities = $state<MetadataResponse[]>([])
  let allSpecs = $state<MetadataResponse[]>([])

  // Detail form state
  let selectedId = $state(null)
  let formTitle = $state('')
  let formSlug = $state('')
  let formCategory = $state(ProjectsCategoryOptions.residential)
  let formStatus = $state(ProjectsStatusOptions.ongoing)
  let formDescription = $state('')
  let formAddressLine1 = $state('')
  let formCity = $state('')
  let formState = $state('')
  let formPinCode = $state('')
  let formDistrict = $state('')
  let formSocials = $state<string[]>([]) // IDs
  let formAmenities = $state<string[]>([]) // IDs
  let formSpecs = $state<string[]>([]) // IDs
  let currentCoverIds = $state([]) // Array of current cover attachment record ID
  let currentCoverVideoIds = $state([]) // Array of current cover video attachment record ID
  let currentBrochureIds = $state([]) // Array of current brochure attachment record ID

  let specificationAttachmentIds = $state([])
  let fileUploadTracker = $state(null)

  let coverFile = $state(null)
  let coverVideoFile = $state(null)
  let brochureFile = $state(null)
  let coverFileInput = $state(null)
  let coverVideoFileInput = $state(null)
  let brochureFileInput = $state(null)
  let titleInputEl = $state(null)

  let formLoading = $state(false)

  // Modal state
  let showModal = $state(false)
  let modalType = $state('') // 'amenity', 'specification', 'social'
  let newItemTitle = $state('')
  let newItemExtra = $state('') // description for spec
  let shareUrl = $state('')
  let modalLoading = $state(false)

  // Metadata editor modal state
  let showMetadataEditor = $state(false)
  let editingMetadataId = $state<string | null>(null)
  let editingMetadataType = $state('') // 'amenity' or 'specification'
  let editingMetadata = $state<MetadataResponse | null>(null)
  let editorFormTitle = $state('')
  let editorFormSummary = $state('')
  let editorFormShowInTiles = $state(false)
  let editorFormFiles = $state<FileList | null>(null)
  let editorCurrentAttachments = $state<string[]>([])
  let editorCurrentAttachmentUrls = $state<{ id: string; url: string }[]>([])
  let editorFileUploadTracker = $state(null)
  let editorFormLoading = $state(false)

  // Fetch function
  async function loadData(page) {
    loading = true
    try {
      const [projectsRes, socialsRes, metadataRes] = await Promise.all([
        pb.collection(Collections.Projects).getList(page, perPage),
        pb.collection(Collections.Socials).getFullList({ sort: 'title' }),
        pb.collection(Collections.Metadata).getFullList({ sort: 'title' }),
      ])

      projects = projectsRes.items
      currentPage = projectsRes.page
      totalPages = projectsRes.totalPages
      totalItems = projectsRes.totalItems

      allSocials = socialsRes
      allAmenities = metadataRes.filter(
        (m) => m.categoryType === MetadataCategoryTypeOptions.amenity
      )
      allSpecs = metadataRes.filter(
        (m) => m.categoryType === MetadataCategoryTypeOptions.specification
      )
    } catch (err) {
      console.error('Failed to load data:', err)
      toast.error('Failed to load data')
    } finally {
      loading = false
    }
  }

  $effect(() => {
    loadData(currentPage)
  })

  $effect(() => {
    if (showModal && titleInputEl) {
      titleInputEl?.focus()
    }
  })

  function selectProject(p: ProjectsResponse) {
    selectedId = p.id
    formTitle = p.title
    formSlug = p.slug
    formCategory = p.category
    formStatus = p.status
    formDescription = p.description ?? ''
    formSocials = p.socials ?? []
    formAmenities = p.projectDetails
    formSpecs = p.projectDetails
    formAddressLine1 = p.addressLine1
    formCity = p.city
    formState = p.state
    formPinCode = p.pincode
    formDistrict = p.district
    // Relation IDs are strings in the 'projects' record (if not expanded)
    currentCoverIds = p?.coverImage ? [p.coverImage] : []
    currentCoverVideoIds = p?.coverVideo ? [p.coverVideo] : []
    currentBrochureIds = p?.brochure ? [p.brochure] : []

    coverFile = null
    coverVideoFile = null
    brochureFile = null
    specificationAttachmentIds = []
  }

  function newProject() {
    selectedId = null
    formTitle = ''
    formSlug = ''
    formCategory = ProjectsCategoryOptions.residential
    formStatus = ProjectsStatusOptions.upcoming
    formDescription = ''
    formAddressLine1 = ''
    formCity = ''
    formState = ''
    formPinCode = ''
    formDistrict = ''
    formSocials = []
    formAmenities = []
    formSpecs = []
    currentCoverIds = []
    currentCoverVideoIds = []
    currentBrochureIds = []
    coverFile = null
    coverVideoFile = null
    brochureFile = null
    specificationAttachmentIds = []
  }

  // Quick Add Logic
  function openModal(type) {
    modalType = type
    newItemTitle = ''
    newItemExtra = ''
    shareUrl = ''
    showModal = true
  }

  async function handleQuickAdd() {
    if (!newItemTitle) {
      toast.error('Title is required')
      return
    }
    modalLoading = true
    try {
      let collection = ''
      let payload = { title: newItemTitle, summary: newItemExtra }

      if (modalType === 'amenity') {
        collection = 'metadata'
        payload.categoryType = 'amenity'
      }
      if (modalType === 'social') {
        collection = 'socials'
        payload.shareUrl = shareUrl
        payload.shareUrlType =
          shareUrl.indexOf('instagram') > -1
            ? 'instagram'
            : shareUrl.indexOf('facebook') > -1
              ? 'facebook'
              : 'youtube'
      }
      if (modalType === 'specification') {
        collection = 'metadata'
        payload.categoryType = 'specification'

        // Upload attachments if any
        if (fileUploadTracker) {
          const selectedFiles = fileUploadTracker.getSelectedFiles()
          if (selectedFiles.length > 0) {
            const uploadedIds = await uploadAttachment(`Spec - ${newItemTitle}`, selectedFiles)
            payload.attachments = uploadedIds
          }
        }
      }

      const record = await pb.collection(collection).create(payload)

      // Refresh list and select
      if (modalType === 'amenity') {
        allAmenities = [...allAmenities, record].sort((a, b) => a.title.localeCompare(b.title))
        formAmenities = [...formAmenities, record.id]
      } else if (modalType === 'social') {
        allSocials = [...allSocials, record].sort((a, b) => a.title.localeCompare(b.title))
        formSocials = [...formSocials, record.id]
      } else if (modalType === 'specification') {
        allSpecs = [...allSpecs, record].sort((a, b) => a.title.localeCompare(b.title))
        formSpecs = [...formSpecs, record.id]

        // Clear file tracker
        if (fileUploadTracker) {
          fileUploadTracker.clearFiles()
        }
      }

      showModal = false
    } catch (err) {
      toast.error(err.message)
    } finally {
      modalLoading = false
    }
  }

  async function saveProject() {
    if (!formTitle) {
      toast.error('Title is required')
      return
    }

    formLoading = true
    const formData = new FormData()
    formData.append('title', formTitle)
    formData.append('category', formCategory)
    formData.append('status', formStatus)
    formData.append('description', formDescription)
    formData.append('addressLine1', formAddressLine1)
    formData.append('city', formCity)
    formData.append('district', formDistrict)
    formData.append('state', formState)
    formData.append('pincode', formPinCode)

    // Append relations
    for (const id of formSocials) formData.append('socials', id)
    for (const id of formAmenities) formData.append('projectDetails', id)
    for (const id of formSpecs) formData.append('projectDetails', id)

    try {
      // 1. Handle Cover Image
      if (coverFile) {
        const urls = await uploadAttachment(`Cover - ${formTitle}`, [coverFile])
        if (urls.length > 0) {
          const newId = urls[0]
          if (newId) {
            formData.append('coverImage', newId)
            // Clean up old
            const oldId = currentCoverIds[0]
            if (oldId) {
              await deleteAttachment(oldId)
            }
          }
        }
      }

      // 2. Handle Brochure
      if (brochureFile) {
        const urls = await uploadAttachment(`Brochure - ${formTitle}`, [brochureFile])
        if (urls.length > 0) {
          const newId = urls[0]
          if (newId) {
            formData.append('brochure', newId)
            // Clean up old
            const oldId = currentBrochureIds[0]
            if (oldId) {
              await deleteAttachment(oldId)
            }
          }
        }
      }

      // 3. Handle CoverVideo
      if (coverVideoFile) {
        const urls = await uploadAttachment(`CoverVideo - ${formTitle}`, [coverVideoFile])
        if (urls.length > 0) {
          const newId = urls[0]
          if (newId) {
            formData.append('coverVideo', newId)
            // Clean up old
            const oldId = currentCoverVideoIds[0]
            if (oldId) {
              await deleteAttachment(oldId)
            }
          }
        }
      }

      if (selectedId) {
        const updated = await pb.collection(Collections.Projects).update(selectedId, formData)

        // for (const id of [...formAmenities, ...formSpecs]) {
        //   const metadataRes = [...allAmenities, ...allSpecs];
        //   const foundMetadata = metadataRes.find((it) => it.id === id);
        //   const projectSlugs = foundMetadata.projectSlugs ?? [];
        //   const updateRefs = await pb
        //     .collection(Collections.Metadata)
        //     .update(id, {
        //       projectSlugs: [...projectSlugs, updated.id],
        //     });
        // }
        projects = projects.map((it) => (it.id === selectedId ? updated : it))
        selectProject(updated)
      } else {
        const created = await pb.collection(Collections.Projects).create(formData)
        // for (const id of [...formAmenities, ...formSpecs]) {
        //   const metadataRes = [...allAmenities, ...allSpecs];
        //   const foundMetadata = metadataRes.find((it) => it.id === id);
        //   const projectSlugs = foundMetadata.projectSlugs ?? [];
        //   const updateRefs = await pb
        //     .collection(Collections.Metadata)
        //     .update(id, {
        //       projectSlugs: [...projectSlugs, created.id],
        //     });
        // }
        projects = [created, ...projects]
        selectProject(created)
      }
      toast.success('Project Saved.')
    } catch (err) {
      toast.error(String(err))
      console.error(err)
    } finally {
      formLoading = false
    }
  }

  async function deleteProject(id) {
    if (!confirm('Delete this project?')) return
    try {
      const p = projects.find((it) => it.id === id)

      // Cleanup relations if they exist
      if (p.coverImage) await deleteAttachment(p.coverImage)
      if (p.coverVideo) await deleteAttachment(p.coverVideo)
      if (p.brochure) await deleteAttachment(p.brochure)

      await pb.collection(Collections.Projects).delete(id)
      projects = projects.filter((item) => item.id !== id)
      if (selectedId === id) newProject()
      toast.success('Project Deleted.')
    } catch (err) {
      toast.error(String(err))
    }
  }

  // Metadata Editor Functions
  async function openMetadataEditor(metadataId: string, type: string) {
    try {
      const metadata = (await pb.collection(Collections.Metadata).getOne(metadataId, {
        expand: 'attachments',
      })) as MetadataResponse

      editingMetadataId = metadataId
      editingMetadataType = type
      editingMetadata = metadata
      editorFormTitle = metadata.title
      editorFormSummary = metadata.summary ?? ''
      editorFormShowInTiles = metadata.showInTiles ?? false
      editorCurrentAttachments = metadata.attachments ?? []

      const attachments = (metadata as any).expand?.attachments
      editorCurrentAttachmentUrls =
        attachments?.map((a) => ({
          id: a.id,
          url: pb.files.getURL(a, a.attachment),
        })) ?? []

      editorFormFiles = null
      showMetadataEditor = true
    } catch (err) {
      console.error('Failed to open metadata editor:', err)
      toast.error('Failed to load metadata')
    }
  }

  function closeMetadataEditor() {
    showMetadataEditor = false
    editingMetadataId = null
    editingMetadataType = ''
    editingMetadata = null
    editorFormTitle = ''
    editorFormSummary = ''
    editorFormShowInTiles = false
    editorCurrentAttachments = []
    editorCurrentAttachmentUrls = []
    editorFormFiles = null
  }

  async function saveMetadata() {
    if (!editingMetadataId) return

    editorFormLoading = true
    let finalAttachments = [...editorCurrentAttachments]

    try {
      // Upload new files if any
      if (editorFormFiles && editorFormFiles.length > 0) {
        const uploadedIds = await uploadAttachment(
          `${editingMetadataType} - ${editorFormTitle}`,
          Array.from(editorFormFiles)
        )
        finalAttachments = [...finalAttachments, ...uploadedIds]
      }

      const data = {
        title: editorFormTitle,
        summary: editorFormSummary,
        showInTiles: editorFormShowInTiles,
        attachments: finalAttachments,
      }

      const updated = (await pb.collection(Collections.Metadata).update(editingMetadataId, data, {
        expand: 'attachments',
      })) as MetadataResponse

      // Update in the respective list
      if (editingMetadataType === 'amenity') {
        allAmenities = allAmenities.map((it) => (it.id === editingMetadataId ? updated : it))
      } else if (editingMetadataType === 'specification') {
        allSpecs = allSpecs.map((it) => (it.id === editingMetadataId ? updated : it))
      }

      toast.success('Metadata updated successfully')
      closeMetadataEditor()
    } catch (err) {
      console.error(err)
      toast.error((err as any)?.message || 'Failed to save')
    } finally {
      editorFormLoading = false
    }
  }

  async function removeEditorAttachment(attachId: string) {
    if (!confirm('Remove this attachment?')) return

    try {
      const success = await deleteAttachment(attachId)
      if (success) {
        editorCurrentAttachments = editorCurrentAttachments.filter((id) => id !== attachId)
        editorCurrentAttachmentUrls = editorCurrentAttachmentUrls.filter((u) => u.id !== attachId)

        // Update the record immediately
        if (editingMetadataId) {
          await pb.collection(Collections.Metadata).update(editingMetadataId, {
            attachments: editorCurrentAttachments,
          })
        }
        toast.success('Attachment removed')
      }
    } catch (err) {
      toast.error('Failed to remove attachment')
    }
  }
</script>

<div class="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-100px)]">
  <!-- Master: list -->
  <div
    class="md:col-span-1 flex flex-col h-full bg-white rounded-3xl border border-aspada-navy/20 shadow-xl overflow-hidden"
  >
    <div class="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
      <h3 class="font-bold text-aspada-navy text-xl">Projects</h3>
      <button
        onclick={newProject}
        class="text-sm text-white bg-aspada-navy px-4 py-2 rounded-lg font-bold hover:bg-aspada-navy/80 transition-colors"
        >+ New Project</button
      >
    </div>

    <div class="flex-1 overflow-y-auto p-4 space-y-3">
      {#if loading}
        <div class="text-center py-10 text-slate-400">Loading projects...</div>
      {:else if projects.length === 0}
        <div class="text-center py-10 text-slate-400">No projects found.</div>
      {:else}
        {#each projects as p}
          <div
            class="group p-4 rounded-2xl cursor-pointer border border-transparent hover:border-aspada-gold/30 hover:bg-slate-50 transition-all relative"
            class:bg-slate-100={selectedId === p.id}
            class:border-l-4={selectedId === p.id}
            class:border-l-aspada-gold={selectedId === p.id}
            role="button"
            tabindex="0"
            onclick={() => selectProject(p)}
            onkeydown={(e) => e.key === 'Enter' && selectProject(p)}
          >
            <div class="flex justify-between items-start">
              <div>
                <div
                  class="font-bold text-slate-900 group-hover:text-aspada-gold transition-colors"
                >
                  {p.title}
                </div>
                <div class="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">
                  {p.category} • {p.status}
                </div>
              </div>
            </div>

            <button
              aria-label="Delete Project"
              onclick={(e) => {
                e.stopPropagation()
                deleteProject(p.id)
              }}
              class="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors cursor-pointer"
            >
              <span class="i-lucide-trash-2 text-2xl text-aspada-steel"></span>
            </button>
          </div>
        {/each}
      {/if}
    </div>

    <!-- Pagination Footer -->
    <div class="p-4 border-t border-gray-100 bg-slate-50 shrink-0 flex justify-center gap-2">
      <button
        onclick={() => loadData(currentPage - 1)}
        disabled={currentPage === 1 || loading}
        class="px-3 py-1 text-sm border bg-white rounded-lg disabled:opacity-50 hover:bg-gray-50"
      >
        Previous
      </button>
      <span class="text-sm flex items-center px-2 text-slate-500"
        >Page {currentPage} of {totalPages}</span
      >
      <button
        onclick={() => loadData(currentPage + 1)}
        disabled={currentPage === totalPages || loading}
        class="px-3 py-1 text-sm border bg-white rounded-lg disabled:opacity-50 hover:bg-gray-50"
      >
        Next
      </button>
    </div>
  </div>

  <!-- Detail: form -->
  <div
    class="md:col-span-2 h-full overflow-y-auto bg-white rounded-3xl border border-aspada-gold/20 shadow-xl p-8"
  >
    <div class="flex items-center justify-between mb-8">
      <h3 class="font-bold text-slate-900 text-2xl">
        {selectedId ? 'Edit Project' : 'Create New Project'}
      </h3>
      {#if selectedId}
        <div class="bg-slate-100 text-xs px-3 py-1 rounded-full text-slate-500 font-mono">
          ID: {selectedId}
        </div>
      {/if}
    </div>

    <div class="space-y-6 max-w-4xl">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <label class="block">
          <span class="text-sm font-bold text-slate-700 mb-1 block">Project Title</span>
          <input
            bind:value={formTitle}
            class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-aspada-gold focus:bg-white outline-none transition-all"
            placeholder="e.g. The Grand Residence"
          />
        </label>

        <label class="block">
          <span class="text-sm font-bold text-slate-700 mb-1 block">Slug (Auto-generated)</span>
          <input
            readonly
            bind:value={formSlug}
            class="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
            placeholder="project-slug"
          />
        </label>
      </div>
      <div class="grid grid-cols-1 gap-8">
        <label class="block">
          <span class="text-sm font-bold text-slate-700 mb-1 block">Address Line 1</span>
          <input
            bind:value={formAddressLine1}
            class="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-aspada-gold/50 outline-none transition-all font-bold text-aspada-navy"
            placeholder="e.g. 123 Main St"
          />
        </label>
      </div>
      <div class="grid grid-cols-2 gap-6">
        <label class="block">
          <span class="text-sm font-bold text-slate-700 mb-1 block">City</span>
          <input
            bind:value={formCity}
            class="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-aspada-gold/50 outline-none transition-all font-bold text-aspada-navy"
            placeholder="e.g. Shivamogga"
          />
        </label>
        <label class="block">
          <span class="text-sm font-bold text-slate-700 mb-1 block">District</span>
          <input
            bind:value={formDistrict}
            class="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-aspada-gold/50 outline-none transition-all font-bold text-aspada-navy"
            placeholder="e.g. Shivamogga"
          />
        </label>
        <label class="block">
          <span class="text-sm font-bold text-slate-700 mb-1 block">State</span>
          <input
            bind:value={formState}
            class="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-aspada-gold/50 outline-none transition-all font-bold text-aspada-navy"
            placeholder="e.g. Karnataka"
          />
        </label>
        <label class="block">
          <span class="text-sm font-bold text-slate-700 mb-1 block">Pin Code</span>
          <input
            bind:value={formPinCode}
            class="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-aspada-gold/50 outline-none transition-all font-bold text-aspada-navy"
            placeholder="e.g. 577201"
          />
        </label>
      </div>

      <div class="grid grid-cols-2 gap-6">
        <label class="block">
          <span class="text-sm font-bold text-slate-700 mb-1 block">Category</span>
          <select
            bind:value={formCategory}
            class="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-aspada-gold/50 outline-none transition-all font-bold text-aspada-navy"
          >
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
            <option value="plots">Plots</option>
          </select>
        </label>

        <label class="block">
          <span class="text-sm font-bold text-slate-700 mb-1 block">Status</span>
          <select
            bind:value={formStatus}
            class="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-aspada-gold/50 outline-none transition-all font-bold text-aspada-navy"
          >
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
          </select>
        </label>
      </div>

      <label class="block">
        <span class="text-sm font-bold text-slate-700 mb-1 block">Description</span>
        <div class="prose max-w-none">
          {#key selectedId}
            <MilkdownEditor
              bind:value={formDescription}
              class="w-full min-h-[150px] p-4 bg-slate-50 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-aspada-gold focus-within:bg-white transition-all"
              placeholder="Describe the project..."
            />
          {/key}
        </div>
      </label>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
        <Autocomplete
          label="Amenities"
          placeholder="Select amenities..."
          options={allAmenities}
          bind:selected={formAmenities}
          allowCreate={true}
          oncreate={() => openModal('amenity')}
          onedit={(id: string) => openMetadataEditor(id, 'amenity')}
        />

        <Autocomplete
          label="Specifications"
          placeholder="Select specifications..."
          options={allSpecs}
          bind:selected={formSpecs}
          allowCreate={true}
          oncreate={() => openModal('specification')}
          onedit={(id: string) => openMetadataEditor(id, 'specification')}
        />
      </div>

      <div class="pt-2">
        <Autocomplete
          label="Social Links"
          placeholder="Select social links..."
          options={allSocials}
          bind:selected={formSocials}
          allowCreate={true}
          oncreate={() => openModal('social')}
        />
      </div>

      {#key selectedId}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
          <FileUploadTracker
            label="Cover Image"
            accept="image/*"
            maxFiles={1}
            onFileSelect={(files) => (coverFile = files[0])}
            bind:attachmentIds={currentCoverIds}
          />

          <FileUploadTracker
            label="Cover Video"
            accept="video/*"
            maxFiles={1}
            onFileSelect={(files) => (coverVideoFile = files[0])}
            bind:attachmentIds={currentCoverVideoIds}
          />

          <div class="md:col-span-2">
            <FileUploadTracker
              label="Brochure (PDF)"
              accept=".pdf"
              maxFiles={1}
              onFileSelect={(files) => (brochureFile = files[0])}
              bind:attachmentIds={currentBrochureIds}
            />
          </div>
        </div>
      {/key}
    </div>

    <div class="flex gap-4 mt-8 pt-6 border-t border-slate-100">
      <button
        onclick={saveProject}
        disabled={formLoading}
        class="flex-1 bg-aspada-navy/90 text-aspada-silver px-8 py-4 rounded-xl font-bold hover:shadow-lg hover:-translate-y-1 transition-all disabled:opacity-50 text-lg cursor-pointer"
      >
        {formLoading ? 'Saving...' : selectedId ? 'Update Project' : 'Create Project'}
      </button>

      {#if selectedId}
        <button
          onclick={() => deleteProject(selectedId)}
          class="px-6 py-4 text-red-500 hover:bg-red-50 rounded-xl font-bold transition-colors cursor-pointer"
        >
          Delete
        </button>
      {/if}

      <button
        onclick={newProject}
        class="px-6 py-4 text-slate-500 hover:bg-slate-50 rounded-xl font-bold transition-colors cursor-pointer"
      >
        Reset
      </button>
    </div>
  </div>
</div>

<Modal
  show={showModal}
  title={`Add New ${
    modalType === 'amenity' ? 'Amenity' : modalType === 'specification' ? 'Specification' : 'Social'
  }`}
  onClose={() => (showModal = false)}
>
  <div class="space-y-4">
    <label class="block">
      <span class="text-sm font-bold text-slate-700">Title <span class="text-red-500">*</span></span
      >
      <input
        bind:this={titleInputEl}
        bind:value={newItemTitle}
        class="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-aspada-gold/50 outline-none transition-all font-bold text-aspada-navy"
        placeholder="Enter title"
      />
    </label>

    {#if modalType === 'social'}
      <label class="block">
        <span class="text-sm font-bold text-slate-700">Share URL</span>
        <input
          type="url"
          bind:value={shareUrl}
          class="w-full mt-1 p-3 border rounded-xl focus:ring-2 focus:ring-aspada-gold/50 outline-none"
          placeholder="Enter share URL"
        />
      </label>
    {/if}
    {#if modalType !== 'social'}
      <label class="block">
        <span class="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block ml-1"
          >Summary / Details</span
        >
        <input
          bind:value={newItemExtra}
          class="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-aspada-gold/50 outline-none transition-all font-bold text-aspada-navy"
          placeholder="Enter summary or details..."
        />
      </label>
    {/if}

    {#if modalType === 'amenity'}
      <FileUploadTracker
        bind:this={fileUploadTracker}
        label="Icon (Optional)"
        bind:attachmentIds={specificationAttachmentIds}
        maxFiles={1}
        accept="image/*"
      />
    {/if}

    {#if modalType === 'specification'}
      <FileUploadTracker
        bind:this={fileUploadTracker}
        label="Attachments (Optional)"
        bind:attachmentIds={specificationAttachmentIds}
        maxFiles={3}
        accept="image/*"
      />
    {/if}

    <div class="flex justify-end gap-2 mt-6">
      <button
        onclick={() => (showModal = false)}
        class="px-4 py-2 rounded-lg hover:bg-slate-100 text-slate-600 font-medium"
      >
        Cancel
      </button>
      <button
        onclick={handleQuickAdd}
        disabled={modalLoading}
        class="px-6 py-2 bg-aspada-gold text-white rounded-lg font-bold hover:brightness-110 disabled:opacity-50"
      >
        {modalLoading ? 'Creating...' : 'Create'}
      </button>
    </div>
  </div>
</Modal>

<!-- Metadata Editor Modal -->
<Modal
  show={showMetadataEditor}
  title={`Edit ${editingMetadataType === 'amenity' ? 'Amenity' : 'Specification'}`}
  onClose={closeMetadataEditor}
>
  <div class="space-y-4 max-w-2xl">
    <label class="block">
      <span class="text-sm font-bold text-slate-700">Title</span>
      <input
        bind:value={editorFormTitle}
        class="w-full mt-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-aspada-gold/50 outline-none transition-all font-bold text-aspada-navy"
        placeholder="Enter title..."
      />
    </label>

    <label class="block">
      <span class="text-sm font-bold text-slate-700">Summary / Details</span>
      <textarea
        bind:value={editorFormSummary}
        class="w-full mt-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-aspada-gold/50 outline-none transition-all font-medium text-slate-700"
        placeholder="Enter summary or details..."
        rows="3"
      ></textarea>
    </label>

    {#if editingMetadataType === 'specification'}
      <label class="block cursor-pointer group">
        <span class="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block"
          >Show in tiles</span
        >
        <div class="relative inline-flex items-center">
          <input type="checkbox" bind:checked={editorFormShowInTiles} class="sr-only peer" />
          <div
            class="w-14 h-7 bg-slate-200 rounded-full transition-all duration-300 peer-checked:bg-aspada-gold peer-focus:ring-4 peer-focus:ring-aspada-gold/20 after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-7 after:shadow-sm"
          ></div>
          <span class="ml-3 text-sm font-bold text-aspada-navy">
            {editorFormShowInTiles ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </label>
    {/if}

    <label class="block">
      <span class="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block"
        >Add Attachments</span
      >
      <div class="relative group">
        <input
          type="file"
          multiple
          bind:files={editorFormFiles}
          class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
        />
        <div
          class="w-full p-4 bg-slate-50 border-2 border-dashed border-slate-200 group-hover:border-aspada-gold rounded-2xl transition-all flex items-center gap-3"
        >
          <div
            class="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 group-hover:text-aspada-gold shadow-sm"
          >
            <span class="i-lucide-upload-cloud"></span>
          </div>
          <span class="text-sm font-bold text-slate-500 truncate">
            {editorFormFiles
              ? `${editorFormFiles.length} files selected`
              : 'Drop files here or click'}
          </span>
        </div>
      </div>
    </label>

    {#if editorCurrentAttachmentUrls.length > 0}
      <div>
        <span class="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block"
          >Current Attachments</span
        >
        <div class="flex flex-wrap gap-2">
          {#each editorCurrentAttachmentUrls as attach}
            <div
              class="group relative flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl pr-10 hover:border-aspada-gold transition-all"
            >
              <div
                class="w-10 h-10 rounded-lg overflow-hidden bg-white border border-slate-100 flex items-center justify-center text-aspada-gold"
              >
                <span class="i-lucide-file-text"></span>
              </div>
              <a href={attach.url} target="_blank" class="text-xs font-bold text-aspada-navy"
                >View</a
              >
              <button
                onclick={() => removeEditorAttachment(attach.id)}
                class="absolute right-2 p-1.5 text-red-400 hover:text-red-600"
                title="Remove"
              >
                <span class="i-lucide-x text-sm"></span>
              </button>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <div class="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
      <button
        onclick={closeMetadataEditor}
        class="px-4 py-2 rounded-lg hover:bg-slate-100 text-slate-600 font-medium"
      >
        Cancel
      </button>
      <button
        onclick={saveMetadata}
        disabled={editorFormLoading}
        class="px-6 py-2 bg-aspada-navy text-white rounded-lg font-bold hover:bg-aspada-navy/90 disabled:opacity-50 transition-all"
      >
        {editorFormLoading ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  </div>
</Modal>
