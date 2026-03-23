/**
 * =================================================
 * @module
 * @desc 编辑器正文内容分页模块，通过NodeChange事件监听
 * 1.正向分页（新增内容/节点）：通过遍历所有节点（包括子节点），找出第一个匹配越界(绝对位置+高度超出了单页的限高)的元素。
 *  ◆ 如为主容器info-block的二级子元素，直接插入后页的第一个位置。
 *  ◆ 如为LI/TD/等，则往上递归获取主容器的特性，重新构建新的容器，并延续DOM结构体，将本身体和后面的所有兄弟元素置入新的容器。
 * 2.逆向分页（删除内容/节点）:
 * @author sam 2021-08-20
 * =================================================
 */
export default class editorPages {

    setPages(evt) {
        console.log('setPages editor',this.editor, evt);
        // 当前
        const container = evt.parents[evt.parents.length - 1];
    }
}
