import samCode from './index.vue';

samCode.install = function (Vue) {
  Vue.component(samCode.name, samCode);
};

export default samCode;