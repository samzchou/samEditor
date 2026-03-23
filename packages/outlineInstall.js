import outline from '@/components/outline/outline.vue';

outline.install = function (Vue) {
    Vue.component(outline.name, outline);
};

export default outline;