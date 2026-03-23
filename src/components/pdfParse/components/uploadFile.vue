<template>
    <div class="upload-file-cmp">
        <div class="forms">
            <el-upload
                ref="uploadRef"
                drag
                action="#"
                :multiple="data.multiple||false"
                :show-file-list="false"
                :file-list="fileList"
                :http-request="httpRequest"
                :limit="data.limit"
                :accept="data.accept||''"
                :on-change="handleBeforeUpload"
                :on-exceed="handleExceed" 
				:disabled="uploading">
                <i class="el-icon-upload"></i>
                <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
                <div class="el-upload__tip" slot="tip">
                    <p>
                        <span v-if="data.accept">只能上传{{data.accept}}文件，</span>
                        <span v-else>禁止上传ext,bat,msi,sh等可执行文件，</span>
                        <span>每次上传不超过{{data.limit}}个文件。</span>
                    </p>
                    <p v-if="limitError" style="color: red;font-weight: bold;"><i class="el-icon-warning" /> 文件数量超出了{{data.limit}}个，已经取消操作！</p>
                </div>
            </el-upload>
        </div>

        <div class="lists">
            <el-table size="mini" :data="fileList" style="width: 100%">
                <el-table-column prop="name" label="文件名" show-overflow-tooltip></el-table-column>
                <el-table-column prop="size" label="文件大小" width="100">
                    <template slot-scope="scope">{{ formatFileSize(scope.row.size) }}</template>
                </el-table-column>
                <el-table-column prop="disabled" label="允许上传" width="100" align="center">
                    <template slot-scope="scope">
                        <el-tooltip :content="scope.row.disabled?'Upload not allowed':'Allow upload'" placement="top">
                            <i :class="scope.row.disabled?'el-icon-warning':'el-icon-success'" :style="{'font-size':'1.25em','color':scope.row.disabled?'red':'green'}" />
                        </el-tooltip>
                    </template>
                </el-table-column>
                <el-table-column prop="progress" label="状态" width="120" align="center">
                    <template slot-scope="scope">
                        <!-- <el-progress v-if="scope.row.percentage && scope.row.percentage !== 100" :percentage="scope.row.percentage" />
                        <span v-else>{{ scope.row.status }}</span> -->
                        <template v-if="scope.row.percentage">
                            <el-progress v-if="scope.row.percentage && scope.row.percentage !== 100" :percentage="scope.row.percentage" />
                            <span v-else-if="scope.row.percentage === 100 && scope.row.status === 'ready'"><i class="el-icon-loading"/> waiting</span>
                            <span v-else>{{ scope.row.status }}</span>
                        </template>
                        <template v-else>
                            {{ scope.row.status }}
                        </template>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="100" align="center">
                    <template slot-scope="scope">
                        <el-tooltip content="Remove file " placement="top">
                            <el-button type="text" icon="el-icon-delete" :disabled="uploading" @click.stop.prevent="cancelUpload(scope.row, scope.$index)" />
                        </el-tooltip>
                    </template>
                </el-table-column>
            </el-table>

            <div class="btns">
                <el-button size="small" type="primary" icon="el-icon-upload2" :disabled="!fileList.length||!checkUpload" @click.stop.prevent="submitUpload" :loading="uploading">上传/转换</el-button>
                <el-button size="small" type="success" icon="el-icon-finished" :disabled="uploading||!fileList.length||!checkSave" @click.stop.prevent="submitSave">保存</el-button>
                <el-button size="small" type="warning" plain icon="el-icon-close" :disabled="uploading" @click.stop.prevent="exitUpload">退出</el-button>
            </div>
        </div>
    </div>
</template>

<script>
    // 后台Node接口
    import { uploadFile, officeServer } from '@/api/nodeServer.js';
    // 全局函数
    import $global from '@/utils/global.js';
    // import axios from 'axios';

    export default {
        name:'upload-file-cmp',
        inject: ['docSetting'],
        props: {
            data: {
                type: Object,
                default: () => {
                    return {
                        multiple: true,
                        limit:5,
                    }
                }
            }
        },
        computed: {
            checkUpload() {
                const uoloadFiles = this.fileList.filter(o => o.status === 'completed');
                return uoloadFiles.length !== this.fileList.length;
            },
            checkSave() {
                for (let item of this.fileList) {
                    if (item.status !== 'completed' && !item.disabled) {
                        return false;
                    }
                }
                return true;
            }
        },
        data() {
            return {
                uploading: false,
                fileList: [],
                uploadList: [],
                limitError: false,
            }
        },
        methods: {
            formatFileSize(val) {
                return $global.formatFileSize(val);
            },
            exitUpload() {
                this.$emit('change', { act:'close' });
            },
            handleExceed(files, fileList) {
                this.limitError = files.length > this.data.limit;
            },
            submitSave() {
                const files = [];
                this.fileList.forEach(item => {
                    if (item.fileUrl) {
                        const obj = {
                            id: item.uuid,
                            fileUrl: item.fileUrl,
                            fileSize: item.size,
                            label: item.name
                        }
                        files.push(obj);
                    }

                })
                this.$emit('change', { act:'upload', data:files });
            },
            // 拦截默认上传
            httpRequest() {
                return false;
            },
            /**
             * 上传文件
             * @param {Object} file
             */
            async handleBeforeUpload(file, fileList) {
                console.log('handleBeforeUpload==>', file, fileList)
                this.fileList = fileList.map(item => {
                    let extName = $global.getExt(item.name);
                    if (['exe','sh','bat','msi'].includes(extName)) {
                        item.disabled = true;
                    }
                    item.uuid = $global.guid();
                    return item;
                });
                this.limitError = false;
            },

            // 删除文件
            cancelUpload(item, index) {
                this.$refs.uploadRef.abort(item);
                this.fileList.splice(index, 1);
            },

            removeFileList(itemIndex) {
                const fileItem = this.fileList[itemIndex];
                this.$set(fileItem, 'status', 'remove');
            },
            // 上传文件
            async uploadFiles(item={}, fileIndex) {
				const extName = $global.getExt(item.name);
                const formData = new FormData();
                formData.append('file', item.raw);
                formData.append('uuid', String(item.uuid));
                formData.append('fileName', item.name);

                let res = await uploadFile(formData, this.docSetting.nodeURL);
                console.log('uploadFiles==>', res)
                if (res && res.data) {
					let filePath = res.data[0]['outFile'];
					if (['doc','docx'].includes(extName)) {
						const condition = {
							operation: 'wordToPdf',
							filePath,
						}
						res = await officeServer(condition, this.docSetting.nodeURL);

						if (res && res.data) {
							filePath = res.data;
						}
					}
				
                    item.percentage = 100;
                    item.status = 'completed';
                    item.fileUrl = this.docSetting.nodePath + '/files/' + filePath;
                    this.$set(this.fileList, fileIndex, item);
                }
            },

            // 执行上传
            async submitUpload() {
                const allowFiles = this.fileList.filter(o => o.status === 'ready');
                if (allowFiles.length) {
                    this.uploading = true;
                    for (let i=0; i<allowFiles.length; i++) {
                        const item = allowFiles[i];
                        const _index = _.findIndex(this.fileList, { uuid:item.uuid });
                        await this.uploadFiles(item, _index);
                    }
                    this.uploading = false;
                }
            }
        }
    }
</script>

<style lang="scss" scoped>
    .upload-file-cmp{
        padding: 25px;
        display: flex;
        .forms{
            flex: 0 0 300px;
            margin-right: 15px;
            ::v-deep .el-upload{
                width: 100%;
                .el-upload-dragger{
                    width: 100%;
                }
            }
        }
        .lists{
            flex: 1;
            .btns{
                padding: 15px;
                text-align: center;
            }
            ::v-deep .el-table{
                .cell {
                    .el-progress{

                    }
                }
            }
        }
    }
</style>
