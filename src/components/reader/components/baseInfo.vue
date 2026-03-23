<template>
    <div class="standard-info-container">
        <fieldset>
            <legend>题录信息</legend>
            <ul class="list">
                <li v-for="(item, idx) in data.listData" :key="idx">
                    <label>{{item.label}}:</label>
                    <span>{{item.value}}</span>
                </li>
            </ul>
        </fieldset>
        <fieldset>
            <legend>历史沿革</legend>
            <ul class="list">
                <li>
                    <label>废止:</label>
                    <span>GB 4943-2001 《信息技术设备的安全》</span>
                </li>
            </ul>
        </fieldset>
        <fieldset>
            <legend>起草单位</legend>
            <ul class="list">
                <li>
                    <span>工业和信息化部电子第四研究院</span>
                </li>
                <li>
                    <span>上海市质量监督检验技术研究院</span>
                </li>
                <li>
                    <span>北京泰瑞特检测技术服务有限责任公司</span>
                </li>
            </ul>
        </fieldset>
        <fieldset>
            <legend>起草专家</legend>
            <ul class="avatars">
                <li>
                    <img src="http://192.168.0.239:9001/files/images/profile.jpg" />
                    <span>王莹</span>
                </li>
                <li>
                    <img src="http://192.168.0.239:9001/files/images/profile.jpg" />
                    <span>胡京平</span>
                </li>
                <li>
                    <img src="http://192.168.0.239:9001/files/images/profile.jpg" />
                    <span>李正</span>
                </li>
                <li>
                    <img src="http://192.168.0.239:9001/files/images/profile.jpg" />
                    <span>罗祖蔚</span>
                </li>
                <li>
                    <img src="http://192.168.0.239:9001/files/images/profile.jpg" />
                    <span>张跃亭</span>
                </li>
            </ul>
        </fieldset>
        <fieldset>
            <legend>同类标准</legend>
            <ul class="catalogs">
                <li>
                    <i class="iconfont icon-manage" />
                    <span>中标分类</span>
                </li>
                <li>
                    <i class="iconfont icon-jianguanfengkong" />
                    <span>ICS分类</span>
                </li>
                <li>
                    <i class="iconfont icon-shuju01" />
                    <span>UDC分类</span>
                </li>
                <li>
                    <i class="iconfont icon-app" />
                    <span>地方分类</span>
                </li>
                <li>
                    <i class="iconfont icon-tools" />
                    <span>国内标准</span>
                </li>
                <li>
                    <i class="iconfont icon-collection " />
                    <span>行业分类</span>
                </li>
                <li>
                    <i class="iconfont icon-tasklist" />
                    <span>TC标准</span>
                </li>
            </ul>
        </fieldset>
    </div>
</template>

<script>
    export default {
        name: 'standard-base-info',
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
