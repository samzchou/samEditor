<template>
	<div class="tag-container">
		<div class="content">
			<el-tree ref="tagTree" :data="tagList" :props="defaultProps" node-key="tagId"  default-expand-all :expand-on-click-node="false">
				<div class="tag-tree-node" slot-scope="{ node, data }">
					<template v-if="!data.edit && !data.new">
						<span>{{data.tagType}} {{data.tagName}} --{{data.edit}}</span>
						<el-button-group>
							<el-button size="mini" icon="el-icon-plus" @click.stop.prevent="appendTag(data)"></el-button>
							<el-button size="mini" icon="el-icon-edit" v-if="node.level>1"  @click.stop.prevent="editTag(node, data)"></el-button>
							<el-button size="mini" icon="el-icon-delete" v-if="node.level>1"  @click.stop.prevent="removeTag(node, data)"></el-button>
						</el-button-group>
					</template>
					<template v-else>
						<span class="inputs">
                            <el-input size="mini" v-model="data.tagType" placeholder="标签类别"></el-input>
							<el-input size="mini" v-model="data.tagName" placeholder="标签名称"></el-input>
						</span>
						<el-button v-if="data.new" size="mini" icon="el-icon-delete" @click.stop.prevent="removeTag(node, data)"></el-button>
						<el-button v-else size="mini" icon="el-icon-close" @click.stop.prevent="editClose(node, data)"></el-button>
					</template>
				</div>
			</el-tree>
		</div>
		<div class="btns" v-if="isEditing">
			<template>
				<el-button size="small" type="primary" icon="el-icon-edit" @click.stop.prevent="updateTag" :loading="submitLoading">保存数据</el-button>
			</template>
		</div>
	</div>
</template>

<script>
    import { branchSetTagTree, deleteTagTree } from '@/api/tags.js';
    // 全局方法
	import $samGlobal from '@/utils/global';
	export default {
		name: 'custom-tag',
		props: {
			tagTree: {
				type: Array,
				default: () => {
					return [];
				}
			}
		},
		watch: {
			tagTree: {
				handler(data) {
					if (!_.isEmpty(data)) {
						this.setTreeData(_.cloneDeep(data));
					}
				},
				deep: true,
				immediate: true
			}
		},
		data() {
			return {
				tagList: [{
					tagType: '标签',
					children: []
				}],
				defaultProps: {
					children: 'children',
					label: 'tagType'
				},
				isEditing: false,
                submitLoading: false
			};
		},
		methods: {
            /**
             * @description 设置标签树数据
             */
			setTreeData(data=[]) {
				this.tagList = [{
					tagType: '标签',
					children: data
				}];
			},
            /**
             * @description 取消编辑标签数据
             */
			cancelEdit() {
                this.setTreeData(_.cloneDeep(this.tagTree));
                this.isEditing = false;
			},

            editClose(node={}, data={}) {
                this.$set(data, 'edit', false);
                // 是否还存在其他编辑的节点
                return this.checkEditNode();
            },
            /**
             * @description 编辑标签数据
             * @param {Object} node
             * @param {Object} data
             */
            editTag(node={}, data={}) {
                this.$set(data, 'edit', true);
                this.isEditing = true;
            },

            checkEditNode() {
                var list = this.deepFilterToArray(this.tagList);
                var flag = true;
                for(let i=0; i<list.length; i++) {
                    if (list[i]['new'] || list[i]['edit']) {
                        flag = false;
                        break;
                    }
                }
                if (flag) {
                    this.cancelEdit();
                }
                return flag;
            },

			/**
			 * @description 添加标签数据
			 * @param {Object} data
			 */
			appendTag(data={}) {
				var uuid = $samGlobal.guid();
				const newChild = { parentId:data.tagTreeId||'', tagTreeId: uuid, tagType: '', tagName: '', new:true, children: [] };
				if (!data.children) {
				  this.$set(data, 'children', []);
				}
				data.children.push(newChild);
				this.isEditing = true;
			},
			/**
			 * @description 移除标签数据
			 * @param {Object} node
			 * @param {Object} data
			 */
			removeTag(node={}, data={}) {
                this.$confirm('确定删除该节点及所有子节点?', '提示', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                }).then(() => {
                    var dataList = [];
                    if (data.new) {
                        var parent = node.parent;
                        var children = parent.data.children || parent.data;
                        var index = children.findIndex(d => d.tagTreeId === data.tagTreeId);
                        children.splice(index, 1);
                        // 是否还存在其他编辑的节点
                        return this.checkEditNode();
                    } else {
                        dataList.push(data);
                        if (data.children && data.children.length) {
                            dataList = dataList.concat(this.deepFilterToArray(data.children));
                        }
                        var ids = [];
                        dataList.forEach(item => {
                            if (item.tagNumId) {
                               ids.push(item.tagNumId);
                            }
                        });
                        // console.log('removeTag ids=>', ids);
                        deleteTagTree(ids).then(res => {
                            if (res.code === 200) {
                                this.$emit('change', { act:'updateTag' })
                            }
                        })
                    }
                }).catch(() => { });

			},
			/**
			 * @description 清除标签数据的其他字段
			 */
			clearTreeData(list=[], isEdit=false) {
                var newList = [];
				// 去除根节点数据
				list.splice(0, 1);
				list.forEach(item => {
                    if (isEdit && (item.edit || item.new)) {
                        newList.push(item);
                    } else {
                        if (!item.edit && !item.new && !isEdit) {
                            newList.push(item);
                        }
                    }
				});
				return newList;
			},

			/**
			 * @description 更新标签数据
			 */
			updateTag() {
                this.submitLoading = true;
				var list = this.clearTreeData(this.deepFilterToArray(this.tagList), true);
                var condition = {
                    tagTreeList: list
                }
                branchSetTagTree(condition).then(res => {
                    if (res.code === 200) {
                        this.$message.success('保存成功！');
                        this.isEditing = false;
                        this.$emit('change', { act:'updateTag' })
                    } else {
                        this.$message.error('保存失败！');
                    }
                    this.submitLoading = false;
                })
			},

			/**
			 * @description 递归筛选 - 结果是一纬数组
			 * @param {Array} list 数组
			 * @param {*} opts 其他参数
			 * @return {Array}
			 */
			deepFilterToArray(list, opts = {}) {
			    const childrenKey = opts.childrenKey || 'children';
			    let result = [];
			    const __deepFilter = list => {
					for (let idx = 0; idx < list.length; idx++) {
						let item = list[idx];
			            result.push(item);
						if (item[childrenKey] && item[childrenKey].length) {
							__deepFilter(item[childrenKey]);
						}

					}
					return result;
			    }
			    return __deepFilter(list);
			},
		}
	};
</script>

<style lang="scss" scoped>
	.tag-container {
		height: 100%;
		width: 100%;
		display: flex;
		flex-direction: column;
		.content{
			flex:1;
			overflow: auto;
			::v-deep .el-tree{
				.tag-tree-node{
					line-height: 30px;
					border-bottom: 1px solid rgba(0, 0, 0, 0.08);
					flex: 1;
					display: flex;
					align-items: center;
					justify-content: space-between;
					font-size: 12px;
					button{
						padding: 3px;
					}
					.inputs{
						display: flex;
						max-width: inherit;
						flex: 1;
						.el-input{
							flex: 1;
                            width: auto;
                            padding: 0 5px;
							input{
								border-width: 0 0 1px 0;
                                border-color: #409eff;
                                border-radius: 0;
                                padding: 0;
                                width: 100%;
                                height: 27px;
                                line-height: 27px;
                                color: #596beb;

							}
						}
					}
				}
			}
		}
		.btns{
			padding: 10px;
			background-color: #f8f8f8;
			border-top: 1px solid #e9e9e9;
			text-align: center;
		}
	}
</style>
