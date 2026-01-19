<script lang="ts">
  import { actions } from 'astro:actions'

  // Svelte 5 Props & State
  let { projectTitle = 'General Inquiry' } = $props()

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
  class="bg-white p-6 sm:p-8 rounded-3xl sm:rounded-[2rem] shadow-xl border border-slate-100 max-w-md w-full mx-auto"
>
  <h3 class="text-xl sm:text-2xl font-bold text-aspada-navy mb-5 sm:mb-6">Enquire Now</h3>

  <div class="space-y-4">
    <div class="space-y-1 w-full">
      <label
        for="name"
        class="text-xs sm:text-[10px] uppercase tracking-widest text-slate-400 font-bold ml-1"
      >
        Full Name
      </label>
      <input
        id="name"
        bind:value={fullName}
        placeholder="Full Name"
        required
        class="w-full p-3 sm:p-4 text-base bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-aspada-gold outline-none"
      />
    </div>

    <div class="space-y-1 w-full">
      <label
        for="email"
        class="text-xs sm:text-[10px] uppercase tracking-widest text-slate-400 font-bold ml-1"
      >
        Email Address
      </label>
      <input
        id="email"
        type="email"
        bind:value={contactEmail}
        placeholder="Contact Email"
        required
        class="w-full p-3 sm:p-4 text-base bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-aspada-gold outline-none"
      />
    </div>

    <div class="space-y-1 w-full">
      <label
        for="phone"
        class="text-xs sm:text-[10px] uppercase tracking-widest text-slate-400 font-bold ml-1"
      >
        Phone Number
      </label>

      <div class="relative group">
        <span
          class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm border-r border-aspada-silver pr-3"
        >
          +91
        </span>

        <input
          id="phone"
          bind:value={contactNo}
          type="tel"
          inputmode="numeric"
          placeholder="98765 43210"
          required
          class="w-full p-3 sm:p-4 pl-16 text-base bg-slate-50 border rounded-xl outline-none transition-all duration-300
             {contactNo.length > 0 && !isValid
            ? 'border-rose-300 focus:ring-4 focus:ring-rose-500/10'
            : 'border-aspada-gold/60 focus:border-aspada-gold focus:ring-4 focus:ring-aspada-gold/10'}"
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
        <p class="text-xs text-rose-500 font-medium ml-1 animate-in slide-in-from-top-1">
          Please enter a valid 10-digit mobile number
        </p>
      {/if}
    </div>

    <div class="space-y-1 w-full">
      <label
        for="message"
        class="text-xs sm:text-[10px] uppercase tracking-widest text-slate-400 font-bold ml-1"
      >
        Message
      </label>
      <textarea
        id="message"
        bind:value={message}
        placeholder="How can we help you?"
        rows="3"
        class="w-full p-3 sm:p-4 text-base bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-aspada-gold outline-none"
      ></textarea>
    </div>

    <button
      type="submit"
      disabled={status === 'sending'}
      class="w-full bg-aspada-navy text-white font-bold py-3 sm:py-4 rounded-xl transition-all hover:bg-opacity-90 active:scale-95 disabled:opacity-50"
    >
      {status === 'sending' ? 'Submitting...' : 'Send Message'}
    </button>
  </div>

  {#if status === 'success'}
    <p class="mt-4 text-emerald-600 text-sm font-medium text-center animate-bounce">
      ✓ Thank you! We will contact you shortly.
    </p>
  {/if}
</form>
