<script setup lang="ts" generic="T = any">
import type { FTColumn } from './column';
import { computed } from 'vue';

const props = defineProps<{
  tableName: string,
  columns: FTColumn[],
  row: T,
}>();

const data = computed(() => {
  const item = props.row;
  return props.columns.map((col: FTColumn) => ({
    col,
    key: col.key,
    itemComponent: col.itemComponent,
    text: (col.getItemText ? col.getItemText(item) : item[col.key]) ?? null,
  }));
});

</script>

<template>
  <tr>
    <td v-for="{ col, key, itemComponent, text } of data" :key="key">
      <component
        v-if="itemComponent"
        :is="itemComponent"
        :item="row"
        :col="col"
        :key="key"
        :table-name="tableName"
      />
      <p v-else-if="text != null">
        {{ text }}
      </p>
    </td>
  </tr>
</template>

<style lang="less">
</style>


