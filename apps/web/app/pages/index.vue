<template>
    <section class="relative mx-auto h-[calc(100vh-64px)] max-w-7xl px-6">
        <div class="grid h-full items-center gap-[72px] lg:grid-cols-[1fr_auto]">
            <div class="max-w-[720px] py-7">
                <h1 class="text-[42px] font-semibold tracking-tight text-[#4e5c63] md:text-[56px]">
                    SYN. YouRen here.
                </h1>

                <div class="mt-5 flex flex-wrap gap-3 text-[14px]">
                    <div v-for="tag in tags" :key="tag"
                        class="rounded-full bg-[rgb(244,244,244)] px-4 py-1.5 text-[#66757c]">
                        {{ tag }}
                    </div>
                </div>

                <p class="mt-8 text-[18px] text-[#627075] md:text-[22px]">
                    A person who got lost on the path of life.
                </p>

                <div class="mt-8 flex items-center gap-4">
                    <a v-for="social in socials" :key="social.label" :href="social.href" :aria-label="social.label"
                        class="group relative flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#f4f4f4] transition hover:-translate-y-0.5">
                        <img :src="social.icon" :alt="social.label" class="h-5 w-5 object-contain opacity-90">

                        <span
                            class="pointer-events-none absolute top-[56px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[rgb(244,244,244)] px-4 py-1.5 text-[14px] text-[#66757c] opacity-0 transition-opacity group-hover:opacity-100">
                            {{ social.label }}
                        </span>
                    </a>
                </div>
            </div>

            <div class="relative flex justify-center">
                <div class="absolute inset-0 m-auto h-[320px] w-[320px] rounded-full bg-[#dfe7c8]/60 blur-3xl"></div>
                <img :src="headImage" alt="YouRen avatar"
                    class="relative h-[265px] w-[265px] rounded-full object-cover shadow-[0_20px_60px_rgba(180,200,160,0.28)] md:h-[360px] md:w-[360px]">
            </div>
        </div>

        <NuxtLink to="#articles"
            class="absolute bottom-10 left-1/2 -translate-x-1/2 opacity-70 transition hover:opacity-100"
            aria-label="Scroll to articles">
            <img :src="downPageIcon" alt="Scroll down" class="h-6 w-6 cursor-pointer">
        </NuxtLink>

    </section>

    <section id="articles" class="mx-auto mt-[120px] max-w-7xl px-6">
        <div class="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            <ArticleCard v-for="item in postList" :key="item.id" :post="item" />
        </div>

        <div class="mt-6 flex justify-end pr-6">
            <div
                class="flex h-[52.5px] w-[162px] cursor-pointer items-center justify-center rounded-lg border border-[#d9d9d9] bg-white font-mono text-[16px] text-[#5f6a6f] shadow-[0_6px_20px_rgba(0,0,0,0.04)] transition hover:bg-[#f8f8f8]">
                <span class="mr-4 text-[28px]">→</span>
                <span>阅读更多</span>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import ArticleCard from '../components/ArticleCard.vue'
import headImage from '../assets/image/head.jpg'
import IoCover from '../assets/image/Io.webp'
import ChronicleCover from '../assets/image/chronicle.webp'
import GradientCover from '../assets/image/gradient.webp'
import IssuesCover from '../assets/image/Issues.webp'
import LattractionCover from '../assets/image/lattraCtion.webp'
import SequaiaCover from '../assets/image/sequaia.webp'

import atomIcon from '../assets/svg/atom.svg'
import codebergIcon from '../assets/svg/codeberg.svg'
import downPageIcon from '../assets/svg/Down_Page.svg'
import fediverseIcon from '../assets/svg/febiverse.svg'
import forgejoIcon from '../assets/svg/forgejo.svg'
import homeIcon from '../assets/svg/home.svg'
import openPgpIcon from '../assets/svg/openPGP_Public_Key.svg'

const tags = [
    'Quadratic Element',
    'Full-stack Development Engineer',
    'Independent Developer',
    'Programmer',
]

const socials = [
    { label: 'Home', href: '#', icon: homeIcon },
    { label: 'Atom', href: '#', icon: atomIcon },
    { label: 'Fediverse', href: '#', icon: fediverseIcon },
    { label: 'Forgejo', href: '#', icon: forgejoIcon },
    { label: 'Codeberg', href: '#', icon: codebergIcon },
    { label: 'OpenPGP', href: '#', icon: openPgpIcon },
]

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

const postList = computed(() => posts.value.slice(0, 6))
</script>
