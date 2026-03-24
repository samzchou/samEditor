const mongoose = require('mongoose')
const Schema = mongoose.Schema

const userSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    nickname: {
        type: String,
        default: '',
    },
    avatar: {
        type: String,
        default: '',
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'guest'],
        default: 'user',
    },
    tenantId: {
        type: String,
        default: '',
    },
    amount: {
        type: Number,
        default: 0,
    },
    myApp: {
        type: Array,
        default: [],
    },
    isVerify: {
        type: Number,
        default: 0,
    },
    bio: {
        type: String,
        default: '',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    loginAt: {
        type: Number,
        default: 0,
    },
    lockUntil: {
        type: Date,
    },
    lastLogin: {
        type: Date,
    },
    passwordChangedAt: {
        type: Date,
    },
    socketId: {
        type: String,
        default: null,
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    isGuest: {
        type: Boolean,
        default: false,
    },
})
// 注册模型
const user = mongoose.model('user', userSchema)

// 文件集合模型
const FileSchema = new Schema({
    parentId: {
        type: String,
        default: '0', // 0 表示根目录
    },
    userId: {
        type: String,
        ref: 'User',
        required: true,
    },
    isFolder: {
        type: Boolean,
        default: false,
    },
    label: {
        type: String,
        required: true,
    },
    fileType: String,
    fileUrl: String,
    fileSize: Number,
    viewUrl: String,
    editUrl: String,
    imgUrl: String,
    description: String,
    publishPath: String,
    appId: {
        type: String,
        default: '',
    },
    isShared: {
        type: Boolean,
        default: false,
    },
    sort: {
        type: Number,
        default: 0,
    },
    createAt: {
        type: Date,
        default: Date.now,
    },
    updateAt: {
        type: Date,
        default: Date.now,
    },
    delFlag: {
        type: Number,
        default: 0,
    },
})
// 创建索引
FileSchema.index({ id: 1, userId: 1, parentId: 1, label: 'text' })
// 注册模型
const File = mongoose.model('File', FileSchema)

// 转换器集合模型
const ConverterSchema = new Schema({
    _id: String,
    parentId: {
        type: String,
        default: '0',
    },
    label: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        default: '',
    },
    accept: {
        type: [String], // 接受的文件类型数组，例如 ['.pdf', '.doc']
        default: [],
    },
    isDisabled: {
        type: Boolean,
        default: false,
    },
    userCount: {
        type: Number,
        default: 0,
    },
    sort: {
        type: Number,
        default: 0,
    },
    price: {
        type: Number,
        default: 0,
    },
    createAt: {
        type: Date,
        default: Date.now,
    },
})

// 创建索引
ConverterSchema.index({ id: 1, parentId: 1, label: 'text' })
// 注册模型
const Converter = mongoose.model('Converter', ConverterSchema)

// 转换记录
const ConvertRecordSchema = new Schema({
    userId: {
        type: String,
        ref: 'User',
        required: true,
    },
    apiForm: {
        type: String,
        required: true,
    },
    fromUrl: {
        type: String,
        required: true,
    },
    fileUrl: {
        type: String,
        default: '',
    },
    fileSize: {
        type: Number,
        default: 0,
    },
    isSuccess: {
        type: Boolean,
        default: false,
    },
    description: {
        type: String,
        default: '',
    },
    createAt: {
        type: Date,
        default: Date.now,
    },
})
// 创建索引
ConvertRecordSchema.index({ id: 1, userId: 1, label: 'description' })
// 注册模型
const ConvertRecord = mongoose.model('ConvertRecord', ConvertRecordSchema)

const ApiCredentialSchema = new Schema({
    userId: {
        type: String,
        ref: 'User',
        required: true,
    },
    apiId: {
        type: String,
        required: true,
    },
    apiKey: {
        type: String,
        required: true,
    },
    apiSecret: {
        type: String,
    },
    authorization: {
        type: String,
    },
    status: {
        type: Boolean,
        default: true,
    },
    bindDomain: {
        type: String,
        default: '',
    },
    createAt: {
        type: Date,
        default: Date.now,
    },
    updateAt: {
        type: Date,
        default: '',
    },
})
// 创建索引
ApiCredentialSchema.index({ id: 1, userId: 1 })
// 注册模型
const ApiCredential = mongoose.model('ApiCredential', ApiCredentialSchema)

const AiChatSchema = new Schema({
    userId: {
        type: String,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        default: 'gpt',
    },
    children: {
        type: Array,
    },
    contents: {
        type: Object,
    },
    createAt: {
        type: Date,
        default: Date.now,
    },
    updateAt: {
        type: Date,
        default: Date.now,
    },
})
// 创建索引
AiChatSchema.index({ id: 1, userId: 1, contents: 'text' })
// 注册模型
const AiChat = mongoose.model('AiChat', AiChatSchema)

// ---------页面编辑器
const PageEditorSchema = new Schema({
    userId: {
        type: String,
        default: '',
    },
    isStatic: {
        type: Number,
        default: 0,
    },
    label: {
        type: String,
        required: true,
    },
    type: {
        type: Number,
        default: 1,
    },
    catalogue: {
        type: String,
        default: '',
    },
    content: {
        type: String,
        required: true,
    },
    thumbPath: {
        type: String,
        default: '',
    },
    createTime: {
        type: Date,
        default: Date.now,
    },
})
// 创建索引
PageEditorSchema.index({ id: 1, label: 'text' })
// 注册模型
const PageEditor = mongoose.model('PageEditor', PageEditorSchema)

// ---------用户好友
const userFriendSchema = new Schema({
    userId: {
        type: String,
        required: true,
    },
    toId: {
        type: String,
        required: true,
    },
    label: {
        type: String,
        required: true,
    },
    type: {
        type: Number,
        default: 1,
    },
    createAt: {
        type: Date,
        default: Date.now,
    },
})
// 创建索引
userFriendSchema.index({ id: 1 })
// 注册模型
const userFriend = mongoose.model('userFriend', userFriendSchema)

// ---------应用
const appSchema = new Schema({
    userId: {
        type: String,
        default: '',
    },
    type: {
        type: String,
        required: true,
    },
    catalogue: {
        type: String,
        default: '',
    },
    label: {
        type: String,
        required: true,
    },
    path: {
        type: String,
        required: true,
    },
    icon: {
        type: String,
        default: '',
    },
    description: {
        type: String,
        default: '',
    },
    content: {
        type: String,
        default: '',
    },
    price: {
        type: Number,
        default: 0,
    },
    counts: {
        type: Number,
        default: 0,
    },
    stars: {
        type: Number,
        default: 0,
    },
    status: {
        type: Number,
        default: 0,
    },
    sort: {
        type: Number,
        default: 0,
    },
    isPrivate: {
        type: Boolean,
        default: false,
    },
    createAt: {
        type: Date,
        default: Date.now,
    },
})
// 创建索引
appSchema.index({ id: 1, description: 'text' })
// 注册模型
const app = mongoose.model('app', appSchema)

// ---------文件分享
const fileShareSchema = new Schema({
    fileId: {
        type: String,
        default: '',
    },
    fromUser: {
        type: String,
        required: true,
    },
    toUser: {
        type: String,
        default: '',
    },
    type: {
        type: Number,
        default: 0,
    },
    label: {
        type: String,
        required: true,
    },
    icon: {
        type: String,
        default: '',
    },
    url: {
        type: String,
        default: '',
    },
    description: {
        type: String,
        default: '',
    },
    counts: {
        type: Number,
        default: 0,
    },
    starts: {
        type: Number,
        default: 0,
    },
    createAt: {
        type: Date,
        default: Date.now,
    },
    delFlag: {
        type: Number,
        default: 0,
    },
})
// 创建索引
fileShareSchema.index({ id: 1, description: 'text' })
// 注册模型
const fileShare = mongoose.model('fileShare', fileShareSchema)

// ---------数据字典
const sysDictSchema = new Schema({
    parentId: {
        type: String,
        default: '0',
    },
    label: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        default: '',
    },
    sort: {
        type: Number,
        default: 0,
    },
    createAt: {
        type: Date,
        default: Date.now,
    },
})
// 创建索引
sysDictSchema.index({ id: 1, label: 'text' })
// 注册模型
const sysDict = mongoose.model('sysDict', sysDictSchema)

// 评论或修订
const commentSchema = new Schema({
    parentId: {
        type: String,
        default: '',
    },
    userId: {
        type: String,
        ref: 'User',
        required: true,
    },
    type: {
        type: Number,
        default: 0,
    },
    fromId: {
        type: String,
        default: '',
    },
    targetId: {
        type: String,
        default: '',
    },
    contents: {
        type: String,
        default: '',
    },
    status: {
        type: Number,
        default: 0,
    },
    createAt: {
        type: Date,
        default: Date.now,
    },
    updateAt: {
        type: Date,
        default: Date.now,
    },
})
// 创建索引
commentSchema.index({ id: 1, userId: 1, contents: 'text' })
// 注册模型
const comment = mongoose.model('comment', commentSchema)

// 用户收藏夹
const userFavSchema = new Schema({
    userId: {
        type: String,
        ref: 'User',
        required: true,
    },
    type: {
        type: Number,
        default: 0,
    },
    fromId: {
        type: String,
        default: '',
    },
    label: {
        type: String,
        default: '',
    },
    path: {
        type: String,
        default: '',
    },
    createAt: {
        type: Date,
        default: Date.now,
    },
    updateAt: {
        type: Date,
        default: Date.now,
    },
})
// 创建索引
userFavSchema.index({ id: 1, userId: 1 })
// 注册模型
const userFav = mongoose.model('userFav', userFavSchema)

// 网络爬虫
const crawlerSchema = new Schema({
    appId: {
        type: String,
        default: '',
    },
    userId: {
        type: String,
        ref: 'User',
        required: true,
    },
    type: {
        type: Number,
        default: 0,
    },
    label: {
        type: String,
        default: '',
    },
    configs: {
        type: Object,
        default: {},
    },
    delFlag: {
        type: Number,
        default: 0,
    },
    createAt: {
        type: Date,
        default: Date.now,
    },
    updateAt: {
        type: Date,
        default: Date.now,
    },
})
// 创建索引
crawlerSchema.index({ id: 1, userId: 1 })
// 注册模型
const crawler = mongoose.model('crawler', crawlerSchema)

// 用户访问日志
const docsSchema = new Schema({
    userId: {
        type: String,
        ref: 'User',
        required: true,
    },
    docName: {
        type: String,
        default: '',
    },
    docType: {
        type: String,
        default: '',
    },
    sourceType: {
        type: String,
        default: '',
    },
    sourceId: {
        type: String,
        default: '',
    },
    imgUrl: {
        type: String,
        default: '',
    },
    sort: {
        type: Number,
        default: 1000,
    },
    tags: {
        type: String,
        default: '',
    },
    counts: {
        type: Number,
        default: 1,
    },
    stars: {
        type: Number,
        default: 0,
    },
    remark: {
        type: String,
        default: '',
    },
    ibo: {
        type: Number,
        default: 0,
    },
    status: {
        type: Number,
        default: 0,
    },
    createAt: {
        type: Date,
        default: Date.now,
    },
    updateAt: {
        type: Date,
        default: Date.now,
    },
    delFlag: {
        type: Number,
        default: 0,
    },
})
// 创建索引
docsSchema.index({ id: 1, userId: 1, docName: 'text' })
// 注册模型
const docs = mongoose.model('docs', docsSchema)

// 用户访问日志
const userLogSchema = new Schema({
    userId: {
        type: String,
        ref: 'User',
        required: true,
    },
    apiName: {
        type: String,
        default: '',
    },
    apiType: {
        type: String,
        default: '',
    },
    sourceId: {
        type: String,
        default: '',
    },
    appName: {
        type: String,
        default: '',
    },
    appPath: {
        type: String,
        default: '',
    },
    remark: {
        type: String,
        default: '',
    },
    errorMsg: {
        type: String,
        default: '',
    },
    startTime: {
        type: Date,
        default: Date.now,
    },
    endTime: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        default: '',
    },
})
// 创建索引
userLogSchema.index({ id: 1, userId: 1 })
// 注册模型
const userLog = mongoose.model('userLogs', userLogSchema)

// 编辑器标签
const stdTagSchema = new Schema({
    type: {
        type: Number,
        default: 0,
    },
    parentId: {
        type: String,
        default: '',
    },
    name: {
        type: String,
        default: '',
    },
    enName: {
        type: String,
        default: '',
    },
    htmlTag: {
        type: String,
        default: '',
    },
    mapName: {
        type: String,
        default: '',
    },
    content: {
        type: String,
        default: '',
    },
    status: {
        type: Number,
        default: 0,
    },
    delFlag: {
        type: Boolean,
        default: false,
    },
    createTime: {
        type: Date,
        default: Date.now,
    },
    sort: {
        type: Number,
        default: 0,
    },
    hidden: {
        type: Boolean,
        default: false,
    },
})
// 创建索引
stdTagSchema.index({ id: 1 });
// 注册模型
const stdTag = mongoose.model('stdTags', stdTagSchema);


// 编辑器模板
const stdModelSchema = new Schema({
    userId: {
        type: String,
        default: '',
    },
    label: {
        type: String,
        default: '',
    },
    content: {
        type: String,
        default: '',
    },
    configs: {
        type: Object,
        default: {}
    },
    filePath: {
        type: String,
        default: '',
    },
    status: {
        type: Number,
        default: 0,
    },
    delFlag: {
        type: Boolean,
        default: false,
    },
    createTime: {
        type: Date,
        default: Date.now,
    },
})
// 创建索引
stdModelSchema.index({ id: 1 });
// 注册模型
const stdModel = mongoose.model('stdModels', stdModelSchema);

// 编辑器草稿箱
const draftSchema = new Schema({
    docId: {
        type: String,
        required: true,
    },
    label: {
        type: String,
        default: '',
    },
    filePath: {
        type: String,
        default: '',
    },
    bytes: {
        type: Number,
        default: 0,
    },
    status: {
        type: Number,
        default: 0,
    },
    delFlag: {
        type: Boolean,
        default: false,
    },
    createTime: {
        type: Date,
        default: Date.now,
    },
})
// 创建索引
draftSchema.index({ id: 1 });
// 注册模型
const draft = mongoose.model('drafts', draftSchema);

// 编辑器文档
const edtDocumentSchema = new Schema({
    userId: {
        type: String,
        default: '',
    },
    modelId: { // 模板ID
        type: String,
        default: '',
    },
    stdName: {
        type: String,
        default: '',
    },
    stdKind: { // 标准文档类型
        type: Number,
        default: 0,
    },
    type: { // 文档类型
        type: Number,
        default: 0,
    },
    filePath: {
        type: String,
        default: '',
    },
    outputData: {
        type: Object,
        default: {},
    },
    forms: { // 其他题录数据
        type: Object,
        default: '',
    },
    version: {
        type: String,
        default: '',
    },
    status: {
        type: Number,
        default: 0,
    },
    delFlag: {
        type: Boolean,
        default: false,
    },
    createTime: {
        type: Date,
        default: Date.now,
    },
})
// 创建索引
edtDocumentSchema.index({ id: 1 });
// 注册模型
const edtDocument = mongoose.model('edtDocuments', edtDocumentSchema);

// 编辑器文档修订Revision
const edtRevisionSchema = new Schema({
    docId: { // 文档ID
        type: String,
        default: '',
    },
    userId: {
        type: String,
        default: '',
    },
    version: {
        type: String,
        default: '',
    },
    filePath: {
        type: String,
        default: '',
    },
    content: {
        type: Object,
        default: null,
    },
    status: {
        type: Number,
        default: 0,
    },
    delFlag: {
        type: Boolean,
        default: false,
    },
    createTime: {
        type: Date,
        default: Date.now,
    }
})
// 创建索引
edtRevisionSchema.index({ id: 1 });
// 注册模型
const edtRevision = mongoose.model('edtRevisions', edtRevisionSchema);

// 编辑器文档大纲数据
const edtOutlineSchema = new Schema({
    docId: {
        type: String,
        default: '',
    },
    outlineId: {
        type: String,
        default: '',
    },
    parentId: {
        type: String,
        default: '',
    },
    outlineTitle: {
        type: String,
        default: '',
    },
    outlineType: {
        type: Number,
        default: 0,
    },
    number: {
        type: String,
        default: '',
    },
    level: {
        type: Number,
        default: 1,
    },
    content: {
        type: String,
        default: '',
    },
    thumbnail: {
        type: String,
        default: '',
    },
    createTime: {
        type: Date,
        default: Date.now,
    },
})
// 创建索引
edtOutlineSchema.index({ id: 1 });
// 注册模型
const edtOutline = mongoose.model('edtOutlines', edtOutlineSchema);

module.exports = {
    user,
    File,
    Converter,
    ConvertRecord,
    ApiCredential,
    AiChat,
    PageEditor,
    userFriend,
    userFav,
    app,
    fileShare,
    comment,
    sysDict,
    crawler,
    docs,
    userLog,
    stdTag,
    stdModel,
    edtDocument,
    edtRevision,
    edtOutline,
    draft
}
