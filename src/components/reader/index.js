
import standardReader from './index.vue';

standardReader.install = function (Vue) {
    Vue.component(standardReader.name, standardReader);
};

export default standardReader;