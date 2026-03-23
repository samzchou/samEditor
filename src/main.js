import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";


import '@/plugins/index.js';

/**
 * ---------------------
 * 系统全局CSS样式引入
 * ---------------------
 */
import '@/assets/scss/base.scss';                    // 全局基本样式表
import '@/assets/iconfont/iconfont.css';            // iconfont字体图标库

// 虚拟滚动组件
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import VueVirtualScroller from 'vue-virtual-scroller'
Vue.use(VueVirtualScroller)

Vue.config.productionTip = false;

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount("#app");
