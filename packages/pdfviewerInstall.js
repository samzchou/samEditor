import pdfViewer from '@/components/pdfViewer/pdfViewer.vue';

pdfViewer.install = function (Vue) {
    Vue.component(pdfViewer.name, pdfViewer);
};

export default pdfViewer;