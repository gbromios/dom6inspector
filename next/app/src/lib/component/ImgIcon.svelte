<script lang="ts">
  import { icons } from '$lib/icon';
  export let name: string;
  export let cls: string = ''
  export let title: null|string = null;
  $: icon = icons[name];
</script>

{#if icon}
  <img
    class="img-icon{cls ? ' ' + cls : ''}"
    role="presentation"
    data-name={name}
    width={icon.width}
    height={icon.height}
    src={icon.src}
    title={title}
  >
{:else}
  <span data-name={name} >�</span>
{/if}


