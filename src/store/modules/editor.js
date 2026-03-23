import $storage from 'good-storage';
import { listContentTemplate } from '@/api/editor';
import $global from '@/utils/global';
const editor = {
	namespaced: true,
    state: {
        userInfo: null,
        listTemplate: [],
    },

    mutations: {
        UPDATE_USER: (state, data) => {
			state.userInfo = data;
		},
        UPDATE_TEMPLATE: (state, data) => {
        	state.listTemplate = data;
        },

    },

    actions: {
        async loadTemplate({ commit, state }, url) {
            listContentTemplate({}, url).then(res => {
                if (res.code === 200) {
                    var data = res.rows.map(item => {
                        item = $global.clearDataByField(item, ['createUser','delFlag','deleteTime','deleteUser','isAsc','orderByColumn','pageNum','pageSize','params','searchValue','searchValueArray','updateUser']);
                        return item;
                    });
                    console.log('store listContentTemplate', data);
                    commit('UPDATE_TEMPLATE', data);
                }
            })
        }

    }
}

export default editor;
