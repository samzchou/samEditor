<template>
    <div class="standard-info-container">
        <fieldset>
            <legend>采用</legend>
            <ul class="list">
                <li>
                    <label>现行:</label>
                    <span>GB 4943-2001 《信息技术设备的安全》</span>
                </li>
            </ul>
        </fieldset>
        <fieldset>
            <legend>引用</legend>
            <ul class="list">

            </ul>
        </fieldset>
        <fieldset>
            <legend>被采用</legend>
            <ul class="list">

            </ul>
        </fieldset>
        <fieldset>
            <legend>被引用</legend>
            <ul class="list">
                <li>
                    <label>现行:</label>
                    <span>GB 4943-2001 《信息技术设备的安全》</span>
                </li>
            </ul>
        </fieldset>
    </div>
</template>

<script>
    export default {
        name: 'standard-quota-info',
        props: {
            data: {
                type: Object,
                default: () => {
                    return {
                        listData: [
                            { label:'标准名称', value:'信息技术设备安全第1部分:通用要求' },
                            { label:'标准编号', value:'GB 4943.1-2011' },
                        ]
                    }
                }
            }
        }
    }
</script>

<style lang="scss" scoped>
    @import './standard.scss';
</style>
