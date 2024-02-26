<script setup lang="ts">
  import type { FTColumn } from './column';
  import ImgIcon from './ImgIcon.vue';
  defineProps<{
    tableName: string;
    column: FTColumn;
  }>();
</script>

<template>
  <ImgIcon class="bool-head" :name="column.labelProps.icon" />
</template>

<style lang="less">
  img.bool-head {
    height: 16px;
    width: 16px;
  }
</style>

