<script setup lang="ts" generic="T = any">
import type { FTColumn } from './column';
import { computed } from 'vue';

defineProps<{
  tableName: string,
  columns: FTColumn[],
  item: T,
}>();

//const text = computed(() => )

</script>

<template>
  <tr>
    <td v-for="col of columns" :key="col.key">
      <component
        v-if="col.itemComponent"
        :key="col.key"
        :is="col.itemComponent"
        :item="item"
        :col="col"
        :table-name="tableName"
      />
      <span v-else="text != null">
        {{ col.getItemText(item) }}
      </span>
    </td>
  </tr>
</template>

<style lang="less">
</style>


