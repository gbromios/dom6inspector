<script lang="ts">
import FullTable from '$lib/component/FullTable.svelte';
import { dbStore } from '$lib/db/store';
</script>

{#await $dbStore}
  <p>Loading</p>
{:then dbs}
  <FullTable
    columns={dbs.columns}
    table={dbs.table}
  />
{:catch _err}
  <mark>Table failed to load.</mark>
{/await}

