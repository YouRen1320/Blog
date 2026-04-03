<template>
    <section class="mx-auto max-w-[720px] px-6 py-14 md:py-20">
        <article class="text-[16px] leading-[1.95] text-[#5c6a71]">
            <header>
                <h1 class="text-[40px] font-semibold tracking-tight text-[#4d5a61] md:text-[46px]">
                    Travelling
                </h1>
                <p class="mt-2 text-[14px] leading-7 text-[#8f8377]">
                    这是一个暂时性的跳转页，用来安放我之后会慢慢接入的项目、计划和外部入口。
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
                <section id="about-this-page" class="scroll-mt-24">
                    <h2 class="text-[29px] font-semibold tracking-tight text-[#4d5a61]">About this page</h2>
                    <div class="mt-4 space-y-5">
                        <p>
                            这里不会是一个传统意义上的“文章页”，而更像是一个中转站。以后如果我接入开往、十年之约，或者整理一些值得单独放出来的外部入口，它们会逐步被放到这里。
                        </p>
                        <p>
                            在真正接好这些外部链接之前，这一页先作为一个保留位置，说明它将来会承担什么角色。
                        </p>
                    </div>
                </section>

                <section id="plans" class="scroll-mt-24">
                    <h2 class="text-[29px] font-semibold tracking-tight text-[#4d5a61]">Plans</h2>
                    <div class="mt-4 space-y-5">
                        <p>
                            目前比较明确的方向，是把一些和个人站、独立博客、站点互访有关的计划接进来。这样这个页面就不会只是一个链接出口，而会慢慢变成一个更完整的入口页。
                        </p>
                        <p>
                            等这些内容逐渐稳定之后，我会把对应的地址、说明和状态也补充完整。
                        </p>
                    </div>
                </section>

                <section id="future-destinations" class="scroll-mt-24">
                    <h2 class="text-[29px] font-semibold tracking-tight text-[#4d5a61]">Future destinations</h2>
                    <div class="mt-4 space-y-4 text-[15px] leading-8 text-[#617076]">
                        <p>接下来可能会放在这里的内容包括：</p>
                        <ul class="list-disc space-y-2 pl-6 marker:text-[#b4a798]">
                            <li>开往 / Travellings 相关入口</li>
                            <li>十年之约等长期博客计划</li>
                            <li>与个人站有关的公共页面或项目跳转</li>
                        </ul>
                    </div>
                </section>
            </div>
        </article>
    </section>
</template>

<script setup lang="ts">
const sections = [
    { id: 'about-this-page', title: 'About this page' },
    { id: 'plans', title: 'Plans' },
    { id: 'future-destinations', title: 'Future destinations' },
]
</script>
