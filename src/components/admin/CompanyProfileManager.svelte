<script lang="ts">
  import pb from '../../lib/pb'
  import toast from 'svelte-french-toast'
  import { Collections, type CompaniesRecord } from '../../types/pocketbase-types'

  let loading = $state(false)
  let saving = $state(false)
  let record = $state<CompaniesRecord | null>(null)

  // Form state
  let companyName = $state('')
  let companyMainPhone = $state('')
  let companyAlternatePhone1 = $state('')
  let companyAlternatePhone2 = $state('')
  let companyMainEmail = $state('')
  let companyFacebook = $state('')
  let companyInsta = $state('')
  let companyYoutube = $state('')
  let addressLine1 = $state('')
  let city = $state('')
  let state = $state('')
  let pincode = $state('')

  function formatPhone(phone: string) {
    return phone.replace(/[^0-9]/g, '')
  }

  async function loadData() {
    try {
      loading = true
      const list = await pb
        .collection(Collections.Companies)
        .getFirstListItem("companyName = '" + import.meta.env.PUBLIC_COMPANY_NAME + "'")
      if (list) {
        record = list as unknown as CompaniesRecord
        syncForm()
      }
    } catch (err) {
      console.error('Failed to load company profile:', err)
      toast.error('Failed to load company profile')
    } finally {
      loading = false
    }
  }

  function syncForm() {
    if (!record) return
    companyName = record.companyName || ''
    companyMainPhone = record.companyMainPhone || ''
    companyAlternatePhone1 = record.companyAlternatePhone1 || ''
    companyAlternatePhone2 = record.companyAlternatePhone2 || ''
    companyMainEmail = record.companyMainEmail || ''
    companyFacebook = record.companyFacebook || ''
    companyInsta = record.companyInsta || ''
    companyYoutube = record.companyYoutube || ''
    addressLine1 = record.addressLine1 || ''
    city = record.city || ''
    state = record.state || ''
    pincode = record.pincode || ''
  }

  async function saveProfile() {
    if (!companyName) {
      toast.error('Company Name is required')
      return
    }

    saving = true
    try {
      const data = {
        companyName,
        companyMainPhone,
        companyAlternatePhone1,
        companyAlternatePhone2,
        companyMainEmail,
        companyFacebook,
        companyInsta,
        companyYoutube,
        addressLine1,
        city,
        state,
        pincode,
      }

      if (record?.id) {
        const updated = await pb.collection(Collections.Companies).update(record.id, data)
        record = updated as unknown as CompaniesRecord
        toast.success('Profile updated successfully')
      } else {
        const created = await pb.collection(Collections.Companies).create(data)
        record = created as unknown as CompaniesRecord
        toast.success('Profile created successfully')
      }
    } catch (err: any) {
      console.error('Failed to save profile:', err)
      toast.error(err.message || 'Failed to save profile')
    } finally {
      saving = false
    }
  }

  $effect(() => {
    loadData()
  })
</script>

<div class="max-w-4xl mx-auto">
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
          <span class="i-lucide-building-2 text-2xl"></span>
        </div>
        <div>
          <h2 class="text-2xl font-black text-aspada-navy tracking-tight uppercase">
            Company Profile
          </h2>
          <p class="text-slate-400 text-sm font-medium uppercase tracking-widest">
            Manage your corporate identity & contact details
          </p>
        </div>
      </div>

      {#if loading}
        <div class="flex flex-col items-center justify-center py-20 gap-4">
          <div
            class="w-12 h-12 border-4 border-aspada-gold/20 border-t-aspada-gold rounded-full animate-spin"
          ></div>
          <p class="text-slate-400 font-bold uppercase tracking-widest text-xs">
            Loading profile...
          </p>
        </div>
      {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Basic Info -->
          <div class="md:col-span-2">
            <label class="block">
              <span
                class="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block ml-1"
                >Company Name</span
              >
              <input
                bind:value={companyName}
                class="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-aspada-gold/50 outline-none transition-all font-bold text-aspada-navy"
                placeholder="Aspada Group"
              />
            </label>
          </div>

          <!-- Contact Details -->
          <label class="block">
            <span
              class="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block ml-1"
              >Main Email</span
            >
            <div class="relative group">
              <span
                class="absolute left-4 top-1/2 -translate-y-1/2 i-lucide-mail text-slate-400 group-focus-within:text-aspada-gold transition-colors"
              ></span>
              <input
                bind:value={companyMainEmail}
                type="email"
                class="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-aspada-gold/50 outline-none transition-all font-medium text-slate-700"
                placeholder="contact@aspada.com"
              />
            </div>
          </label>

          <!-- Address -->
          <label class="block">
            <span
              class="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block ml-1"
              >Address</span
            >
            <input
              bind:value={addressLine1}
              class="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-aspada-gold/50 outline-none transition-all font-bold text-aspada-navy"
              placeholder="123 Main St"
            />
          </label>
          <label class="block">
            <span
              class="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block ml-1"
              >City</span
            >
            <input
              bind:value={city}
              class="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-aspada-gold/50 outline-none transition-all font-bold text-aspada-navy"
              placeholder="City"
            />
          </label>
          <label class="block">
            <span
              class="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block ml-1"
              >State</span
            >
            <input
              bind:value={state}
              class="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-aspada-gold/50 outline-none transition-all font-bold text-aspada-navy"
              placeholder="State"
            />
          </label>
          <label class="block">
            <span
              class="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block ml-1"
              >Pincode</span
            >
            <input
              bind:value={pincode}
              class="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-aspada-gold/50 outline-none transition-all font-bold text-aspada-navy"
              placeholder="Pincode"
            />
          </label>

          <label class="block group cursor-pointer">
            <span
              class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 block ml-1 transition-colors group-focus-within:text-aspada-navy"
            >
              Main Phone
            </span>

            <div
              class="relative flex items-center bg-slate-50 border border-slate-200 rounded-2xl transition-all duration-300
              focus-within:ring-4 focus-within:ring-aspada-gold/10 focus-within:border-aspada-gold/30
              focus-within:bg-white focus-within:-translate-y-[1px] focus-within:shadow-xl"
            >
              <span
                class="ml-4 i-lucide-phone text-slate-400 group-focus-within:text-aspada-gold transition-colors text-lg"
              ></span>

              <div
                class="ml-3 pr-3 border-r border-slate-200 flex items-center justify-center select-none"
              >
                <span class="text-aspada-navy font-bold text-sm tracking-tight">+91</span>
              </div>

              <input
                bind:value={companyMainPhone}
                type="text"
                inputmode="tel"
                placeholder="+919876543210"
                class="w-full p-4 pl-3 bg-transparent outline-none font-bold text-aspada-navy placeholder:text-slate-300 placeholder:font-medium"
              />

              {#if companyMainPhone.length === 13}
                <div class="pr-4 transition-all animate-in zoom-in fade-in duration-500">
                  <span class="i-lucide-check-circle-2 text-green-500 text-xl"></span>
                </div>
              {/if}
            </div>
          </label>

          <label class="block group cursor-pointer">
            <span
              class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 block ml-1 transition-colors group-focus-within:text-aspada-navy"
            >
              Alternate Phone 1
            </span>

            <div
              class="relative flex items-center bg-slate-50 border border-slate-200 rounded-2xl transition-all duration-300
              focus-within:ring-4 focus-within:ring-aspada-gold/10 focus-within:border-aspada-gold/30
              focus-within:bg-white focus-within:-translate-y-[1px] focus-within:shadow-xl"
            >
              <span
                class="ml-4 i-lucide-phone text-slate-400 group-focus-within:text-aspada-gold transition-colors text-lg"
              ></span>

              <div
                class="ml-3 pr-3 border-r border-slate-200 flex items-center justify-center select-none"
              >
                <span class="text-aspada-navy font-bold text-sm tracking-tight">+91</span>
              </div>

              <input
                bind:value={companyAlternatePhone1}
                type="text"
                inputmode="tel"
                placeholder="+919876543210"
                class="w-full p-4 pl-3 bg-transparent outline-none font-bold text-aspada-navy placeholder:text-slate-300 placeholder:font-medium"
              />

              {#if companyAlternatePhone1.length === 13}
                <div class="pr-4 transition-all animate-in zoom-in fade-in duration-500">
                  <span class="i-lucide-check-circle-2 text-green-500 text-xl"></span>
                </div>
              {/if}
            </div>
          </label>

          <label class="block group cursor-pointer">
            <span
              class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 block ml-1 transition-colors group-focus-within:text-aspada-navy"
            >
              Alternate Phone 2
            </span>

            <div
              class="relative flex items-center bg-slate-50 border border-slate-200 rounded-2xl transition-all duration-300
              focus-within:ring-4 focus-within:ring-aspada-gold/10 focus-within:border-aspada-gold/30
              focus-within:bg-white focus-within:-translate-y-[1px] focus-within:shadow-xl"
            >
              <span
                class="ml-4 i-lucide-phone text-slate-400 group-focus-within:text-aspada-gold transition-colors text-lg"
              ></span>

              <div
                class="ml-3 pr-3 border-r border-slate-200 flex items-center justify-center select-none"
              >
                <span class="text-aspada-navy font-bold text-sm tracking-tight">+91</span>
              </div>

              <input
                bind:value={companyAlternatePhone2}
                type="text"
                inputmode="tel"
                placeholder="+919876543210"
                class="w-full p-4 pl-3 bg-transparent outline-none font-bold text-aspada-navy placeholder:text-slate-300 placeholder:font-medium"
              />

              {#if companyAlternatePhone2.length === 13}
                <div class="pr-4 transition-all animate-in zoom-in fade-in duration-500">
                  <span class="i-lucide-check-circle-2 text-green-500 text-xl"></span>
                </div>
              {/if}
            </div>
          </label>

          <!-- Social Media -->
          <div class="md:col-span-2 pt-4 border-t border-slate-100 mt-4">
            <h3 class="text-xs font-black uppercase tracking-[0.2em] text-aspada-gold mb-6">
              Social Media Presence
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <label class="block">
                <span
                  class="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block ml-1"
                  >Facebook URL</span
                >
                <div class="relative group">
                  <span
                    class="absolute left-4 top-1/2 -translate-y-1/2 i-lucide-facebook text-slate-400 group-focus-within:text-aspada-gold transition-colors"
                  ></span>
                  <input
                    bind:value={companyFacebook}
                    class="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-aspada-gold/50 outline-none transition-all font-medium text-slate-700"
                    placeholder="https://facebook.com/..."
                  />
                </div>
              </label>

              <label class="block">
                <span
                  class="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block ml-1"
                  >Instagram URL</span
                >
                <div class="relative group">
                  <span
                    class="absolute left-4 top-1/2 -translate-y-1/2 i-lucide-instagram text-slate-400 group-focus-within:text-aspada-gold transition-colors"
                  ></span>
                  <input
                    bind:value={companyInsta}
                    class="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-aspada-gold/50 outline-none transition-all font-medium text-slate-700"
                    placeholder="https://instagram.com/..."
                  />
                </div>
              </label>

              <label class="block">
                <span
                  class="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block ml-1"
                  >YouTube URL</span
                >
                <div class="relative group">
                  <span
                    class="absolute left-4 top-1/2 -translate-y-1/2 i-lucide-youtube text-slate-400 group-focus-within:text-aspada-gold transition-colors"
                  ></span>
                  <input
                    bind:value={companyYoutube}
                    class="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-aspada-gold/50 outline-none transition-all font-medium text-slate-700"
                    placeholder="https://youtube.com/..."
                  />
                </div>
              </label>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-4 mt-12 pt-8 border-t border-slate-100">
          <button
            onclick={saveProfile}
            disabled={saving}
            class="flex-1 bg-aspada-navy text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-aspada-navy/90 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl shadow-aspada-navy/20 flex items-center justify-center gap-3"
          >
            {#if saving}
              <div
                class="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"
              ></div>
              Processing...
            {:else}
              <span class="i-lucide-save text-xl"></span>
              Update Corporate Profile
            {/if}
          </button>

          <button
            onclick={syncForm}
            class="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-colors"
          >
            Reset
          </button>
        </div>
      {/if}
    </div>
  </div>
</div>
