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
    ><span class="text">{text}</span></a>
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
    color: var(--fg-color);
    border: 0.25em solid var(--se-color);
    //border-bottom: none;
    padding: 2px 0.7em;
    display: flex;
    align-items: center;
    text-transform: uppercase;
    cursor: pointer;
    text-decoration: none;
    letter-spacing: 0.1px;
  }

  a.route:not(.active):hover {
    //font-weight: bold;
    color: var(--ln-color);
    border-color: var(--ln-color);
    letter-spacing: 0.1px;
  }
  a.route.active {
    background-color: var(--fg-color);
    border-color: var(--fg-color);
    color: var(--bg-color);
    font-weight: bold;
  }
}
</style>
