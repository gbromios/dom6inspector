<script lang="ts">
import type { Column } from '$lib/table-defs/column';
import BoolTH from './Column/Bool.svelte';
export let table: any;
export let columns: Column[];
const tcase = [
  40, 85, 473, 475, 343, 3467, 2530, 2483, 3420,
  486, 571, 574, 570, 764, 781, 912, 913, 1291, 1294,
  1292, 1284, 1397, 1553, 1710, 1763, 1849, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 12, 13, 14, 15, 16,
]

//const titems = tcase.map(i => table.items[i]);
const titems = table.items.sort((a, b) => {
  const aN = a.name.n.length + ((a.name.f + 2).length || 0)
  const bN = b.name.n.length + ((b.name.f + 2).length || 0)
  return bN - aN
}).slice(0, 256);

// TODO - smarter
const flex = {
  id: '0 0 3em',
  name: '1 1 auto',
  holy: '0 0 2em',
  rt: '0 0 6em',
  magicpaths: '0 0 16em',
}

</script>

<section class="ft-table" role="table">
  <div class="ft-head" role="rowgroup">
    {#each columns as column (column.key)}
      <div
        class="ft-col"
        role="columnheader"
        title={column.labelText}
        style="flex: {column.size}"
        data-key={column.key}
      >
        {#if column.labelComponent}
          <svelte:component
            this={BoolTH}
            text={column.labelText}
            {...column.labelProps}
          />
        {:else}
          <span class="text">{column.labelText}</span>
        {/if}
      </div>
    {/each}
  </div>
  <div class="ft-body" role="rowgroup">
    {#each titems as item (item[table.rowKey])}
      <article role="row" class="ft-row">
        {#each columns as column (column.key)}
          <div
            class="ft-data"
            role="cell"
            data-key={column.key}
            style="flex: {column.size}"
          >
            {#if item[column.key] == null}
            {:else if column.itemComponent}
              <svelte:component
                this={column.itemComponent}
                value={item[column.key]}
                item={item}
              />
            {:else}
              <span class="text">
              {column.getItemText(item)}
              </span>
            {/if}
          </div>
        {/each}
      </article>
    {/each}
  </div>
</section>
