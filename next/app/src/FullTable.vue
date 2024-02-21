<script setup lang="ts">
import type { FTColumn } from './column';
import FullRow from './FullRow.vue';

const props = defineProps<{
  name: string,
  rows: any[],
  columns: FTColumn[],
  rowKey: string,
}>();

console.log('FT COLUMNS', props.columns);
</script>

<template>
  <table class="full-table">
    <thead>
      <th
        v-for="col of columns"
        :key="col.key"
      >
        <component
          v-if="col.labelComponent"
          :is="col.labelComponent"
          :col="col"
          :table-name="name"
        />
        <span v-else="">{{ col.labelText }}</span>
      </th>
    </thead>
    <tbody>
      <FullRow
        v-for="row of rows"
        :table-name="name"
        :key="rowKey"
        :row="row"
        :columns="columns"
      />
    </tbody>
  </table>
</template>

<style lang="less">
  .full-table {
    border-spacing: 0;
    width: 100%;
  }
  .full-table > thead {
    position: sticky;
    background-color: #222;
    top: 0;
  }
  .full-table th, .full-table td {
    padding: 4px;
    border: 1px solid var(--se-color);
  }
</style>

