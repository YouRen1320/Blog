<template>
    <section class="mx-auto max-w-[720px] px-6 py-14 md:py-20">
        <article class="text-[16px] leading-[1.95] text-[#5c6a71]">
            <header>
                <h1 class="text-[40px] font-semibold tracking-tight text-[#4d5a61] md:text-[46px]">
                    Links
                </h1>
                <p class="mt-2 text-[14px] leading-7 text-[#8f8377]">
                    一些我持续关注、愿意推荐，或者想认真保存下来的站点与链接。
                </p>
            </header>

            <div class="mt-14 space-y-16 md:space-y-20">
                <section v-for="group in groups" :key="group.title">
                    <h2 class="text-[25px] font-semibold tracking-tight text-[#4d5a61]">
                        {{ group.title }}
                    </h2>

                    <div class="mt-7 space-y-8">
                        <article v-for="item in group.items" :key="item.name">
                            <a :href="item.href" target="_blank" rel="noreferrer"
                                class="inline-block text-[22px] font-semibold tracking-tight text-[#556269] transition hover:text-[#404c53] hover:underline underline-offset-4">
                                {{ item.name }}
                            </a>

                            <p class="mt-1 text-[13px] text-[#8f8377]">
                                {{ item.href }}
                            </p>

                            <p class="mt-2 text-[15px] leading-8 text-[#617076]">
                                {{ item.description }}
                            </p>
                        </article>
                    </div>
                </section>
            </div>
        </article>
    </section>
</template>

<script setup lang="ts">
const groups = [
    {
        title: 'Friends',
        items: [
            {
                name: 'Chlorine',
                href: 'https://chlo.is/',
                description: '一个让我很喜欢的个人站，安静、克制，也很有自己的气质。',
            },
            {
                name: 'Example Friend',
                href: 'https://example.com/',
                description: '这里以后可以放你真正想交换友链的朋友站点。',
            },
        ],
    },
    {
        title: 'Places I Visit',
        items: [
            {
                name: 'Codeberg',
                href: 'https://codeberg.org/',
                description: '我会持续关注的一类独立开发与开源社区空间。',
            },
            {
                name: 'Fediverse',
                href: 'https://joinmastodon.org/',
                description: '相对缓慢、相对自由，也更容易形成真实连接的一种网络角落。',
            },
        ],
    },
    {
        title: 'Projects & References',
        items: [
            {
                name: 'NowNowNow',
                href: 'https://nownownow.com/about',
                description: '关于 now page 概念的来源说明，也是这类个人页面很重要的参考。',
            },
            {
                name: 'Krita',
                href: 'https://krita.org/',
                description: '如果后面继续练习绘画，这会是我大概率会常用的工具之一。',
            },
        ],
    },
]
</script>
