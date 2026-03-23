<template>
    <div class="edition-container">
        <el-select size="small" v-model="dateValue" clearable style="width:100%" @change="changeValue">
			<el-option v-for="(v,idx) in docVersion" :key="idx" :value="v.label" :label="v.label" />
		</el-select>
    </div>
</template>

<script>
    export default {
        name: 'doc-edition',
        props: {
            data:{
                type: Object,
                default: () => {
                    return {}
                }
            }
        },
        watch: {
            data: {
                handler(obj) {
                    this.setData();
                },
                deep: true,
                immediate: true
            }
        },
        data() {
            return {
				docVersion: [
                    { label:'草案稿', value:1 },
                    { label:'征求意见稿', value:2 },
                    { label:'送审稿', value:3 },
                    { label:'报批稿', value:4 }
                ],
                dateValue: ""
            }
        },
        methods: {
            setData() {
                if (!_.isEmpty(this.data) && this.data.value) {
                    this.dateValue = this.data.value;
                }
            },
            changeValue() {
                this.$emit('change', this.dateValue)
            },
            submit() {
                return this.dateValue;
            }
        }
    }
</script>

<style lang="scss" scoped>
    .edition-container{
        padding: 10px;
    }
</style>

