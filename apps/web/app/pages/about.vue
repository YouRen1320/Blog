<template>
    <section class="mx-auto max-w-[720px] px-6 py-14 md:py-20">
        <article class="text-[16px] leading-[1.95] text-[#5c6a71]">
            <header>
                <h1 class="text-[40px] font-semibold tracking-tight text-[#4d5a61] md:text-[46px]">
                    About
                </h1>
                <p class="mt-2 text-[14px] leading-7 text-[#8f8377]">
                    关于我，也关于这个站点为什么会以这样的方式存在。
                </p>
            </header>

            <section class="mt-9 border-l-2 border-[#e8dfd2] pl-5">
                <h2 class="text-[18px] font-medium text-[#5a666d]">Contents</h2>
                <nav class="mt-3 text-[15px] text-[#67747b]">
                    <ul class="space-y-2">
                        <li v-for="section in sections" :key="section.id">
                            <a :href="`#${section.id}`" class="transition hover:text-[#49565d] hover:underline underline-offset-4">
                                {{ section.title }}
                            </a>
                        </li>
                    </ul>
                </nav>
            </section>

            <div class="mt-11 space-y-12">
                <section id="who-am-i" class="scroll-mt-24">
                    <h2 class="text-[29px] font-semibold tracking-tight text-[#4d5a61]">Who am I</h2>
                    <div class="mt-4 space-y-5">
                        <p>
                            我是 YouRen。平时写代码，也写一点文字，偶尔会把一些和技术、表达、审美有关的想法放到这里。
                        </p>
                        <p>
                            我不太想把自己定义得过于固定。与其说我是什么，不如说我一直在不同兴趣之间移动，然后慢慢学着把它们整理成一个更完整的自我。
                        </p>
                    </div>
                </section>

                <section id="what-i-do" class="scroll-mt-24">
                    <h2 class="text-[29px] font-semibold tracking-tight text-[#4d5a61]">What I do</h2>
                    <div class="mt-4 space-y-5">
                        <p>
                            现在我主要把精力放在编程、写作和持续学习上。对我来说，这三件事并不是彼此分开的，它们经常会在同一段时间里互相影响。
                        </p>
                        <p>
                            我喜欢那种既能动手做、又能留下痕迹的事情：做一个页面、写一篇文章、整理一个长期会继续维护的小项目。
                        </p>
                    </div>
                </section>

                <section id="this-blog" class="scroll-mt-24">
                    <h2 class="text-[29px] font-semibold tracking-tight text-[#4d5a61]">This blog</h2>
                    <div class="mt-4 space-y-5">
                        <p>
                            这个博客对我来说，不只是一个放内容的地方。它更像一个稳定的自留地：可以慢慢写，慢慢改，也可以允许自己在这里保留一些还没有完全成形的想法。
                        </p>
                        <p>
                            我希望它不是一个只追求更新频率的站点，而是一个能够长久留下来、持续生长的地方。
                        </p>
                    </div>
                </section>

                <section id="contact" class="scroll-mt-24">
                    <h2 class="text-[29px] font-semibold tracking-tight text-[#4d5a61]">Contact</h2>
                    <div class="mt-4 space-y-5">
                        <p>
                            如果之后你想通过友链、站点交流、或者其他方式联系我，这里会慢慢补上更完整的联系方式。
                        </p>
                        <p>
                            目前你也可以先把这里当成一个持续更新的自我介绍页。
                        </p>
                    </div>
                </section>
            </div>
        </article>
    </section>
</template>

<script setup lang="ts">
const sections = [
    { id: 'who-am-i', title: 'Who am I' },
    { id: 'what-i-do', title: 'What I do' },
    { id: 'this-blog', title: 'This blog' },
    { id: 'contact', title: 'Contact' },
]
</script>
