<template>
    <div class="out-line-container">
        <el-tree ref="outlineTree"
            :data="treeData"
            :props="defaultProps"
            :empty-text="emptyText"
            :allow-drop="allowDrop"
            :allow-drag="allowDrag"
            @node-drop="nodeDropped"
            :draggable="draggable"
            @node-drag-over="handleDragOver"
            default-expand-all
            :highlight-current="!draggable"
            node-key="outlineId"
            :expand-on-click-node="false"
            @node-click="handleNodeClick">

            <div class="custom-tree-node" slot-scope="{ node, data }">
                <div :style="`flex:1; max-width:${node.level > 5 ? 200-(node.level-5)*30 : 200}px`">
                    <span v-if="[8,9].includes(data.outlineType)" class="bk" :class="data.docattr">
                        <el-dropdown @command="handleCommand" v-if="update">
                            <span class="el-dropdown-link">附录{{ data.letter||data.outlineCatalog }}<i class="el-icon-arrow-down el-icon--right" /></span>
                            <el-dropdown-menu slot="dropdown">
                                <el-dropdown-item :command="{data,key:'specs'}">规范性</el-dropdown-item>
                                <el-dropdown-item :command="{data,key:'means'}">资料性</el-dropdown-item>
                            </el-dropdown-menu>
                        </el-dropdown>
                        <span v-else>附录{{ data.letter||data.outlineCatalog }}</span>
                    </span>
                    <span v-else class="bk">{{ data.outlineCatalog && ![8,9].includes(data.outlineType) ? data.outlineCatalog : '' }}</span>
                    <span>{{ data.outlineTitle }}</span>
                </div>
            </div>
        </el-tree>
        
    </div>
</template>

<script>
    /**
     * @description 大纲树组件
     * data {Array} 大纲树数据
     * editor 大纲可编辑与否
     * allLevel 显示所有层级
     */
    import { outlineTypes, outlineMenus } from "../tinymceEditor/configs/editorOptions";
    import { batchUpdateOutline } from '@/api/outline';
    import $bus from '@/utils/bus';
    // import draggable from 'vuedraggable'
    import $samGlobal from "@/utils/global";

    export default {
        name: 'tinymce-outline',
        props: {
            data: Array, // 大纲数据
            editor: Boolean, // 编辑状态
            allLevel: Boolean, // 显示所有层级
            isPrivate: Boolean, // 私有模式
            update: { // 可编辑大纲
                type: Boolean,
                default: false
            },
            menus: {
                type: Array,
                default: () => {
                    return []
                }
            },
            draggable: {
                type: Boolean,
                default: true
            },
        },
        computed: {
            emptyText() {
                let str = '待构建大纲数据...';
                return str;
            },
        },
        watch: {
            data: {
                handler(data) {
                    if (!_.isEmpty(data) && !$samGlobal.compare(data, this.treeData)) {
                        setTimeout(() => {
                            this.setData(data);
                        }, 300)
                    }
                },
                immediate: true,
                deep: true
            },
        },

        data() {
            return {
                envMode: process.env.NODE_ENV,
                defaultProps: {
                    children: 'children',
                    label: 'outlineTitle'
                },
                memberList: [], // 用户列表（用于分配章节条目）
                treeData: [],
                currNode: null,
                editOutline: false,
                coordination: false,
                scrollTop: 0,
            };
        },
        methods: {
            // 以下这两函数处理拖拽位置的显示
            treeScroll(evt) {
                this.scrollTop = evt.target.scrollTop;
            },
            handleDragOver() {
                const dropIndicator = this.$refs.outlineTree.$el.querySelector('.el-tree__drop-indicator');
                let top = parseInt(dropIndicator.style.top);
                dropIndicator.style.top = (this.scrollTop + top) + 'px';
            },
           
            /**
             * @description 允许节点可以拖拽
             * @param {Object} node
             */
            allowDrag(node = {}) {
                const notAllowType = [1,2,11,12];
                return !notAllowType.includes(node.data.outlineType);
            },
            /**
             * @description 允许拖拽后置入节点
             * @param {Object} draggingNode 正在拖动的节点
             * @param {Object} currNode 要置入的节点
             * @param {String} type 置入的类型 prev next inner
             */
            allowDrop(draggingNode = {}, currNode = {}, type = '') {
                const draggingOutlineType = draggingNode.data.outlineType;
                const currOutlineType = currNode.data.outlineType;
                return currOutlineType === draggingOutlineType;
            },
            /**
             * @description 节点拖拽成功后触发
             * @param {Object} droppedNode 被拖拽节点对应的 Node
             * @param {Object} targetNode 结束拖拽时最后进入的节点
             * @param {String} type 被拖拽节点的放置位置 before、after、inner
             */
            nodeDropped(droppedNode, targetNode, type) {
                const resultTreeNode = this.$refs['outlineTree'].getNode(droppedNode.data.parentId);
                const targetNodeTreeNode = this.$refs['outlineTree'].getNode(targetNode.data.parentId);

                this.updateChildren(this.treeData[0].children, droppedNode.data.parentId, resultTreeNode.data.children);
                this.updateChapter(droppedNode, targetNode, type);
            },
            updateChildren(data=[], targetId, newChildren){
                data.forEach((item,index,arr) => {
                    if (item.outlineId === targetId) {
                        arr[index]['children'] = newChildren;
                    }
                    if (item.children && item.children.length > 0) {
                        this.updateChildren(item.children, targetId, newChildren);
                    }
                });
            },
            updateChapter(droppedNode, targetNode, type) {
                const droppedData = droppedNode.data;
                const targetData = targetNode.data;
                if (type === 'inner'){
                    droppedData.parentId = targetData.outlineId;
                } else {
                    droppedData.parentId = targetData.parentId;
                }
                this.resetTreeAfterDrag(droppedData, targetData, type);
            },
            /**
             * @description 解析大纲标题
             * @param {String} title 大纲原始标题
             */
            parseOutlineTitle(title = '') {
                title = title.replace(/\<br\/\>/g, '&nbsp;&nbsp;');
                if (title.slice(-2) === '通知') {
                    title = '通知';
                }
                return title;
            },


            // 外部调用
            backEdit(lockedDoc = 0) {
                this.editOutline = lockedDoc;
            },


            // 初始化设置数据结构
            setData(data) {
                /*if (data && data.length) {
                    var lists = [];
                    var treeChildren = data[0]['children'];
                    const parseChildren = (arr, level) => {
                        if (arr && Array.isArray(arr)) {
                            arr.forEach(item => {
                                if ([8, 9].includes(item.outlineType)) {
                                    item.docattr = item.infoNum == 8 || !item.infoNum ? 'specs' : 'means'; //item.outlineType == 8 ? 'specs' : 'means';
                                }
                                if (parseInt(item.isVisible) === 1) {
                                    lists.push(item);
                                    // 继续遍历
                                    if (item.children && item.children.length) {
                                        // 过滤掉不显示的 && !this.draggable
                                        if (!this.allLevel && !this.draggable) {
                                            item.children = item.children.filter(o => {
                                                return o.isVisible === 1;
                                            })
                                        }
                                        parseChildren(item.children, level + 1);
                                    }
                                }
                            })
                        }
                    }
                    parseChildren(data[0]['children'], 2);
                    var treeData = _.cloneDeep(data[0]);
                    delete treeData.children;

                    lists.unshift(treeData);
                    this.treeData = $samGlobal.handleTree(lists, 'outlineId', 'parentId', 'children', '0');

                } else {
                    this.treeData = _.cloneDeep(data);
                }*/
                this.treeData = _.cloneDeep(data);
                console.log('大纲', this.treeData)
            },
            /**
             * @description 获取大纲数据
             */
            getData() {
                return this.treeData[0];
            },


            /**
             * @description 更新节点名称
             * @param {Object} evt
             * @param {Object} data
             */
            updateItem(data = null) {
                this.$emit('change', { act: 'updateOutlineTitle', ...data });
            },

            /**
             * @description 获取大纲章节的最后的目录层级
             * @param {Boolean} isAppendix
             */
            getLastCatalog(isAppendix = false) {
                var lists = _.filter(this.treeData[0]['children'], item => {
                    return item['outlineCatalog'] !== undefined && [3, 4, 5, 6, 8, 9].includes(item.outlineType) && (isAppendix ? [8, 9].includes(item.outlineType) : ![8, 9].includes(item.outlineType));
                });
                return lists.length;
            },

            /**
             * @description 获取最后的排序号
             * @param {Object} treeData
             * @param {Int} outlineType
             * @param {Boolean} isAppendix
             */
            getLastOrderNum(treeData = {}, outlineType = 0, isAppendix = false) {
                var orderNum = 0;
                var sameNodes = _.filter(treeData.children, { parentId: treeData.outlineId, outlineType: outlineType, isVisible: 1 });
                if (isAppendix) {
                    sameNodes = _.filter(treeData.children, item => {
                        return item.parentId === treeData.outlineId && [8, 9].includes(item.outlineType) && item.isVisible === 1;
                    });
                }
                for (let i = 0; i < sameNodes.length; i++) {
                    let node = sameNodes[i];
                    if (node.orderNum > orderNum) {
                        orderNum = node.orderNum;
                    }
                }
                return orderNum;
            },
             /**
             *  @description 重置数据
             */
             resetTreeAfterDrag(droppedData, targetData, type) {
                this.resetOutline(3, ['outlineType']);
                this.$emit('change', { act: 'updateOutline', data:{ tree:this.treeData, droppedData, targetData, type }});
            },
            /**
             *  @description 重置数据
             */
            resetTreeData() {
                var treeData = this.treeData[0];
                treeData.children = _.orderBy(treeData.children, ['outlineType', 'orderNum', 'outlineCatalog']);
                // 重新编码outlineCatalog
                this.setCatalogNum();
                this.$forceUpdate();
            },
            resetOutline(startOutlineCatalog = 0, orders = ['outlineType', 'outlineCatalog']) {
                let outlineCatalog = startOutlineCatalog;
                let orderNum = 0 // 当前排序号
                let orderNumStart = 0 // 需要重排的起始序号400
                const sortCatalog = (arr, parentNode) => {
                    arr.forEach((node, idx) => {
                        if (node.outlineCatalog) {
                            if (!parentNode && ![3, 4, 5, 6, 8, 9].includes(node.outlineType)) {
                                outlineCatalog++;
                                node.outlineCatalog = outlineCatalog;
                            } else {
                                // 根据新位置生成新的outlineCatalog，ancestors，letter
                                if (parentNode) {
                                    if ([8, 9].includes(parentNode.outlineType) && parentNode.letter) {
                                        node.outlineCatalog = parentNode.outlineCatalog + '.' + (idx + 1)
                                        node.letter = parentNode.letter + '.' + (idx + 1)
                                    } else {
                                        node.outlineCatalog = parentNode.outlineCatalog + '.' + (idx + 1)
                                    }
                                    node.ancestors =  parentNode.ancestors + ',' + node.outlineId
                                } else {
                                    node.ancestors = node. parentId + ',' + node.outlineId
                                }
                                // 根据新位置处理内容字符串里的data-parentid，data-index，data-prev
                                if (node.hasOwnProperty('content')) {
                                    let htmlString= node.content?.content || ''
                                    let updatedHtmlString = htmlString.replace(/(data-parentid=")[^"]*(")/, `$1${node.parentId}$2`);

                                    if([8, 9].includes(node.outlineType) && parentNode){
                                        const splitString = (s) => {
                                            const match = s.match(/^([A-Z])\.(.*)$/);
                                            return match ? [match[1], match[2]] : ['',''];
                                        }
                                        // console.log(node);
                                        const [prev, index] = splitString(node.outlineCatalog)  // 输出: ['A', '1']
                                        updatedHtmlString = updatedHtmlString.replace(/(data-prev=")[^"]*(")/, `$1${prev}$2`);
                                        updatedHtmlString = updatedHtmlString.replace(/(data-index=")[^"]*(")/, `$1${index}$2`);
                                    } else {
                                        updatedHtmlString = updatedHtmlString.replace(/(data-index=")[^"]*(")/, `$1${node.outlineCatalog}$2`);
                                    }
                                    node.content.content = updatedHtmlString
                                }
                            }
                            if(node.orderNum > orderNumStart + 99){
                                orderNum = String(node.outlineCatalog).length=== 1? parseInt(orderNum/100 + 1)*100: orderNum + 1
                                node.orderNum = orderNum
                            }
                            if (node.children && node.children.length) {
                                node.children = _.orderBy(node.children, orders, new Array(orders.length).fill('asc'));
                                sortCatalog(node.children, node);
                            }
                        }
                    });
                };
                // console.log("before   this.treeData[0]",   this.treeData[0].children[4]['children'][0]['outlineTitle'])
                var sourceIndex = 0, asourceIndex = 0;
                this.treeData[0].children.forEach(item => {
                    if ([3, 4, 5, 6, 8, 9].includes(item.outlineType)) {
                        if ([8, 9].includes(item.outlineType)) {
                            asourceIndex++;
                            item.outlineCatalog = asourceIndex;
                            item.letter = $samGlobal.numberToLetters(asourceIndex - 1);
                        } else {
                            sourceIndex++;
                            item.outlineCatalog = sourceIndex;
                        }
                    }
                    // 不允许拖拽的类型，1 前言 3 范围 4 规范性引用文件 5 术语和定义
                    const notAllowType = [1, 2, 3, 4, 5, 11, 12];
                    if (notAllowType.includes(item.outlineType)) {
                        orderNum = orderNumStart = item.orderNum;
                    }
                });
                sortCatalog(this.treeData[0].children);
            },
            /**
             * @description 重置大纲和章节的排序
             */
            setCatalogNum(outlineCatalog = 0, orders = ['outlineType', 'outlineCatalog']) {
                var outlineCatalog = outlineCatalog;
                const sortCatalog = (arr, parentNode) => {
                    arr.forEach((node, idx) => {
                        if (node.outlineCatalog) {
                            if (!parentNode && ![3, 4, 5, 6, 8, 9].includes(node.outlineType)) {
                                outlineCatalog++;
                                node.outlineCatalog = outlineCatalog;
                            } else {
                                if (parentNode) {
                                    if ([8, 9].includes(parentNode.outlineType) && parentNode.letter) {
                                        node.outlineCatalog = parentNode.letter + '.' + (idx + 1);
                                    } else {
                                        node.outlineCatalog = parentNode.outlineCatalog + '.' + (idx + 1);
                                    }
                                }
                            }
                            if (node.children) {
                                node.children = _.orderBy(node.children, orders, new Array(orders.length).fill('asc'));
                                sortCatalog(node.children, node);
                            }
                        }
                    });
                };
                var sourceIndex = 0,
                    asourceIndex = 0;
                this.treeData[0].children.forEach(item => {
                    if ([3, 4, 5, 6, 8, 9].includes(item.outlineType)) {
                        if ([8, 9].includes(item.outlineType)) {
                            asourceIndex++;
                            item.outlineCatalog = asourceIndex;
                            item.letter = $samGlobal.numberToLetters(asourceIndex - 1);
                        } else {
                            sourceIndex++;
                            item.outlineCatalog = sourceIndex;
                        }
                    }
                });
                sortCatalog(this.treeData[0].children);
            },
           

            /**
             * @description 当前选中的节点
             * @param {Object} nodeData
             */
            handleNodeClick(nodeData = {}) {
                this.currNode = nodeData;
                if (nodeData.locked) {
                    this.$emit('change', { act: 'selectItem', data: { ...nodeData } });
                } else {
                    this.$emit('change', { act: 'selectNode', data: { ...nodeData } });
                }
            },
            
        },
        mounted() {
            this.$nextTick(() => {
                // treeScroll
                document.querySelector('.el-tree').addEventListener('scroll', (evt) => {
                    // 更新 drop-indicator 的位置
                    this.treeScroll(evt);
                });
            });
        }
    };
</script>

<style lang="scss" scoped>
    @import './index.scss';
</style>
