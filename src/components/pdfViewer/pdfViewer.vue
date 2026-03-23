<template>
    <div class="pdfviewer-container" v-bind="$attrs" v-on="$listeners">
        <!-- PDF文档方式显示 -->
        <iframe v-if="!showImg && pdfSrc" :id="`iframe_${id}`" :src="pdfSrc" frameborder="0" scrolling="no" crossorigin="anonymous" allow="clipboard-write" width="100%" height="100%" :style="iframeStyle" />
        <!-- PDF图片方式显示 -->
        <div v-else-if="showImg" class="img-content">
            <header>
                <div>
                    <el-button type="text" :icon="showThumbnail?'el-icon-s-fold':'el-icon-s-unfold'" @click="showThumbnail=!showThumbnail" />
                    <el-input-number v-model="activePage" :controls="false" :min="1" :max="allPages" style="width: 40px;" @change="scrollToNumer" />
                    <span style="margin-left:5px; font-size:14px;"> / {{ allPages }}</span>
                </div>
                <div>
                    <el-button type="text" size="small" icon="el-icon-minus" @click="handleZoomStep(false)" />
                    <el-button type="text" size="small" icon="el-icon-plus" @click="handleZoomStep(true)" />
                    <el-dropdown trigger="click" style="margin-left: 5px;" @command="handleZoom">
                        <span class="el-dropdown-link">
                            {{zoomTitle}} <i class="el-icon-arrow-down el-icon--right"></i>
                        </span>
                        <el-dropdown-menu slot="dropdown">
                            <el-dropdown-item v-for="(item,idx) in options" :key="idx" :command="item">{{item.label}}</el-dropdown-item>
                        </el-dropdown-menu>
                    </el-dropdown>
                    <el-button v-if="download" type="text" size="small" icon="el-icon-download" style="margin-left: 5px;font-size:13px" @click="downloadPdf">下载</el-button>
                </div>
            </header>
            <main>
                <!-- 左侧缩略图 -->
                <div class="left-warpper" id="thumbwarpper" :style="{'left':showThumbnail ?'0px':'-100%'}">
                    <ul>
                        <li v-for="(src,idx) in pdfImgList" :key="idx" :id="'thumb-'+idx" :class="{'active':activePage-1 === idx}" @click="scrollToPage(idx)">
                            <img :src="src" />
                            <p>第{{idx+1}}页</p>
                        </li>
                    </ul>
                </div>
                <!-- PDF大图 -->
                <div class="main-warpper" id="pdfwarpper" :style="backgroundStyle" @scroll="scrollEvent">
                    <ul>
                        <li v-for="(src,idx) in pdfImgList" :key="idx" :id="'page-'+idx">
                            <img :src="src" :style="{'width':imgWidth}" />
                            <div v-if="waterMask!==null" class="water-mask" :style="{'top':`calc(50% - waterMask.size)`}">
                                <p v-if="waterMask.text" :style="{'font-size':waterMask.size,'color':waterMask.color||'#CCC'}">{{waterMask.text}}</p>
                                <img v-else :src="waterMask.image" :style="{'height':waterMask.size||'100px'}">
                            </div>
                        </li>
                    </ul>
                </div>
            </main>
        </div>
        <!-- 回到顶部 -->
        <div v-show="topDistance>500" class="to-top" title="回到顶部" @click.stop.prevent="moveToTop" >
            <i class="iconfont icon-Upward" />
        </div>
        <input :id="`upload-${id}`" type="file" accept=".pdf" v-show="false" @change="handleBeforeUpload" />

    </div>
</template>

<script>
    // 引入加解密方法
    import { encrypt, decrypt, encryptLong } from '@/utils/jsencrypt';
    // nodeServer接口
    import { uploadFile, documentServer } from '@/api/nodeServer';
    // 全局方法
    import $global from '@/utils/global';
    // SOCKET通信模块
    import socketUtil from "@/utils/socketUtil";
    // 事件总线
    import $bus from '@/utils/bus';

    export default {
        name: 'pdf-viewer',
        props: {
			viewerId: String,
			data: {
				type: Object,
				default: () => {
                    return {};
                }
			},
            // 文档url地址
            url: {
                type: String,
                default: () => {
                    return "";
                }
            },
            closeSidebar: Boolean,
            nodeSocket: String,
            // nodeServer服务地址
            nodeURL: {
                type: String,
                default: () => {
                    return process.env.VUE_APP_REMOTE_API;
                }
            },
            zoomIn: {
                type: [Number,String],
                default: () => {
                    return 'auto';
                }
            },
            // 水印
            waterMask: Object,
            encrypt: Boolean,
            // 文档是否转base64
            base64: {
                type: Boolean,
                default: () => {
                    return false;
                }
            },
            // 禁用PDF阅读器上某些按钮 'presentationMode演示全屏','openFile 打开本地文件','print 打印','download下载','viewBookmark查看书签','secondaryToolbarToggle其他工具'
            disable: {
                type: Array,
                default: () => {
                    return [];
                }
            },
            export: Boolean,
            download: {
                type: Boolean,
                default: true
            },
            limit: {
                type: Number,
                default: 0
            },
            // 快速工具条
            quickTools: {
                type: Array,
                default: () => {
                    return [];
                }
            },
            showLoading: {
                type: Boolean,
                default: true
            },
            showImg: Boolean,
            bgStyle: {
                type: Object,
                default: () => {
                    return {
                        color: '#dfdcdc',
                        image: 'none'
                    };
                }
            },
			// 延迟加载
			delayTime: {
				type: Number,
				default: 1500
			}
        },
        watch: {
            url: {
                handler(val) {
                    this.$nextTick(() => {
                        if (val && val.startsWith('http')) {
                            this.pdfUrl = val;
                            if (this.base64) {
                                this.loadPdf();
                            }
                        } else {
                            console.error('pdf路径错误', val);
                        }
                    })
                },
                immediate: true,
            },
            closeSidebar: {
                handler(flag) {
                    this.showThumbnail = !flag;
                },
                immediate: true,
            }
        },
        computed: {
            // PDF阅读器地址
            pdfSrc() {
                if (!this.base64 && this.pdfUrl) {
                    return this.nodeURL + '/pdfview/web/viewer.html?limit=' + this.limit + '&file=' + this.pdfUrl + '#zoom=' + this.zoomIn;
                } else {
                    return this.nodeURL + '/pdfview/web/viewer.html?tmp=' + new Date().getTime() + '#zoom=' + this.zoomIn;
                }
            },
            // iframe 样式，等PDF阅读器实例加载完成后显示
            iframeStyle() {
                return {
                    visibility: !this.loaded ? "collapse" : "visible"
                }
            },
            defaultWidth() {
                var pdfContainer = document.getElementById('pdfwarpper');
                var containerWidth = pdfContainer.offsetWidth;
                return parseInt(containerWidth - 100);
            },
            backgroundStyle() {
                return {
                    'background-color': this.bgStyle.color,
                    'background-image': `url(${this.bgStyle.image})`
                }
            },
			selectionStyle() {
				const width = this.currentX - this.startX;
				const height = this.currentY - this.startY;
				return {
					left: `${this.startX}px`,
					top: `${this.startY}px`,
					width: `${width}px`,
					height: `${height}px`,
				};
			},
        },

        data() {
            return {
                topDistance: 0,
                loading: null,
                loaded: false,
                iframer: null,
                id: $global.guid(),
                pdfUrl: '',
                imgWidth: '450px',
                pdfImgList: [],
                showThumbnail: false,
                activePage: 1,
                zoom: 100,
                zoomTitle: '100%',
                options: [
                    {label:'100%', value:100},
                    {label:'200%', value:200},
                    {label:'190%', value:190},
                    {label:'180%', value:180},
                    {label:'170%', value:170},
                    {label:'160%', value:160},
                    {label:'150%', value:150},
                    {label:'140%', value:140},
                    {label:'130%', value:130},
                    {label:'120%', value:120},
                    {label:'110%', value:110},
                    {label:'90%', value:90},
                    {label:'80%', value:80},
                    {label:'70%', value:70},
                    {label:'60%', value:60},
                    {label:'40%', value:40},
                    {label:'50%', value:50},
                ],
                allPages: 0,
                socketInstance: null,
                clickThumb: false,
                finished: false,
            }
        },
        methods: {
            /**
             * @description buffer转base64
             * @param {Object} evt
             */
            binary2base64(bi) {
                let str = '';
                for (let i = 0, len = bi.length; i < len; i++) {
                    str += String.fromCharCode(bi[i]);
                }
                return btoa(str);
            },

            /**
             * @description 读取本地文件
             * @param {Object} evt
             */

            async handleBeforeUpload(evt) {
                this.loaded = false;
                var file = document.getElementById(`upload-${this.id}`).files[0];
                var reader = new FileReader();
                reader.onload = (e) => {
                    let buffer = new Uint8Array(e.target.result);
                    var base64Data = this.binary2base64(buffer);
                    this.openUrl('data:application/octet-stream;base64,' + base64Data);
                }
                reader.onerror = (e) =>{
                    console.error('onerror', e);
                };
                reader.readAsArrayBuffer(file);
            },
            openFile() {
                var ele = document.getElementById(`upload-${this.id}`);
                ele.click();
                this.loaded = false;
            },
            /**
             * @description Loading
             * @param {String} str
             */
            onLoading(str) {
                if (!str) {
                    this.loading && this.loading.close();
                }
                if (!this.loading) {
                    this.loading = this.$loading({
                        lock: true,
                        text: str,
                        spinner: 'el-icon-loading',
                        background: 'rgba(0, 0, 0, 0.7)'
                    });
                } else {
                    this.loading.text = str;
                }
                setTimeout(() => {
                    this.loading && this.loading.close();
                    this.loading = null;
                }, 30 * 1000);
            },
            moveToTop() {
                this.scrollToPage(0, true);
            },

            /**
             * @description 文档页面滚动事件
             */
            scrollEvent(evt) {
                var target = evt.target;
                var top = target.scrollTop;
                this.topDistance = top;

                const posToPage = () => {
                    var container = document.querySelector('#pdfwarpper>ul');
                    var allPageNodes = Array.from(container.querySelectorAll('li'));
                    var containerTop = container.getBoundingClientRect().top;
                    for (let i=0; i<allPageNodes.length; i++) {
                        let rect = allPageNodes[i].getBoundingClientRect();
                        let pageTop = _.floor(rect.top - containerTop);
                        let pageHeight = _.floor(rect.height);
                        if ((top + _.ceil(pageHeight/1.5)) > pageTop && top < pageTop + pageHeight/3) {
                            if (i + 1 !== this.activePage) {
                                this.activePage = i + 1;
                                this.asyncScrollThumb(i, true);
                            }
                            break;
                        }
                    }
                }

                setTimeout(() => {
                    posToPage()
                }, 500);
            },

            /**
             * @description 页面输入框事件
             */
            scrollToNumer() {
                this.clickThumb = false;
                this.scrollToPage(this.activePage - 1, true);
            },

            /**
             * @description 页面缩略图事件
             * @param {Int} index
             */
            scrollToPage(index=0, flag=false) {
                if (!flag) {
                    this.clickThumb = true;
                }
                var pageContainer = document.getElementById('pdfwarpper');
                var pageNode = pageContainer.querySelector('#page-' + index);
                if (pageNode) {
                    pageNode.scrollIntoView({
                        // behavior: "smooth",
                        block: "start",
                        inline: "nearest"
                    });
                }

                setTimeout(() => {
                    this.clickThumb = false;
                }, 750)
            },

            /**
             * @description 缩略图同步滚动
             * @param {Int} index
             */
            asyncScrollThumb(index, flag = false) {
                if (!this.clickThumb) {
                    var thumbContainer = document.getElementById('thumbwarpper');
                    var thumbNode = thumbContainer.querySelector('#thumb-' + index);
                    thumbNode.scrollIntoView({
                        // behavior: "smooth",
                        block: "start",
                        inline: "nearest"
                    });
                }
            },

            handleZoom(item) {
                this.zoomTitle = item.label;
                this.zoom = item.value;
                var defaultWidth = this.defaultWidth;
                this.imgWidth = (defaultWidth * item.value / 100) + 'px';
            },
            handleZoomStep(flag=false) {
                var zoomValue = this.zoom;
                if (flag) {
                    zoomValue += 10;
                } else {
                    zoomValue -= 10;
                }
                var item = _.find(this.options, { value:zoomValue });
                if (item) {
                    this.handleZoom(item);
                }
            },

            /**
             * @description 重置文档路径
             * @param {String} url
             */
            resetUrl(url = '') {
                if (url && url.match(/^\http|https/i) !== null) {
                    this.pdfUrl = url;
                    this.loadPdf();
                }
            },

            downloadPdf() {
                $global.downloadFile(this.pdfUrl)
            },

            /**
             * @description 创建SOCKET实例
             */
            connectSocket(data = {}) {
                if (this.socketInstance) {
                    this.socketInstance.closeSocket();
                }
                if (this.nodeSocket) {
                    this.socketInstance = new socketUtil(this.nodeSocket, { userId:this.id });
                }
            },
            /**
             * @description 断开Socket连接
             */
            disconnectSocket() {
                if (this.socketInstance) {
                    this.socketInstance.closeSocket(true);
                    this.socketInstance = null;
                }
            },

            /**
             * @description 将PDF的URL地址加密传给后台处理成base64编码
             * @argument 注意：如果考虑文档安全因素，前端将URL地址加密传给后台再输出base64编码。加密方式为rsa
             * @returns 返回base64数据后按照特定规则（二次混淆加密）解密
             */
            async loadPdf(pdfUrl) {
                if (pdfUrl) {
                    this.pdfUrl = pdfUrl;
                }
                this.onLoading('正在加载PDF文档,请等候加载完成...');
                // HTTP加密
                const encodeUrl = txt => {
                    let arr = [];
                    let splitStr = txt.split(/\//i);
                    splitStr.forEach(str => {
                        if (str) {
                            arr.push(encryptLong(str))
                        }
                    });
                    return arr;
                }

                this.loaded = false;
                var nodeUrl = this.nodeURL || process.env.VUE_APP_REMOTE_API;
                var res;
                // 仅显示图片
                if (this.showImg) {
                    // 建立socket通信，以便接收处理进度
                    this.connectSocket();
                    // 图片列表
                    this.pdfImgList = [];
                    res = await documentServer({
                        type:'pdfToImage',
                        quality: 200,
                        download: this.download,
                        url: this.base64 ? encodeUrl(this.pdfUrl) : this.pdfUrl,
                        socketId: this.id,
                    }, nodeUrl);
                    if (res && res.data) {
                        this.imgWidth = this.defaultWidth + 'px';
                        this.pdfImgList = res.data.map(src => {
                            return nodeUrl + '/' + src;
                        });
                        this.allPages = this.pdfImgList.length;
                    } else {
                        this.$message.error('文档加载失败，请检查API接口及参数.！');
                    }
                    // 全部完成
                    setTimeout(() => {
                        this.loading && this.loading.close();
                        this.loading = null;
                    }, 1500);
                    return true;
                }

                // 加载PDF文档
                if (this.base64) {
                    res = await uploadFile({
                        "type": 'getUrl',
                        "number": $global.randomNumber(10, 200),
                        "url": encodeUrl(this.pdfUrl)
                    }, nodeUrl);
                    // console.warn('get pdfUrl====>', res)
                    if (res && res.data) {
                        var base64Data = res.data.split('').reverse().join('').replace(/\aSmUu00Yt/i, '');
                        this.openUrl('data:application/octet-stream;base64,' + base64Data);
                    } else {
                        this.loading && this.loading.close();
                        this.loading = null;
                        // this.$message.error('文档加载失败，请检查API接口及参数！');
                        this.$emit('close');
                    }
                } else {
                    // this.openUrl(this.pdfUrl);
                }
            },

            /**
             * @description 发送给阅读器，打开PDF文件
             * @param {String} file
             */
            openUrl(file = "") {
                this.onLoading('正在加载PDF文档,请等候加载完成...');
                setTimeout(() => {
                    this.iframer.contentWindow.postMessage({
                        file,
                        disable: this.disable,
                        limit: this.limit,
                        closeSidebar:this.closeSidebar,
                        export: this.export,
                        waterMask:this.waterMask,
                        quickTools:this.quickTools,
                        serverUrl: this.nodeURL
                    }, '*');
                    this.loading && this.loading.close();
                    this.loading = null;
                }, this.delayTime)
            },

            /**
             * @description blob 转码
             * @param {Object} file 文件
             */
            blobToDataURI(file = null, isArray= false) {
                return new Promise(resolve => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        resolve(e.target.result);
                    }
                    reader.readAsDataURL(file);
                })
            },

            /**
             * @description 下载文件
             * @param {Object} data
             */
            handleDownload(data) {
                // console.log('handleDownload', data)
                fetch(data.src).then(res => res.blob().then(blob => {
                    var a = document.createElement('a');
                    var url = window.URL.createObjectURL(blob);
                    var filename = data.filename;
                    a.href = url;
                    a.download = filename;
                    a.click();
                    window.URL.revokeObjectURL(url);
                    a.remove();
                }))
            },

			async searchHighLight() {
				this.iframer.contentWindow.postMessage({
					highlightRect:true,
					//focus: true,
					cls: '',
					...this.data
				}, '*');
			},

            /**
             * @description 监听PDF阅读器的上报事件
             * @param {Object} event
             */
            listenerViewer(event) {
                // console.log('listenerViewer', event);
                const data = event.data;
	
                switch (data.act) {
                    case 'loaded':
                        this.loaded = true;
                        if (data.documentInfo) {
                            if (data.documentInfo?.Author !== 'sam' || !data.documentInfo?.Author) {
                                this.loading && this.loading.close();
                                this.loading = null;
                            }
                        }
                        // 如果定义了一些文档的数据，如直接定位等
                        if (!_.isEmpty(this.data)) {
							setTimeout(() => {
                                this.searchHighLight();
                            }, 750);
                        }
                        this.$emit('change', { act: 'loaded', data:_.omit(event.data, ['act']) });
                        break;
                    case 'selection':
                        this.$emit('change', { act: 'selection', data:_.omit(event.data, ['act']) });
                        break;
                    case 'outlineList':
                        this.$emit('change', { act: 'outlineList', data:event.data.outlineList });
                        break;
                    case 'exportData':
                        this.$emit('change', { act: 'exportData', data:event.data.data });
                        break;
                    case 'quit':
                        this.$confirm('确定关闭PDF阅读器?', '提示', {
                            confirmButtonText: '确定',
                            cancelButtonText: '取消',
                            type: 'warning'
                        }).then(() => {
                            this.$emit('change', { act: 'close' });
                        }).catch(() => {});
                        break;
                    case 'cropImage':
                        // console.log('crop', data)
						// this.$emit('change', { act: 'cropImage', data:data });
                        break;
                }
				if (event.data.act && !['quit'].includes(event.data.act)) {
					this.$emit('change', {...event.data, id:this.viewerId||this.id});
				}
            },
            /**
             * @description 定位到页面
             * @param {Int} page
             */
			scrollPage(page) {
				this.postMessage({ page })
			},

			getBody() {
				return this.iframer.contentWindow.document.body;
			},

			postMessage(data={}) {
				console.log('postMessage--->', data)
				this.iframer.contentWindow.postMessage(data, '*');
			}

        },
        mounted() {
            // 组件加载完成后注册监听iframer事件
            if (!this.showImg) {
                this.iframer = document.getElementById(`iframe_${this.id}`);
                // console.log('this.iframer.contentWindow', this.iframer.contentWindow.document.body)
                this.postMessage({ 'init': true, disable: this.disable, limit: this.limit, export: this.export });
                // this.iframer.contentWindow.postMessage({ 'init': true, disable: this.disable, limit: this.limit, export: this.export }, '*');
                window.addEventListener('message', this.listenerViewer, false);
            }
            var nodeUrl = this.nodeURL || process.env.VUE_APP_REMOTE_API;
            // 监听socket上报事件
            $bus.$on('onMsg', data => {
                if (data.pages) {
                    this.allPages = data.pages;
                } else if (data.pageNumber) {
                    var str = `文档读取完成：第${data.pageNumber}页，共${this.allPages}页`;
                    this.loading.setText(str);
                    // this.onLoading(`文档读取完成:第${data.pageNumber}页，共${this.allPages}页`);
                    if (data.pageNumber < 5) {
                        this.pdfImgList.push(nodeUrl + '/' + data.imgSrc);
                    }
                    // this.scrollToPage(data.pageNumber - 1);
                }
            })


        },
        beforeDestroy() {
            // 销毁监听事件
            if (!this.showImg) {
                window.removeEventListener('message', this.listenerViewer);
            }
            // 销毁socket
            this.disconnectSocket();
        }
    }
</script>

<style lang="scss" scoped>
    .pdfviewer-container {
        height: 100%;
        width: 100%;
        position: relative;

		.screenshot{
			position: absolute;
			top: 20px;
			left: 200px;
		}
		.screenshot-area {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
		}

		.selection-rect {
			position: absolute;
			border: 2px dashed blue;
			pointer-events: none;
		}

		.screenshot-preview {
			margin-top: 20px;
		}

        .to-top{
            position: absolute;
            right: 10px;
            bottom: 10px;
            background-color: #fff;
            padding: 3px;
            border-radius: 3px;
            box-shadow: 2px 2px 2px 0 rgba(0,0,0,.3);
            cursor: pointer;
        }

        ::v-deep .pdf-viewer {
            height: 100%;
            width: 100%;

            .pdf-viewer__header {
                height: 40px;
            }

            .pdf-viewer__body {
                height: calc(100% - 40px);
                width: 100%;
            }
        }
        .img-content{
            height: 100%;
            >header{
                height:35px;
                border-bottom:1px solid #EEE;
                padding: 0 10px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                background-color: #f7f7f7;
                >div{
                    display: flex;
                    align-items: center;
                    >button{
                        padding: 5px 10px 5px 0;
                        font-size: 1.5em;
                        margin: 0;
                    }
                    >input{
                        padding: 3px 5px;
                        text-align: center;
                        border: 1px solid #DDD;
                        outline: none;

                        &:focus{
                            border:1px solid #409EFF;
                        }
                    }
                    ::v-deep .el-input-number {
                        line-height:25px;
                        height: 25px;
                        input{
                            padding: 0 5px;
                            text-align: center;
                            line-height:25px;
                            height: 25px;
                        }
                    }
                }

            }
            >main{
                position: relative;
                display: flex;
                height: calc(100% - 35px);
                .left-warpper{
                    transition: all .35s;
                    border-right: 1px solid #CCC;
                    background-color: rgba(0,0,0,.3);
                    position: absolute;
                    left: -100%;
                    top: 0;
                    bottom: 0;
                    overflow: auto;
                    z-index:10;
                    >ul{
                        margin: 15px auto;
                        padding: 10px 30px 0;
                        >li {
                            position: relative;
                            text-align: center;
                            margin: 10px 0;
                            background-clip: padding-box;
                            padding: 6px;
                            &.active{
                                background-color: #7a7a7a;
                                color: #FFF;
                            }
                            >img {
                                width:140px;
                            }
                        }
                    }
                }
                .main-warpper{
                    flex: 1;
                    overflow: auto;
                    >ul{
                        padding: 10px 0;
                        >li {
                            position: relative;
                            text-align: center;

                            >img {
                                width:450px;
                                margin: 10px 0;
                                background-color:#FFF;
                                box-shadow: 3px 3px 3px 0 rgba(0,0,0,.2);
                                border: 1px solid #EEE;
                                transition: width .2s;
                            }
                            .water-mask{
                                pointer-events: none;
                                animation:fadeMask 1.5s 1;
                                position: absolute;
                                left: 0;
                                top: calc(50% - 50px);
                                width: 100%;
                                display: inline-block;
                                transform: rotate(-45deg);
                                opacity: .3;
                                >p{
                                    letter-spacing: 0.15em;
                                }
                            }
                        }
                    }
                }
            }

        }
    }

    @keyframes fadeMask{
       0%{
            opacity: 0;
        }
        100%{
            opacity: .3;
        }
    }

</style>
