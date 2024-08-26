<script setup lang="ts">
  import { computed } from 'vue';
  import { icons } from './icon';
  const props = defineProps<{ name: string; }>();
  const icon = computed(() => {
    const icon = icons[props.name];
    if (!icon) {
      console.warn(`icon "${props.name}" is not defined`)
      return null;
    }
    return icon;
  });
</script>

<template>
  <img
    v-if="icon"
    :width="icon.width"
    :height="icon.height"
    :src="icon.src"
    role="presentation"
  >
</template>
