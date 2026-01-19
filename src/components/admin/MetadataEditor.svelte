<script lang="ts">
  import pb from '../../lib/pb'
  import { uploadAttachment, deleteAttachment } from '../../lib/utils'
  import toast from 'svelte-french-toast'
  import { Collections, MetadataCategoryTypeOptions } from '../../types/pocketbase-types'
  import Autocomplete from './Autocomplete.svelte'

  type Metadata = {
    id?: string
    title: string
    categoryType: string
    summary: string
    showInTiles: boolean
    attachments: string[]
    projectSlugs: string[]
    expand?: {
      attachments?: any[]
    }
    created?: string
    updated?: string
  }

  const categories = [
    { value: 'amenity', label: 'Amenity' },
    { value: 'postCategory', label: 'Post Category' },
    { value: 'tag', label: 'Tag' },
    { value: 'specification', label: 'Gallery' },
    { value: 'statsSettings', label: 'Stats Settings' },
    { value: 'contactSettings', label: 'Contact Settings' },
    { value: 'gallery', label: 'Gallery Images' },
  ]

  let { initialCategory = 'amenity' } = $props<{
    initialCategory?: string
  }>()

  let items = $state<Metadata[]>([])
  // svelte-ignore state_referenced_locally
  let selectedCategory = $state(initialCategory)
  let loading = $state(false)
  let formLoading = $state(false)
  let projects = $state<any[]>([])

  // Sync selectedCategory with initialCategory prop if it changes externally
  $effect(() => {
    selectedCategory = initialCategory
  })

  // Detail form state
  let selectedId = $state<string | null>(null)
  let formTitle = $state('')
  let formSummary = $state('')
  let formCategory = $state('amenity')
  let formShowInTiles = $state(false)
  let formFiles = $state<FileList | null>(null)
  let currentAttachments = $state<string[]>([])
  let currentAttachmentUrls = $state<{ id: string; url: string }[]>([])

  async function loadData() {
    try {
      loading = true
      projects = await pb.collection(Collections.Projects).getFullList()
      const list = await pb.collection(Collections.Metadata).getFullList({
        filter: `categoryType = '${selectedCategory}'`,
        expand: 'attachments',
      })
      items = list as unknown as Metadata[]
    } catch (err) {
      console.error('Failed to load metadata:', err)
      toast.error('Failed to load data')
    } finally {
      loading = false
    }
  }

  $effect(() => {
    loadData()
  })

  function selectItem(item: Metadata) {
    selectedId = item.id ?? null
    formTitle = item.title ?? ''
    formSummary = item.summary ?? ''
    formShowInTiles = item.showInTiles ?? false
    formCategory = item.categoryType ?? MetadataCategoryTypeOptions.amenity
    currentAttachments = item.attachments ?? []

    const attachments = item.expand?.attachments
    currentAttachmentUrls =
      attachments?.map((a) => ({
        id: a.id,
        url: pb.files.getURL(a, a.attachment),
      })) ?? []

    formFiles = null
  }

  function newItem() {
    selectedId = null
    formTitle = ''
    formSummary = ''
    formCategory = selectedCategory
    formShowInTiles = false
    currentAttachments = []
    currentAttachmentUrls = []
    formFiles = null
  }

  async function saveItem() {
    if (!formTitle) {
      toast.error('Title is required')
      return
    }

    formLoading = true
    let finalAttachments = [...currentAttachments]

    try {
      // 1. Upload new files if any
      if (formFiles && formFiles.length > 0) {
        const uploadedIds = await uploadAttachment(
          `${formCategory} - ${formTitle}`,
          Array.from(formFiles)
        )
        finalAttachments = [...finalAttachments, ...uploadedIds]
      }

      const data = {
        title: formTitle,
        summary: formSummary,
        showInTiles: formShowInTiles,
        categoryType: formCategory,
        attachments: finalAttachments,
      }

      if (selectedId) {
        const updated = await pb.collection('metadata').update(selectedId, data, {
          expand: 'attachments',
        })
        items = items.map((it) => (it.id === selectedId ? (updated as unknown as Metadata) : it))
        selectItem(updated as unknown as Metadata)
        toast.success('Updated successfully')
      } else {
        const created = await pb.collection('metadata').create(data, {
          expand: 'attachments',
        })
        items = [created as unknown as Metadata, ...items]
        selectItem(created as unknown as Metadata)
        toast.success('Created successfully')
      }
    } catch (err) {
      console.error(err)
      toast.error(err?.message || 'Failed to save')
    } finally {
      formLoading = false
    }
  }

  async function deleteItem(id?: string) {
    if (!id) return
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      // Delete attachments first if any
      const item = items.find((it) => it.id === id)
      if (item?.attachments?.length) {
        for (const attachId of item.attachments) {
          await deleteAttachment(attachId)
        }
      }

      await pb.collection('metadata').delete(id)
      items = items.filter((it) => it.id !== id)
      if (selectedId === id) newItem()
      toast.success('Deleted successfully')
    } catch (err) {
      toast.error(err?.message || 'Delete failed')
    }
  }

  async function removeAttachment(attach: { id: string }) {
    if (!confirm('Remove this attachment?')) return

    try {
      const success = await deleteAttachment(attach.id)
      if (success) {
        currentAttachments = currentAttachments.filter((id) => id !== attach.id)
        currentAttachmentUrls = currentAttachmentUrls.filter((u) => u.id !== attach.id)

        // Update the record immediately
        if (selectedId) {
          await pb.collection('metadata').update(selectedId, {
            attachments: currentAttachments,
          })
          // Update the list item too
          items = items.map((it) =>
            it.id === selectedId ? { ...it, attachments: currentAttachments } : it
          )
        }
        toast.success('Attachment removed')
      }
    } catch (err) {
      toast.error('Failed to remove attachment')
    }
  }

  function handleCategoryChange(e: Event) {
    const target = e.target as HTMLSelectElement
    selectedCategory = target.value
    newItem()
  }
</script>

<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
  <!-- Sidebar: Category Selector & List -->
  <div class="md:col-span-1 space-y-6">
    <div class="bg-white p-6 rounded-3xl border border-aspada-gold/20 shadow-xl overflow-hidden">
      <label class="block mb-6">
        <span class="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block"
          >Category Type</span
        >
        <select
          bind:value={selectedCategory}
          onchange={handleCategoryChange}
          class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-aspada-gold/50 outline-none appearance-none font-bold text-aspada-navy"
        >
          {#each categories as cat}
            <option value={cat.value}>{cat.label}</option>
          {/each}
        </select>
      </label>

      <div class="flex items-center justify-between mb-4 mt-8">
        <h3 class="font-black uppercase tracking-tighter text-aspada-navy text-xl">
          {categories.find((c) => c.value === selectedCategory)?.label}s
        </h3>
        <button
          onclick={newItem}
          class="text-xs font-black uppercase tracking-widest bg-aspada-gold text-white px-4 py-2 rounded-full hover:scale-105 transition-all shadow-lg shadow-aspada-gold/20"
        >
          + Add New
        </button>
      </div>

      <div class="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
        {#if loading && items.length === 0}
          <div class="animate-pulse space-y-3">
            {#each Array(4) as _}
              <div class="h-16 bg-slate-100 rounded-2xl w-full"></div>
            {/each}
          </div>
        {:else if items.length === 0}
          <div class="text-center py-10">
            <p class="text-slate-400 text-sm">No items found for this category.</p>
          </div>
        {:else}
          {#each items as item}
            <div
              class="group p-4 rounded-2xl cursor-pointer border transition-all duration-300 flex justify-between items-center {selectedId ===
              item.id
                ? 'border-aspada-gold bg-aspada-gold/5'
                : 'border-transparent hover:border-slate-200 hover:bg-slate-50'}"
              role="button"
              tabindex="0"
              onclick={() => selectItem(item)}
              onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && selectItem(item)}
            >
              <div class="min-w-0 flex-1">
                <div class="font-bold text-aspada-navy truncate">
                  {item.title}
                </div>
                <div class="text-[10px] uppercase tracking-widest text-slate-400 mt-1">
                  {item.attachments?.length || 0} attachments
                </div>
              </div>
              <button
                onclick={(e) => {
                  e.stopPropagation()
                  deleteItem(item.id)
                }}
                class="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-600 transition-opacity"
                title="Delete item"
              >
                <span class="i-lucide-trash-2 text-lg"></span>
              </button>
            </div>
          {/each}
        {/if}
      </div>
    </div>
  </div>

  <!-- Main Area: Form -->
  <div class="md:col-span-2">
    <div
      class="bg-white p-8 rounded-3xl border border-aspada-gold/20 shadow-xl relative overflow-hidden"
    >
      <!-- Decorative background accent -->
      <div
        class="absolute -top-10 -right-10 w-40 h-40 bg-aspada-gold/5 rounded-full blur-3xl pointer-events-none"
      ></div>

      <div class="relative z-10">
        <div class="flex items-center gap-4 mb-8">
          <div
            class="w-12 h-12 rounded-2xl bg-aspada-gold/10 flex items-center justify-center text-aspada-gold"
          >
            <span class="i-lucide-edit-3 text-2xl"></span>
          </div>
          <div>
            <h2 class="text-2xl font-black text-aspada-navy tracking-tight uppercase">
              {selectedId ? 'Edit Item' : 'Create New Item'}
            </h2>
            <p class="text-slate-400 text-sm font-medium uppercase tracking-widest">
              Managing in <span class="text-aspada-gold"
                >{formCategory === 'specification'
                  ? 'Gallery (Add project specifics)'
                  : formCategory}</span
              >
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-6">
          <label class="block">
            <span
              class="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block ml-1"
              >Title / Name</span
            >
            <input
              bind:value={formTitle}
              class="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-aspada-gold/50 outline-none transition-all font-bold text-aspada-navy"
              placeholder="Enter title..."
            />
          </label>

          {#if selectedCategory === 'specification'}
            <label class="block cursor-pointer group">
              <span
                class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 block ml-1 transition-colors group-hover:text-aspada-navy"
              >
                Show in tiles
              </span>

              <div class="relative inline-flex items-center">
                <input type="checkbox" bind:checked={formShowInTiles} class="sr-only peer" />

                <div
                  class="
      w-14 h-7 bg-slate-200 rounded-full transition-all duration-300
      peer-checked:bg-aspada-gold peer-focus:ring-4 peer-focus:ring-aspada-gold/20
      after:content-[''] after:absolute after:top-[4px] after:left-[4px]
      after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all
      peer-checked:after:translate-x-7 after:shadow-sm
    "
                ></div>

                <span class="ml-3 text-sm font-bold text-aspada-navy">
                  {formShowInTiles ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </label>
          {/if}
          <label class="block">
            <span
              class="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block ml-1"
              >Summary / Details</span
            >
            <input
              bind:value={formSummary}
              class="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-aspada-gold/50 outline-none transition-all font-medium text-slate-700"
              placeholder="Provide a brief summary or details..."
            />
          </label>

          <div class="grid md:grid-cols-2 gap-6">
            <label class="block">
              <span
                class="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block ml-1"
                >Add Attachments</span
              >
              <div class="relative group">
                <input
                  type="file"
                  multiple
                  bind:files={formFiles}
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
                    {formFiles ? `${formFiles.length} files selected` : 'Drop files here or click'}
                  </span>
                </div>
              </div>
            </label>

            {#if currentAttachmentUrls.length > 0}
              <div>
                <span
                  class="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block ml-1"
                  >Current Attachments</span
                >
                <div class="flex flex-wrap gap-2">
                  {#each currentAttachmentUrls as attach}
                    <div
                      class="group relative flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl pr-10 hover:border-aspada-gold transition-all"
                    >
                      <div
                        class="w-10 h-10 rounded-lg overflow-hidden bg-white border border-slate-100 flex items-center justify-center text-aspada-gold"
                      >
                        <span class="i-lucide-file-text"></span>
                      </div>
                      <a
                        href={attach.url}
                        target="_blank"
                        class="text-[10px] font-black uppercase tracking-widest text-aspada-navy hover:underline"
                        >View</a
                      >
                      <button
                        onclick={() => removeAttachment(attach)}
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
          </div>
        </div>

        <div class="flex items-center gap-4 mt-12 pt-8 border-t border-slate-100">
          <button
            onclick={saveItem}
            disabled={formLoading}
            class="flex-1 bg-aspada-navy text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-aspada-navy/90 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl shadow-aspada-navy/20"
          >
            {formLoading ? 'Processing...' : selectedId ? 'Sync Changes' : 'Create Record'}
          </button>

          {#if selectedId}
            <button
              onclick={() => deleteItem(selectedId)}
              class="p-4 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-colors"
              title="Delete Item"
            >
              <span class="i-lucide-trash-2 text-xl"></span>
            </button>
          {/if}

          <button
            onclick={newItem}
            class="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-colors"
          >
            Discard
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .custom-scrollbar::-webkit-scrollbar {
    width: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #e2e8f0;
    border-radius: 20px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #cbd5e1;
  }

  input:checked + div:after {
    transform: translateX(1 rem);
    /* Cubic-bezier gives it that fruity "spring" */
    transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }
</style>
