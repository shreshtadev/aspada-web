<script>
  import { actions } from "astro:actions";
  import { tick } from "svelte";

  // Svelte 5 States
  let isOpen = $state(false);
  let isTyping = $state(false);
  let userInput = $state("");
  let chatElement = $state(null);

  // Initialize with a warm welcome
  let messages = $state([
    {
      role: "model",
      parts: [
        {
          text: "Namaste! I am your Aspada Assistant. I can help you with project details, locations, or scheduling a site visit in Shivamogga. What is on your mind?",
        },
      ],
    },
  ]);

  // Auto-scroll to bottom whenever messages change
  $effect(() => {
    if (messages.length && chatElement) {
      chatElement.scrollTo({
        top: chatElement.scrollHeight,
        behavior: "smooth",
      });
    }
  });

  async function sendMessage() {
    if (!userInput.trim() || isTyping) return;

    const userText = userInput;
    messages = [...messages, { role: "user", parts: [{ text: userText }] }];
    userInput = "";
    isTyping = true;

    try {
      // Calling the Gemini 2.0 Flash Action
      const { data, error } = await actions.chatWithAI({
        message: userText,
        history:
          messages[0].role === "model"
            ? messages.slice(1, -1)
            : messages.slice(0, -1),
      });

      if (data) {
        messages = [...messages, { role: "model", parts: [{ text: data }] }];
      } else if (error) {
        messages = [
          ...messages,
          {
            role: "model",
            parts: [
              {
                text: "I'm having trouble connecting right now. Please try again in a moment.",
              },
            ],
          },
        ];
      }
    } catch (err) {
      console.error("Chat Error:", err);
    } finally {
      isTyping = false;
    }
  }
</script>

<button
  onclick={() => (isOpen = !isOpen)}
  class="fixed bottom-6 right-6 w-16 h-16 bg-aspada-navy text-aspada-gold rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-[100] border border-white/10"
  aria-label="Toggle Chat"
>
  {#if isOpen}
    <span class="i-lucide-x text-2xl"></span>
  {:else}
    <span class="i-lucide-message-circle text-2xl"></span>
  {/if}
</button>

{#if isOpen}
  <div
    class="fixed bottom-24 right-6 w-[90vw] md:w-[400px] h-[600px] max-h-[70vh] bg-white/90 backdrop-blur-2xl border border-slate-200 rounded-[2.5rem] shadow-2xl z-[100] flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-500"
  >
    <div class="p-6 bg-aspada-navy text-white flex items-center gap-4">
      <div
        class="w-10 h-10 rounded-full bg-aspada-gold/20 flex items-center justify-center border border-aspada-gold/30"
      >
        <span class="i-lucide-bot text-aspada-gold"></span>
      </div>
      <div>
        <h3 class="font-bold tracking-tight">Aspada Assistant</h3>
        <p
          class="text-[10px] uppercase tracking-widest text-aspada-gold/80 font-black"
        >
          Online • Gemini 2.0 Flash
        </p>
      </div>
    </div>

    <div
      bind:this={chatElement}
      class="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar bg-gradient-to-b from-slate-50 to-white"
    >
      {#each messages as msg}
        <div
          class="flex {msg.role === 'model' ? 'justify-start' : 'justify-end'}"
        >
          <div
            class="max-w-[85%] p-4 rounded-[1.5rem] text-sm leading-relaxed shadow-sm
            {msg.role === 'model'
              ? 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
              : 'bg-aspada-navy text-white rounded-tr-none font-medium'}"
          >
            {msg.parts[0].text}
          </div>
        </div>
      {/each}

      {#if isTyping}
        <div class="flex justify-start animate-pulse">
          <div
            class="bg-slate-100 p-4 rounded-[1.5rem] rounded-tl-none flex gap-1"
          >
            <span class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
            ></span>
            <span
              class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"
            ></span>
            <span
              class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"
            ></span>
          </div>
        </div>
      {/if}
    </div>

    <div class="p-4 bg-white border-t border-slate-100">
      <div class="relative flex items-center group">
        <input
          bind:value={userInput}
          onkeydown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask me anything..."
          class="w-full p-4 pr-14 bg-slate-50 border border-slate-200 rounded-2xl outline-none transition-all
                 focus:bg-white focus:border-aspada-gold/50 focus:ring-4 focus:ring-aspada-gold/10 font-medium"
        />
        <button
          type="button"
          aria-label="Chat with aspadabot"
          onclick={sendMessage}
          disabled={!userInput.trim() || isTyping}
          class="absolute right-2 w-10 h-10 bg-aspada-navy text-white rounded-xl flex items-center justify-center
                 transition-all active:scale-90 disabled:opacity-30 disabled:grayscale"
        >
          <span class="i-lucide-send-horizontal text-lg"></span>
        </button>
      </div>
      <p
        class="text-[8px] text-center text-slate-400 mt-3 uppercase tracking-tighter"
      >
        Powered by <a
          href="https://shreshtasmg.in"
          class="text-aspada-gold hover:underline"
          target="_blank">ShreshtaSMG</a
        > • AspadaDevelopers • Real Estate
      </p>
    </div>
  </div>
{/if}

<style>
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
</style>
