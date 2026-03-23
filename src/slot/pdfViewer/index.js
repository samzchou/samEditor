
import pdfViewer from './pdfViewer.vue';

pdfViewer.install = function (Vue) {
    Vue.component(pdfViewer.name, pdfViewer);
};

export default pdfViewer;