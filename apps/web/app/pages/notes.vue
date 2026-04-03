<template>
    <section class="mx-auto max-w-[720px] px-6 py-14 md:py-20">
        <article class="text-[#5c6a71]">
            <header>
                <h1 class="text-[40px] font-semibold tracking-tight text-[#4d5a61] md:text-[46px]">
                    Notes
                </h1>
                <p class="mt-2 text-[14px] leading-7 text-[#8f8377]">
                    一些更短的记录、随笔和还没有长成正式文章的片段。
                </p>
            </header>

            <div class="mt-14 space-y-16 md:space-y-20">
                <section v-for="group in groupedNotes" :key="group.year">
                    <h2 class="text-[25px] font-semibold tracking-tight text-[#4d5a61]">
                        {{ group.year }}
                    </h2>

                    <div class="mt-7 space-y-8">
                        <article v-for="note in group.items" :key="`${group.year}-${note.title}`">
                            <a :href="note.href"
                                class="inline-block text-[21px] font-semibold tracking-tight text-[#556269] transition hover:text-[#404c53]">
                                {{ note.title }}
                            </a>

                            <p class="mt-2 text-[15px] leading-8 text-[#617076]">
                                {{ note.summary }}
                            </p>

                            <div class="mt-2 text-[13px] text-[#908478]">
                                <p>{{ note.date }}</p>
                            </div>
                        </article>
                    </div>
                </section>
            </div>
        </article>
    </section>
</template>

<script setup lang="ts">
const groupedNotes = [
    {
        year: 2026,
        items: [
            {
                title: '在深夜改页面时想到的事',
                href: '#',
                summary: '有些页面不是为了完成任务，而是为了让自己更确定想把什么留下来。',
                date: '04-02',
            },
            {
                title: '关于慢一点的写作',
                href: '#',
                summary: '比起立刻发布，我更想把一些句子放久一点，看看它们最后会变成什么。',
                date: '03-28',
            },
            {
                title: '一个人维护小站的快乐',
                href: '#',
                summary: '它不是特别高效，却会让我很清楚哪些东西是真正属于自己的。',
                date: '03-18',
            },
        ],
    },
    {
        year: 2025,
        items: [
            {
                title: '想把零散记录整理起来',
                href: '#',
                summary: '也许笔记、短句和随笔不必被严格区分，它们都可以先留在这里。',
                date: '12-06',
            },
            {
                title: '一些没有写成文章的话',
                href: '#',
                summary: '不是所有想法都需要被写成长文，短一点也很好。',
                date: '09-14',
            },
        ],
    },
]
</script>
