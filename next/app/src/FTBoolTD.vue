<script setup lang="ts">
  import type { FTColumn } from './column';

  defineProps<{
    column: FTColumn
    item: unknown,
    opts?: { icon: string },
    value: boolean;
    text: string;
  }>();
</script>

<template>
  <span class="bool-item" :style="{ color: value ? 'limegreen' : 'tomato' }">
    {{ value ? '✓' : '✗' }}
  </span>
</template>

<style lang="less">
  .bool-item {
    user-select: none;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>

