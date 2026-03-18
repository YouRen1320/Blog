import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView/HomeView.vue';
import NowaDays from '@/views/NowaDays/NowaDays.vue';
import OldTimeBlues from '@/views/OldTimeBlues/OldTimeBlues.vue';
import NoticeBoard from '@/views/NoticeBoard/NoticeBoard.vue';
import RegardingMe from '@/views/RegardingMe/RegardingMe.vue';
import CodeHere from '@/views/CodeHere/CodeHere.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/nowadays',
      name: 'nowadays',
      component: NowaDays,
    },
    {
      path: '/old-time-blues',
      name: 'old-time-blues',
      component: OldTimeBlues,
    },
    {
      path: '/notice-board',
      name: 'notice-board',
      component: NoticeBoard,
    },
    {
      path: '/regarding-me',
      name: 'regarding-me',
      component: RegardingMe,
    },
    {
      path: '/code-here',
      name: 'code-here',
      component: CodeHere,
    },
  ],
});

export default router;
