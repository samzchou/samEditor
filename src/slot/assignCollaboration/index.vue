<template>
    <div class="assign-collaboration-container">
        <el-alert title="分配编写任务" type="info" description="选中右侧的一位编写人员，再勾选左侧需要编写的标准的章节(父节点不包含任何子孙节点)，勾选完成后点击确定保存分配任务." show-icon :closable="false" />
        <div class="close-btn">
            <i class="el-icon-close" @click.stop.prevent="$emit('close')" />
        </div>
        <div class="cooperation-content">
            <div class="left">
                <div style="margin-left: 10px;" v-if="!checkAssinOutline">
                    <el-button size="mini" @click="selectAll" :disabled="currItem === null">全选/全不选</el-button>
                </div>
                <el-tree ref="oTree"
                    :data="outlineList"
                    :props="cooperationDialogProps"
                    check-strictly
                    show-checkbox
                    default-expand-all
                    node-key="outlineId"
                    @check="currentChecked">
                    <span class="custom-tree-node" slot-scope="{ node, data }" :class="{'owner':isAssignOutline(data), 'disabled':data.disabled}">
                        <!-- 已分配的成员 -->
                        <!-- <span>{{data.outlineId}}</span> -->
                        <el-tooltip v-if="isAssignOutline(data)" :content="assignOwnerContent(data)" placement="top">
                            <i class="el-icon-user-solid" />
                        </el-tooltip>
                        <!-- 章节条目号和名称 -->
                        <span v-if="data.outlineCatalog && data.outlineCatalog != ''" style="margin-right: 5px;">{{data.letter ? "附录" + data.letter : data.outlineCatalog}}</span>
                        <el-tooltip class="item" effect="dark" :content="data.outlineTitle" placement="top-start">
                            <span :data-id="data.outlineId" :data-owner="data.owner">{{ data.outlineTitle }}</span>
                        </el-tooltip>
                    </span>
                </el-tree>
            </div>
            <div class="right">
                <el-table ref="cmTable" size="mini" :data="memberList" empty-text="未定义协作人员" border highlight-current-row style="width:100%" :cell-class-name="setActiveStyle" :max-height="550" @row-click="handleCurrentChange">
                    <el-table-column label="选择" width="50" align="center" fixed>
                        <template slot-scope="scope">
                            <i class="iconfont" :class="currItem && currItem.userId===scope.row.userId ? 'icon--Checked':'icon-checkbox-unchecked'"></i>
                        </template>
                    </el-table-column>
                    <el-table-column prop="userName" label="用户名" width="120" />
                    <el-table-column prop="assignOutline" label="分配状态">
                        <template slot-scope="scope">
                            <ul v-if="scope.row.assignOutline && scope.row.assignOutline !==''">
                                <h5>已分配{{scope.row.assignOutline.split(',').length}}个章节条目</h5>
                                <li v-for="id in scope.row.assignOutline.split(',')" :key="id">
                                    <span>{{parseOultineItem(id)}}</span>
                                    <el-button v-if="currItem && currItem.userId===scope.row.userId" type="text" size="small" icon="el-icon-delete" @click.stop.prevent="removeAssign(id, scope.row)" />
                                </li>
                            </ul>
                            <el-tag v-else type="danger">未分配</el-tag>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
        </div>
    </div>
</template>

<script>
    import $global from '@/utils/global';
    export default {
        name: "assignCollaboration",
        props: {
            data: {
                type: Object,
                default: () => {
                    return {};
                },
            },
            author: {
                type: Object,
                default: () => {
                    return {
                        userId: "",
                        userName: "anonymous",
                        commitId: "",
                        memberList: [],
                    };
                },
            },
        },
        watch: {
            data: {
                handler(obj) {
                    if (!_.isEmpty(obj)) {
                        this.$nextTick(() => {
                            this.setData();
                        });
                    }
                },
                deep: true,
                immediate: true
            }
        },
        computed: {
            checkAssinOutline() {
                if (!_.isEmpty(this.author.assignOutlineId)) {
                    return true;
                }
                return false;
            }
        },
        data() {
            return {
                cooperationDialogProps: {
                    children: "children",  // not
                    label: "outlineTitle",
                },
                outlineList: [],
                memberList: [],
                currItem: null,
                currSelectedData: [],
            };
        },
        methods: {
            // 是否已被分配
            isAssignOutline(data) {
                for (var i = 0; i<this.memberList.length; i++) {
                    let user = this.memberList[i];
                    if (!_.isEmpty(user.assignOutline) && user.assignOutline.split(',').includes(data.outlineId)) {
                        return true;
                    }
                }
                return false;
            },
            /**
             * @description 设置数据
             */
            setData() {
                // debugger
                this.memberList = !_.isEmpty(this.data.memberList) ? _.cloneDeep(this.data.memberList) : [];
                this.setOutlineList();
            },
            /**
             * @description 表格单元行选中
             */
            setActiveStyle({row, rowIndex}) {
                if (this.currItem && this.currItem.userId === row.userId) {
                    return 'active';
                }
                return '';
            },

            /**
             * @description 显示分配的用户
             */
            assignOwnerContent(data) {
                let str = "已分配：";
                let userName = [];
                for (var i = 0; i<this.memberList.length; i++) {
                    let user = this.memberList[i];
                    if (!_.isEmpty(user.assignOutline) && user.assignOutline.split(',').includes(data.outlineId)) {
                        userName.push(user.userName);
                    }
                }
                str += userName.join(',');
                return str;
            },
            // 转换大纲负责人名称
            parseOwnerName(userId='') {
                let user = _.find(this.memberList, { userId: userId });
                return user ? user.userName : "-";
            },

            /**
             * @description 根据大纲ID解析大纲标题
             * @param{Object} row
             */
            parseOultineItem(id='') {
                var item = $global.getChildData('outlineId', id, this.outlineList);
                if (item) {
                    var outlineCatalog = item.letter ? "附录" + item.letter : item.outlineCatalog;
                    return outlineCatalog ? outlineCatalog + " "  + item.outlineTitle : item.outlineTitle;
                }
                return '未定义...';
            },
            /**
             * @description 移除已分配的大纲
             * @param{Object} row
             */
            removeAssign(outlineId='', item = {}) {
                const removeOwner = children => {
                    children.forEach(node => {
                        let owner = node.owner || [];
                        if (_.isString(owner)) {
                            owner = JSON.parse(owner);
                        }
                        if (!_.isEmpty(owner)) {
                            let isAssignIndex = _.findIndex(owner, { userId:item.userId });
                            if (node.outlineId === outlineId && !!~isAssignIndex) {
                                owner = _.remove(owner, user => {
                                    return user.userId !== item.userId;
                                });
                            }
                            this.$set(node, 'owner', owner);// .join(",")
                        }
                        // delete node.disabled;

                        if (!_.isEmpty(node.children)) {
                            removeOwner(node.children);
                        }
                    })
                }
                this.$confirm('确定要移除吗?', '提示', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                }).then(() => {
                    let assignOutline = item.assignOutline ? item.assignOutline.split(',') : [];
                    assignOutline = _.remove(assignOutline, id => {
                        return id !== outlineId;
                    });
                    // 重置章节树选中
                    let checkedItems = [];
                    assignOutline.forEach(outlineId => {
                        let outlineItem = $global.getChildData('outlineId', outlineId, this.outlineList);
                        if (outlineItem) {
                            checkedItems.push(outlineItem);
                        }
                    });
                    this.$refs.oTree.setCheckedNodes(checkedItems);

                    // 重置用户分配的章节条目
                    this.$set(item, 'assignOutline', assignOutline.join(","));
                    let idx = _.findIndex(this.memberList, { userId:item.userId });
                    if (!!~idx) {
                        this.$set(this.memberList, idx, item);
                    }
                    // 移除章节被分配的用户
                    removeOwner(this.outlineList);

                }).catch(() => { });
            },

            /**
             * @description 选中用户
             * @param{Object} row
             */
            handleCurrentChange(row={}) {
                // 如果被指定分配了章节且用户相同则终止
                if (!_.isEmpty(this.author.assignOutlineId) && row.userName === this.author.userName) {
                    this.$message.warning('当前用户已被指定了分配章节，不可继续分配！');
                    this.currItem = null;
                    return false;
                }

                if (!this.currItem || row.userId !== this.currItem.userId) {
                    this.currItem = row;
                    this.currSelectedData = [];
                    this.setOutlineList(false);
                    this.$message.info('已选中用户：' + row.userName + '，请选择分配大纲章节或条目！')
                }
            },

            /**
             * @description 重新定义大纲数据， 并设置大纲选中
             * @param{Boolean} setData
             */
            setOutlineList(setData=true) {
                if (setData) {
                    const matchOutline = outlineItem => {
                        var parentNode = $global.getParentNode(this.data.outlineList, outlineItem.outlineId, { idKey:"outlineId", parentKey:"parentId", "children":"children" });
                        // debugger
                        for (let i=0; i<parentNode.length; i++) {
                            if (this.author.assignOutlineId.includes(parentNode[i]['outlineId'])) {
                                return true;
                            }
                        }
                        return false;
                    }

                    const recurrenceList = (arrList, level) => {
                        arrList = arrList.map(item => {
                            delete item.enabled, delete item.disabled;
                            // 第二层禁用可选
                            if (level > 0 && this.author.outlineLevel && level >= this.author.outlineLevel) {
                                // debugger
                                item.disabled = true;
                            }
                            if (item.children && item.children.length) {
                                item.children = recurrenceList(item.children, level + 1);
                            }
                            if (item.owner) {
                                item.owner = $global.isJSON(item.owner) ? JSON.parse(item.owner) : item.owner;
                                this.memberList.forEach(user => {
                                    let assignOutline = user.assignOutline ? user.assignOutline.split(',') : [];
                                    if (_.find(item.owner, { userId:user.userId })) {
                                        assignOutline.push(item.outlineId);
                                    }
                                    user.assignOutline = _.uniq(assignOutline).join(',');
                                })
                            }
                            return item;
                        })
                        return arrList;
                    }
                    // console.log('this.data.outlineList', this.data.outlineList);
                    this.outlineList = recurrenceList(_.cloneDeep(this.data.outlineList), 0);
                }
                if (this.currItem) {
                    this.currSelectedData = this.currItem.assignOutline ? this.currItem.assignOutline.split(",") : [];
                }
                this.$refs.oTree.setCheckedKeys(this.currSelectedData);
            },

            /**
             * @description 根据大纲ID获取所有子集对象
             * @param {String} outlineId
             */
            getAllChildrenNodes(outlineId='') {
                var outlineItem = $global.getChildData('outlineId', outlineId, this.outlineList);
                var nodes = [];
                const findChilds = item => {
                    if (item && item.children && item.children.length) {
                        nodes = nodes.concat(item.children);
                        item.children.forEach(child => {
                            findChilds(child);
                        })
                    }
                }
                findChilds(outlineItem);
                return nodes;
            },
            getAllParentNodes(outlineId='') {
                var outlineItem = $global.getChildData('outlineId', outlineId, this.outlineList);
                var nodes = [];
                const findChilds = item => {
                    if (item && item.parentId) {
                        let parentNode = $global.getChildData('outlineId', item.parentId, this.outlineList);
                        if (parentNode) {
                            nodes.push(parentNode);
                            findChilds(parentNode);
                        }
                    }
                }
                findChilds(outlineItem);
                return nodes;
            },

            /**
             * @description 全选/不全选
             */
            selectAll() {
                var assignOutline = this.currItem.assignOutline ? this.currItem.assignOutline.split(',') : [];
                if (assignOutline.length !== this.outlineList.length) {
                    // 全部选中
                    var checkedKeys = this.outlineList.map((i) => i.outlineId);
                    this.setAssignOutline(checkedKeys);
                } else {
                    // 全部不选中
                    this.currSelectedData = [];
                    this.resetOutlineData(this.currSelectedData);
                    this.$refs.oTree.setCheckedNodes([]);
                }

                this.$set(this.currItem, "assignOutline", this.currSelectedData.join(","));
                var index = _.findIndex(this.memberList, { userId:this.currItem.userId });
                if (!!~index) {
                    this.$set(this.memberList, index, { ...this.currItem });
                }
            },

            /**
             * @description 选中大纲
             * @param {Object} checkedNodes
             * @param {Object} checkedObj
             */
            currentChecked(checkedNodes={}, checkedObj={}) {
                if (!this.currItem) {
                    this.$message.warning('请先选择用户成员再处理章节条目的分配！')
                    this.$refs.oTree.setCheckedKeys([]);
                    return;
                }
                this.setAssignOutline(checkedObj.checkedKeys);
            },
            /**
             * @description 根据大纲ID获取所有已被分配的章节条目
             * @param {Array} ids
             */
            checkHasChildren(ids=[]) {
                var exitsItems = [];
                ids.forEach(id => {
                    let allChildNodes = this.getAllChildrenNodes(id);
                    allChildNodes.forEach(item => {
                        if (!_.isEmpty(item.owner) && !~_.findIndex(exitsItems, { outlineId: item.outlineId })) {
                            exitsItems.push(item);
                        }
                    });
                    // 取出所有父级，校验是否被分配 && (_.isEmpty(this.author.assignOutlineId) || !this.author.assignOutlineId.includes(item.outlineId) , userId:this.currItem.userId
                    let parentNodes = this.getAllParentNodes(id);
                    parentNodes.forEach(item => {
                        if (!_.isEmpty(item.owner) && item.outlineId !== id && !~_.findIndex(exitsItems, { outlineId: item.outlineId })) {
                            exitsItems.push(item);
                        }
                    });
                    // 重新过滤掉非用户自己的
                    exitsItems = exitsItems.filter(item => {
                        for (let i=0; i<item.owner.length; i++) {
                            if (item.owner[i].userId === this.currItem.userId) {
                                return true;
                            }
                        }
                        return false;
                    })
                });
                return exitsItems;
            },

            /**
             * @description 选中大纲分配给当前用户  checkedNodes、checkedKeys
             * @param {Object} checkedNodes
             * @param {Object} checkedObj
             */
            setAssignOutline(checkedKeys=[]) {
                this.currSelectedData = [];
                var exitsItems = this.checkHasChildren(checkedKeys);
                // 去除已经被分配的
                var assignOutline = this.currItem.assignOutline ? this.currItem.assignOutline.split(',') : [];
                if (_.isEmpty(exitsItems)) {
                    var checkedIds = checkedKeys.filter(id => { return !assignOutline.includes(id); });
                    exitsItems = this.checkHasChildren(checkedIds);
                }

                // 判断节点是否包含了子集，如有则须去掉
                exitsItems = exitsItems.concat(this.checkExistInMembers(checkedKeys));
                exitsItems = _.uniqBy(exitsItems, 'outlineId');
                // console.log('exitsItems', exitsItems);
                if (exitsItems.length > 0) {
                    var message = [];
                    exitsItems.forEach((item, i) => {
                        let outlineCatalog = item.letter ? "附录" + item.letter : item.outlineCatalog;
                        message.push(outlineCatalog ? outlineCatalog + ' ' + item.outlineTitle : item.outlineTitle);
                    })
                    this.$message({
                        type: 'warning',
                        dangerouslyUseHTMLString: true,
                        message: '所选章节条目有冲突（已被分配了章节条目），请重新定义！<br/>-----------------------------------------------------------------------------<br/>' + message.join("<br/>")
                    });
                }

                // 如果和其他用户分配的章节条目有冲突，则回复原先的配置 inMembers
                if (exitsItems.length > 0) {
                    this.currSelectedData = this.currItem.assignOutline ? this.currItem.assignOutline.split(',') : [];
                } else {
                    this.currSelectedData = checkedKeys;
                }

                this.$set(this.currItem, "assignOutline", this.currSelectedData.join(","));
                var index = _.findIndex(this.memberList, { userId:this.currItem.userId });
                if (!!~index) {
                    this.$set(this.memberList, index, { ...this.currItem });
                }
                // 重置节点选中
                var checkedItems = this.resetOutlineData(this.currSelectedData);
                this.$refs.oTree.setCheckedNodes(checkedItems);
            },

            resetOutlineData(selectedIds=[]) {
                var checkedItems = [];
                const setOutlineData = nodes => {
                    nodes.forEach(item => {
                        let owner = item.owner || []; //  ? (_.isString(item.owner) ? JSON.parse(item.owner) : item.owner)
                        if (!_.isEmpty(owner) && _.isString(owner)) {
                            owner = JSON.parse(owner);
                        }
                        if (_.isString(owner)) {
                            owner = JSON.parse(owner);
                        }

                        if (selectedIds.includes(item.outlineId)) {
                            owner.push(this.currItem);
                            checkedItems.push(item);
                        } else {
                            owner = _.remove(owner, obj => {
                                return obj.userId !== this.currItem.userId;
                            });
                        }
                        this.$set(item, 'owner', _.uniqBy(owner, 'userId'));
                        if (item.children && item.children.length > 0) {
                            item.children = setOutlineData(item.children);
                        }
                    });
                    return nodes;
                }

                this.outlineList = setOutlineData(this.outlineList);
                return checkedItems;
            },


            /**
             * @description 从其他用户已分配的章节中取出冲突的ID
             * @param {Array} checkedKeys 当前选中的IDS
             */
            checkExistInMembers(checkedKeys=[]) {
                var items = [];
                this.memberList.forEach(item => {
                    if (this.currItem.userId !== item.userId && item.assignOutline) {
                        let splitIds = item.assignOutline.split(',');
                        // 取出节点下所有子集
                        let isExtisIds = [];
                        checkedKeys.forEach(id => {
                            let outlineItem = $global.getChildData('outlineId', id, this.outlineList);
                            // 获取所有子集的ID，判断是否已被分配
                            if (!_.isEmpty(outlineItem.children)) {
                                let childNodeIds = this.findAllChildrenNode(outlineItem.children);
                                if (childNodeIds.length) {
                                    isExtisIds = isExtisIds.concat(childNodeIds);
                                }
                            }
                            // 往上递归取出父节点，判断是否已被分配
                            let parentNodes = $global.getParentNode(this.outlineList, id, { idKey:"outlineId", parentKey:"parentId", "children":"children" });
                            if (parentNodes.length) {
                                parentNodes.forEach(node => {
                                    // 去除本身的节点
                                    if (node.outlineId !== id) { // && (_.isEmpty(this.author.assignOutlineId || !this.author.assignOutlineId.includes(node.outlineId)))
                                        isExtisIds.push(node.outlineId);
                                    }
                                })
                            }
                        });
                        // 如果子集ID匹配到已分配的章节ID则push到集合中
                        if (isExtisIds.length) {
                            isExtisIds.forEach(id => {
                                if (splitIds.includes(id)) {
                                    let outlineItem = $global.getChildData('outlineId', id, this.outlineList);
                                    items.push(outlineItem);
                                }
                            })
                        }
                    }
                });
                items = items.filter(item => {
                    for (let i=0; i<item.owner.length; i++) {
                        if (item.owner[i].userId === this.currItem.userId) {
                            return true;
                        }
                    }
                    return false;
                })

                return items;
            },
            /**
             * @description 遍历子节点曲中所有子集ID
             * @param {Array} list node节点集合
             */
            findAllChildrenNode(list=[]) {
                var ids = [];
                const getChild = arr => {
                    arr.forEach(item => {
                        ids.push(item.outlineId);
                        if (item.children && item.children.length) {
                            getChild(item.children);
                        }
                    })
                }
                getChild(list);
                return ids;
            },
            /**
             * @description 校验所选的节点是否已经存在已被分配的子孙节点
             * @param {Array} list node节点集合
             */
            checkExistInIds(list=[], checkedKeys=[]) {
                var ids = [];
                const checkOutlineItem = arr => {
                    arr.forEach(item => {
                        if (checkedKeys.includes(item.outlineId)) {
                            ids.push(item.outlineId);
                        }
                        if (item.children && item.children.length) {
                            checkOutlineItem(item.children)
                        }
                    })
                }
                checkOutlineItem(list);
                return ids;
            },

            // 获取数据
            submit() {
                return this.memberList;
            },
        },

    };
</script>

<style lang="scss" scoped>
    .assign-collaboration-container {
        height: 100%;
        overflow: hidden;
        position: relative;
        .close-btn{
            position: absolute;
            right: 10px;
            top: 20px;
            z-index: 100;
            >i{
                font-size: 1.25em;
                cursor: pointer;
            }
        }
        .cooperation-content {
            display: flex;
            // padding: 20px;
            background-color: #fafafa;
            // border-bottom: 1px #ddd solid;
            min-height: 300px;
            height: calc(100% - 56px);
            .left {
                overflow: auto;
                padding: 10px 10px 10px 0;
                background-color: #fff;
                /* border-radius: 3px;
                box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.05); */
                border-right: 1px solid #efefef;
                flex: 1;
                max-height: 600px;
                &::-webkit-scrollbar-track-piece {
                    background: #f7f7f7;
                }
                &::-webkit-scrollbar {
                    width: 6px;
                }
                &::-webkit-scrollbar-thumb {
                    background: #dee3e9;
                    border-radius: 6px;
                }
                ::v-deep .el-tree {
                    padding: 0 !important;
                    .el-checkbox.is-disabled{
                        display: none;
                    }
                }


                ::v-deep .custom-tree-node {
                    justify-content: initial !important;
                    border-bottom: none !important;
                    position: relative;
                    color: #9d9d9d;
                    &.owner {
                        color: #51c971;
                    }


                    .el-icon-user-solid{
                        margin: -10px 0 0 -5px;
                    }
                }
            }

            .right {
                height: 100%;
                width: 600px;
                background-color: #fff;
                ::v-deep .el-table {
                    .active{
                        background-color: #e9fff9 !important;
                    }
                    .cell {
                        >i{
                           font-size: 1.5em;
                            &.icon--Checked{
                                color: #4ddb52;
                            }
                        }
                        >ul{
                            width: 100%;
                            overflow: hidden;
                            list-style: none;
                            >li{
                                border-top: 1px dashed #e3e3e3;
                                display: flex;
                                align-items: center;
                                justify-content: space-between;
                                >span{
                                    flex:1;
                                    overflow: hidden;
                                    white-space: nowrap;
                                    text-overflow: ellipsis;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
</style>
