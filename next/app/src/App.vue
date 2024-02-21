<script setup lang="ts">
  import { RouterView } from 'vue-router';
  import { useStore } from './store';
  const store = useStore();

  store.initDB().then(() => {
    console.log('store is ready');
  })


</script>

<template>
  <div v-if="store.fatalError" class="bootstrap fatal-error">
    <strong>{{ store.fatalError }}</strong>
  </div>
  <LoadingApp v-else-if="store.loading.state !== 0" v-bind="store.loading"/>
  <main v-else class="main-view">
    <div class="scroll-wrapper">
      <RouterView />
    </div>
  </main>
</template>

<style lang="less">
  .main-view {
    overflow-y: hidden;
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
  }
  .scroll-wrapper {
    flex: 0 0 100%;
    min-height: 0;
    overflow-y: overlay;
  }
  .fatal-error {
    color: var(--hl-color);
  }
</style>
