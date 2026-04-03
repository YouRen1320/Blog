<template>
    <section class="mx-auto max-w-[720px] px-6 py-14 md:py-20">
        <article class="text-[16px] leading-[1.95] text-[#5c6a71]">
            <header>
                <h1 class="text-[42px] font-semibold tracking-tight text-[#4d5a61] md:text-[48px]">
                    如今
                </h1>
                <div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-[#8f8377]">
                    <span>3 min read</span>
                    <span>·</span>
                    <span>约 1.2k 字</span>
                    <span>·</span>
                    <span>2026-04-02 更新</span>
                </div>
            </header>

            <section class="mt-9 border-l-2 border-[#e8dfd2] pl-5">
                <h2 class="text-[18px] font-medium text-[#5a666d]">目录</h2>
                <nav class="mt-3 text-[15px] text-[#67747b]">
                    <ul class="space-y-2">
                        <li v-for="section in sections" :key="section.id">
                            <a :href="`#${section.id}`" class="transition hover:text-[#49565d] hover:underline underline-offset-4">
                                {{ section.title }}
                            </a>
                            <ul v-if="section.children" class="mt-2 space-y-1.5 pl-5 text-[14px] text-[#8b7d70]">
                                <li v-for="child in section.children" :key="child.id">
                                    <a :href="`#${child.id}`" class="transition hover:text-[#49565d] hover:underline underline-offset-4">
                                        {{ child.title }}
                                    </a>
                                </li>
                            </ul>
                        </li>
                    </ul>
                </nav>
            </section>

            <div class="mt-11 space-y-12">
                <section id="about-now" class="scroll-mt-24">
                    <h2 class="text-[29px] font-semibold tracking-tight text-[#4d5a61]">有关 /now</h2>
                    <div class="mt-4 space-y-5">
                        <p>
                            “Now page” 的概念来自 Derek Sivers 与 nownownow.com。它不是动态列表，也不适合记录所有零碎小事，而是用来说明：在这个阶段，我究竟在把时间和注意力放在哪里。
                        </p>
                        <blockquote class="border-l-2 border-[#e3dacf] pl-4 italic text-[#7d7267]">
                            A now page is a page that tells you what this person is focused on at this point in their life.
                        </blockquote>
                        <p>
                            因此，这一页会偏向生活与兴趣的总体状态，而不是过分细小的即时更新。如果只是一些短句、碎片和偶发念头，它们更适合留在别处，比如社交平台或更轻量的时间线里。
                        </p>
                    </div>
                </section>

                <section id="chlorine" class="scroll-mt-24">
                    <h2 class="text-[29px] font-semibold tracking-tight text-[#4d5a61]">小氯</h2>
                    <div class="mt-4 space-y-5">
                        <p>
                            我是 YouRen。写代码、写作、做一些与表达相关的东西，构成了我现在大部分稳定而重复的日常。
                        </p>
                        <p>
                            我并不太擅长把自己定义成一个单一身份。更准确地说，我总在工程、叙述、审美与兴趣之间来回移动，然后在这些移动里慢慢找到一点属于自己的节奏。
                        </p>
                    </div>
                </section>

                <section id="life" class="scroll-mt-24">
                    <h2 class="text-[29px] font-semibold tracking-tight text-[#4d5a61]">生活概况</h2>

                    <div class="mt-6 space-y-10">
                        <section id="research" class="scroll-mt-24">
                            <h3 class="text-[22px] font-semibold text-[#56646a]">预研</h3>
                            <div class="mt-3 space-y-4">
                                <p>
                                    最近有不少精力放在预研上。更准确地说，是为接下来的研究方向做准备：读论文、记问题、和前辈交流，再慢慢判断什么值得继续投入。
                                </p>
                                <p>
                                    这个过程并不总能立刻得到结果，但它正在持续改变我看待技术、方法和人与系统关系的方式，也影响着我接下来想继续读什么、写什么。
                                </p>
                            </div>
                        </section>

                        <section id="writing" class="scroll-mt-24">
                            <h3 class="text-[22px] font-semibold text-[#56646a]">乱写</h3>
                            <div class="mt-3 space-y-4">
                                <p>
                                    最近也重新恢复了一点写作热情，所以开始更认真地维护这个博客。把一些会在脑海里迅速散掉的东西写下来，本身就很像在替自己做整理。
                                </p>
                                <p>
                                    我想继续写，不只是想留下内容，也是因为写作会逼我重新组织经验、重新理解读到的材料。技术写作和非技术写作，我都想慢慢捡回来。
                                </p>
                            </div>
                        </section>

                        <section id="community" class="scroll-mt-24">
                            <h3 class="text-[22px] font-semibold text-[#56646a]">菌落</h3>
                            <div class="mt-3 space-y-4">
                                <p>
                                    我依然把很多注意力放在人与人的连接上。最近尤其喜欢那种比较慢、比较轻、没有太强算法牵引的交流方式：能说话，能旁观，也能只是安静地看见彼此的存在。
                                </p>
                                <p>
                                    这种连接感未必能直接转化成某种产出，但它会让我更清楚自己为什么还想继续表达、继续写、继续维护一个属于自己的小站。
                                </p>
                            </div>
                        </section>

                        <section id="drawing" class="scroll-mt-24">
                            <h3 class="text-[22px] font-semibold text-[#56646a]">想学绘画</h3>
                            <div class="mt-3 space-y-4">
                                <p>
                                    另外一个反复出现的念头，是想慢慢把绘画重新拾起来。不是为了立刻变得专业，而是希望自己能拥有一种更直接、也更私人的视觉表达方式。
                                </p>
                                <p>
                                    现在的目标很简单：先从头像、小图和配色练习开始。哪怕进展很慢，只要最后能做出一些真正属于自己的东西，我就会很高兴。
                                </p>
                            </div>
                        </section>
                    </div>
                </section>
            </div>
        </article>
    </section>
</template>

<script setup lang="ts">
const sections = [
    { id: 'about-now', title: '有关 /now' },
    { id: 'chlorine', title: '小氯' },
    {
        id: 'life',
        title: '生活概况',
        children: [
            { id: 'research', title: '预研' },
            { id: 'writing', title: '乱写' },
            { id: 'community', title: '菌落' },
            { id: 'drawing', title: '想学绘画' },
        ],
    },
]
</script>