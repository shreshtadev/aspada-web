<script lang="ts">
  import { actions } from 'astro:actions'

  // Svelte 5 Props & State
  let { projectTitle = 'General Inquiry', isModal = false } = $props<{
    projectTitle?: string
    isModal?: boolean
  }>()

  let fullName = $state('')
  let contactNo = $state('')
  let contactEmail = $state('')
  let message = $state('')
  let status = $state('idle') // idle | sending | success | error

  $effect(() => {
    contactNo = contactNo
      .replace(/\D/g, '') // Remove everything that isn't a number
      .slice(0, 10) // Stop at 10 digits
  })

  let isValid = $derived(/^[6-9]\d{9}$/.test(contactNo))

  async function handleSubmit(e: Event) {
    e.preventDefault()
    status = 'sending'

    const { data, error } = await actions.submitContact({
      fullName,
      contactEmail,
      contactNo,
      interest: `Project: ${projectTitle} | Message: ${message}`,
    })

    if (error) {
      status = 'error'
    } else {
      status = 'success'
      fullName = ''
      contactEmail = ''
      contactNo = ''
      message = ''
    }
  }
</script>

<form
  onsubmit={handleSubmit}
  class="w-full mx-auto font-sans {isModal
    ? 'bg-transparent p-0 border-none shadow-none'
    : 'bg-white p-6 sm:p-10 rounded-[2rem] shadow-2xl border border-slate-100 max-w-lg'}"
>
  {#if !isModal}
    <div class="mb-8">
      <h3
        class="text-2xl sm:text-3xl font-display font-extrabold text-aspada-navy tracking-tight mb-2"
      >
        Enquire Now
      </h3>
      <p class="text-slate-500 text-sm font-medium">
        Experience excellence with Aspada. Leave your details below.
      </p>
    </div>
  {/if}

  <div class="space-y-6">
    <!-- Full Name -->
    <div class="group space-y-2 w-full">
      <label
        for="name"
        class="text-[10px] uppercase tracking-widest text-aspada-navy/60 font-bold ml-1 group-focus-within:text-aspada-gold transition-colors"
      >
        Full Name
      </label>
      <div class="relative">
        <span
          class="absolute left-4 top-1/2 -translate-y-1/2 i-lucide-user text-slate-400 group-focus-within:text-aspada-gold transition-colors"
        ></span>
        <input
          id="name"
          bind:value={fullName}
          placeholder="e.g. John Doe"
          required
          class="w-full py-4 pl-11 pr-4 text-base bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-aspada-gold/10 focus:border-aspada-gold outline-none transition-all placeholder:text-slate-400 font-medium"
        />
      </div>
    </div>

    <!-- Email Address -->
    <div class="group space-y-2 w-full">
      <label
        for="email"
        class="text-[10px] uppercase tracking-widest text-aspada-navy/60 font-bold ml-1 group-focus-within:text-aspada-gold transition-colors"
      >
        Corporate Email
      </label>
      <div class="relative">
        <span
          class="absolute left-4 top-1/2 -translate-y-1/2 i-lucide-mail text-slate-400 group-focus-within:text-aspada-gold transition-colors"
        ></span>
        <input
          id="email"
          type="email"
          bind:value={contactEmail}
          placeholder="john@corporation.com"
          required
          class="w-full py-4 pl-11 pr-4 text-base bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-aspada-gold/10 focus:border-aspada-gold outline-none transition-all placeholder:text-slate-400 font-medium"
        />
      </div>
    </div>

    <!-- Phone Number -->
    <div class="group space-y-2 w-full">
      <label
        for="phone"
        class="text-[10px] uppercase tracking-widest text-aspada-navy/60 font-bold ml-1 group-focus-within:text-aspada-gold transition-colors"
      >
        Phone Number
      </label>

      <div class="relative">
        <div
          class="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-slate-400 group-focus-within:text-aspada-gold transition-colors"
        >
          <span class="i-lucide-phone text-sm"></span>
          <span class="text-sm font-bold border-r border-slate-200 pr-2"> +91 </span>
        </div>

        <input
          id="phone"
          bind:value={contactNo}
          type="tel"
          inputmode="numeric"
          placeholder="98765 43210"
          required
          class="w-full py-4 pl-24 pr-12 text-base bg-slate-50/50 border rounded-2xl outline-none transition-all duration-300 font-medium
             {contactNo.length > 0 && !isValid
            ? 'border-rose-300 focus:ring-4 focus:ring-rose-500/10'
            : 'border-slate-200 focus:border-aspada-gold focus:ring-4 focus:ring-aspada-gold/10'}"
        />

        <div class="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
          {#if isValid}
            <span class="i-lucide-check-circle-2 text-emerald-500 animate-in zoom-in"></span>
          {:else if contactNo.length > 0}
            <span class="i-lucide-alert-circle text-rose-400 animate-pulse"></span>
          {/if}
        </div>
      </div>

      {#if contactNo.length > 0 && !isValid}
        <p class="text-[11px] text-rose-500 font-bold ml-1 animate-in slide-in-from-top-1">
          Please enter a valid 10-digit mobile number
        </p>
      {/if}
    </div>

    <!-- Message -->
    <div class="group space-y-2 w-full">
      <label
        for="message"
        class="text-[10px] uppercase tracking-widest text-aspada-navy/60 font-bold ml-1 group-focus-within:text-aspada-gold transition-colors"
      >
        How can we help?
      </label>
      <div class="relative">
        <span
          class="absolute left-4 top-4 i-lucide-message-square text-slate-400 group-focus-within:text-aspada-gold transition-colors"
        ></span>
        <textarea
          id="message"
          bind:value={message}
          placeholder="Briefly describe your requirements..."
          rows="3"
          class="w-full py-4 pl-11 pr-4 text-base bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-aspada-gold/10 focus:border-aspada-gold outline-none transition-all resize-none placeholder:text-slate-400 font-medium"
        ></textarea>
      </div>
    </div>

    <!-- Submit Button -->
    <button
      type="submit"
      disabled={status === 'sending'}
      class="btn-primary w-full py-5 rounded-2xl !bg-aspada-navy !text-white flex items-center justify-center gap-3 group relative overflow-hidden transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
    >
      <div
        class="absolute inset-0 bg-gradient-to-r from-aspada-steel/0 via-white/10 to-aspada-steel/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"
      ></div>

      {#if status === 'sending'}
        <span class="i-lucide-loader-2 animate-spin text-xl"></span>
        <span class="tracking-wide uppercase font-bold text-sm">Processing...</span>
      {:else}
        <span class="tracking-wide uppercase font-bold text-sm">Confirm Enquiry</span>
        <span class="i-lucide-arrow-right text-lg transition-transform group-hover:translate-x-1"
        ></span>
      {/if}
    </button>
  </div>

  {#if status === 'success'}
    <div
      class="mt-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 animate-in zoom-in duration-300"
    >
      <div class="flex-center w-8 h-8 rounded-full bg-emerald-500 text-white shrink-0">
        <span class="i-lucide-check text-sm"></span>
      </div>
      <div>
        <p class="text-emerald-900 font-bold text-sm">Request Received</p>
        <p class="text-emerald-700/80 text-[11px] font-medium">
          Our consultant will reach out shortly.
        </p>
      </div>
    </div>
  {/if}
</form>
