<script lang="ts">
  import { onMount } from 'svelte'

  let { latitude, longitude } = $props<{
    latitude: number
    longitude: number
  }>()

  let mapContainer: HTMLDivElement | null = null

  onMount(async () => {
    const L = await import('leaflet')
    await import('leaflet/dist/leaflet.css')

    const map = L.map(mapContainer!).setView([latitude, longitude], 13)

    L.Icon.Default.mergeOptions({
      iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
      iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
      shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)

    L.marker([latitude, longitude]).addTo(map).bindPopup('Our Location').openPopup()
  })
</script>

<div bind:this={mapContainer} class="map"></div>

<style>
  .map {
    width: 100%;
    height: 100%;
    min-height: 500px;
  }
</style>
