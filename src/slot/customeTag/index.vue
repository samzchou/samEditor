<template>
    <div class="custome-tag-container">
        <el-form size="mini" :model="tagData" :rules="tagRule" ref="tagForm" label-position="top">
            <el-form-item label="标签树" prop="tagTreeId">
                <treeselect size="mini" :options="tagTree" v-model="tagData.tagTreeId" :normalizer="normalizerTree" placeholder="请选择标签类型..." />
            </el-form-item>
            <el-form-item label="标签类型(英文)" prop="tagType">
                <el-input v-model="tagData.tagType"></el-input>
            </el-form-item>
			<el-form-item label="标签名称(中文)" prop="tagName">
			    <el-input v-model="tagData.tagName"></el-input>
			</el-form-item>
			<el-form-item label="标签描述内容" prop="tagContent">
			    <el-input type="textarea" :rows="3" v-model="tagData.tagContent"></el-input>
			</el-form-item>
            <el-form-item>
                <el-button type="primary" @click.stop.prevent="sbumitTag">保存</el-button>
                <el-button @click.stop.prevent="$emit('change',{ act:'close' })">取消</el-button>
            </el-form-item>
        </el-form>
    </div>
</template>

<script>
    import Treeselect from "@riophae/vue-treeselect";
    import "@riophae/vue-treeselect/dist/vue-treeselect.css";
    export default {
        name: 'custom-tag',
        components:{
        	Treeselect
        },
        props: {
        	data: {
        		type: Object,
        		default: () => {
        			return {};
        		}
        	},
        	tagTree: {
        		type: Array,
        		default: () => {
        			return [];
        		}
        	}
        },
        watch: {
        	data: {
        		handler(data) {
        			if (!_.isEmpty(data)) {
                        this.tagData = _.cloneDeep(data);
        			}
        		},
        		deep: true,
        		immediate: true
        	}
        },

        data() {
            return {
                tagData: {
                    tagTreeId: undefined,
                    tagName: '',
					tagType: ''
                },
                tagRule: {
                   tagTreeId: [{required:true, message: '请选择标签树', trigger: 'change'} ],
                   tagName: [{required:true, message: '请输入标签名称', trigger: 'blur'} ],
                   tagType: [{required:true, message: '请输入标签类型', trigger: 'blur'} ],
                }

            }
        },
        methods: {
            /**
             * @description 序列化标签树
             * @param {Object} node
             */
            normalizerTree(node={}) {
            	if (node.children && !node.children.length) {
            		delete node.children;
            	}
            	return {
            		id: node.tagTreeId,
            		label: node.tagType + "(" + node.tagName + ")",
            		children: node.children
            	};
            },
            /**
             * @description 提交保存标签
             */
            sbumitTag() {
                this.$refs.tagForm.validate((valid) => {
                    if (valid) {
                        console.log('tagData=>', this.tagData);
                        this.$emit('change', { act:'setTag', ...this.tagData });
                    }
                });
            }
        }
    }
</script>

<style lang="scss" scoped>
    .custome-tag-container{
        height: 100%;
        width: 100%;
        padding: 10px;
    }
</style>
