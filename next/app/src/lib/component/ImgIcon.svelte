<script lang="ts">
  import { icons } from '$lib/icon';
  export let name: string;
  $: icon = icons[name];
</script>

{#if icon}
  <img
    class="img-icon"
    role="presentation"
    data-name={name}
    width={icon.width}
    height={icon.height}
    src={icon.src}
    alt="bet youd like to know"
  >
{:else}
  <span>!</span>
{/if}


