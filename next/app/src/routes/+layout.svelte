<script lang="ts">
import { onMount } from 'svelte';
import { loadIcons } from '$lib/icon';
import { useDB } from '$lib/db'
import { page } from '$app/stores'
import '$lib/style/app.less';
import '$lib/style/table.less';
let db: any = null;
onMount (async function () {
  const dbPromise = useDB();
  await loadIcons();
  db = await dbPromise;
});

const links = [
  ['/list/units', 'units'],
  ['/settings', 'settings'],
]
</script>

<nav>
  {#each links as [href, text]}
    <a
      href={href}
      class="route {$page.url.pathname === href ? 'active' : ''}"
    >{text}</a>
  {/each}
</nav>
<main>
  <slot></slot>
</main>

<style lang="less">
nav {
  display: flex;
  align-items: stretch;

  a.route {
    border: 0.1em solid currentColor;
    padding: 2px 0.5em 0;
    display: flex;
    align-items: center;
    text-transform: uppercase;
    cursor: pointer;
    text-decoration: none;
  }

  a.route.active {
    font-weight: bold;
  }
}
</style>
