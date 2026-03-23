import structViewer from '@/components/structViewer/index.vue';

structViewer.install = function (Vue) {
    Vue.component(structViewer.name, structViewer);
};

export default structViewer;