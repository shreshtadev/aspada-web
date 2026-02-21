<script lang="ts">
  import pb from '$lib/pb'
  import { Collections, type ProcessesResponse } from '$types/pocketbase-types'
  import { onMount } from 'svelte'

  let { ventureId, onStepSelect, activeStepId } = $props<{
    ventureId: string
    onStepSelect: (id: string) => void
    activeStepId: string | null
  }>()

  let steps = $state<ProcessesResponse[]>([])
  let loading = $state(false)
  let containerWidth = $state(0)

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

  // ─── Tree Construction ──────────────────────────────────────────
  type TreeNode = ProcessesResponse & {
    children: TreeNode[]
    level: number
    x: number
    y: number
  }

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

    // Assign levels and positions
    const NODE_WIDTH = 180
    const NODE_HEIGHT = 80
    const GAP_X = 40
    const GAP_Y = 100

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

    // Assign X positions based on level counts
    const levelCurrentIndices: number[] = new Array(maxLevel + 1).fill(0)

    // Sort all nodes into a flat array for rendering
    const flatNodes: TreeNode[] = []

    function positionNodes(node: TreeNode) {
      const levelIdx = levelCurrentIndices[node.level]
      const totalWidthAtLevel = levelCounts[node.level] * (NODE_WIDTH + GAP_X) - GAP_X
      const startX = (containerWidth - totalWidthAtLevel) / 2

      node.x = startX + levelIdx * (NODE_WIDTH + GAP_X)
      levelCurrentIndices[node.level]++

      flatNodes.push(node)
      // Sort children by sequence
      node.children.sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
      node.children.forEach(positionNodes)
    }

    // This positioning is simplistic (doesn't handle multiple trees perfectly overlap)
    // but works for basic flowcharts.
    roots.forEach(positionNodes)

    // Filter duplicates if any (due to recursive traversal logic above)
    const seen = new Set<string>()
    return flatNodes.filter((n) => {
      if (seen.has(n.id)) return false
      seen.add(n.id)
      return true
    })
  })

  let totalHeight = $derived(nodes.length ? Math.max(...nodes.map((n) => n.y)) + 150 : 500)

  let connectors = $derived.by(() => {
    const paths: { d: string; id: string }[] = []
    const nodeMap = new Map(nodes.map((n) => [n.id, n]))

    nodes.forEach((node) => {
      node.children.forEach((child) => {
        const startX = node.x + 90 // center of 180
        const startY = node.y + 80 // bottom of 80
        const endX = child.x + 90 // center of 180
        const endY = child.y // top of node

        // Bezier curve for smoother connections
        const cp1y = startY + 40
        const cp2y = endY - 40

        const d = `M ${startX} ${startY} C ${startX} ${cp1y}, ${endX} ${cp2y}, ${endX} ${endY}`
        paths.push({ d, id: `${node.id}-${child.id}` })
      })
    })
    return paths
  })
</script>

<div
  class="relative w-full h-full min-h-[500px] overflow-auto bg-slate-50/50 rounded-xl border border-slate-100 p-8"
  bind:clientWidth={containerWidth}
>
  {#if loading}
    <div class="flex items-center justify-center h-full text-slate-400">
      <span class="animate-pulse">Generating flow view...</span>
    </div>
  {:else if steps.length === 0}
    <div class="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
      <span class="i-lucide-git-branch text-4xl opacity-20"></span>
      <div class="text-sm">No steps defined yet</div>
    </div>
  {:else}
    <div class="relative" style="width: 100%; height: {totalHeight}px;">
      <!-- SVG Connectors -->
      <svg class="absolute inset-0 pointer-events-none w-full h-full" style="z-index: 0;">
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="10"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#cbd5e1" />
          </marker>
        </defs>
        {#each connectors as { d, id }}
          <path {d} stroke="#cbd5e1" stroke-width="2" fill="none" marker-end="url(#arrowhead)" />
        {/each}
      </svg>

      <!-- Nodes -->
      {#each nodes as node (node.id)}
        <button
          type="button"
          onclick={() => onStepSelect(node.id)}
          class="absolute p-4 rounded-xl border-2 transition-all text-left shadow-sm group
            {activeStepId === node.id
            ? 'border-blue-500 bg-white shadow-md scale-105 z-20'
            : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-md z-10'}"
          style="width: 180px; height: 80px; left: {node.x}px; top: {node.y}px;"
        >
          <div class="flex flex-col justify-between h-full">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-tighter truncate">
              {node.status.replace('_', ' ')}
            </span>
            <span class="text-sm font-bold text-slate-700 leading-tight line-clamp-2">
              {node.title}
            </span>
          </div>

          <!-- Status Indicator Dot -->
          <div
            class="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full border-2 border-white
            {node.status === 'done'
              ? 'bg-green-500'
              : node.status === 'in_progress'
                ? 'bg-blue-500'
                : node.status === 'review'
                  ? 'bg-amber-500'
                  : 'bg-slate-300'}"
          ></div>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  div {
    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 transparent;
  }
</style>
