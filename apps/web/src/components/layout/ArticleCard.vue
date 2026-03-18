<template>
    <article
        class="mx-auto w-full max-w-6xl overflow-hidden rounded-4xl border border-[#d9d9d6] bg-[#f8f7f3] text-[#4e5c63] shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
        <div class="grid min-h-92 gap-0 md:grid-cols-[1.45fr_1fr]">
            <div class="flex flex-col justify-between border-b border-[#ebe9e2] p-12 md:border-b-0 md:border-r">
                <div>
                    <div class="text-[15px] tracking-[0.45em] text-[#9da4a6]">
                        {{ post.season }}
                    </div>

                    <div class="mt-4 h-1 w-14 bg-[#6f8c5c]"></div>

                    <h2 class="mt-10 max-w-105 text-[clamp(2rem,4vw,3.5rem)] leading-[1.18] font-medium text-[#4c5258]">
                        {{ post.title }}
                    </h2>
                </div>

                <div
                    class="mt-12 text-[clamp(2rem,3.2vw,3rem)] leading-none text-[#bcc3c5] font-['Snell_Roundhand','STKaiti',cursive] italic">
                    {{ post.author }}
                </div>
            </div>

            <div class="h-full min-h-80 bg-[#181818]">
                <img :src="post.cover" :alt="post.title" class="h-full w-full object-cover" />
            </div>
        </div>

        <div class="border-t border-[#ebe9e2] px-12 py-10">
            <h3 class="text-[clamp(1.9rem,3vw,3rem)] leading-tight font-semibold text-[#4e5c63]">
                {{ post.title }}
            </h3>

            <p class="mt-8 text-[clamp(1.25rem,2vw,2rem)] leading-[1.7] text-[#6f7e84]">
                {{ post.summary }}
            </p>

            <div
                class="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4 text-[clamp(1.1rem,1.6vw,1.85rem)] text-[#96a0a4]">
                <span>{{ post.date }}</span>

                <span class="flex items-center gap-3">
                    <svg viewBox="0 0 24 24" class="h-7 w-7 text-[#96a0a4]" fill="none" stroke="currentColor"
                        stroke-width="1.8">
                        <circle cx="12" cy="12" r="9" />
                        <path stroke-linecap="round" d="M12 7v5l3 2" />
                    </svg>
                    {{ post.readingTime }}
                </span>

                <span v-if="post.pinned" class="flex items-center gap-3 text-[#6f8c5c]">
                    <svg viewBox="0 0 24 24" class="h-7 w-7 fill-current" aria-hidden="true">
                        <path
                            d="M12 2.5l2.78 5.64 6.22.9-4.5 4.39 1.06 6.2L12 16.7l-5.56 2.93 1.06-6.2L3 9.04l6.22-.9L12 2.5z" />
                    </svg>
                    置顶
                </span>
            </div>
        </div>
    </article>
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
