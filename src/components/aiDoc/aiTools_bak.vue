<template>
    <div class="ai-tools-cmp">
        <div class="promts">
            <h3>提示语示例</h3>
            <ul>
                <li>请重写这个段落</li>
                <li>请重写这个表格</li>
                <li>请重写这个公式</li>
            </ul>
        </div>
        <div class="forms">
            <el-form :model="ruleForm" ref="ruleForm" label-position="top">
                <el-form-item label="请输入提示语句" prop="prompt">
                    <el-input v-model="ruleForm.prompt" type="textarea" :rows="7" />
                </el-form-item>

                <el-form-item>
                    <el-button type="primary" icon="el-icon-finished" :loading="appending" @click.stop.prevent="submitForm('ruleForm')">立即提交</el-button>
                    <el-button icon="el-icon-close" :disabled="appending" @click.stop.prevent="submitCancel()">取消关闭</el-button>
                </el-form-item>
            </el-form>
        </div>
    </div>
</template>

<script>
    import { documentServer } from '@/api/nodeServer.js';
    // webSocket通信函数库
    import socketUtil from '@/utils/socketUtil.js';
    // 通用函数
    import $global from '@/utils/global.js';
    // 事件总线
    import $bus from '@/utils/bus.js';

    export default {
        name: 'ai-tools-cmp',
        props: {
            data: Object
        },
        inject: ['aiOptions'],
        watch: {
            data: {
                handler(obj) {
                    if (!_.isEmpty(obj)) {
                        this.itemData = _.cloneDeep(obj);
                        this.setData(obj)
                    }
                },
                immediate: true,
                deep: true
            }
        },
        data() {
            return {
                socketInstance: null,
                itemData: null,
                userId: $global.guid(),
                ruleForm: {
                    prompt: '请重写内容'
                },
                appending: false,
            }
        },
        methods: {
            setData(obj) {
                // console.log('setData', obj);
                this.toggleHighlight(true);
                // 连接socket
                this.connectSocket();
            },
            // 高亮切换
            toggleHighlight(flag=false) {
                if (this.itemData.nodes) {
                    for (let node of this.itemData.nodes) {
                        if (node) {
                            if (flag) {
                                $global.addClass(node, 're-write');
                            } else {
                                $global.removeClass(node, 're-write');
                            }
                        }
                    }
                }
            },

            submitCancel() {
                this.toggleHighlight();
                this.$emit('change', { act:'close' });
            },
            submitForm() {
                // this.$emit('change', { act:'submit', data:this.ruleForm });
                this.$set(this.itemData, 'prompt', this.ruleForm.prompt);
                this.getAiData();
            },
            // 组织参数提交到socket
            async getAiData(options={}) {
                // debugger
                if (!this.socketInstance) {
                    this.connectSocket();
                }
                console.log('this.itemData', this.itemData)
                const contents = this.itemData.nodes.map(node => {
                    const obj = {
                        "paragraph": node.textContent,
                        "selected": true
                    }
                    // 如果是章节或条款的
                    if ($global.hasClass(node, 'ol-list') || $global.hasClass(node, 'appendix-list')) {
                        let liIndex = node.dataset.index;
                        if (node.dataset.prev) {
                            liIndex = node.dataset.prev + '.' + liIndex;
                        }
                        const firstChild = node.firstChild;
                        if (firstChild && firstChild.nodeName === '#text' && firstChild.textContent.replace(/\s/g,'') !== '') {
                            obj.paragraph = liIndex + ' ' + firstChild.textContent;
                        }
                    } else if (node.nodeName === 'TABLE') {
                        const tableTitle = node.querySelector('caption.table-title');
                        if (tableTitle) {
                            obj.paragraph = tableTitle.textContent;
                        }
                    } else{
                        const imgNode = node.querySelector('img')
                        if (node.nodeName === 'IMG' || imgNode) {
                            obj.paragraph = imgNode ? imgNode.dataset.latex : node.dataset.latex; // this.itemData.selectedText
                        }
                        // selectedText
                    }
                    return obj;
                });
                const outline = this.itemData.outline.map(item => {
                    return item.str;
                })
                const lastOutline = _.last(this.itemData.outline);
                // const url = this.data.aiDbUrl;
                const condition = {
                    "actionType":"run_jimo_logic",
                    "JimoLogic":`check_generate_progress`,
                    "params": {
                        "action":this.itemData.command,//"rewrite",
                        "type": this.itemData.type,
                        "user_prompt": this.itemData.prompt,
                        // "source_contents": options.selectedText,
                        "std_name": this.itemData.stdName,
                        "titles": outline,
                        "level": lastOutline ? lastOutline['level'] : 1,
                        "contents": contents,
                        "opr_id": $global.guid() // 此为user_id,每次做更新
                    },
                    "ssid":"CFAtATDAAxXAeDAAEOEAwBRAHCEAAAyz"
                }
                console.log('getAiData condition', condition);
                // const res = await getAiContent(this.data.aiDbUrl, condition)
                this.appending = true;
                this.socketInstance.sendMsg(condition, 'generateSystem'); // 与Socket发送消息，建立通信
            },
            // 重写内容
            async appendContent(obj) {
                let type = 'text';
                switch (this.itemData.type) {
                    case 'section':
                        type = 'section';
                        break;
                    case 'table':
                        type = 'table';
                        break;
                    case 'formula':
                        type = 'formula';
                        break;
                }
                const node = this.itemData.nodes[0];
                // debugger
                const contents = obj.contents.filter(item => {
                    return item.type === type;
                });
                console.log('appendContent====>', contents);
                for (let item of contents) {
                    if (type === 'text') {
                        let strs = item.value.split(/\n\n/);
                        for (let str of strs) {
                            const newPar = document.createElement('p');
                            newPar.style.textIndent = '2em';
                            newPar.textContent = str;
                            node.parentNode.insertBefore(newPar, node);
                        }
                    } else if (type === 'table') {
                        const tableNode = document.createElement('table');
                        if (item.caption) {
                            const captionNode = document.createElement('caption');
                            captionNode.className = 'table-title';
                            captionNode.textContent = item.caption;
                            tableNode.appendChild(captionNode);
                        }

                        if (item.header) {
                            const colgroupNode = document.createElement('colgroup');
                            tableNode.appendChild(colgroupNode);
                            const thead = document.createElement('thead');
                            const theadTr = document.createElement('tr');
                            thead.appendChild(theadTr);
                            tableNode.appendChild(thead);
                            // 处理表头及列
                            for (let hs of item.header) {
                                const col = document.createElement('col');
                                colgroupNode.appendChild(col);
                                const th = document.createElement('th');
                                th.textContent = hs;
                                theadTr.appendChild(th);
                            }
                            // 处理表主体
                            if (item.value) {
                                const tbody = document.createElement('tbody');
                                tableNode.appendChild(tbody);
                                for (let val of item.value) {
                                    const tbodyTr = document.createElement('tr');
                                    tbody.appendChild(tbodyTr);
                                    for(let ts of val) {
                                        const td = document.createElement('td');
                                        td.textContent = ts;
                                        tbodyTr.appendChild(td);
                                    }
                                }
                            }
                            node.parentNode.insertBefore(tableNode, node);
                        }
                    } else if (type === 'formula') {
                        let latex = item.value['公式'];
                        if (latex) {
                            const condition = {
                                type: 'mathjaxToImg',
                                format: 'TeX',
                                mathStr: latex,
                                svg: true,
                                html: true
                            }
                            const res = await documentServer(condition, this.aiOptions.nodeURL);
                            if (res && res.data) {
                                let width = Math.floor(parseFloat(res.data.width) * 8.01);
                                let height = Math.floor(parseFloat(res.data.height) * 8.01);
                                if (width > 400) {
                                    width = 400;
                                }
                                let id = $global.guid();
                                let imgStr = `<img class="math-img" data-id="${id}" src="${res.data.png}" width="${width}" height="${height}" data-latex="${latex}" />`;
                            }
                        }
                    }
                }
                // 移除原始段落
                if (['text','table'].includes(type)) {
                    node.remove();
                } else if (type === 'formula') {
                    node.remove();
                }
            },
            // 连接socket
            connectSocket() {
                // debugger
                this.socketInstance = new socketUtil(this.aiOptions.aiSocketURL, { userId: this.userId });
                return this.socketInstance;
            },
            // 断开socket
            disconnectSocket() {
                if (this.socketInstance) {
                    this.socketInstance.closeSocket(true);
                    this.socketInstance = null;
                }
            },
            destroy() {
                this.disconnectSocket();
            }
        },
        mounted() {
            // 监听socket回调
            $bus.$on('onMsg', obj => {
                console.log('onMsg====>', obj)
                let data = obj.data;
                if (data && data.clientId.replace(/^\user_/i,'') === this.userId && data.contents && $global.isJSON(data.contents) && this.appending) {
                    // debugger
                    console.log('socket response data ====>', JSON.parse(data.contents));
                    if (data.progress === '100%') {
                        this.appendContent(JSON.parse(data.contents))
                        this.appending = false;
                    }
                }
            })
        },
        beforeDestroy() {
            this.destroy();
        }
    }
</script>

<style lang="scss" scoped>
    .ai-tools-cmp{
        padding:15px;
        .promts{
            >h3{

            }
            >ul{
                padding: 10px 0;
                margin-left: 20px;
                >li{
                    padding: 5px 0;
                    border-bottom: 1px solid #EEE;
                    list-style-type: circle;
                }
            }
        }
    }
</style>
