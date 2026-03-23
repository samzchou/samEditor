
import samEditor from '@/components/samEditor/samEditor.vue';
import '@/assets/scss/sam-editor.scss';

samEditor.install = function (Vue) {
    Vue.component(samEditor.name, samEditor);
};

export default samEditor;
