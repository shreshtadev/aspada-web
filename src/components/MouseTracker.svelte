<script>
  let { children } = $props()

  let x = $state(0)
  let y = $state(0)
  let opacity = $state(0)

  function handleMouseMove(e) {
    x = e.clientX
    y = e.clientY
    opacity = 1
  }
</script>

<div
  role="presentation"
  onmousemove={handleMouseMove}
  onmouseenter={() => (opacity = 1)}
  onmouseleave={() => (opacity = 0)}
  class="relative min-h-screen w-full overflow-x-hidden"
>
  <div
    class="pointer-events-none fixed inset-0 z-30 transition-opacity duration-300"
    style="
      opacity: {opacity};
      background: radial-gradient(600px circle at {x}px {y}px, rgba(212, 175, 55, 0.1), transparent 40%);
    "
  ></div>

  {@render children()}
</div>
