import aiDoc from '@/components/aiDoc/index.vue';

aiDoc.install = function (Vue) {
    Vue.component(aiDoc.name, aiDoc);
};

export default aiDoc;