<script lang="ts">
  import toast from 'svelte-french-toast'
  import pb from '../../lib/pb'
  import MilkdownEditor from '../MilkdownEditor.svelte'
  import FileUploadTracker from './FileUploadTracker.svelte'

  const authorRoles = ['property-owner', 'contractor', 'investor', 'agent', 'buyer', 'seller']

  const authorRoleOptions = authorRoles.map((role) => ({
    value: role,
    label: (role.charAt(0).toUpperCase() + role.slice(1)).replace('-', ' '),
  }))

  const findRoleLabelByValue = (value) => {
    return authorRoleOptions.find((option) => option.value === value)?.label
  }

  // Master list state
  let testimonials = $state([])
  let projects = $state([])

  // Detail form state
  let selectedId = $state(null)
  let formTitle = $state('Mr')
  let formName = $state('')
  let formContent = $state('')
  let formRating = $state(5)
  let formProject = $state('')
  let authorRole = $state('')
  let formLoading = $state(false)
  let formAttachments = $state([])
  let trackerEl = $state<ReturnType<typeof FileUploadTracker>>()

  async function loadData() {
    try {
      const [projectsList, testimonialsList] = await Promise.all([
        pb.collection('projects').getFullList({ sort: 'title' }),
        pb.collection('testimonials').getFullList({
          expand: 'project',
        }),
      ])
      projects = projectsList
      testimonials = testimonialsList
    } catch (err) {
      console.error('Failed to load data:', err)
      toast.error('Failed to load data')
    }
  }

  $effect(() => {
    loadData()
  })

  function selectTestimonial(t) {
    selectedId = t?.id ?? null
    formTitle = t?.title || 'Mr'
    formName = t?.authorName ?? t?.name ?? ''
    formContent = t?.content ?? ''
    formRating = t?.rating ?? 5
    formProject = t?.project && typeof t.project === 'object' ? t.project.id : t?.project || ''
    authorRole = t?.authorRole || ''
    formAttachments = t.attachments || []
    trackerEl?.clearFiles()
  }

  function newTestimonial() {
    selectedId = null
    formTitle = 'Mr'
    formName = ''
    formContent = ''
    formRating = 5
    formProject = ''
    authorRole = ''
    formAttachments = []
    trackerEl?.clearFiles()
  }

  async function saveTestimonial() {
    if (!formName || !formContent) {
      console.error('Name and testimonial text are required')
      toast.error('Name and testimonial text are required')
      return
    }

    formLoading = true

    const formData = new FormData()
    formData.append('title', formTitle)
    formData.append('authorName', formName)
    formData.append('content', formContent)
    formData.append('rating', String(formRating))
    formData.append('source', 'web')
    formData.append('authorRole', authorRole)

    if (formProject) {
      formData.append('project', formProject)
    }

    try {
      const newFiles = trackerEl?.getSelectedFiles() ?? []

      const fileKey = selectedId ? 'attachments+' : 'attachments'
      for (const file of newFiles) {
        formData.append(fileKey, file)
      }

      let record
      if (selectedId) {
        record = await pb.collection('testimonials').update(selectedId, formData)
        // Ensure we expand for the next select
        record = await pb.collection('testimonials').getOne(record.id, {
          expand: 'project',
        })
        testimonials = testimonials.map((t) => (t.id === record.id ? record : t))
      } else {
        record = await pb.collection('testimonials').create(formData)
        // Ensure we expand
        record = await pb.collection('testimonials').getOne(record.id, {
          expand: 'project',
        })
        testimonials = [record, ...testimonials]
      }
      trackerEl?.clearFiles()
      selectTestimonial(record)
    } catch (err) {
      console.error('PocketBase error:', err?.response?.data || err)
      toast.error(err?.message ?? 'Upload failed')
    } finally {
      formLoading = false
    }
  }

  async function removeAttachment(filename) {
    if (!selectedId) return
    if (!confirm('Permanently remove this showcase image?')) return

    formLoading = true
    try {
      const updated = await pb.collection('testimonials').update(selectedId, {
        'attachments-': [filename],
      })
      // Update local state
      testimonials = testimonials.map((t) => (t.id === updated.id ? updated : t))
      formAttachments = updated.attachments || []
    } catch (err) {
      toast.error('Failed to remove image')
    } finally {
      formLoading = false
    }
  }

  async function deleteTestimonial(id) {
    if (!confirm('Delete this testimonial?')) return
    try {
      await pb.collection('testimonials').delete(id)
      testimonials = testimonials.filter((t) => t.id !== id)
      if (selectedId === id) newTestimonial()
    } catch (err) {
      toast.error(err?.message ?? 'Delete failed')
    }
  }
</script>

<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
  <!-- Master: list -->
  <div class="md:col-span-1">
    <div class="bg-white p-6 rounded-3xl border border-[#d4af37]/20 shadow-xl">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-bold text-slate-900">Testimonials</h3>
        <button
          onclick={newTestimonial}
          class="text-sm text-white bg-[#d4af37] px-3 py-1 rounded font-bold">+ New</button
        >
      </div>

      <div class="space-y-2 max-h-[60vh] overflow-auto">
        {#each testimonials as t}
          <div
            class="p-3 rounded-lg cursor-pointer hover:bg-slate-50 transition-all"
            class:bg-slate-100={selectedId === t.id}
            role="button"
            tabindex="0"
            onclick={() => selectTestimonial(t)}
            onkeydown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                selectTestimonial(t)
              }
            }}
          >
            <div class="flex items-center gap-3">
              <div class="flex-1 min-w-0">
                <div class="font-medium text-slate-900 truncate">
                  {t.authorName}
                </div>
                <div class="text-xs text-aspada-gold">
                  {'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}
                </div>
              </div>
              <div class="text-xs text-aspada-navy/70">
                {findRoleLabelByValue(t.authorRole)}
              </div>
            </div>
            <button
              onclick={(e) => {
                e.stopPropagation()
                deleteTestimonial(t.id)
              }}
              class="text-red-500 text-xs mt-2 hover:underline">Delete</button
            >
          </div>
        {/each}
      </div>
    </div>
  </div>

  <!-- Detail: form -->
  <div class="md:col-span-2">
    <div class="bg-white p-6 rounded-3xl border border-[#d4af37]/20 shadow-xl">
      <h3 class="font-bold text-slate-900 text-lg mb-6">
        {selectedId ? 'Edit Testimonial' : 'Create Testimonial'}
      </h3>

      <div class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <label class="block sm:col-span-1">
            <span class="text-sm font-bold text-slate-700">Title</span>
            <select
              bind:value={formTitle}
              class="w-full mt-1 p-3 border rounded-xl focus:ring-2 focus:ring-[#d4af37]/50 outline-none bg-white"
            >
              <option value="Mr">Mr</option>
              <option value="Ms">Ms</option>
              <option value="Mrs">Mrs</option>
            </select>
          </label>

          <label class="block sm:col-span-3">
            <span class="text-sm font-bold text-slate-700">Client Name</span>
            <input
              bind:value={formName}
              class="w-full mt-1 p-3 border rounded-xl focus:ring-2 focus:ring-[#d4af37]/50 outline-none"
              placeholder="Enter client name"
            />
          </label>
        </div>

        <label class="block">
          <span class="text-sm font-bold text-slate-700">Client Role</span>
          <select
            bind:value={authorRole}
            class="w-full mt-1 p-3 border rounded-xl focus:ring-2 focus:ring-[#d4af37]/50 outline-none bg-white"
          >
            {#each authorRoleOptions as role}
              <option value={role.value}>{role.label}</option>
            {/each}
          </select>
        </label>

        <label class="block">
          <span class="text-sm font-bold text-slate-700">Message</span>
          {#key selectedId}
            <MilkdownEditor
              bind:value={formContent}
              class="w-full mt-1 p-3 border rounded-xl focus:ring-2 focus:ring-[#d4af37]/50 outline-none"
              placeholder="Enter message..."
            />
          {/key}
        </label>

        <div class="grid grid-cols-2 gap-4">
          <label class="block">
            <span class="text-sm font-bold text-slate-700">Rating</span>
            <select bind:value={formRating} class="w-full mt-1 p-3 border rounded-xl">
              <option value={1}>1 Star</option>
              <option value={2}>2 Stars</option>
              <option value={3}>3 Stars</option>
              <option value={4}>4 Stars</option>
              <option value={5}>5 Stars</option>
            </select>
          </label>

          <label class="block">
            <span class="text-sm font-bold text-slate-700">Assign to Project</span>
            <select bind:value={formProject} class="w-full mt-1 p-3 border rounded-xl">
              <option value="">General</option>
              {#each projects as p}
                <option value={p.id}>{p.title}</option>
              {/each}
            </select>
          </label>
        </div>

        <div class="pt-4 border-t border-slate-100">
          <FileUploadTracker
            bind:this={trackerEl}
            label={selectedId ? 'Append New Showcase Photos' : 'Showcase Gallery'}
            maxFiles={1 - (formAttachments?.length || 0)}
            accept="image/*"
          />

          {#if formAttachments.length > 0}
            <div class="mt-4 space-y-3">
              <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                Currently Live Showcases
              </span>
              <div class="grid grid-cols-3 gap-3">
                {#each testimonials.find((i) => i.id === selectedId)?.attachments || [] as filename}
                  <div class="relative group aspect-video rounded-2xl overflow-hidden shadow-sm">
                    <img
                      src={pb.files.getURL(
                        testimonials.find((i) => i.id === selectedId),
                        filename
                      )}
                      class="w-full h-full object-cover"
                      alt="Gallery"
                    />
                    <button
                      type="button"
                      aria-label="Remove attachment"
                      onclick={() => removeAttachment(filename)}
                      class="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm"
                    >
                      <span class="i-lucide-trash-2 text-xl"></span>
                    </button>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      </div>

      <div class="flex gap-3 mt-6">
        <button
          onclick={saveTestimonial}
          disabled={formLoading}
          class="bg-slate-900 text-aspada-cream px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform disabled:opacity-50 cursor-pointer"
        >
          {formLoading ? 'Saving...' : selectedId ? 'Update Testimonial' : 'Create Testimonial'}
        </button>

        {#if selectedId}
          <button
            onclick={() => deleteTestimonial(selectedId)}
            class="bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 cursor-pointer"
          >
            Delete
          </button>
        {/if}

        <button
          onclick={newTestimonial}
          class="bg-slate-100 px-6 py-3 rounded-xl font-bold text-aspada-steel cursor-pointer hover:scale-105 transition-transform"
        >
          Clear
        </button>
      </div>
    </div>
  </div>
</div>
