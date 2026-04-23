<script lang="ts">
  import Autoplay from 'embla-carousel-autoplay'
  import useEmblaCarousel from 'embla-carousel-svelte'
  import pb from '../../lib/pb'
  import type { DocumentsResponse } from '../../types/pocketbase-types'

  let {
    record,
    activeFileIndex = 0,
    onClose,
  } = $props<{
    record: DocumentsResponse
    activeFileIndex?: number
    onClose: () => void
  }>()

  let attachments = $derived(record.attachments || [])
  let emblaApi = $state<any>()

  const options = { loop: true, startIndex: activeFileIndex }
  const plugins = [
    Autoplay({
      delay: 3000,
      stopOnInteraction: false,
      playOnInit: true,
    }),
  ]

  let canScrollPrev = $state(false)
  let canScrollNext = $state(false)

  function updateButtons() {
    if (!emblaApi) return
    canScrollPrev = emblaApi.canScrollPrev()
    canScrollNext = emblaApi.canScrollNext()
  }

  function onInit(event: CustomEvent) {
    emblaApi = event.detail
    updateButtons()
    emblaApi.on('select', () => {
      updateButtons()
      currentIndex = emblaApi.selectedScrollSnap()
    })
    emblaApi.on('reInit', updateButtons)
  }

  function getFileUrl(filename: string) {
    const previewFileUrl = pb.files.getURL(record, filename)
    $inspect(`FilePath: ${filename} and PreviewFileUrl: ${previewFileUrl}`)
    return previewFileUrl
  }

  function isImage(filename: string) {
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(filename || '')
  }

  function isPDF(filename: string) {
    return /\.pdf$/i.test(filename || '')
  }

  // Derived current state from Embla if possible, or props
  let currentIndex = $state(activeFileIndex)

  $effect(() => {
    if (emblaApi) {
      emblaApi.on('select', () => {
        currentIndex = emblaApi.selectedScrollSnap()
      })
    }
  })

  let currentFile = $derived(attachments[currentIndex])
</script>

<div class="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-10">
  <!-- Backdrop -->
  <div
    class="absolute inset-0 bg-slate-900/90 backdrop-blur-md"
    onclick={onClose}
    role="presentation"
  ></div>

  <!-- Content -->
  <div
    class="relative w-full h-full max-w-6xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300"
  >
    <!-- Header -->
    <div class="flex items-center justify-between p-6 border-b border-slate-100 bg-white">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
          {#if isImage(currentFile)}
            <span class="i-lucide-image text-blue-500 text-xl"></span>
          {:else if isPDF(currentFile)}
            <span class="i-lucide-file-text text-red-500 text-xl"></span>
          {:else}
            <span class="i-lucide-file text-slate-400 text-xl"></span>
          {/if}
        </div>
        <div class="min-w-0">
          <h3 class="text-sm font-black text-aspada-navy uppercase tracking-tight truncate">
            {record.title}
          </h3>
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {#if attachments.length > 1}
              File {currentIndex + 1} of {attachments.length} — {currentFile}
            {:else}
              {currentFile}
            {/if}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button
          onclick={() => window.open(getFileUrl(currentFile), '_blank')}
          class="p-2 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-aspada-gold transition-colors flex items-center gap-2 px-4"
          title="Open in new tab"
        >
          <span class="i-lucide-external-link text-lg"></span>
          <span class="text-[10px] font-black uppercase tracking-widest hidden sm:inline"
            >Open Original</span
          >
        </button>

        <button
          onclick={onClose}
          class="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
          aria-label="Close preview"
        >
          <span class="i-lucide-x text-2xl"></span>
        </button>
      </div>
    </div>

    <!-- Viewer -->
    <div class="flex-1 bg-slate-50 relative overflow-hidden flex items-center justify-center">
      {#if attachments.length > 1 && attachments.every(isImage)}
        <!-- Multiple Images Carousel -->
        <div
          class="embla w-full h-full"
          use:useEmblaCarousel={{ options, plugins }}
          onemblaInit={onInit}
        >
          <div class="embla__container h-full flex">
            {#each attachments as file}
              <div
                class="embla__slide flex-[0_0_100%] min-w-0 h-full flex items-center justify-center p-8 sm:p-12"
              >
                <img
                  src={getFileUrl(file)}
                  alt={file}
                  class="max-w-full max-h-full object-contain rounded-2xl shadow-2xl bg-white p-2"
                />
              </div>
            {/each}
          </div>
        </div>

        <!-- Navigation Buttons -->
        {#if canScrollPrev}
          <button
            title="Navigate Left"
            onclick={() => emblaApi?.scrollPrev()}
            class="absolute left-6 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/80 backdrop-blur shadow-xl hover:bg-white transition-all text-aspada-navy hover:scale-110 active:scale-95"
          >
            <span class="i-lucide-chevron-left text-2xl"></span>
          </button>
        {/if}
        {#if canScrollNext}
          <button
            title="Navigate Right"
            onclick={() => emblaApi?.scrollNext()}
            class="absolute right-6 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/80 backdrop-blur shadow-xl hover:bg-white transition-all text-aspada-navy hover:scale-110 active:scale-95"
          >
            <span class="i-lucide-chevron-right text-2xl"></span>
          </button>
        {/if}
      {:else if isImage(currentFile)}
        <div class="p-8 sm:p-12 w-full h-full flex items-center justify-center">
          <img
            src={getFileUrl(currentFile)}
            alt={currentFile}
            class="max-w-full max-h-full object-contain rounded-2xl shadow-2xl bg-white p-2"
          />
        </div>
      {:else if isPDF(currentFile)}
        <div class="w-full h-full">
          <iframe
            src={getFileUrl(currentFile)}
            title="PDF Preview"
            class="w-full h-full border-none"
          ></iframe>
        </div>
      {:else}
        <div class="flex flex-col items-center gap-6 text-slate-400">
          <div class="relative">
            <span class="i-lucide-file-warning text-8xl opacity-10"></span>
            <span
              class="i-lucide-eye-off absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl opacity-40"
            ></span>
          </div>
          <div class="text-center">
            <p class="font-black uppercase tracking-[0.2em] text-xs text-slate-500 mb-2">
              No Preview Available
            </p>
            <p class="text-[10px] font-bold text-slate-400">
              This file type cannot be displayed in the browser.
            </p>
          </div>
          <button
            onclick={() => window.open(getFileUrl(currentFile), '_blank')}
            class="bg-aspada-navy text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-aspada-gold transition-all shadow-xl active:scale-95"
          >
            Download to View
          </button>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .embla__slide {
    flex: 0 0 100%;
    min-width: 0;
  }
</style>
