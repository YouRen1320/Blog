<template>
  <PageHeader />
  <router-view></router-view>
  <PageFooter />
</template>

<script setup lang="ts">
import PageHeader from '@/views/HomeView/PageHeader.vue'
import PageFooter from './views/HomeView/PageFooter.vue';

</script>
