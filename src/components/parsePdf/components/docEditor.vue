<template>
    <div class="doc-editor-container">
        <div v-html="content"></div>
        <!-- <sam-editor v-if="content" ref="samEditor" :data="editorSetting" @change="changeEvent" /> -->
    </div>
</template>

<script>
    // import { samEditor, outline } from 'sam-editor';
    // import 'sam-editor/dist/sam-editor.css';
    export default {
        name: 'doc-editor',
        inject: ['pdfOptions'],
        /* components: {
            samEditor
        }, */
        props: {
            content: String,
        },
        watch: {
            content: {
                handler(content) {
                    if(!_.isEmpty(content)) {

                    }
                },
                immediate: true
             },
        },

        computed: {
            editorSetting() {
                return {

                }
            }
        },
        data() {
            return {
                htmlContent: '',
                editorInstance: null,
            }
        },

        methods: {
            changeEvent(obj) {
                console.log('editor changeEvent', obj)
                switch(obj.act) {
                    case 'initialized':
                        // debugger
                        this.editorInstance = this.$refs.samEditor;
                        // this.editorInstance.interFaceAction({ act: 'resetContent', data: { htmlContent:this.content } });
                        break;
                }
            }
        }
    }
</script>

<style lang="scss" scoped>
    .doc-editor-container{
        height: 100%;
        overflow: auto;
        ::v-deep >div{
            .page-container{
                background-color: #CCC;
                .info-block{
                    position: relative;
                    margin: 30px auto;
                    width: 210mm;
                    border: 1px solid #DDD;
                    padding: 20mm;
                    background-color:#FFF;
                    font-size:10.5pt;
                    font-family: simSun;
                    line-height: 1.6;
                    &::before{
                        content: attr(data-no);
                        color: #CCC;
                        font-family: simHei;
                    	text-align: right;
                        display: inherit;
                    	position: absolute;
                        top: 15mm;
                        left: 25mm;
                        right: 20mm;
                    }
                    &::after{
                        position: absolute;
                        right: 20mm;
                        left: unset;
                        bottom: 10mm;
                        content: attr(data-pagenum);
                        color: #CCC;
                        font-family: simHei;
                    	font-size: 10.5pt;
                    }
                    &.left{
                        padding: 25mm 25mm 20mm 20mm;
                        &::before{
                            text-align: left;
                            left: 20mm;
                        }
                        &::after{
                            left: 20mm;
                            right: unset;
                        }
                    }


                    .header-title{
                        text-align:center;
                        font-family: simHei;
                        font-size: 16pt;
                        line-height: 18pt;
                        margin: 32pt 0 28pt;
                        &.smaller{
                            font-size: 10.5pt;
                        }
                        >p{
                            font-family: simHei;
                            text-align: center;
                            display: block;
                        }
                    }
                    .table-title{
                        font-family: simHei;
                        text-align: center;
                    }
                    .img-title{
                        width: 100%;
                        text-align: center;
                        font-family: simHei !important;
                        color:#000;
                        margin: 0.5em 0;
                        text-indent: 0 !important;
                        &[data-number]::before {
                            content: "图\00A0" attr(data-number);
                            margin-right: 1em;
                        }
                    }

                    .ol-list,.appendix-list{
                        font-family: simHei;
                        line-height: 16.58pt;
                        text-align: justify;
                        word-break: break-all;
                        &[data-index]{
                            &::before{
                                display: inline-block;
                                margin: 0 0.85em 0 0;
                                content: attr(data-index);
                                font-weight: bold;
                            }
                        }
                        p{
                            font-family: simSun;
                            &.zhu,&.zhux,&.example,&.examplex{
                                font-size: 9pt;
                                display: flex;
                                padding-inline-start: 0;
                                text-indent: 0 !important;
                                margin-left: 2.5em;
                                line-height: 15.5pt !important;
                            }
                        }
                    }
                    .bullet{
                        font-family: simSun;
                    }
                    .bullet::before{
                        margin-left: -2em;
                        margin-right: 1em;
                        display: inline-block;
                        transform: scale(.85);
                    	font-family: Wingdings;
                    	content: attr(data-prefix) "" attr(data-suffix);
                    }
                    .bullet[data-type="circle"]::before{
                        content: "●";
                        margin-right: 1.35em;
                    }
                    .bullet[data-type="diamond"]::before{
                        content: "◆";
                        margin-right: 1.35em;
                    }
                    .bullet[data-type="hollow-circle"]::before{
                        content: "○";
                        margin-right: 1.35em;
                        font-size: 14pt;
                    }
                    .bullet[data-type="square"]::before{
                        content: "■";
                        margin-right: 1.35em;
                    }
                    .bullet[data-type="hollow-square"]::before{
                        content: "□";
                        margin-right: 1.35em;
                    }
                    .bullet[data-type="line"]::before{
                        content: "——";
                        margin-right: 0;
                    	font-family: times new roman;
                    }
                    .bullet[data-type="lower"]{
                        counter-increment: lower;
                        &::before{
                            content: counter(lower, lower-alpha) ")";
                            transform: scale(1);
                        	font-family: simSun;
                        }
                    }
                    .bullet[data-type="num"]{
                        counter-increment: num;
                        &::before{
                            content: counter(num) ")";
                            transform: scale(1);
                        	font-family: simSun;
                        }
                    }
                    .bullet[data-type="num-index"]{
                        counter-increment: num-index;
                        &::before{
                            content: "[" counter(num-index) "]";
                            transform: scale(1);
                        	font-family: simSun;
                            margin-right: 0.5em;
                        }
                    }


                    .bullet[data-level="0"]{
                        padding-inline-start: 2em;
                    }
                    .bullet[data-level="1"]{
                        padding-inline-start: 4em;
                    }
                    .bullet[data-level="3"]{
                        padding-inline-start: 8em;
                    }
                    .bullet[data-level="4"]{
                        padding-inline-start: 10em;
                    }
                    .bullet[data-level="5"]{
                        padding-inline-start: 12em;
                    }
                    .bullet[data-level="6"]{
                        padding-inline-start: 14em;
                    }
                    .bullet[data-level="7"]{
                        padding-inline-start: 16em;
                    }
                }
            }
        }
    }
</style>
