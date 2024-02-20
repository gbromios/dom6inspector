<script setup lang="ts">
  defineProps<{
    state: number,
    max: null|number,
    progress: null|number,
    message: string,
  }>();
</script>

<template>
  <div v-if="state > 0" role="status" class="bootstrap">
    <label for="app-loading">App Loading…</label>
    <progress id="app-loading" :max="max" :value="progress" >
      {{ message }}
    </progress>
  </div>
</template>



