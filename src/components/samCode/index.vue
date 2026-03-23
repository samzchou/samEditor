<template>
    <div class="code-content">
        <codemirror ref="samcode" v-model="curCode" :options="cmOptions" @changes="$emit('change', curCode)" />
    </div>
</template>

<script>
    /**
     * codemirror组件再次封装
     * @module ./components/samCode
     */
    import * as sqlFormatter from 'sql-formatter';
    import { codemirror } from 'vue-codemirror';

    import 'codemirror/lib/codemirror.css';
    import 'codemirror/addon/fold/foldgutter.css';
    import 'codemirror/addon/fold/foldcode';
    import 'codemirror/addon/fold/foldgutter';
    import 'codemirror/addon/fold/brace-fold';
    import 'codemirror/addon/fold/comment-fold';

    import 'codemirror/addon/scroll/annotatescrollbar.js';
    import 'codemirror/addon/search/matchesonscrollbar.js';
    import 'codemirror/addon/search/match-highlighter.js';
    import 'codemirror/addon/search/jump-to-line.js';

    import 'codemirror/addon/dialog/dialog.js';
    import 'codemirror/addon/dialog/dialog.css';
    import 'codemirror/addon/search/searchcursor.js';
    import 'codemirror/addon/search/search.js';

    import 'codemirror/addon/edit/matchbrackets.js';
    import 'codemirror/addon/selection/active-line.js';

    import 'codemirror/mode/javascript/javascript';
    import 'codemirror/mode/sql/sql.js';
    import 'codemirror/addon/hint/show-hint.css';
    import 'codemirror/addon/hint/show-hint.js';
    import 'codemirror/addon/hint/sql-hint.js';
    import 'codemirror/addon/lint/json-lint';
    export default {
		name: 'samCode',
        components: {
            codemirror
        },
        /**
         * https://codemirror.net/mode/index.html
         * props 接受父组件的传值
         * @property {Object} mode 代码格式
         * @property {Boolean} format 是否需格式化
         * @property {Boolean} readonly 代码只读
         * @property {Boolean} isJson 是否未JSON
         * @property {Object} data 代码文本
         */
        props: {
            mode: {
                type: [Object, String],
                default() {
                    return {
                        name: 'javascript',
                        json: true
                    };
                }
            },
            format: Boolean,
            isJson: Boolean,
            readonly: Boolean,
            data: [Object, String, Array]
        },
        /**
         * watch 监听props的传值变化
         * @param {Object} data
         */
        watch: {
            data: {
                handler(data) {
                    if (!_.isEmpty(data)) {
                        this.setCode();
                    }
                },
                immediate: true,
                deep: true
            }
        },

        data() {
            return {
                curCode: '',
                /**
                 * CodeMirror配置
                 */
                cmOptions: {
                    lineNumbers: true,
                    lineWrapping: true,
                    foldGutter: true,
                    tabSize: 2,
                    line: true,
                    mode: this.mode, //"application/json",
                    readOnly: false,
                    gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter', 'CodeMirror-lint-markers'],
                    hintOptions: {
                        completeSingle: false, // 当匹配只有一项的时候是否自动补全
                        tables: {
                            // 表 ：[字段..., ...]
                            t_test_login: ['col_a', 'col_B', 'col_C'],
                            t_test_employee: ['other_columns1', 'other_columns2']
                        }
                    },
                    extraKeys: {
                        Ctrl: 'autocomplete' // 触发按键自动补全
                    }
                },
                indentFormat: '  '
            };
        },
        methods: {
            /**
             * 设置代码值
             */
            setCode() {
                this.cmOptions.readOnly = this.readonly;
                this.cmOptions.mode = this.mode;
                if (_.isArray(this.data) && !this.isJson) {
                    if (this.format) {
                        this.curCode = sqlFormatter.format(this.data.join(''), { language: 'n1ql', indent: this.indentFormat });
                    } else {
                        this.curCode = this.data.join('\n');
                    }
                } else if(this.isJson) {
                    this.curCode = JSON.stringify(this.data, null, 2);
                } else {
                    this.curCode = this.data;
                }

                // 延迟刷新下，以免不能及时显示
                setTimeout(() => {
                    if (this.$refs.samcode) {
                        this.$refs.samcode.codemirror.refresh();
                    }
                }, 10);
            },
            /**
             * 获取当前行数
             */
            getAllLineCount() {
                // console.log('getAllLineCount=>', this.$refs.samcode);
                return this.$refs.samcode.codemirror.lineCount();
            },

            /**
             * 获取代码值
             */
            getValue() {
                return this.$refs.samcode.value;
            },
            /**
             * 增加代码值
             * @param {String} code
             */
            addValue(code) {
                if (this.$refs.samcode) {
                    this.curCode += code;
                }
            },
            /**
             * 清空代码值
             */
            clearValue() {
                this.curCode = '';
            },
            getSelection() {
                return this.$refs.samcode.codemirror.getSelection();
            },
            refresh() {
                if (this.$refs.samcode) {
                    this.$refs.samcode.codemirror.refresh();
                }
            }
        }
    };
</script>

<style lang="scss" scoped>
    .code-content {
        height: 100%;
        position: relative;
        ::v-deep .vue-codemirror {
            height: 100%;
            .CodeMirror {
                height: 100%;
                .CodeMirror-line {
                    line-height: 1.25;
                }
            }
        }
    }
</style>
