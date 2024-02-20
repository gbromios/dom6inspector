<script setup lang="ts">
  import { ref, reactive } from 'vue';
  import LoadingApp from './LoadingApp.vue';
  // need db...
  const loading = reactive({
    state: 1,
    message: 'POOPOOPEEPEE',
    progress: null,
    max: null,
  });

  const db = createStore();

</script>

<template>
  <LoadingApp v-if="loading.state > 0" v-bind="loading"/>
</template>


