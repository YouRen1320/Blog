<template>
    <div class="mx-16 grid h-16 grid-cols-[auto_1fr_auto] items-center">
        <img src="../../assets/svg/favicon.svg" alt="" class="w-8 h-6">
        <div class="justify-self-center flex gap-6 rounded-full bg-[rgb(244,244,244)] px-4 py-1.5 items-center">
            <div v-for="item in menu" :key="item" class="cursor-pointer text-[0.875rem] text-[#4a575c] ">{{ item }}
            </div>
        </div>
        <img src="../../assets/svg/sun.svg" alt="" class="w-4 h-4">
    </div>
</template>

<script setup>
import { ref } from 'vue';

// 现在 写作 最新 关于我 xxx
const menu = ref(['NOW', "WRITE", "WITH", "ME", "HERE"])
</script>
