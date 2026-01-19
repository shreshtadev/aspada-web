<script lang="ts">
  import pb from '../../../lib/pb'
  import toast from 'svelte-french-toast'
  import {
    Collections,
    type LeadsResponse,
    type AgentsResponse,
    type LeadActivitiesResponse,
    LeadsStatusOptions,
    LeadsSourceOptions,
    LeadActivitiesContactTypeOptions,
    AgentsRoleOptions,
  } from '../../../types/pocketbase-types'

  type TabType = 'leads' | 'agents' | 'activities'

  let activeTab = $state<TabType>('leads')
  let loading = $state(false)
  let formLoading = $state(false)

  // Leads state
  let leads = $state<LeadsResponse[]>([])
  let selectedLead = $state<LeadsResponse | null>(null)
  let leadForm = $state({
    id: '',
    fullName: '',
    contactEmail: '',
    contactNo: '',
    budgetMin: 0,
    budgetMax: 0,
    interest: '',
    preferredLocation: '',
    source: LeadsSourceOptions.website,
    status: LeadsStatusOptions.New,
    assignedAgent: '',
  })

  // Agents state
  let agents = $state<AgentsResponse[]>([])
  let selectedAgent = $state<AgentsResponse | null>(null)
  let agentForm = $state({
    id: '',
    displayName: '',
    contactPhone: '',
    role: AgentsRoleOptions.Agent,
    isActive: true,
    staffUser: '',
  })

  // Lead Activities state
  let activities = $state<LeadActivitiesResponse[]>([])
  let selectedActivity = $state<LeadActivitiesResponse | null>(null)
  let activityForm = $state({
    id: '',
    lead: '',
    contactType: LeadActivitiesContactTypeOptions.Call,
    note: '',
    scheduledAt: '',
    completedAt: '',
    createdBy: '',
  })
  // Load data based on active tab
  async function loadData(reqSeq: number = 0) {
    loading = true
    const seq = ++reqSeq
    try {
      if (activeTab === 'leads') {
        const result = await pb.collection(Collections.Leads).getFullList({
          sort: '-created',
          expand: 'assignedAgent',
          $autoCancel: false,
        })

        if (seq === reqSeq) {
          leads = result
        }
      } else if (activeTab === 'agents') {
        const result = await pb.collection(Collections.Agents).getFullList({
          sort: '-created',
          $autoCancel: false,
        })
        if (seq === reqSeq) {
          agents = result
        }
      } else if (activeTab === 'activities') {
        const result = await pb.collection(Collections.LeadActivities).getFullList({
          sort: '-created',
          expand: 'lead,createdBy',
          $autoCancel: false,
        })
        if (seq === reqSeq) {
          activities = result
        }
      }
    } catch (err) {
      if (err?.isAbort) return
      console.error('Failed to load data:', err)
      toast.error('Failed to load data')
    } finally {
      if (seq === reqSeq) {
        loading = false
      }
    }
  }

  // Load data when tab changes with proper cleanup
  $effect(() => {
    activeTab
    loadData()
  })

  // ==================== LEADS CRUD ====================
  function selectLead(lead: LeadsResponse) {
    selectedLead = lead
    leadForm = {
      id: lead.id,
      fullName: lead.fullName || '',
      contactEmail: lead.contactEmail || '',
      contactNo: lead.contactNo || '',
      budgetMin: lead.budgetMin || 0,
      budgetMax: lead.budgetMax || 0,
      interest: lead.interest || '',
      preferredLocation: lead.preferredLocation || '',
      source: lead.source || LeadsSourceOptions.website,
      status: lead.status || LeadsStatusOptions.New,
      assignedAgent: lead.assignedAgent || '',
    }
  }

  function newLead() {
    selectedLead = null
    leadForm = {
      id: '',
      fullName: '',
      contactEmail: '',
      contactNo: '',
      budgetMin: 0,
      budgetMax: 0,
      interest: '',
      preferredLocation: '',
      source: LeadsSourceOptions.website,
      status: LeadsStatusOptions.New,
      assignedAgent: '',
    }
  }

  async function saveLead() {
    if (!leadForm.fullName) {
      toast.error('Full name is required')
      return
    }

    formLoading = true
    try {
      const data = {
        fullName: leadForm.fullName,
        contactEmail: leadForm.contactEmail,
        contactNo: leadForm.contactNo,
        budgetMin: leadForm.budgetMin,
        budgetMax: leadForm.budgetMax,
        interest: leadForm.interest,
        preferredLocation: leadForm.preferredLocation,
        source: leadForm.source,
        status: leadForm.status,
        assignedAgent: leadForm.assignedAgent || undefined,
      }

      if (leadForm.id) {
        const updated = await pb
          .collection(Collections.Leads)
          .update(leadForm.id, data, { expand: 'assignedAgent' })
        leads = leads.map((l) => (l.id === leadForm.id ? updated : l))
        selectedLead = updated
        toast.success('Lead updated successfully')
      } else {
        const created = await pb
          .collection(Collections.Leads)
          .create(data, { expand: 'assignedAgent' })
        leads = [created, ...leads]
        selectedLead = created
        leadForm.id = created.id
        toast.success('Lead created successfully')
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err?.message || 'Failed to save lead')
    } finally {
      formLoading = false
    }
  }

  async function deleteLead(id: string) {
    if (!confirm('Are you sure you want to delete this lead?')) return

    try {
      await pb.collection(Collections.Leads).delete(id)
      leads = leads.filter((l) => l.id !== id)
      if (selectedLead?.id === id) newLead()
      toast.success('Lead deleted successfully')
    } catch (err: any) {
      toast.error(err?.message || 'Delete failed')
    }
  }

  // ==================== AGENTS CRUD ====================
  function selectAgent(agent: AgentsResponse) {
    selectedAgent = agent
    agentForm = {
      id: agent.id,
      displayName: agent.displayName || '',
      contactPhone: agent.contactPhone || '',
      role: agent.role || AgentsRoleOptions.Agent,
      isActive: agent.isActive ?? true,
      staffUser: agent.staffUser || '',
    }
  }

  function newAgent() {
    selectedAgent = null
    agentForm = {
      id: '',
      displayName: '',
      contactPhone: '',
      role: AgentsRoleOptions.Agent,
      isActive: true,
      staffUser: '',
    }
  }

  async function saveAgent() {
    if (!agentForm.contactPhone) {
      toast.error('Contact phone is required')
      return
    }

    formLoading = true
    try {
      const data = {
        displayName: agentForm.displayName,
        contactPhone: agentForm.contactPhone,
        role: agentForm.role,
        isActive: agentForm.isActive,
        staffUser: agentForm.staffUser || undefined,
      }

      if (agentForm.id) {
        const updated = await pb.collection(Collections.Agents).update(agentForm.id, data)
        agents = agents.map((a) => (a.id === agentForm.id ? updated : a))
        selectedAgent = updated
        toast.success('Agent updated successfully')
      } else {
        const created = await pb.collection(Collections.Agents).create(data)
        agents = [created, ...agents]
        selectedAgent = created
        agentForm.id = created.id
        toast.success('Agent created successfully')
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err?.message || 'Failed to save agent')
    } finally {
      formLoading = false
    }
  }

  async function deleteAgent(id: string) {
    if (!confirm('Are you sure you want to delete this agent?')) return

    try {
      await pb.collection(Collections.Agents).delete(id)
      agents = agents.filter((a) => a.id !== id)
      if (selectedAgent?.id === id) newAgent()
      toast.success('Agent deleted successfully')
    } catch (err: any) {
      toast.error(err?.message || 'Delete failed')
    }
  }

  // ==================== ACTIVITIES CRUD ====================
  function selectActivity(activity: LeadActivitiesResponse) {
    selectedActivity = activity
    activityForm = {
      id: activity.id,
      lead: activity.lead || '',
      contactType: activity.contactType || LeadActivitiesContactTypeOptions.Call,
      note: activity.note || '',
      scheduledAt: activity.scheduledAt || '',
      completedAt: activity.completedAt || '',
      createdBy: activity.createdBy || '',
    }
  }

  function newActivity() {
    selectedActivity = null
    activityForm = {
      id: '',
      lead: '',
      contactType: LeadActivitiesContactTypeOptions.Call,
      note: '',
      scheduledAt: '',
      completedAt: '',
      createdBy: '',
    }
  }

  async function saveActivity() {
    if (!activityForm.lead) {
      toast.error('Lead is required')
      return
    }

    formLoading = true
    try {
      if (activityForm.scheduledAt !== undefined) {
        activityForm.scheduledAt = new Date(activityForm.scheduledAt)
          .toISOString()
          .replace('T', ' ')
      }
      if (activityForm.completedAt !== undefined) {
        activityForm.completedAt = new Date(activityForm.completedAt)
          .toISOString()
          .replace('T', ' ')
      }
      const data = {
        lead: activityForm.lead,
        contactType: activityForm.contactType,
        note: activityForm.note,
        scheduledAt: activityForm.scheduledAt || undefined,
        completedAt: activityForm.completedAt || undefined,
        createdBy: activityForm.createdBy || undefined,
      }

      if (activityForm.id) {
        const updated = await pb
          .collection(Collections.LeadActivities)
          .update(activityForm.id, data, { expand: 'lead,createdBy' })
        activities = activities.map((a) => (a.id === activityForm.id ? updated : a))
        selectedActivity = updated
        toast.success('Activity updated successfully')
      } else {
        const created = await pb
          .collection(Collections.LeadActivities)
          .create(data, { expand: 'lead,createdBy' })
        activities = [created, ...activities]
        selectedActivity = created
        activityForm.id = created.id
        toast.success('Activity created successfully')
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err?.message || 'Failed to save activity')
    } finally {
      formLoading = false
    }
  }

  async function deleteActivity(id: string) {
    if (!confirm('Are you sure you want to delete this activity?')) return

    try {
      await pb.collection(Collections.LeadActivities).delete(id)
      activities = activities.filter((a) => a.id !== id)
      if (selectedActivity?.id === id) newActivity()
      toast.success('Activity deleted successfully')
    } catch (err: any) {
      toast.error(err?.message || 'Delete failed')
    }
  }

  // Load agents for dropdown in lead form
  let agentsForDropdown = $state<AgentsResponse[]>([])
  async function loadAgentsForDropdown() {
    try {
      agentsForDropdown = await pb.collection(Collections.Agents).getFullList({
        filter: 'isActive = true',
      })
    } catch (err) {
      console.error('Failed to load agents:', err)
    }
  }

  // Load leads for dropdown in activity form
  let leadsForDropdown = $state<LeadsResponse[]>([])
  async function loadLeadsForDropdown() {
    try {
      leadsForDropdown = await pb.collection(Collections.Leads).getFullList({
        sort: '-created',
      })
    } catch (err) {
      console.error('Failed to load leads:', err)
    }
  }

  $effect(() => {
    loadAgentsForDropdown()
    loadLeadsForDropdown()
  })
</script>

<div class="flex flex-col h-full bg-aspada-silver/5 rounded-3xl">
  <!-- Tabs -->
  <div class="border-b border-aspada-steel/20">
    <nav class="flex gap-4 px-6 pt-6">
      <button
        class={`px-6 py-3 font-bold rounded-t-xl transition ${
          activeTab === 'leads'
            ? 'bg-white text-aspada-navy border-b-4 border-aspada-gold'
            : 'text-aspada-steel hover:text-aspada-navy'
        }`}
        onclick={() => (activeTab = 'leads')}
      >
        Leads
      </button>
      <button
        class={`px-6 py-3 font-bold rounded-t-xl transition ${
          activeTab === 'agents'
            ? 'bg-white text-aspada-navy border-b-4 border-aspada-gold'
            : 'text-aspada-steel hover:text-aspada-navy'
        }`}
        onclick={() => (activeTab = 'agents')}
      >
        Agents
      </button>
      <button
        class={`px-6 py-3 font-bold rounded-t-xl transition ${
          activeTab === 'activities'
            ? 'bg-white text-aspada-navy border-b-4 border-aspada-gold'
            : 'text-aspada-steel hover:text-aspada-navy'
        }`}
        onclick={() => (activeTab = 'activities')}
      >
        Activities
      </button>
    </nav>
  </div>

  <!-- Content -->
  <div class="flex flex-1 overflow-hidden bg-white">
    <!-- List Panel -->
    <div class="w-1/3 border-r border-aspada-steel/20 overflow-y-auto p-6">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-xl font-bold text-aspada-navy">
          {activeTab === 'leads' ? 'Leads' : activeTab === 'agents' ? 'Agents' : 'Activities'}
        </h3>
        <button
          class="px-4 py-2 bg-aspada-gold text-aspada-navy font-bold rounded-lg hover:bg-aspada-gold/90 transition"
          onclick={() => {
            if (activeTab === 'leads') newLead()
            else if (activeTab === 'agents') newAgent()
            else newActivity()
          }}
        >
          + New
        </button>
      </div>

      {#if loading}
        <div class="flex items-center justify-center py-12">
          <div
            class="w-8 h-8 border-4 border-aspada-gold border-t-transparent rounded-full animate-spin"
          ></div>
        </div>
      {:else if activeTab === 'leads'}
        <div class="space-y-3">
          {#each leads as lead}
            <button
              class={`w-full text-left p-4 rounded-xl border-2 transition ${
                selectedLead?.id === lead.id
                  ? 'border-aspada-gold bg-aspada-gold/10'
                  : 'border-aspada-steel/20 hover:border-aspada-steel/40'
              }`}
              onclick={() => selectLead(lead)}
            >
              <div class="font-bold text-aspada-navy">{lead.fullName}</div>
              <div class="text-sm text-aspada-steel mt-1">
                {lead.contactEmail || lead.contactNo}
              </div>
              <div class="text-xs text-aspada-steel/70 mt-1">
                Status: {lead.status}
              </div>
            </button>
          {/each}
          {#if leads.length === 0}
            <p class="text-aspada-steel/50 text-center py-8">No leads found</p>
          {/if}
        </div>
      {:else if activeTab === 'agents'}
        <div class="space-y-3">
          {#each agents as agent}
            <button
              class={`w-full text-left p-4 rounded-xl border-2 transition ${
                selectedAgent?.id === agent.id
                  ? 'border-aspada-gold bg-aspada-gold/10'
                  : 'border-aspada-steel/20 hover:border-aspada-steel/40'
              }`}
              onclick={() => selectAgent(agent)}
            >
              <div class="font-bold text-aspada-navy">
                {agent.displayName || 'Unnamed Agent'}
              </div>
              <div class="text-sm text-aspada-steel mt-1">
                {agent.contactPhone}
              </div>
              <div class="text-xs text-aspada-steel/70 mt-1">
                Role: {agent.role} • {agent.isActive ? 'Active' : 'Inactive'}
              </div>
            </button>
          {/each}
          {#if agents.length === 0}
            <p class="text-aspada-steel/50 text-center py-8">No agents found</p>
          {/if}
        </div>
      {:else}
        <div class="space-y-3">
          {#each activities as activity}
            <button
              class={`w-full text-left p-4 rounded-xl border-2 transition ${
                selectedActivity?.id === activity.id
                  ? 'border-aspada-gold bg-aspada-gold/10'
                  : 'border-aspada-steel/20 hover:border-aspada-steel/40'
              }`}
              onclick={() => selectActivity(activity)}
            >
              <div class="font-bold text-aspada-navy">
                {activity.contactType}
              </div>
              <div class="text-sm text-aspada-steel mt-1 line-clamp-2">
                {activity.note || 'No notes'}
              </div>
              <div class="text-xs text-aspada-steel/70 mt-1">
                {activity.scheduledAt
                  ? new Date(activity.scheduledAt).toLocaleDateString()
                  : 'No schedule'}
              </div>
            </button>
          {/each}
          {#if activities.length === 0}
            <p class="text-aspada-steel/50 text-center py-8">No activities found</p>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Form Panel -->
    <div class="flex-1 overflow-y-auto p-6">
      {#if activeTab === 'leads'}
        <form
          onsubmit={(e) => {
            e.preventDefault()
            saveLead()
          }}
          class="space-y-6"
        >
          <div class="flex justify-between items-center">
            <h3 class="text-2xl font-bold text-aspada-navy">
              {leadForm.id ? 'Edit Lead' : 'New Lead'}
            </h3>
            {#if leadForm.id}
              <button
                type="button"
                class="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition"
                onclick={() => deleteLead(leadForm.id)}
              >
                Delete
              </button>
            {/if}
          </div>

          <div class="grid grid-cols-2 gap-6">
            <div>
              <label for="fullName" class="block text-sm font-bold text-aspada-navy mb-2">
                Full Name *
              </label>
              <input
                id="fullName"
                type="text"
                bind:value={leadForm.fullName}
                class="w-full px-4 py-3 border-2 border-aspada-steel/20 rounded-lg focus:border-aspada-gold focus:outline-none transition"
                required
              />
            </div>

            <div>
              <label for="contactEmail" class="block text-sm font-bold text-aspada-navy mb-2">
                Contact Email
              </label>
              <input
                id="contactEmail"
                type="email"
                bind:value={leadForm.contactEmail}
                class="w-full px-4 py-3 border-2 border-aspada-steel/20 rounded-lg focus:border-aspada-gold focus:outline-none transition"
              />
            </div>

            <div>
              <label for="contactNo" class="block text-sm font-bold text-aspada-navy mb-2">
                Contact No
              </label>
              <input
                id="contactNo"
                type="text"
                bind:value={leadForm.contactNo}
                class="w-full px-4 py-3 border-2 border-aspada-steel/20 rounded-lg focus:border-aspada-gold focus:outline-none transition"
              />
            </div>

            <div>
              <label for="status" class="block text-sm font-bold text-aspada-navy mb-2">
                Status
              </label>
              <select
                id="status"
                bind:value={leadForm.status}
                class="w-full px-4 py-3 border-2 border-aspada-steel/20 rounded-lg focus:border-aspada-gold focus:outline-none transition"
              >
                {#each Object.values(LeadsStatusOptions) as status}
                  <option value={status}>{status}</option>
                {/each}
              </select>
            </div>

            <div>
              <label for="budgetMin" class="block text-sm font-bold text-aspada-navy mb-2">
                Budget Min
              </label>
              <input
                id="budgetMin"
                type="number"
                bind:value={leadForm.budgetMin}
                class="w-full px-4 py-3 border-2 border-aspada-steel/20 rounded-lg focus:border-aspada-gold focus:outline-none transition"
              />
            </div>

            <div>
              <label for="budgetMax" class="block text-sm font-bold text-aspada-navy mb-2">
                Budget Max
              </label>
              <input
                id="budgetMax"
                type="number"
                bind:value={leadForm.budgetMax}
                class="w-full px-4 py-3 border-2 border-aspada-steel/20 rounded-lg focus:border-aspada-gold focus:outline-none transition"
              />
            </div>

            <div>
              <label for="source" class="block text-sm font-bold text-aspada-navy mb-2">
                Source
              </label>
              <select
                id="source"
                bind:value={leadForm.source}
                class="w-full px-4 py-3 border-2 border-aspada-steel/20 rounded-lg focus:border-aspada-gold focus:outline-none transition"
              >
                {#each Object.values(LeadsSourceOptions) as source}
                  <option value={source}>{source}</option>
                {/each}
              </select>
            </div>

            <div>
              <label for="assignedAgent" class="block text-sm font-bold text-aspada-navy mb-2">
                Assigned Agent
              </label>
              <select
                id="assignedAgent"
                bind:value={leadForm.assignedAgent}
                class="w-full px-4 py-3 border-2 border-aspada-steel/20 rounded-lg focus:border-aspada-gold focus:outline-none transition"
              >
                <option value="">-- None --</option>
                {#each agentsForDropdown as agent}
                  <option value={agent.id}>
                    {agent.displayName || agent.contactPhone}
                  </option>
                {/each}
              </select>
            </div>

            <div class="col-span-2">
              <label for="interest" class="block text-sm font-bold text-aspada-navy mb-2">
                Interest
              </label>
              <input
                id="interest"
                type="text"
                bind:value={leadForm.interest}
                class="w-full px-4 py-3 border-2 border-aspada-steel/20 rounded-lg focus:border-aspada-gold focus:outline-none transition"
              />
            </div>

            <div class="col-span-2">
              <label for="preferredLocation" class="block text-sm font-bold text-aspada-navy mb-2">
                Preferred Location
              </label>
              <input
                id="preferredLocation"
                type="text"
                bind:value={leadForm.preferredLocation}
                class="w-full px-4 py-3 border-2 border-aspada-steel/20 rounded-lg focus:border-aspada-gold focus:outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={formLoading}
            class="px-8 py-3 bg-aspada-gold text-aspada-navy font-bold rounded-full hover:bg-aspada-gold/90 transition disabled:opacity-50"
          >
            {formLoading ? 'Saving...' : 'Save Lead'}
          </button>
        </form>
      {:else if activeTab === 'agents'}
        <form
          onsubmit={(e) => {
            e.preventDefault()
            saveAgent()
          }}
          class="space-y-6"
        >
          <div class="flex justify-between items-center">
            <h3 class="text-2xl font-bold text-aspada-navy">
              {agentForm.id ? 'Edit Agent' : 'New Agent'}
            </h3>
            {#if agentForm.id}
              <button
                type="button"
                class="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition"
                onclick={() => deleteAgent(agentForm.id)}
              >
                Delete
              </button>
            {/if}
          </div>

          <div class="grid grid-cols-2 gap-6">
            <div>
              <label for="displayName" class="block text-sm font-bold text-aspada-navy mb-2">
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                bind:value={agentForm.displayName}
                class="w-full px-4 py-3 border-2 border-aspada-steel/20 rounded-lg focus:border-aspada-gold focus:outline-none transition"
              />
            </div>

            <div>
              <label for="contactPh" class="block text-sm font-bold text-aspada-navy mb-2">
                Contact Phone *
              </label>
              <input
                id="contactPh"
                type="text"
                bind:value={agentForm.contactPhone}
                class="w-full px-4 py-3 border-2 border-aspada-steel/20 rounded-lg focus:border-aspada-gold focus:outline-none transition"
                required
              />
            </div>

            <div>
              <label for="role" class="block text-sm font-bold text-aspada-navy mb-2"> Role </label>
              <select
                id="role"
                bind:value={agentForm.role}
                class="w-full px-4 py-3 border-2 border-aspada-steel/20 rounded-lg focus:border-aspada-gold focus:outline-none transition"
              >
                {#each Object.values(AgentsRoleOptions) as role}
                  <option value={role}>{role}</option>
                {/each}
              </select>
            </div>

            <div class="flex items-center pt-8">
              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  bind:checked={agentForm.isActive}
                  class="w-5 h-5 text-aspada-gold border-aspada-steel/20 rounded focus:ring-aspada-gold"
                />
                <span class="text-sm font-bold text-aspada-navy">Is Active</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={formLoading}
            class="px-8 py-3 bg-aspada-gold text-aspada-navy font-bold rounded-full hover:bg-aspada-gold/90 transition disabled:opacity-50"
          >
            {formLoading ? 'Saving...' : 'Save Agent'}
          </button>
        </form>
      {:else}
        <form
          onsubmit={(e) => {
            e.preventDefault()
            saveActivity()
          }}
          class="space-y-6"
        >
          <div class="flex justify-between items-center">
            <h3 class="text-2xl font-bold text-aspada-navy">
              {activityForm.id ? 'Edit Activity' : 'New Activity'}
            </h3>
            {#if activityForm.id}
              <button
                type="button"
                class="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition"
                onclick={() => deleteActivity(activityForm.id)}
              >
                Delete
              </button>
            {/if}
          </div>

          <div class="grid grid-cols-2 gap-6">
            <div class="col-span-2">
              <label for="lead" class="block text-sm font-bold text-aspada-navy mb-2">
                Lead *
              </label>
              <select
                id="lead"
                bind:value={activityForm.lead}
                class="w-full px-4 py-3 border-2 border-aspada-steel/20 rounded-lg focus:border-aspada-gold focus:outline-none transition"
                required
              >
                <option value="">-- Select Lead --</option>
                {#each leadsForDropdown as lead}
                  <option value={lead.id}>
                    {lead.fullName} - {lead.contactEmail || lead.contactNo}
                  </option>
                {/each}
              </select>
            </div>

            <div>
              <label for="contactType" class="block text-sm font-bold text-aspada-navy mb-2">
                Contact Type
              </label>
              <select
                id="contactType"
                bind:value={activityForm.contactType}
                class="w-full px-4 py-3 border-2 border-aspada-steel/20 rounded-lg focus:border-aspada-gold focus:outline-none transition"
              >
                {#each Object.values(LeadActivitiesContactTypeOptions) as type}
                  <option value={type}>{type}</option>
                {/each}
              </select>
            </div>

            <div>
              <label for="scheduledAt" class="block text-sm font-bold text-aspada-navy mb-2">
                Scheduled At
              </label>
              <input
                id="scheduledAt"
                type="datetime-local"
                bind:value={activityForm.scheduledAt}
                class="w-full px-4 py-3 border-2 border-aspada-steel/20 rounded-lg focus:border-aspada-gold focus:outline-none transition"
                placeholder="Set a reminder date and time"
              />
              {#if activityForm.scheduledAt}
                <p class="text-xs text-aspada-steel/70 mt-2">
                  Scheduled for: {new Date(activityForm.scheduledAt).toLocaleString()}
                </p>
              {/if}
            </div>

            <div>
              <label for="completedAt" class="block text-sm font-bold text-aspada-navy mb-2">
                Completed At
              </label>
              <input
                id="completedAt"
                type="datetime-local"
                bind:value={activityForm.completedAt}
                class="w-full px-4 py-3 border-2 border-aspada-steel/20 rounded-lg focus:border-aspada-gold focus:outline-none transition"
                placeholder="Set a reminder date and time"
              />
              {#if activityForm.completedAt}
                <p class="text-xs text-aspada-steel/70 mt-2">
                  Completed at: {new Date(activityForm.completedAt).toLocaleString()}
                </p>
              {/if}
            </div>

            <div class="col-span-2">
              <label for="note" class="block text-sm font-bold text-aspada-navy mb-2"> Note </label>
              <textarea
                id="note"
                bind:value={activityForm.note}
                rows="4"
                class="w-full px-4 py-3 border-2 border-aspada-steel/20 rounded-lg focus:border-aspada-gold focus:outline-none transition"
              ></textarea>
            </div>
          </div>

          <button
            type="submit"
            disabled={formLoading}
            class="px-8 py-3 bg-aspada-gold text-aspada-navy font-bold rounded-full hover:bg-aspada-gold/90 transition disabled:opacity-50"
          >
            {formLoading ? 'Saving...' : 'Save Activity'}
          </button>
        </form>
      {/if}
    </div>
  </div>
</div>
