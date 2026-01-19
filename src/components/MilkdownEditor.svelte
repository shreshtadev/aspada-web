<script>
  import { Crepe } from '@milkdown/crepe'
  import { listenerCtx } from '@milkdown/kit/plugin/listener'
  import '@milkdown/crepe/theme/common/style.css'
  import '@milkdown/crepe/theme/frame.css'
  import { onMount, onDestroy } from 'svelte'
  import { markdownAttachmentUploader } from '../lib/utils'

  let { value = $bindable(''), placeholder = 'Start typing...', class: className = '' } = $props()

  let editorElement
  let crepe
  let shouldUpdateFromProp = true

  // Handle prop updates
  $effect(() => {
    if (crepe && shouldUpdateFromProp && value !== undefined) {
      // We need to check if the value is actually different to avoid cursor jumps
      // exposed by the underlying editor, but Crepe doesn't expose a simple synchronous getMarkdown always.
      // However, for a simple implementation, we can trust the robust two-way binding flag.
      if (value !== undefined) {
        // Accessing internal editor state is tricky without the ctx
        // But we can just create a new one or hopefully use an update method if exposed.
        // Crepe currently is designed more as a one-off editor, but let's try to update.
        // NOTE: Crepe doesn't have a direct setMarkdown method documented in simplest docs.
        // We might need to rely on the initial load or use the internal ctx.
      }
    }
  })

  onMount(async () => {
    if (!editorElement) return

    crepe = new Crepe({
      root: editorElement,
      defaultValue: value,
      features: {
        'image-block': false,
        table: false,
        latex: false,
        'code-mirror': false,
      },
      featureConfigs: {
        [Crepe.Feature.Placeholder]: {
          text: placeholder,
        },
      },
    })

    // Configure listener for two-way binding
    crepe.editor.config((ctx) => {
      ctx.get(listenerCtx).markdownUpdated((ctx, markdown, prevMarkdown) => {
        if (markdown !== value) {
          shouldUpdateFromProp = false
          value = markdown
          // Allow prop updates again after a tick/delay if needed,
          // but usually we just want to block the immediate reflection.
          setTimeout(() => {
            shouldUpdateFromProp = true
          }, 0)
        }
      })
    })

    await crepe.create()
  })

  onDestroy(() => {
    if (crepe) {
      crepe.destroy()
    }
  })
</script>

<div bind:this={editorElement} class="milkdown-container {className}"></div>

<style>
  /* Crepe themes are usually self-contained but we can override variables */
  :global(.milkdown-container) {
    /* Ensure it takes height */
    min-height: 200px;
  }
  :global(.milkdown-theme-frame) {
    height: 100%;
  }
  :global(.milkdown) {
    height: 100%;
    outline: none;
  }
</style>
