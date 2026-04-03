<template>
    <section class="mx-auto max-w-[720px] px-6 py-14 md:py-20">
        <article class="text-[#5c6a71]">
            <header>
                <h1 class="text-[40px] font-semibold tracking-tight text-[#4d5a61] md:text-[46px]">
                    写作
                </h1>
                <p class="mt-2 text-[14px] leading-7 text-[#8f8377]">
                    这里收录我在这个博客上公开发布的文章。目前共 {{ totalPosts }} 篇。
                </p>
            </header>

            <div class="mt-14 space-y-16 md:space-y-20">
                <section v-for="group in groupedPosts" :key="group.year">
                    <h2 class="text-[25px] font-semibold tracking-tight text-[#4d5a61]">
                        {{ group.year }}
                    </h2>

                    <div class="mt-7 space-y-9">
                        <article v-for="post in group.items" :key="`${group.year}-${post.title}`" class="group">
                            <a :href="post.href"
                                class="inline-block text-[23px] font-semibold tracking-tight text-[#556269] transition hover:text-[#404c53]">
                                {{ post.title }}
                            </a>

                            <div class="mt-2.5 space-y-0.5 text-[13px] leading-6 text-[#908478]">
                                <p>{{ post.monthZh }} · {{ post.monthFr }}</p>
                                <p>{{ post.date }}</p>
                            </div>
                        </article>
                    </div>
                </section>
            </div>
        </article>
    </section>
</template>

<script setup lang="ts">
const archive = [
    {
        year: 2026,
        items: [
            {
                title: '局部吸引子',
                href: '#',
                monthZh: '雨月',
                monthFr: 'PLUVIÔSE',
                date: '03-17',
            },
            {
                title: '岁时录（二十四）',
                href: '#',
                monthZh: '花月',
                monthFr: 'FLORÉAL',
                date: '03-13',
            },
            {
                title: 'Adult',
                href: '#',
                monthZh: '风月',
                monthFr: 'VENTÔSE',
                date: '03-10',
            },
            {
                title: '06',
                href: '#',
                monthZh: '昼夜平分',
                monthFr: 'ÉQUINOXE',
                date: '03-08',
            },
            {
                title: 'Hello, Sequoia PGP',
                href: '#',
                monthZh: '雨月',
                monthFr: 'PLUVIÔSE',
                date: '03-05',
            },
        ],
    },
    {
        year: 2025,
        items: [
            {
                title: '查戈斯群岛与 .io 的命运',
                href: '#',
                monthZh: '葡月',
                monthFr: 'VENDÉMIAIRE',
                date: '08-06',
            },
            {
                title: '献与被遗忘者',
                href: '#',
                monthZh: '雾月',
                monthFr: 'BRUMAIRE',
                date: '06-14',
            },
            {
                title: '关于表达与身份的一次整理',
                href: '#',
                monthZh: '霜月',
                monthFr: 'FRIMAIRE',
                date: '05-12',
            },
        ],
    },
    {
        year: 2024,
        items: [
            {
                title: '关于这个博客的开始',
                href: '#',
                monthZh: '芽月',
                monthFr: 'GERMINAL',
                date: '11-09',
            },
            {
                title: '记录一次缓慢的迁移',
                href: '#',
                monthZh: '牧月',
                monthFr: 'PRAIRIAL',
                date: '09-23',
            },
        ],
    },
]

const groupedPosts = archive
const totalPosts = archive.reduce((sum, group) => sum + group.items.length, 0)
</script>
