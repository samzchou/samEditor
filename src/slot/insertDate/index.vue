<template>
    <div class="date-container">
        <el-date-picker
            ref="datePicker"
            size="small"
            v-model="dateValue"
            type="date"
            value-format="yyyy-MM-dd"
            placeholder="选择日期时间" @change="changeValue"
            style="width:100%" />
    </div>
</template>

<script>
    export default {
        name: 'insert-date',
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
                handler(obj, oldData) {
                    this.setDat();
                },
                deep: true,
                immediate: true
            }
        },
        data() {
            return {
                dateValue: ""
            }
        },
        methods: {
            setDat() {
                if (!_.isEmpty(this.data) && this.data.value && this.isDate(this.data.value)) {
                    this.dateValue = this.data.value;
                }
            },
            isDate(str="") {
                return /^\d{4}-\d{2}-\d{2}$/.test(str);
            },
            changeValue() {
                this.$emit('change', this.dateValue);
            },
            submit() {
                return this.dateValue;
            }
        }
    }
</script>

<style lang="scss" scoped>
    .date-container{
        padding: 10px;
    }
</style>
