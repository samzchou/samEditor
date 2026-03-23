import docComparison from '@/components/docComparison/index.vue';

docComparison.install = function (Vue) {
    Vue.component(docComparison.name, docComparison);
};

export default docComparison;