<script lang="ts">
  import pb from '$lib/pb'
  import { Collections, type ProcessesResponse } from '$types/pocketbase-types'

  let { ventureId, onStepSelect, activeStepId } = $props<{
    ventureId: string
    onStepSelect: (id: string, title: string) => void
    activeStepId: string | null
  }>()

  let steps = $state<ProcessesResponse[]>([])
  let loading = $state(false)
  let containerWidth = $state(0)

  // Interactive State
  let scale = $state(1)
  let translateX = $state(0)
  let translateY = $state(0)
  let isDragging = $state(false)
  let lastMousePos = { x: 0, y: 0 }

  // ─── Data Loading ──────────────────────────────────────────────
  async function loadAllSteps() {
    if (!ventureId) return
    loading = true
    try {
      const res = await pb.collection(Collections.Processes).getFullList<ProcessesResponse>({
        filter: `project = "${ventureId}"`,
        sort: 'sequence',
      })
      steps = res
    } catch (err) {
      console.error('Failed to load steps for flow:', err)
    } finally {
      loading = false
    }
  }

  $effect(() => {
    if (ventureId) loadAllSteps()
  })

  // ─── Pan & Zoom Logic ──────────────────────────────────────────
  function handleWheel(e: WheelEvent) {
    e.preventDefault()
    const zoomSpeed = 0.001
    const minScale = 0.5
    const maxScale = 2
    const delta = -e.deltaY
    const newScale = Math.min(Math.max(scale + delta * zoomSpeed, minScale), maxScale)
    scale = newScale
  }

  function handlePointerDown(e: PointerEvent) {
    if (e.pointerType === 'mouse' && e.button !== 0) return // Only primary
    if ((e.target as HTMLElement).closest('button')) return

    isDragging = true
    lastMousePos = { x: e.clientX, y: e.clientY }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e: PointerEvent) {
    if (!isDragging) return
    const dx = e.clientX - lastMousePos.x
    const dy = e.clientY - lastMousePos.y
    translateX += dx
    translateY += dy
    lastMousePos = { x: e.clientX, y: e.clientY }
  }

  function handlePointerUp(e: PointerEvent) {
    isDragging = false
    try {
      if ((e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) {
        ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
      }
    } catch (err) {
      // Ignore capture release errors
    }
  }

  function resetView() {
    scale = 1
    translateX = 0
    translateY = 0
  }

  // ─── Tree Construction ──────────────────────────────────────────
  type TreeNode = ProcessesResponse & {
    children: TreeNode[]
    level: number
    x: number
    y: number
  }

  const NODE_WIDTH = 220
  const NODE_HEIGHT = 100
  const GAP_X = 60
  const GAP_Y = 140

  let nodes = $derived.by(() => {
    if (!steps.length) return []

    const nodeMap = new Map<string, TreeNode>()
    steps.forEach((s) => {
      nodeMap.set(s.id, { ...s, children: [], level: 0, x: 0, y: 0 })
    })

    const roots: TreeNode[] = []
    nodeMap.forEach((node) => {
      if (node.parent && nodeMap.has(node.parent)) {
        nodeMap.get(node.parent)!.children.push(node)
      } else {
        roots.push(node)
      }
    })

    let maxLevel = 0
    const levelCounts: number[] = []

    function traverse(node: TreeNode, level: number) {
      node.level = level
      maxLevel = Math.max(maxLevel, level)
      levelCounts[level] = (levelCounts[level] || 0) + 1
      node.y = level * (NODE_HEIGHT + GAP_Y)
      node.children.forEach((child) => traverse(child, level + 1))
    }

    roots.forEach((root) => traverse(root, 0))

    const levelCurrentIndices: number[] = new Array(maxLevel + 1).fill(0)
    const flatNodes: TreeNode[] = []

    function positionNodes(node: TreeNode) {
      const levelIdx = levelCurrentIndices[node.level]
      const totalWidthAtLevel = levelCounts[node.level] * (NODE_WIDTH + GAP_X) - GAP_X
      const startX = (containerWidth - totalWidthAtLevel) / 2

      node.x = startX + levelIdx * (NODE_WIDTH + GAP_X)
      levelCurrentIndices[node.level]++

      flatNodes.push(node)
      node.children.sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
      node.children.forEach(positionNodes)
    }

    roots.forEach(positionNodes)

    // Secondary pass to better center parents over children?
    // For now, let's keep it clean.

    const seen = new Set<string>()
    return flatNodes.filter((n) => {
      if (seen.has(n.id)) return false
      seen.add(n.id)
      return true
    })
  })

  let totalHeight = $derived(nodes.length ? Math.max(...nodes.map((n) => n.y)) + 200 : 600)

  let connectors = $derived.by(() => {
    const paths: { d: string; id: string; active: boolean }[] = []
    nodes.forEach((node) => {
      node.children.forEach((child) => {
        const startX = node.x + NODE_WIDTH / 2
        const startY = node.y + NODE_HEIGHT
        const endX = child.x + NODE_WIDTH / 2
        const endY = child.y

        const cp1y = startY + GAP_Y * 0.4
        const cp2y = endY - GAP_Y * 0.4

        const isActive = activeStepId === node.id || activeStepId === child.id

        const d = `M ${startX} ${startY} C ${startX} ${cp1y}, ${endX} ${cp2y}, ${endX} ${endY}`
        paths.push({ d, id: `${node.id}-${child.id}`, active: isActive })
      })
    })
    return paths
  })

  const statusMap = {
    todo: { color: 'bg-slate-300', label: 'To Do', icon: 'i-lucide-circle' },
    in_progress: { color: 'bg-aspada-gold', label: 'In Progress', icon: 'i-lucide-clock' },
    review: { color: 'bg-amber-500', label: 'Review', icon: 'i-lucide-eye' },
    done: { color: 'bg-green-500', label: 'Completed', icon: 'i-lucide-check-circle' },
  }
</script>

<div
  class="relative w-full h-[70vh] min-h-[600px] overflow-hidden bg-slate-50/50 rounded-[3rem] border-2 border-slate-100 shadow-inner group touch-none"
  bind:clientWidth={containerWidth}
  onwheel={handleWheel}
  onpointerdown={handlePointerDown}
  onpointermove={handlePointerMove}
  onpointerup={handlePointerUp}
  onpointercancel={handlePointerUp}
  onpointerleave={handlePointerUp}
  role="presentation"
>
  <!-- UI Controls -->
  <div class="absolute top-6 left-6 z-40 flex flex-col gap-2">
    <div
      class="bg-white/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-100 shadow-xl flex flex-col gap-1"
    >
      <button
        onclick={() => (scale = Math.min(scale + 0.1, 2))}
        class="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-aspada-navy font-black transition-all active:scale-95"
        title="Zoom In"
      >
        <span class="i-lucide-plus text-lg"></span>
      </button>
      <button
        onclick={() => (scale = Math.max(scale - 0.1, 0.5))}
        class="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-aspada-navy font-black transition-all active:scale-95"
        title="Zoom Out"
      >
        <span class="i-lucide-minus text-lg"></span>
      </button>
      <div class="h-px bg-slate-100 mx-2"></div>
      <button
        onclick={resetView}
        class="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-aspada-navy font-black transition-all active:scale-95 text-xs"
        title="Reset View"
      >
        100%
      </button>
    </div>
  </div>

  <!-- Legend -->
  <div class="absolute bottom-6 left-6 z-40">
    <div
      class="bg-white/80 backdrop-blur-md px-4 py-3 rounded-[1.5rem] border border-slate-100 shadow-xl flex items-center gap-6"
    >
      {#each Object.entries(statusMap) as [key, val]}
        <div class="flex items-center gap-2">
          <div class="w-2.5 h-2.5 rounded-full {val.color}"></div>
          <span class="text-[10px] font-black uppercase tracking-widest text-slate-500"
            >{val.label}</span
          >
        </div>
      {/each}
    </div>
  </div>

  <!-- Flow Content -->
  <div
    class="absolute inset-0 transition-transform duration-75 cursor-grab active:cursor-grabbing"
    style="transform: translate({translateX}px, {translateY}px) scale({scale}); transform-origin: center;"
  >
    {#if loading}
      <div class="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
        <span class="i-lucide-loader-2 text-4xl animate-spin mb-4 text-aspada-gold"></span>
        <p class="text-[10px] font-bold uppercase tracking-[0.2em] font-mono">
          Synthesizing Architectural Map...
        </p>
      </div>
    {:else if steps.length === 0}
      <div class="absolute inset-0 flex flex-col items-center justify-center text-slate-300 gap-4">
        <div
          class="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg border border-slate-100"
        >
          <span class="i-lucide-share-2 text-4xl opacity-20"></span>
        </div>
        <p class="text-xs font-black uppercase tracking-widest text-center">
          System Offline: No Processes Detected
        </p>
      </div>
    {:else}
      <div class="relative" style="width: 100%; height: {totalHeight}px;">
        <!-- SVG Connectors -->
        <svg
          class="absolute inset-0 pointer-events-none w-full h-full overflow-visible"
          style="z-index: 0;"
        >
          <defs>
            <marker
              id="arrow-gold"
              markerWidth="10"
              markerHeight="7"
              refX="10"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#EAAA00" />
            </marker>
            <marker
              id="arrow-default"
              markerWidth="10"
              markerHeight="7"
              refX="10"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#CBD5E1" />
            </marker>
          </defs>
          {#each connectors as { d, id, active }}
            <!-- Glow background for active connections -->
            {#if active}
              <path
                {d}
                stroke="#EAAA00"
                stroke-width="8"
                stroke-opacity="0.1"
                fill="none"
                class="animate-pulse"
              />
            {/if}
            <path
              {d}
              stroke={active ? '#EAAA00' : '#E2E8F0'}
              stroke-width={active ? '4' : '3'}
              fill="none"
              marker-end="url(#{active ? 'arrow-gold' : 'arrow-default'})"
              class="transition-all duration-300"
            />
          {/each}
        </svg>

        <!-- Nodes -->
        {#each nodes as node (node.id)}
          <button
            type="button"
            onclick={() => onStepSelect(node.id, node.title)}
            class="absolute p-6 rounded-[2rem] border-4 transition-all duration-500 text-left group
              {activeStepId === node.id
              ? 'border-aspada-gold bg-white shadow-[0_20px_50px_rgba(234,170,0,0.15)] scale-110 z-20'
              : 'border-white bg-white/90 hover:border-aspada-gold/20 hover:shadow-2xl z-10'}"
            style="width: {NODE_WIDTH}px; height: {NODE_HEIGHT}px; left: {node.x}px; top: {node.y}px;"
          >
            <div class="flex flex-col justify-between h-full relative z-10">
              <div class="flex items-center justify-between">
                <span
                  class="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate"
                >
                  {statusMap[node.status]?.label || node.status}
                </span>
                <span
                  class="i-lucide-arrow-right-circle text-slate-200 group-hover:text-aspada-gold transition-colors"
                ></span>
              </div>
              <span
                class="text-sm font-black text-aspada-navy leading-tight line-clamp-2 group-hover:text-aspada-gold transition-colors"
              >
                {node.title}
              </span>
            </div>

            <!-- Absolute decorative elements -->
            <div
              class="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-transparent to-slate-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-tr-[2rem]"
            ></div>

            <!-- Status Badge -->
            <div
              class="absolute -top-3 -right-3 w-8 h-8 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center text-white text-xs transition-transform group-hover:scale-110
              {statusMap[node.status]?.color || 'bg-slate-300'}"
            >
              <span class={statusMap[node.status]?.icon || 'i-lucide-help-circle'}></span>
            </div>

            <!-- Active indicator pulse -->
            {#if activeStepId === node.id}
              <div
                class="absolute inset-0 rounded-[2rem] ring-4 ring-aspada-gold/20 animate-ping"
              ></div>
            {/if}
          </button>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Background Grid Decoration -->
  <div
    class="absolute inset-0 pointer-events-none opacity-[0.03] z-0"
    style="background-image: radial-gradient(#334155 1px, transparent 1px); background-size: 32px 32px;"
  ></div>
</div>

<style>
  div {
    user-select: none;
  }

  /* Smooth transitions for zoom but disabled for dragging to feel responsive */
  .cursor-grab:not(.active\:cursor-grabbing) {
    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
</style>
