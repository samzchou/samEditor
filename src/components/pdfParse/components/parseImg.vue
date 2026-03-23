<template>
    <div class="parse-image-cmp">
        <h3><i class="el-icon-picture-outline"/> 解析图片</h3>
        <div v-if="data" class="parse-img" v-loading="loading" element-loading-text="正在将图片解析成相关内容">
            <img :src="imgSrc" :width="data.width" />
        </div>
		<div class="choose-type">
			<el-radio-group v-model="parseType">
				<el-radio label="img" v-if="blobImg">复制图片</el-radio>
				<el-radio label="text">解析为文字</el-radio>
				<el-radio label="table">解析为表格</el-radio>
				<el-radio label="formula">解析为公式</el-radio>
			</el-radio-group>
		</div>
        <div class="btns">
            <el-button size="small" type="primary" icon="el-icon-finished" :disabled="loading" @click.stop.prevent="submitParse" :loading="loading">{{loading?'图片解析中':'提交'}}</el-button>
            <el-button size="small" icon="el-icon-close" :disabled="loading" @click.stop.prevent="closeIt">取消关闭</el-button>
        </div>
    </div>
</template>

<script>
    import axios from 'axios';
    // 后台Node接口
    import { uploadFile, parseImage, documentServer } from '@/api/nodeServer.js';
    // 全局函数
    import $global from '@/utils/global.js';

	// import { aiChat } from '@/api/nodeServer';

    export default {
        name: 'parse-image-cmp',
        inject: ['docSetting'],
        props: {
            data: Object
        },
        watch: {
            data: {
                handler(obj) {
                    this.uploaded = false;
                    this.imgSrc = '';
                    if (!_.isEmpty(obj)) {
                        this.setImage();
                    }
                },
                immediate: true,
                deep: true,
            }
        },

        data() {
            return {
                imgSrc: '',
                loading: false,
				uploaded: false,
                resultStr: '',
				parseType: 'img',
				blobImg: false,
				/* currModel: {
                    label:'claude',
                    value:'claude-3-5-sonnet-20240620',
                }, */
            }
        },
        methods: {
            isBlob(data) {
                return data instanceof Blob;
            },

            async setImage() {
                if (this.data && this.data.image) {
                    if (!this.isBlob(this.data.image)) {
                        this.imgSrc = this.data.image;
                        this.uploaded = true;
                    } else {
                        this.imgSrc = URL.createObjectURL(this.data.image);
						this.blobImg = true;
                    }
                }
            },
            async submitParse() {
				// 请求剪贴板写入权限
				if (this.parseType === 'img') {
					const permissionStatus = await navigator.permissions.query({ name: 'clipboard-write' });
					if (permissionStatus.state === 'granted' || permissionStatus.state === 'prompt') {
						const clipboardItem = new ClipboardItem({
							'image/png': this.data.image
						});
						await navigator.clipboard.write([clipboardItem]);
						this.$emit('change', { act:'closeDrawer' });
						this.$message.success('截图已复制到剪贴板，可以直接粘贴到编辑器中！');
					}
                    return;
				}

                this.loading = true;

				if (!this.uploaded) {
					const uuid = $global.guid();
					const formData = new FormData();
					formData.append('file', this.data.image, uuid + '.png')
					formData.append('fileName', uuid + '.png');

					const res = await uploadFile(formData, this.docSetting.nodeURL);
					console.log('submitParse==>', res)

					if (res && res.data) {
						this.imgSrc = this.docSetting.nodeURL + '/files/' + res.data[0]['outFile'];
						this.uploaded = true;
						// 解析提交
						await this.parseImage();
					}
				} else {
					await this.parseImage();
				}
                this.loading = false;
            },

			async parseImage() {
                const condition = {
                    "image_url": this.imgSrc,
                    "image_type": this.parseType
                }
                // await parseImage(condition, this.docSetting.parseApi);//
                // debugger
                const res = await parseImage(condition, this.docSetting.parseApi); //axios.post(this.docSetting.parseApi, condition);
                console.log('parseImage===>', res)
                if (res && !_.isEmpty(res.data)) {
                    if (this.parseType === 'formula') {
                        this.parseFormula(res.data.parse_text);
                    } else {
                        this.$emit('change', { act:'appendText', data:{type:this.parseType, content:res.data.parse_text} });
                    }
                }

                this.loading = false;
				/* if (this.parseType === 'img') {
					console.log('this.imgSrc', this.imgSrc);
					this.$emit('change', { act:'appendImage', imgSrc:this.imgSrc, width:this.data.width })
				} else {
					this.$emit('change', { act:'parseImage', data:{type:'text',value:'这是一段测试文字'} });
				} */
			},

            async parseFormula(mathStr) {
                if (!mathStr) {
                    this.$message.error('未解析出公式！');
                    return;
                }
                const condition = {
                    "operation":"mathjaxToImg",
                    "format":"TeX",
                    "svg":true,
                    "mathStr":mathStr,
                    "html":"true"
                }
                const res = await documentServer(condition, this.docSetting.nodeURL);
                if (res && res.data) {
                    const data = res.data;
                    data.width = Math.floor(parseFloat(data.width) * 8.01);
                    data.height = Math.floor(parseFloat(data.height) * 8.01);
                    if (data.width > 400) {
                        data.width = 400;
                    }
                    this.$emit('change', { act:'appendFormula', data:{...res.data,latex:mathStr} });
                }
            },


            closeIt() {
                this.$emit('change', {'act':'closeDrawer'})
            },

            clearData() {
                this.imgSrc = '';
                this.uploaded = false;
                //console.log('clearData', this.data)
            }
        },
        beforeDestroy() {
            this.clearData();
        }
    }
</script>

<style lang="scss" scoped>
    .parse-image-cmp{
        padding: 20px;
        .parse-img{
            border: 1px solid #DDD;
            padding: 10px;
            margin: 15px 0;
            max-height: 600px;
            min-height: 200px;
            overflow: auto;
            >img{
                max-width: 100%;
            }
        }
        .btns{
            text-align: center;
			margin-top:20px;
			padding-top: 15px;
			border-top: 1px solid #EEE;
        }
    }
</style>
