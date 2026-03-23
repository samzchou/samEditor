import pdfParse from '@/components/pdfParse/index.vue';

pdfParse.install = function (Vue) {
    Vue.component(pdfParse.name, pdfParse);
};

export default pdfParse;