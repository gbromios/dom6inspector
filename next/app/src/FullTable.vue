<script setup lang="ts">
import type { FTColumn } from './column';
import { computed } from 'vue';
import { useStore } from './store';
import FullRow from './FullRow.vue';

const props = defineProps<{ tableName: string; }>();
const store = useStore();
const table = computed(() => store.db?.tables[props.tableName] ?? null);
const columns = computed(() => store.columns[props.tableName])
</script>

<template>
  <table v-if="table" table class="full-table">
    <thead>
      <th
        v-for="col of store.columns[table.name]"
        :key="col.key"
      >
        <component
          v-if="col.labelComponent"
          :is="col.labelComponent"
          :col="col"
          :table-name="table.name"
        />
        <span v-else>
          {{ col.labelText }}
        </span>
      </th>
    </thead>
    <tbody>
      <FullRow
        v-for="item of table.items"
        :table-name="table.name"
        :key="table.rowKey"
        :columns="columns"
        :item="item"
      />
    </tbody>
  </table>
</template>

<style lang="less">
  .full-table {
    border-spacing: 0;
    width: 100%;
    & > thead {
      position: sticky;
      background-color: #222;
      top: 0;
    }
    & th {
      padding: 4px;
      border: 1px solid var(--se-color);
      text-align: left;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    & td {
      padding: 4px;
      border: 1px solid var(--se-color);
    }
  }
</style>

