<script>
  import pb from "../../lib/pb";

  let email = $state("");
  let password = $state("");
  let error = $state("");

  async function login() {
    try {
      await pb.collection("users").authWithPassword(email, password);
      document.cookie = pb.authStore.exportToCookie({ httpOnly: false });
      window.location.href = "/admin/projects";
    } catch {
      error = "Invalid credentials";
    }
  }
</script>

<div
  class="max-w-md mx-auto mt-20 p-8 rounded-2xl shadow-xl border border-aspada-gold/20"
>
  <h1 class="text-2xl font-bold mb-6 text-aspada-steel">Admin Login</h1>

  {#if error}<p class="text-red-500 mb-4">{error}</p>{/if}

  <input
    type="email"
    bind:value={email}
    placeholder="Email"
    class="w-full p-3 border rounded-lg mb-4"
  />
  <input
    type="password"
    bind:value={password}
    placeholder="Password"
    class="w-full p-3 border rounded-lg mb-6"
  />

  <button
    onclick={login}
    class="w-full bg-aspada-navy text-aspada-cream font-bold py-3 rounded-lg hover:bg-aspada-steel/90 transition-all cursor-pointer"
  >
    Sign In
  </button>
</div>
