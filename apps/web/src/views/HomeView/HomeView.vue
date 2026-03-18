<template>
    <HomeHero />
    <ArticleCard v-for="item in PostList" :key="item.id" :post="item" />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import HomeHero from '@/views/HomeView/HomeHero.vue';
import ArticleCard from '@/components/layout/ArticleCard.vue'
import IoCover from '@/assets/image/Io.webp'
import ChronicleCover from '@/assets/image/chronicle.webp'
import GradientCover from '@/assets/image/gradient.webp'
import IssuesCover from '@/assets/image/Issues.webp'
import LattractionCover from '@/assets/image/lattraCtion.webp'
import SequaiaCover from '@/assets/image/sequaia.webp'

// 文章列表描述
const posts = ref([
    {
        id: 1,
        season: 'VENDÉMIAIRE',
        title: '查戈斯群岛与 .io 的命运',
        author: 'Chlorine',
        cover: IoCover,
        summary: '献与被遗忘者。',
        date: '2025-08-06',
        readingTime: '22 min read',
        pinned: true,
    },
    {
        id: 2,
        season: 'PLUVIÔSE',
        title: '局部吸引子',
        author: 'Chlorine',
        cover: ChronicleCover,
        summary: '一台 MacBook，可以用十年吗？',
        date: '2026-03-17',
        readingTime: '24 min read',
    },
    {
        id: 3,
        season: 'FLORÉAL',
        title: '岁时录（二十四）',
        author: 'Chlorine',
        cover: GradientCover,
        summary: '如若不知道该写什么，就写周报好了。',
        date: '2026-03-13',
        readingTime: '20 min read',
    },
    {
        id: 4,
        season: 'VENTÔSE',
        title: 'Adult',
        author: 'Chlorine',
        cover: IssuesCover,
        summary: '长大以后，问题并不会自动消失。',
        date: '2026-03-10',
        readingTime: '18 min read',
    },
    {
        id: 5,
        season: 'ÉQUINOXE',
        title: '06',
        author: 'Chlorine',
        cover: LattractionCover,
        summary: '记录一次视觉与代码之间的尝试。',
        date: '2026-03-08',
        readingTime: '16 min read',
    },
    {
        id: 6,
        season: 'PLUVIÔSE',
        title: 'Hello, Sequoia PGP',
        author: 'Chlorine',
        cover: SequaiaCover,
        summary: '关于密钥、身份与表达的一点整理。',
        date: '2026-03-05',
        readingTime: '19 min read',
    },
    {
        id: 7,
        season: 'AUTUMN',
        title: '第七篇文章',
        author: 'Chlorine',
        cover: IoCover,
        summary: '这条不会显示，因为只取前 6 条。',
        date: '2026-03-01',
        readingTime: '12 min read',
    },
])
const PostList = computed(() => posts.value.slice(0, 6));
</script>