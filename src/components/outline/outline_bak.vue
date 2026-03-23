<template>
    <div class="out-line-container">
        <!-- 管理=> 锁定模式切换 -->
        <div class="switch-admin" v-if="author.isAdmin && author.lockedAll" :class="{'active':editOutline}">
            <i :class="!editOutline ? 'iconfont icon-Switch-' : 'iconfont icon-Switch-1'" @click.stop.prevent="setEditingOutline" />
            <i v-if="author.assignOutline && editOutline && author.memberList && author.memberList.length" class="iconfont icon-haoyouliebiao" @click.stop.prevent="assignCollaboration" />
            <el-button v-if="author.isAdmin && author.forceUnlock && !editOutline" size="mini" type="text" icon="el-icon-unlock" class="unlock-force" @click.stop.prevent="unlockAll">全部解锁</el-button>
        </div>

        <el-tree ref="outlineTree"
            :data="treeData"
            :props="defaultProps"
            :empty-text="emptyText"
            :allow-drop="allowDrop"
            :allow-drag="allowDrag"
            :node-drop="nodeDropped"
            :draggable="draggable"
            default-expand-all
            highlight-current
            node-key="id"
            :expand-on-click-node="false"
            @node-click="handleNodeClick">
            <!-- data.locked||node.parent.data.locked|| -->
            <div class="custom-tree-node" slot-scope="{ node, data }" :class="{'locked':!editOutline && isOtherOwner(data) && author.lockedAll }" :title="isOtherOwner(data)">
                <!-- 树节点章节主标题 -->
                <!-- 默认是200,当层级超过五时，超出省略会失效，当超过五时减去前方缩进的长度 -->
                <div :style="`flex:1; max-width:${node.level > 5 ? 200-(node.level-5)*30 : 200}px`" :data-owner="data.owner">
                    <span v-if="[8,9].includes(data.outlineType) && data.docattr" class="bk" :class="data.docattr">
                        <el-dropdown @command="handleCommand" v-if="update">
                            <span class="el-dropdown-link">附录{{ data.letter||data.outlineCatalog }}<i class="el-icon-arrow-down el-icon--right" /></span>
                            <el-dropdown-menu slot="dropdown">
                                <el-dropdown-item :command="{data,key:'specs'}">规范性</el-dropdown-item>
                                <el-dropdown-item :command="{data,key:'means'}">资料性</el-dropdown-item>
                            </el-dropdown-menu>
                        </el-dropdown>
                        <span v-else>附录{{ data.letter||data.outlineCatalog }}</span>
                    </span>
                    <span v-else class="bk" :title="data.outlineCatalog">{{ data.outlineCatalog && ![8,9].includes(data.outlineType) ? data.outlineCatalog : '-' }}</span>
                    <div class="label" :title="data.outlineTitle">
                        <el-input v-if="editInput(data)" v-model="data.outlineTitle" @keyup.native.enter="updateItem(data)" @blur="updateItem(data)" />
                        <span v-else v-html="parseOutlineTitle(data.outlineTitle)" />
                    </div>
                </div>

                <!-- 大于第一层级章节标题，目录树仅展现到第二级 （如果是多人协同编辑模式下）-->
                <template v-if="node.level>1 && author && (author.commitId || author.lockedAll)">
                    <div v-if="data.locked && !author.lockedAll">
                        <i class="el-icon-lock" />
                    </div>
                    <div v-else style="padding-right: 5px;">
                        <!-- 如果在编辑大纲模式下(管理员操作) -->
                        <el-button-group v-if="adminOutline && editOutline && !data.locked">
                            <el-button
                                v-if="[5,6,8,9].includes(data.outlineType) && node.level===2"
                                size="mini"
                                icon="el-icon-document-copy"
                                title="插入同类章节"
                                @click.stop.prevent="() => insertChapter(data)" />
                            <!-- 分配大纲按钮 -->
                            <!-- <span>{{checkAssignOutlieAuthor(node, data)}}</span> -->
                            <el-button
                                size="mini" class="ass1"
                                :class="{'active': hasAssignOutline(data)}"
                                :icon="!assignTitle(data.owner) ? 'el-icon-user' : 'el-icon-user-solid'"
                                :title="assignTitle(data.owner)||'分配大纲'"
                                @click.stop.prevent="() => assignOutline(node, data)" />
                            <!-- 删除节点 -->
                            <el-button
                                v-if="(!isPrivate || ![1,3,4,5].includes(data.outlineType)) && node.level===2"
                                size="mini" icon="el-icon-delete"
                                title="删除节点"
                                @click.stop.prevent="() => removeItem(node, data)" />
                        </el-button-group>

                        <!-- 仅可协同不做章节的分配 第二层节点显示操作按钮-->
                        <el-button-group v-else-if="author.lockedAll && !author.assignOutline">
                            <!-- 章节被他人锁定了 -->
                            <el-tooltip v-if="lockedByUser(data)" :content="lockedByUserContent(data)" placement="top">
                                <i class="el-icon-lock" style="padding: 3px; color:orangered;" />
                            </el-tooltip>
                            <el-button
                                v-if="node.level===2 && !lockedByUser(data)"
                                size="mini"
                                :class="{'active':lockedBySelf(data)}"
                                :icon="lockedBySelf(data) ? 'el-icon-unlock' : 'el-icon-edit-outline'"
                                :title="lockedBySelf(data) ? '解锁章节' : '编辑章节'"
                                @click.stop.prevent="editDocbyUnlock(data)" />
                        </el-button-group>

                        <!-- 定义了章节的分配 则操作分配 锁定 解锁 -->
                        <el-button-group v-else>
                            <!-- 可分配章节 -->
                            <template>
                                <el-button
                                    v-if="chechHasAssigned(data) && !checkHasLocked(data) && !data.locked"
                                    size="mini" class="ass3"
                                    :class="{'active':hasAssignOutline(data)}"
                                    :icon="!assignTitle(data.owner) ? 'el-icon-user' : 'el-icon-user-solid'"
                                    :title="assignTitle(data.owner)||'分配大纲'"
                                    @click.stop.prevent="() => assignOutlineToMember(node, data)" />
                            </template>

                            <!-- 章节被他人锁定了 -->
                            <el-tooltip v-if="lockedByUser(data)" :content="lockedByUserContent(data)" placement="top">
                                <i class="el-icon-lock" style="padding: 3px; color:orangered;" />
                            </el-tooltip>
                            <!-- 锁定编辑或解锁 notChildAssign(node,data) -->
                            <el-button
                                v-if="!data.locked && checkIsAssignOutline(data)"
                                size="mini"
                                :class="{'active':lockedBySelf(data) && checkIsAssignOutline(data)}"
                                :icon="lockedBySelf(data) ? 'el-icon-unlock' : 'el-icon-edit-outline'"
                                :title="lockedBySelf(data) ?'解锁章节' : '编辑章节'"
                                @click.stop.prevent="editDocbyUnlock(data)" />
                        </el-button-group>
                        <!-- {{checkIsAssignOutline(data)}} -->
                    </div>
                </template>

                <template v-else>
                    <!-- 新增章节下拉菜单 -->
                    <div v-if="data.parentId==='0' && checkSingleEdit && !merged && !author.commitId">
                        <el-menu mode="horizontal" class="tree-menu" @select="handleSelectAdd">
                            <el-submenu index="0">
                                <template slot="title">新增</template>
                                <template v-for="(item,idx) in addMenus">
                                    <el-menu-item v-if="!item.children" :index="item.index" :key="idx">{{item.label}}</el-menu-item>
                                    <el-submenu v-else :index="item.index" :key="item.index">
                                        <template slot="title">{{item.label}}</template>
                                        <el-menu-item v-for="(subItem, j) in item.children" :key="j" :index="subItem.index">{{subItem.label}}</el-menu-item>
                                    </el-submenu>
                                </template>
                            </el-submenu>
                        </el-menu>
                    </div>
                    <!-- 锁定状态下 -->
                    <div v-else-if="node.level===2 && checkSingleEdit && !merged" class="btns">
                        <template v-if="editor">
                            <el-button v-if="data.locked" size="mini" icon="el-icon-lock" title="文档已锁定" :disabled="true" />
                            <el-button v-else size="mini" type="success" icon="el-icon-edit" title="编辑文档" @click.stop.prevent="() => $emit('change', { act:'editDoc', data })" />
                        </template>
                        <template v-else>
                            <el-button
                                v-if="[5,6,8,9].includes(data.outlineType)"
                                size="mini"
                                icon="el-icon-document-copy"
                                title="插入同类章节"
                                @click.stop.prevent="() => insertChapter(data)" />
                            <el-button
                                v-if="(!isPrivate || ![1,3,4,5].includes(data.outlineType)) && !fixed.includes(data.outlineType)"
                                size="mini" icon="el-icon-delete"
                                title="删除节点"
                                @click.stop.prevent="() => removeItem(node, data)" />
                        </template>
                    </div>
                </template>
            </div>
        </el-tree>
        <!-- 弹窗组件-->
        <el-dialog
            append-to-body
            custom-class="cmp-dialog"
            :data-cmp="cmpName"
            :visible.sync="dialogData.visible"
            :width="dialogData.width"
            :fullscreen="dialogData.fullscreen"
            :close-on-click-modal="false"
            :show-close="false"
            destroy-on-close
            @before-close="closeDialog"
            @close="closeDialog">
            <div class="cmp-content" :style="{'height':dialogData.height||'auto'}">
                <component ref="slotCmp" v-if="slotCmp" :is="slotCmp" :data="dialogData" :author="author" @change="changeCmpData" @close="closeDialog" />
            </div>
            <div slot="footer">
                <el-button size="small" @click.stop.prevent="closeDialog">取 消</el-button>
                <el-button size="small" type="primary" @click.stop.prevent="submitDialogValue">确 定</el-button>
            </div>
        </el-dialog>
    </div>
</template>

<script>
    /**
     * @description 大纲树组件
     * data {Array} 大纲树数据
     * editor 大纲可编辑与否
     * allLevel 显示所有层级
     *
     */
    import { outlineTypes, outlineMenus } from "../tinymceEditor/configs/editorOptions";
    import { batchUpdateOutline } from '@/api/outline';
    // import $bus from '@/utils/bus';
    import $samGlobal from "@/utils/global";
    // 附属组件
    import * as slotComponent from "@/slot/index.js";
    // 弹窗拖拽
    import elDragDialog from '@/directive/el-drag-dialog';
    export default {
        name: 'tinymce-outline',
        directives: { elDragDialog },
        props: {
            data: Array, // 大纲数据
            editor: Boolean, // 编辑状态
            allLevel: Boolean, // 显示所有层级
            isPrivate: Boolean, // 私有模式
            update: { // 可编辑大纲
                type: Boolean,
                default: false
            },
            fixed: { // 固定章节不能操作
                type: Array,
                default: () => {
                    return [];
                }
            },
            merged: { // 是否已合并了文档
                type: Boolean,
                default: false
            },
            author: { // 用户信息
                type: Object,
                default: () => {
                    return {
                        userId: '3837777',
                        userName: 'sam.shen',
                        commitId: '',
                        isAdmin: false, // 是否为管理员（可编辑大纲）
                        lockedAll: false, // 是否为多人编纂
                        assignOutline: false, // 是否可以分配大纲
                        memberList: [], // 成员列表
                        assignOutlineId: []
                    }
                }
            },
            lockedOutline: Array,
            menus: {
                type: Array,
                default: () => {
                    return []
                }
            },
            draggable: Boolean
        },
        computed: {
            emptyText() {
                let str = '待构建大纲数据...';
                return str;
            },
            checkSingleEdit() {
                return this.update && (this.editOutline || !this.author.lockedAll);
            },
            adminOutline() {
                return this.author.isAdmin;
            },
            disabledEdit() {
                let disabled = !this.author.isAdmin;
                if (this.lockedOutline.length) {
                    disabled = true;
                }
                return disabled;
            },
            slotCmp() {
                if (this.cmpName) {
                    return slotComponent[this.cmpName];
                }
                return null;
            },
        },
        watch: {
            data: {
                handler(data) {
                    if (!_.isEmpty(data)) {
                        // console.log('this.treeData==>', data)
                        let diff = $samGlobal.compare(data, this.treeData);
                        if (!diff) {
                            setTimeout(() => {
                                this.setData();
                            }, 300)
                        }
                    }
                },
                immediate: true,
                deep: true
            },

            author: {
                handler(data) {
                    if (!_.isEmpty(data)) {
                        if (data.lockDoc) {
                            this.editOutline = true;
                        }
                        if (data.memberList && data.memberList.length) {
                            this.memberList = _.cloneDeep(data.memberList);
                        }
                    }
                },
                immediate: true,
                deep: true
            },
            menus: {
                handler(data) {
                    if (!_.isEmpty(data)) {
                        this.addMenus = data;
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
                // 附属组件名称
                cmpName: null,
                dialogData: {}, // 附属组件弹窗和数据
                addMenus: [...outlineMenus],
                assignOutlineId: []
            };
        },
        methods: {
            /**
             * @description 校验是否可分配章节及其子集
             * @param {Object} data
             */
            checkHasLocked(data) {
                if (this.lockedBySelf(data)) {
                    return true;
                }
                // 校验父级点是否已经被锁定
                var parentNodes = $samGlobal.getParentNode(this.treeData[0]['children'], data.outlineId, { idKey: "outlineId", parentKey: "parentId", "children": "children" });
                for (let i = 0; i < parentNodes.length; i++) {
                    if (this.lockedBySelf(parentNodes[i]) || parentNodes[i].locked) {
                        return true;
                        break;
                    }
                }
                return false;
            },

            /**
             * @description 校验是否可分配章节及其子集
             * @param {Object} data
             */
            chechHasAssigned(data) {
                var flag = false;

                if (this.author.assignOutline) {
                    if (this.author.isAdmin) {
                        return true;
                    }
                    // 已定义的可分配的章节子集,不包含本身已被指定的章节
                    if (!_.isEmpty(this.author.memberList)) {
                        for (let i =0; i<this.assignOutlineId.length; i++) {
                            if (data.ancestors.split(',').includes(this.assignOutlineId[i]) && !this.assignOutlineId.includes(data.outlineId)) {
                                flag = true;
                                break;
                            }
                        }
                    }
                }
                return flag;
            },

            /**
             * @description 校验章节是否已经被分配了
             */
            checkIsAssignOutline(data) {
                if (!_.isEmpty(data.owner)) {
                    var owner = _.isString(data.owner) ? JSON.parse(data.owner) : data.owner;
                    var assingIndex = _.findIndex(owner, { userId: this.author.userId });
                    return !!~assingIndex;
                }
                return false;
            },

            /**
             * @description 强制全部解锁
             */
            unlockAll() {
                this.$confirm('确定全部解锁，可能会影响正在编辑的文档?', '提示', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                }).then(() => {
                    this.$emit('change', { act: 'lockDoc', isLock: 0, forceUnlock: true });
                }).catch(() => {});
            },

            // 校验是否可无限分配
            isUnlimit(level = 2) {
                var flag = true;
                if (level > 2 && this.author.outlineLevel && level > this.author.outlineLevel) {
                    flag = false;
                }
                return flag;
            },

            /**
             * @description 校验章节是否被自己锁定
             * @param {Object} node
             * @param {Object} data
             */
            notChildAssign(node = {}, data = {}) {
                var lockedItem = _.find(this.lockedOutline, { lockedOutlineId: data.outlineId });
                if (lockedItem && lockedItem.userId === this.author.userId) {
                    return true;
                }
                return false;
            },

            /**
             * @description 允许节点可以拖拽, 待完善
             * @param {Object} node
             */
            allowDrag(node = {}) {
                /* console.log('allowDrag=>', node)
                return node.level > 2; */
                return false;
            },
            /**
             * @description 允许拖拽后置入节点
             * @param {Object} draggingNode 正在拖动的节点
             * @param {Object} currNode 要置入的节点
             * @param {String} type 置入的类型 prev next inner
             */
            allowDrop(draggingNode = {}, currNode = {}, type = '') {
                /* console.log('allowDrop=>', draggingNode, currNode, type)
                if (![1, 2, 11, 12].includes(currNode.data.outlineType)) {
                    return true;
                } */
                return false;
            },
            /**
             * @description 节点拖拽成功后触发
             * @param {Object} droppedNode 被拖拽节点对应的 Node
             * @param {Object} endNode 结束拖拽时最后进入的节点
             * @param {String} type 被拖拽节点的放置位置 before、after、inner
             */
            nodeDropped(droppedNode, endNode, type) {
                console.log('nodeDropped=>', droppedNode, endNode, type)
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

            /**
             * @description 章节是否已经被分配过
             * @param {Object} data
             */
            hasAssignOutline(data) {
                return !_.isEmpty(data.owner);
            },

            /**
             * @description 分配图标文字说明
             * @param {String} owners 已分配的用户
             */
            assignTitle(owners) {
                if (!_.isEmpty(owners) && this.author && this.author.memberList) {
                    owners = _.isString(owners) ? JSON.parse(owners) : owners;
                    let userName = [];
                    owners.forEach(item => {
                        userName.push(item.userName);
                    })
                    return '已分配：' + userName.join(",");
                }
                return undefined;
            },

            // 是否可直接编辑
            editInput(data = {}) {
                // 如果是协同作业模式的
                if (this.author.lockedAll && !this.editOutline) {
                    return this.lockedBySelf(data);
                }
                return this.update && !this.merged && data.enabled;
            },

            setEditingCoordination() {
                this.coordination = !this.coordination;
                this.$emit('change', { act: 'coordination', flag: this.coordination })
            },

            // 外部调用
            backEdit(lockedDoc = 0) {
                this.editOutline = lockedDoc;
            },

            /**
             * @description 大纲设置为可编辑状态
             */
            setEditingOutline() {
                if (this.disabledEdit) {
                    this.$message.warning('当前大纲有被锁定的章节，请在全部解锁后操作！');
                    return;
                }
                this.editOutline = !this.editOutline;
                this.$emit('change', { act: 'lockDoc', isLock: this.editOutline ? 1 : 0 });
            },

            /**
             * @description 获取大纲锁定状态（他人）
             * @param {Object} data
             */
            lockedByUser(data={}) {
                var lockedItem = _.find(this.lockedOutline, obj => {
                    return obj.lockedOutlineId === data.outlineId && obj.userId !== this.author.userId;
                });
                if (!_.isEmpty(lockedItem)) {
                    return true;
                }
                return false;
            },

            /**
             * @description 获取大纲锁定状态（他人）的具体内容
             * @param {Object} data
             */
            lockedByUserContent(data={}) {
                var lockedItem = _.find(this.lockedOutline, obj => {
                    return obj.lockedOutlineId === data.outlineId && obj.userId !== this.author.userId;
                });
                if (!_.isEmpty(lockedItem)) {
                    return "章节已被" + lockedItem.userName + "锁定";
                }
                return "";
            },

            /**
             * @description 获取大纲锁定状态（自己）
             * @param {Object} data 大纲数据
             * @param {Object} node 节点数据
             */
            lockedBySelf(data={}, node={}) {
                var lockedIndex = _.findIndex(this.lockedOutline, { lockedOutlineId: data.outlineId, userId:this.author.userId });
                return !!~lockedIndex;
            },

            // 初始化设置数据结构
            setData() {
                if (this.author.lockDoc) {
                    this.editOutline = true;
                }
                // console.log('大纲', this.data)
                if (this.data && this.data.length) {
                    this.assignOutlineId = _.cloneDeep(this.author.assignOutlineId||[]);
                    var lists = [];
                    // var treeChildren = this.data[0]['children'];
                    var userId = this.author.userId;
                    const parseChildren = (arr, level) => {
                        if (arr && Array.isArray(arr)) {
                            arr.forEach(item => {
                                if ([8, 9].includes(item.outlineType)) {
                                    item.docattr = item.infoNum == 8 || !item.infoNum ? 'specs' : 'means';
                                    // sam.shen 新增，附录子节点不需要附录属性定义
                                    if (item.outlineCatalog && item.outlineCatalog.split('.').length > 1) {
                                        delete item.docattr;
                                    }
                                }
                                // 解锁
                                if (this.author.userId && this.author.lockedAll) {
                                    let lockIndex = _.findIndex(this.lockedOutline, o => {
                                        return o.lockedOutlineId === item.outlineId && o.userId !== userId;
                                    });
                                    let editIndex = _.findIndex(this.lockedOutline, o => {
                                        return o.lockedOutlineId === item.outlineId && o.userId === userId;
                                    });

                                    if (!!~lockIndex) {
                                        item.locked = true;
                                    } else {
                                        item.locked = false;
                                    }

                                    if (!!~editIndex) {
                                        item.editing = true;
                                    }
                                }
                                // 章节是否已被分配。并更新用户数据
                                if (!_.isEmpty(item.owner) && !_.isEmpty(this.memberList)) {
                                    // debugger
                                    this.memberList.forEach(user => {
                                        let assignOutline = user.assignOutline ? user.assignOutline.split(',') : [];
                                        let assignIndex = _.findIndex(item.owner, { userId: user.userId });
                                        if (!!~assignIndex) {
                                            assignOutline.push(item.outlineId);
                                        }
                                        user.assignOutline = _.uniq(assignOutline).join(",");
                                    });
                                    // console.log(item.owner);
                                    for (let i = 0; i<item.owner.length; i++) {
                                        if (item.owner[i]['userId'] === this.author.userId) {
                                            this.assignOutlineId.push(item.outlineId);
                                        }
                                    }
                                    this.assignOutlineId = _.uniq(this.assignOutlineId);
                                    // debugger
                                }
                                // 层级锁定不能被分配
                                if (this.author.outlineLevel && level > this.author.outlineLevel) {
                                    item.disabled = true;
                                }

                                if (parseInt(item.isVisible) === 1 || (this.author.lockedAll && this.author.assignOutline)) {
                                    lists.push(item);
                                    // 继续遍历
                                    if (item.children && item.children.length) {
                                        // 过滤掉不显示的
                                        if (!this.allLevel) {
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
                    parseChildren(this.data[0]['children'], 2);
                    var treeData = _.cloneDeep(this.data[0]);
                    delete treeData.children;
                    // console.log('lists===>', lists)
                    // debugger
                    lists.unshift(treeData);
                    this.treeData = $samGlobal.handleTree(lists, 'outlineId', 'parentId', 'children', '0');
                    // console.log("this.assignOutlineId", this.assignOutlineId)

                } else {
                    this.treeData = _.cloneDeep(this.data);
                }
            },
            /**
             * @description 获取大纲数据
             */
            getData() {
                return this.treeData[0];
            },

            /**
             * @description 删除节点
             * @param {Object} node
             * @param {Object} data
             */
            removeItem(node = null, data = null) {
                this.$confirm('将同时删除相关正文内容!确定要删除', '提示', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                }).then(() => {
                    var parent = node.parent;
                    var children = parent.data.children || parent.data;
                    var index = children.findIndex((d) => d.outlineId === data.outlineId);
                    children.splice(index, 1);
                    this.resetTreeData();
                    this.$emit('change', { act: 'remove', ...data });
                }).catch(() => {});
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
             * @description 附录属性切换
             * @param {Object} obj
             */
            handleCommand(obj) {
                /* var outlineType = obj.key === 'specs' ? 8 : 9;
                this.$set(obj.data, 'outlineType', outlineType); */
                this.$set(obj.data, 'docattr', obj.key);
                this.$set(obj.data, 'infoNum', obj.key === 'specs' ? 8 : 9);
                this.$emit('change', { act: 'docattr', data: obj.data });
            },

            /**
             * @description 插入章节
             * @param {Object} item
             */
            insertChapter(item = {}) {
                var outlineId = $samGlobal.guid();
                var itemCatalog = String(item.outlineCatalog).split('.');
                var orderNum = item.orderNum;
                // 附录的 "A".charCodeAt() - 65
                if (isNaN(itemCatalog[itemCatalog.length - 1])) {
                    itemCatalog = itemCatalog[itemCatalog.length - 1];
                } else {
                    itemCatalog = parseInt(itemCatalog[itemCatalog.length - 1]) + 1;
                }
                // itemCatalog = isNaN(itemCatalog[itemCatalog.length - 1]) ? itemCatalog[itemCatalog.length - 1] : parseInt(itemCatalog[itemCatalog.length - 1]);

                var treeData = this.treeData[0];
                var sameNodes = _.filter(treeData.children, { parentId: item.parentId, outlineType: item.outlineType, isVisible: 1 });
                if (item.letter || [8, 9].includes(item.outlineType)) {
                    sameNodes = _.filter(treeData.children, c => {
                        return c.parentId === item.parentId && [8, 9].includes(c.outlineType) && c.isVisible === 1;
                    });
                }
                // debugger
                var index = _.findIndex(treeData.children, { outlineId: item.outlineId });
                var data = _.merge({}, item, {
                    ancestors: item.parentId + ',' + outlineId,
                    parentId: item.parentId,
                    outlineId,
                    isVisible: 1,
                    levelNum: 1,
                    orderNum: orderNum, // + 1,
                    outlineType: [8,9].includes(item.outlineType) ? item.outlineType : 6,
                    outlineTitle: '新章节',
                    outlineCatalog: itemCatalog, //itemCatalog + 1,
                    content: null
                });

                if (data.letter) {
                    let childId = $samGlobal.guid();
                    data.children = [{
                        outlineId: childId,
                        parentId: outlineId,
                        ancestors: `${data.parentId},${outlineId},${childId}`,
                        levelNum: 3,
                        orderNum: 1,
                        isVisible: 1,
                        outlineTitle: '附录条款',
                        outlineType: 10,
                        outlineCatalog: data.letter + '.' + 1,
                        content: null
                    }]
                } else {
                    delete data.children;
                }
                // 在当前节点后插入新数据
                var appendixIndex = 0;
                treeData.children.splice(index + 1, 0, data);
                treeData.children.forEach(child => {
                    let childItem = _.find(sameNodes, { outlineId: child.outlineId });
                    if (childItem) {
                        if (childItem.letter) {
                            childItem.letter = $samGlobal.numberToLetters(appendixIndex);
                            appendixIndex++;
                        }
                    }
                });

                this.resetTreeData();
                // 更新文档结构
                this.refreshDoc(outlineId, data);
            },

            /**
             * @description 从根节点后添加节点 【大纲类型 1.章 2.条 3.附录章 4.附录条 5.前言 6.引言 7.参考文献 8.索引】
             * @param {Object} key
             * @param {String} keyPath
             */
            handleSelectAdd(key, keyPath, vm = null, title = undefined) {
                var error;
                var treeData = this.treeData[0];
                var outlineType = parseInt(key);
                var outTypeData = _.find(outlineTypes, { type: outlineType });
                if (!outTypeData) {
                    this.$message.error("大纲数据结构错误！");
                    return false;
                }
                var outlineId = $samGlobal.guid();
                var orderNum = this.getLastOrderNum(treeData, outlineType, keyPath.includes('8-9'));
                // debugger
                if (!orderNum) {
                    orderNum = outTypeData.orderNum;
                }
                if (key === '9') {
                    outlineType = 8;
                }

                var data = {
                    docId: treeData.docId || '',
                    parentId: treeData.outlineId,
                    outlineId,
                    isVisible: 1,
                    levelNum: 1,
                    infoNum: parseInt(key),
                    outlineType,
                    outlineTitle: title || outTypeData.label,
                    orderNum: orderNum + 1,
                    ancestors: treeData.outlineId + ',' + outlineId,
                    content: null
                }
                switch (key) {
                    // 固定类型
                    case '1':
                    case '2':
                    case '3':
                    case '4':
                    case '5':
                    case '11':
                    case '12':
                        if (_.find(treeData.children, item => { return item.outlineType == data.outlineType; })) {
                            error = '已存在相同类型大纲节点！';
                        }
                        case '6': // 条文章节
                        case '8': // 附录章节
                        case '9':

                            let outlineCatalog = parseInt(this.getLastCatalog(keyPath.includes('8-9')));
                            data.outlineCatalog = outlineCatalog + 1;
                            // 附录章节
                            if (keyPath.includes('8-9')) {
								data.outlineTitle = '附录名称';
                                data.appendix = true; // outlineType
                                data.letter = $samGlobal.numberToLetters(outlineCatalog);
                                data.docattr = key === '8' ? 'specs' : 'means'; // 规范性 | 资料性 (outlineType)
                                // 同时需要添加子节点
                                data.children = [];
                            }
                            break;
                            // 其他
                        default:
                            if (_.find(treeData.children, { outlineType: data.outlineType })) {
                                error = '已存在相同类型大纲节点！';
                            }
                            break;
                }
                if (error) {
                    this.$message.warning(error);
                    return false;
                }

                if (!treeData.children) {
                    this.$set(treeData, 'children', []);
                }
                if (['1', '2', '11', '12'].includes(key)) {
                    data.outlineCatalog = '';
                }
                // debugger
                treeData.children.push(data);
                this.resetTreeData();
                this.refreshDoc(outlineId, data);
                return true;
            },

            /**
             * @description 创建新的大纲
             * @param {String} outlineId
             * @param {Object} data
             */
            createNewOutline(outlineId = '', data = {}) {
                this.resetTreeData();
                this.refreshDoc(outlineId, data);
            },

            /**
             * @description 重置文档
             * @param {String} outlineId
             * @param {Object} data
             */
            refreshDoc(outlineId = '', data = null) {
                setTimeout(() => {
                    var children = this.treeData[0]['children'];
                    var itemIndex = _.findIndex(children, { outlineId });
                    var prevNode = children[itemIndex - 1];
                    // 上报新增章节页面事件
                    this.$emit('change', { act: 'add', prevNode, currNode: data });
                }, 0);
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
            resetTreeData() {
                var treeData = this.treeData[0];
                treeData.children = _.orderBy(treeData.children, ['outlineType', 'orderNum', 'outlineCatalog']);
                // 重新编码outlineCatalog
                this.setCatalogNum();
                this.$forceUpdate();
            },
            /**
             * @description 重置大纲和章节的排序
             */
            setCatalogNum() {
                var outlineCatalog = 0;
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
                                node.children = _.orderBy(node.children, ['outlineType', 'outlineCatalog'], ['asc', 'asc']);
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
             * @description 解锁或锁定章节
             * @param {Object} data
             */
            editDocbyUnlock(data = {}, node={}) {
                if (this.author.lockedAll) {
                    var msg;
                    // 校验父级点是否已经被锁定
                    var parentNodes = $samGlobal.getParentNode(this.treeData[0]['children'], data.outlineId, { idKey: "outlineId", parentKey: "parentId", "children": "children" });
                    for (let i = 0; i < parentNodes.length; i++) {
                        if (parentNodes[i]['locked'] && parentNodes[i].outlineId !== data.outlineId) {
                            msg = '父章节条目【' + parentNodes[i].outlineTitle + '】已被锁定编辑，请在待解锁后再操作！';
                            break;
                        }
                    }
                    // 同时校验子章节是否有被锁定
                    if (!msg) {
                        var childNodes = $samGlobal.getChildNodes(data.children || []);
                        for (let i = 0; i < childNodes.length; i++) {
                            if (childNodes[i]['locked'] && childNodes[i].outlineId !== data.outlineId) {
                                msg = '子章节条目【' + childNodes[i].outlineTitle + '】已被锁定编辑，请在待解锁后再操作！';
                                break;
                            }
                        }
                    }
                    if (msg) {
                        this.$message.warning(msg);
                        return;
                    }
                    this.$emit('change', { act: 'editDoc', data, unlock: this.lockedBySelf(data, node) });
                } else {
                    this.handleNodeClick(data);
                }
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

            /**
             * @description 将树结构转换为一维数组
             * @param {Array} treeDatas
             */
            combineOutlines(treeDatas = []) {
                var arrLists = [];
                const fun = arr => {
                    for (let i = 0; i < arr.length; i++) {
                        let item = arr[i];
                        arrLists.push(item);
                        if (item.children && item.children.length) {
                            fun(item.children);
                        }
                    }
                }
                fun(treeDatas);
                return arrLists;
            },

            /**
             * @description 保存大纲数据
             * @param {Boolean}  isTest:true 仅输出一维数组
             */
            async saveOutlineData(isTest = false) {
                // 重新转换为一维数组
                var lists = this.combineOutlines([...this.treeData]);
                if (isTest) {
                    return lists;
                }
                var editorConfig = $samGlobal.getStroage('tinymceConfig');
                var res = await batchUpdateOutline({ outlineList: lists }, editorConfig.editorURL || '');
                if (res.code === 200) {
                    this.$message.success('已保存大纲！');
                    return true;
                } else {
                    this.$message.error('保存大纲失败！');
                    return false;
                }
            },
            /**
             * @description 校验是否有权限分配大纲
             * @param {Object} node
             * @param {Object} data
             */
            checkAssignOutlieAuthor(node = null, data = null) {
                // 如果是无限级分配
                const matchOutline = outlineItem => {
                    var parentNode = $samGlobal.getParentNode(this.treeData[0]['children'], outlineItem.outlineId, { idKey: "outlineId", parentKey: "parentId", "children": "children" });
                    for (let i = 0; i < parentNode.length; i++) {
                        if (this.assignOutlineId.includes(parentNode[i]['outlineId'])) { // 同时包含自身节点 && parentNode[i]['outlineId'] !== outlineItem.outlineId
                            return true;
                        }
                    }
                    return false;
                }
                if (!_.isEmpty(this.assignOutlineId)) {
                    return matchOutline(data);
                }
                return true;
            },
            /**
             * @description 再次分配大纲
             * @param {Object} node
             * @param {Object} data
             */
            assignOutlineToMember(node = null, data = null) {
                var isLocked = data.locked;
                var error;
                if (!isLocked) {
                    // 校验父章节是否被锁定编辑的
                    var parentNode = $samGlobal.getParentNode(this.treeData[0]['children'], data.outlineId, { idKey: "outlineId", parentKey: "parentId", "children": "children" });
                    for (let i = 0; i < parentNode.length; i++) {
                        if (parentNode[i].locked) {
                            error = '父章节【' + parentNode[i].outlineTitle + '】已被锁定，待解锁后再操作！';
                            break;
                        }
                    }
                    // 校验子章节是否被锁定编辑的
                    if (!isLocked) {
                        let childNode = $samGlobal.findAllChildrenNode(data.children, data, { key: "outlineId", parentKey: 'parentId', children: "children" });
                        for (let i = 0; i < childNode.length; i++) {
                            if (childNode[i].locked) {
                                error = '子章节【' + childNode[i].outlineTitle + '】已被锁定，待解锁后再操作！';
                                break;
                            }
                        }
                    }
                } else {
                    error = '该章节【' + data.outlineTitle + '】已被锁定编辑了！';
                }
                // 如果章节有被锁定的则终止
                if (error) {
                    this.$message.warning(error);
                    return false;
                }
                this.assignOutline(node, data);

            },
            /**
             * @description 分配大纲
             * @param {Object} node
             * @param {Object} data
             */
            assignOutline(node = null, data = null) {
                // 判断是否被指定了分配大纲
                if (!this.checkAssignOutlieAuthor(node, data) && !this.author.isAdmin) {
                    this.$message.warning('该章节【' + data.outlineTitle + '】无权限分配！');
                    return;
                }

                // 判断父级或子集大纲是否已被分配
                const checkIsExits = outlineData => {
                    var itemArr = [];
                    if (!outlineData.owner) {
                        if (outlineData.children && outlineData.children.length) {
                            let allChildNodes = $samGlobal.findAllChildrenNode(outlineData.children, outlineData, { key: "outlineId", parentKey: 'parentId', children: "children" });
                            for (let i = 0; i < allChildNodes.length; i++) {
                                let item = allChildNodes[i];
                                if (item.owner) {
                                    let outlineCatalog = item.letter ? "附录" + item.letter : item.outlineCatalog;
                                    itemArr.push(outlineCatalog + ' ' + item.outlineTitle);
                                }
                            }
                        }
                        // 查找父级是否有被分配
                        var parentNodes = $samGlobal.getParentNode(this.treeData[0].children, outlineData.outlineId, { idKey: "outlineId", parentKey: 'parentId', children: "children" });
                        if (parentNodes && parentNodes.length) {
                            for (let i = 0; i < parentNodes.length; i++) {
                                let item = parentNodes[i];
                                if (item.owner && (_.isEmpty(this.assignOutlineId || !this.assignOutlineId.includes(item.outlineId)))) {
                                    let outlineCatalog = item.letter ? "附录" + item.letter : item.outlineCatalog;
                                    itemArr.push(outlineCatalog + ' ' + item.outlineTitle);
                                }
                            }
                        }
                    }
                    return itemArr;
                }
                var checkIsExitsItems = checkIsExits(data);

                // console.log('checkIsExitsItems', checkIsExitsItems)
                if (checkIsExitsItems.length) {
                    this.$message({
                        type: 'warning',
                        dangerouslyUseHTMLString: true,
                        message: '所选章节条目有冲突（已被分配了章节条目），请重新定义协作分配！<br/>-----------------------------------------------------------------------------<br/>' + checkIsExitsItems.join("<br/>")
                    });
                    return false;
                }
                this.openDialogComp({
                    cmpName: 'assignOutline',
                    visible: true,
                    title: '分配大纲',
                    width: '600px',
                    outlineData: this.treeData,
                    node,
                    data
                });
            },

            /**
             * @description 打开弹窗加载附属组件
             * @param {Object} obj
             */
            openDialogComp(obj = {}) {
                this.cmpName = obj.cmpName;
                this.dialogData = obj;
            },
            /**
             * @description 关闭弹窗前销毁组件
             */
            closeDialog() {
                this.dialogData.visible = false;
                this.cmpName = undefined;
            },
            /**
             * @description 附属组件值提交
             */
            submitDialogValue() {
                var dataValue = this.$refs.slotCmp.submit();
                if (this.dialogData.cmpName === 'assignOutline') { // 分配大纲
                    var outlineData = $samGlobal.getChildData('outlineId', this.dialogData.data.outlineId, this.treeData[0].children);
                    if (outlineData) {
                        outlineData.owner = this.memberList.filter(o => dataValue.includes(o.userId)).map(item => {
                            delete item.assignOutline;
                            return item;
                        });
                        // 提交更新
                        this.$emit('change', { act: 'updateOutlineOwner', assignOutline: true, items: [outlineData] });
                    } else {
                        this.$message.error('大纲查找失败');
                    }
                } else if (this.dialogData.cmpName === 'assignCollaboration') { // 分配任务
                    this.memberList = dataValue;
                    this.setOutlineOwner();
                }

                this.dialogData.visible = false;
            },

            /**
             * @description 遍历节点。设置已分配的节点
             */
            setOutlineOwner() {
                var items = [];
                const setOwner = arr => {
                    arr.forEach(item => {
                        let assignMembers = this.memberList.filter(user => {
                            return user.assignOutline && user.assignOutline.includes(item.outlineId);
                        });
                        let owner = [];
                        if (!_.isEmpty(assignMembers)) {
                            // debugger
                            owner = assignMembers.map(obj => {
                                return {
                                    userId: obj.userId,
                                    userName: obj.userName
                                };
                            })
                        }
                        this.$set(item, 'owner', owner);
                        items.push(item);
                        // 继续分配
                        if (!_.isEmpty(item.children)) {
                            setOwner(item.children);
                        }
                    })
                }
                setOwner(this.treeData[0].children);
                // 上报给编辑器，设置章节条目的分配
                this.$emit('change', { act: 'updateOutlineOwner', items });
            },

            /**
             * @description 附属组件值改变
             * @param {Object} obj
             */
            changeCmpData(data) {
                console.log('changeCmpData=>', data)
            },
            // 转换大纲负责人名称
            parseOwnerName(userId) {
                var user = _.find(this.memberList, { userId: userId });
                return user ? user.userName : userId;
            },

            /**
             * @description 大纲是否分配给其他用户
             * @param {Object} data
             */
            isOtherOwner(data = {}, node={}) {
                // s1. 找出祖父节点是否有正在被锁定编辑的
                var lockedParentBySelf = this.getParentLockBySelf(data, true);
                if (lockedParentBySelf) {
                    return false;
                }
                // s2.本身节点是否被分配的
                if (_.isEmpty(data.owner)) {
                    return this.author.assignOutline;
                }
                // s3. 按配置分配的
                var assignIndex = _.findIndex(data.owner, { userId: this.author.userId });
                return this.author.assignOutline && data.owner && !~assignIndex;
            },

            /**
             * @description 祖父节点节点是否被锁定正在编辑的
             * @param {Object} data
             */
            isLockParent(item = {}, node={}) {
                let parentNodes = $samGlobal.getParentNode(this.treeData[0].children, data.outlineId, { idKey: "outlineId", parentKey: "parentId", "children": "children" });
                if (parentNodes && parentNodes.length) {
                    for (let i = 0; i < parentNodes.length; i++) {
                        let isLocked = this.lockedBySelf(parentNodes[i]);
                        if (isLocked) {
                            return true;
                        }
                    }
                }
                return false;
            },

            /**
             * @description 获取祖父节点是否被分配给自己且正在被锁定编辑的
             * @param {Object} item
             */
            getParentLockBySelf(item = {}, isSelf = false) {
                let parentNodes = $samGlobal.getParentNode(this.treeData[0].children, item.parentId, { idKey: "outlineId", parentKey: "parentId", "children": "children" });
                if (parentNodes && parentNodes.length) {
                    for (let i = 0; i < parentNodes.length; i++) {
                        let isLocked = this.lockedBySelf(parentNodes[i]);
                        if (isLocked || (isSelf && !_.isEmpty(parentNodes[i]['owner']) && this.checkIsAssignOutline(item))) {
                            return true;
                        }
                    }
                }
                return false;
            },

            // 显示分配的用户
            assignOwnerContent(data) {
                let str = "已分配人员：";
                let userName = [];
                if (!_.isEmpty(data.owner)) {
                    let owner = _.isString(data.owner) ? JSON.parse(data.owner) : data.owner;
                    owner.forEach(item => {
                        userName.push(item.userName);
                    })
                }
                str += userName.join(",");
                return str;
            },
            /**
             * @description 协作分配
             * @param {Object} node
             * @param {Object} data
             */
            assignCollaboration(outlineData=null) {
                if (!this.data.length) {
                    this.$message.warning('数据异常，请刷新页面后重试！');
                    return;
                }
                // debugger
                this.openDialogComp({
                    cmpName: 'assignCollaboration',
                    visible: true,
                    title: '协作分配',
                    width: '900px',
                    height: '100%',
                    outlineList: this.data[0].children,
                    memberList: this.memberList
                });
            },
        }
    };
</script>

<style lang="scss" scoped>
    @import './index.scss';
</style>
