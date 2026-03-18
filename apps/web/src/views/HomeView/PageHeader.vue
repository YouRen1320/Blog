<template>
    <div class="mx-16 grid h-16 grid-cols-[auto_1fr_auto] items-center">
        <router-link :to="{ name: 'home' }"><img src="../../assets/svg/favicon.svg" alt=""
                class="w-8 h-6 cursor-pointer"></router-link>
        <div class="justify-self-center flex gap-6 rounded-full bg-[rgb(244,244,244)] px-4 py-1.5 items-center">
            <router-link v-for="item in menu" :key="item.routeName" :to="{ name: item.routeName }">{{ item.label
                }}</router-link>
        </div>
        <img src="../../assets/svg/sun.svg" alt="" class="w-4 h-4 cursor-pointer">
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// 现在 写作 最新 关于我 xxx
const menu = ref([
    { label: 'NOW', routeName: 'nowadays' },
    { label: 'WRITE', routeName: 'old-time-blues' },
    { label: 'WITH', routeName: 'notice-board' },
    { label: 'ME', routeName: 'regarding-me' },
    { label: 'HERE', routeName: 'code-here' },
]
)
</script>
