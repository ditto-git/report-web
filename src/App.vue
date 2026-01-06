<template>
  <router-view />
  <FontSizeControl />
</template>

<script setup>
import FontSizeControl from './components/FontSizeControl.vue'
</script>

<style>
#app {
  width: 100%;
  min-height: 100vh;
}
</style>

