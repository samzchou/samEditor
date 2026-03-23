<template>
    <div class="assign-outline-container">
        <P></P>
        <div class="s-header">
            <div class="title">已选大纲：{{ data.data.letter ? '附录' + data.data.letter : data.data.outlineCatalog }} {{ data.data.outlineTitle }}</div>
        </div>
        <div class="transfer">
            <el-transfer
                filterable
                :filter-method="filterMethod"
                filter-placeholder="请输入用户名"
                v-model="dataValue"
                :data="author.memberList"
                :props="{ key: 'userId', label: 'userName' }"
                :titles="['待分配成员', '已分配成员']">
            </el-transfer>
        </div>
    </div>
</template>

<script>
    export default {
        name: 'assignOutline',
        props: {
            data: {
                type: Object,
                default: () => {
                    return {};
                }
            },
            author: {
                type: Object,
                default: () => {
                    return {
                        userId: '',
                        userName: 'anonymous',
                        commitId: '',
                        memberList: []
                    };
                }
            }
        },
        watch: {
            data: {
                handler(obj) {
                    if (!_.isEmpty(obj)) {
                        this.setData();
                    }
                },
                deep: true,
                immediate: true
            }
        },
        data() {
            return {
                dataValue: [],
                filterMethod(query, item) {
                    return item.userName.indexOf(query) > -1;
                }
            };
        },
        methods: {
            setData() {
                this.dataValue = [];
                console.info('setData=>', this.data, this.author);
                if (!_.isEmpty(this.data.data.owner)) {
                    var owner = _.cloneDeep(this.data.data.owner);
                    if (_.isString(owner)) {
                        owner = JSON.parse(owner);
                    }
                    this.dataValue = owner.map(owner => {
                        let userIndex = _.findIndex(this.author.memberList, { userId:owner.userId });
                        return owner.userId;
                    });
                    console.info('this.dataValue=>', this.dataValue);
                }
            },
            changeValue() {
                this.$emit('change', this.valueStr);
            },
            submit() {
                return this.dataValue;
            }
        },
        created() {
            // this.setData();
        }
    };
</script>

<style lang="scss" scoped>
    .assign-outline-container {
        padding: 10px;
        .s-header {
            font-size: 14px;
            font-weight: bold;
            padding: 5px 0;
            border-bottom: 1px #ddd solid;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            > div {
                color: #606266;
                &::before {
                    content: '';
                    height: 20px;
                    width: 6px;
                    background-color: #0b92d6;
                    display: block;
                    float: left;
                    margin-right: 15px;
                }
            }
        }

        .transfer {
            display: flex;
            align-items: center;
            justify-content: center;
        }
        ::v-deep .el-transfer {
            display: flex;
            .el-transfer-panel{
                width: auto;
            }
            .el-transfer__buttons {
                display: flex;
                width: auto;
                padding: 0 15px;
                justify-content: center;
                flex-direction: column;
            }
            .el-transfer-panel__list {
                display: block;
                .el-checkbox__label {
                    padding-left: 24px;
                }
            }
            .el-transfer__button {
                margin: 10px 0;
            }
        }
    }
</style>
