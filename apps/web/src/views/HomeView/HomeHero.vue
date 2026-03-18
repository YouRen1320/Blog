<template>
    <section class="flex items-center justify-center">
        <div class="grid grid-cols-[auto_auto] items-center gap-18 mt-32 w-6xl h-64s">
            <div class="max-w-300 py-7">
                <h1 class="text-[42px] font-semibold text-[#4e5c63]">
                    SYN. YouRen here.
                </h1>

                <div class="mt-5 flex flex-wrap gap-3 text-[14px]">
                    <div v-for="tag in tags" :key="tag"
                        class="rounded-full bg-[rgb(244,244,244)] px-4 py-1.5 items-center text-[#66757c]">
                        {{ tag }}
                    </div>
                </div>

                <p class="mt-8 text-[18px]  text-[#627075]">
                    A person who got lost on the path of life.
                </p>

                <div class="mt-4 flex items-center gap-4">
                    <a v-for="social in socials" :key="social.label" :href="social.href" :aria-label="social.label"
                        class="group w-15 h-15 flex items-center justify-center rounded-full bg-[#f4f4f4]  hover:0 relative">
                        <img :src="social.icon" :alt="social.label" class="h-5 w-5 object-contain opacity-90">
                        <span
                            class="pointer-events-none absolute top-12 left-1/2 -translate-x-1/2 text-[#66757c] whitespace-nowrap rounded-full bg-[rgb(244,244,244)] px-4 py-1.5 opacity-0 transition-opacity group-hover:opacity-100 text-[14px]">
                            {{ social.label }}
                        </span>
                    </a>
                </div>
            </div>

            <img :src="headImage" alt="YouRen avatar" class="w-66.25 h-66.25 rounded-full ">
        </div>
    </section>

    <div class="flex justify-center items-center">
        <img :src="downPageIcon" alt="Scroll down" class="mt-36 h-6 w-6 cursor-pointer">
    </div>
</template>

<script setup lang="ts">
import headImage from '../../assets/image/head.jpg'
import atomIcon from '../../assets/svg/atom.svg'
import codebergIcon from '../../assets/svg/codeberg.svg'
import downPageIcon from '../../assets/svg/Down_Page.svg'
import fediverseIcon from '../../assets/svg/febiverse.svg'
import forgejoIcon from '../../assets/svg/forgejo.svg'
import homeIcon from '../../assets/svg/home.svg'
import openPgpIcon from '../../assets/svg/openPGP_Public_Key.svg'

const tags = ['Quadratic Element', 'Full-stack Development Engineer', 'Independent Developer', 'Programmer']

const socials = [
    { label: 'Home', href: '#', icon: homeIcon },
    { label: 'Atom', href: '#', icon: atomIcon },
    { label: 'Fediverse', href: '#', icon: fediverseIcon },
    { label: 'Forgejo', href: '#', icon: forgejoIcon },
    { label: 'Codeberg', href: '#', icon: codebergIcon },
    { label: 'OpenPGP', href: '#', icon: openPgpIcon }
]
</script>
