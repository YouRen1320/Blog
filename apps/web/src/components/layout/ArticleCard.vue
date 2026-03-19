<template>
    <div
        class="w-90.5 h-85.25 border border-[#dbdbdb] bg-[#f7f7f7] shadow-[0_8px_30px_rgba(0,0,0,0.03)] rounded-2xl overflow-hidden">
        <img :src="post.cover" :alt="post.title" class="w-full h-45.75 object-cover">
        <div class="px-7 pt-7">
            <h3 class="text-[18px]  font-semibold text-[#535f64]">
                {{ post.title }}
            </h3>
            <div class="mt-3 text-[15px]  text-[#879194] font-extralight">
                {{ post.summary }}
            </div>
            <div class="mt-5 flex items-center gap-3 text-[12px] text-[#b6bcbe] font-extralight">
                <div>{{ post.date }}</div>

                <div class="flex items-center gap-2">
                    <span class="text-[20px]">🕙</span>
                    <span>{{ post.readingTime }}</span>
                </div>

                <div v-if="post.pinned" class="flex items-center gap-2 text-[#6f8f52]">
                    <span class="text-[20px]">★</span>
                    <span>置顶</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
interface PostCard {
    id: number
    season: string
    title: string
    author: string
    cover: string
    summary: string
    date: string
    readingTime: string
    pinned?: boolean
}

const props = defineProps<{
    post: PostCard
}>()
</script>
