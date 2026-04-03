<template>
    <div class="mx-16 grid h-16 grid-cols-[auto_1fr_auto] items-center">
        <NuxtLink to="/">
            <img src="../../assets/svg/favicon.svg" alt="" class="w-8 h-6 cursor-pointer">
        </NuxtLink>
        <div class="justify-self-center flex gap-6 rounded-full bg-[rgb(244,244,244)] px-4 py-1.5 items-center">
            <NuxtLink v-for="item in menu" :key="item.label" :to="item.to">
                {{ item.label }}
            </NuxtLink>

        </div>
        <img src="../../assets/svg/sun.svg" alt="" class="w-4 h-4 cursor-pointer">
    </div>
</template>

<script setup>
//导航栏菜单
const menu = [
    { label: 'Now', to: '/now' }, //最新文章
    { label: 'Writing', to: '/writing' }, //文章列表
    { label: 'Notes', to: '/notes' }, //一些碎碎语 随笔
    { label: 'About', to: '/about' }, // 关于我
    { label: 'Links', to: '/links' }, // 友链
    { label: 'Travelling', to: '/travelling' }, // 开往，后期会接入十年之约等
]


</script>