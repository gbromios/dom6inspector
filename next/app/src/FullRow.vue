<script setup lang="ts" generic="T = any">
import type { FTColumn } from './column';
import { computed } from 'vue';

const props = defineProps<{
  tableName: string,
  columns: FTColumn[],
  item: T,
}>();

const tds = computed(() => props.columns.map(column => {
  const text = column.getItemText(props.item);
  return {
    key: column.key,
    text,
    comp: column.itemComponent,
    props: column.itemComponent ? {
      column,
      item: props.item,
      value: props.item[column.key],
      tableName: props.tableName,
      opts: column.itemProps,
      text,
    } : null,
  }

}))
</script>

<template>
  <tr>
    <td v-for="{ text, key, comp, props } of tds" :key="key">
      <component v-if="comp" :is="comp" v-bind="props" />
      <span v-else="text != null">{{ text }}</span>
    </td>
  </tr>
</template>

<style lang="less">
</style>


