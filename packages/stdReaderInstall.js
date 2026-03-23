import stdReader from '@/components/reader/index.vue';

stdReader.install = function (Vue) {
    Vue.component(stdReader.name, stdReader);
};

export default stdReader;