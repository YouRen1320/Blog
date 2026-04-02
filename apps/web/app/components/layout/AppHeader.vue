<template>
    <div class="mx-16 grid h-16 grid-cols-[auto_1fr_auto] items-center">
        <NuxtLink to="/">
            <img src="../../assets/svg/favicon.svg" alt="" class="w-8 h-6 cursor-pointer">
        </NuxtLink>
        <div class="justify-self-center flex gap-6 rounded-full bg-[rgb(244,244,244)] px-4 py-1.5 items-center">
            <NuxtLink v-for="item in menu" :key="item.to" :to="item.to">
                {{ item.label }}
            </NuxtLink>

        </div>
        <img src="../../assets/svg/sun.svg" alt="" class="w-4 h-4 cursor-pointer">
    </div>
</template>

<script setup>
//导航栏菜单
const menu = [
    { label: 'Now', to: '/now' },
    { label: 'Writing', to: '/writing' },
    { label: 'Notes', to: '/notes' },
    { label: 'About', to: '/about' },
    { label: 'Code', to: '/code' },
]


</script>