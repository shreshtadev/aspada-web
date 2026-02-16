<script lang="ts">
  import pb from '../../lib/pb'
  import { onMount } from 'svelte'
  import { Collections, type LeadActivitiesResponse } from '../../types/pocketbase-types'
  import toast from 'svelte-french-toast'
  import { fade, slide } from 'svelte/transition'

  let activities = $state<LeadActivitiesResponse[]>([])
  let loading = $state(true)

  async function loadReminders() {
    try {
      // Get incomplete activities scheduled for today or in the past
      const now = new Date().toISOString()
      const result = await pb.collection(Collections.LeadActivities).getFullList({
        filter: `completedAt = "" && scheduledAt <= "${now}"`,
        sort: 'scheduledAt',
        expand: 'lead',
        $autoCancel: false,
      })
      activities = result
    } catch (err) {
      console.error('Failed to load reminders:', err)
    } finally {
      loading = false
    }
  }

  async function markComplete(id: string) {
    try {
      const completedAt = new Date().toISOString()
      await pb.collection(Collections.LeadActivities).update(id, { completedAt })
      activities = activities.filter((a) => a.id !== id)
      toast.success('Task completed!')
    } catch (err) {
      toast.error('Failed to update task')
    }
  }

  onMount(() => {
    loadReminders()
    // Optional: set up a subscription for real-time updates
    const unsubscribe = pb
      .collection(Collections.LeadActivities)
      .subscribe('*', ({ action, record }) => {
        if (action === 'create' || action === 'update' || action === 'delete') {
          loadReminders()
        }
      })

    return () => {
      unsubscribe.then((unsub) => unsub())
    }
  })

  function formatRelativeTime(dateStr: string) {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 60) {
      if (diffMins < 0) return `In ${Math.abs(diffMins)}m`
      return `${diffMins}m ago`
    }

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) {
      if (diffHours < 0) return `In ${Math.abs(diffHours)}h`
      return `${diffHours}h ago`
    }

    return date.toLocaleDateString()
  }

  function getIcon(type: string) {
    switch (type) {
      case 'Call':
        return 'i-lucide-phone'
      case 'Email':
        return 'i-lucide-mails'
      case 'Whatsapp':
        return 'i-lucide-message-square-text'
      case 'Site Visit':
        return 'i-lucide-locate-fixed'
      default:
        return 'i-lucide-pencil'
    }
  }

  function isOverdue(dateStr: string) {
    return new Date(dateStr) < new Date()
  }
</script>

<div class="bg-white rounded-2xl border-2 border-aspada-steel/10 overflow-hidden">
  <div class="px-6 py-4 bg-aspada-navy flex items-center justify-between">
    <div class="flex items-center gap-2">
      <span class="text-xl i-lucide-bell-ring"></span>
      <h3 class="font-bold text-white uppercase tracking-wider text-sm">Action Required</h3>
    </div>
    {#if activities.length > 0}
      <span
        class="bg-aspada-gold text-aspada-navy px-2 py-0.5 rounded-full text-xs font-black animate-pulse"
      >
        {activities.length} PENDING
      </span>
    {/if}
  </div>

  <div class="divide-y divide-aspada-steel/5 max-h-[400px] overflow-y-auto">
    {#if loading}
      <div class="p-8 text-center" in:fade>
        <div
          class="w-8 h-8 border-4 border-aspada-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"
        ></div>
        <p class="text-aspada-steel text-sm">Checking for tasks...</p>
      </div>
    {:else if activities.length === 0}
      <div class="p-12 text-center" in:fade>
        <div class="text-4xl mb-3 opacity-20">✨</div>
        <p class="text-aspada-navy font-bold">All caught up!</p>
        <p class="text-aspada-steel text-sm mt-1">No pending tasks for now.</p>
      </div>
    {:else}
      {#each activities as activity (activity.id)}
        <div class="p-4 hover:bg-aspada-silver/10 transition group" in:slide out:fade>
          <div class="flex items-start gap-4">
            <div
              class={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition shadow-sm ${isOverdue(activity.scheduledAt) ? 'bg-red-50' : 'bg-aspada-gold/10'}`}
            >
              <span class={getIcon(activity.contactType)}></span>
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2 mb-1">
                <span class="font-bold text-aspada-navy truncate">
                  {activity.expand?.lead?.fullName || 'Contact Lead'}
                </span>
                <span
                  class={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${isOverdue(activity.scheduledAt) ? 'bg-red-100 text-red-600' : 'bg-aspada-gold/20 text-aspada-navy/70'}`}
                >
                  {formatRelativeTime(activity.scheduledAt)}
                </span>
              </div>

              <p
                class="text-xs text-aspada-steel line-clamp-1 italic group-hover:line-clamp-none transition-all"
              >
                {activity.note || 'No notes added...'}
              </p>

              <div class="mt-3 flex gap-2">
                <button
                  onclick={() => markComplete(activity.id)}
                  class="flex-1 bg-aspada-gold text-aspada-navy py-1.5 rounded-lg text-xs font-bold hover:bg-aspada-gold/90 transition shadow-sm"
                >
                  Mark Done
                </button>
                {#if activity.expand?.lead?.contactNo}
                  <a
                    href={`tel:${activity.expand.lead.contactNo}`}
                    class="px-3 bg-white border border-aspada-steel/20 rounded-lg flex items-center justify-center text-sm hover:border-aspada-gold transition"
                  >
                    📞
                  </a>
                  <a
                    href={`https://wa.me/${activity.expand.lead.contactNo.replace(/\D/g, '')}`}
                    target="_blank"
                    class="px-3 bg-white border border-aspada-steel/20 rounded-lg flex items-center justify-center text-sm hover:border-aspada-gold transition text-green-600"
                  >
                    💬
                  </a>
                {/if}
              </div>
            </div>
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>

<style>
  /* Custom scrollbar for better look */
  .divide-y::-webkit-scrollbar {
    width: 4px;
  }
  .divide-y::-webkit-scrollbar-track {
    background: transparent;
  }
  .divide-y::-webkit-scrollbar-thumb {
    background: rgba(15, 23, 42, 0.1);
    border-radius: 10px;
  }
</style>
