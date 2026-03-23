<template>
	<div class="paging-small-container clearfix">
		<div class="page-size">共{{ total }}条</div>
		<ul class="page-lis clearfix">
			<li v-if="currentPage > 1" @click="changePage(currentPage - 1)">上一页</li>
			<li :class="{ active: currentPage == item.val }" v-for="(item, idx) in pagelist" :key="idx" v-text="item.text" @click="changePage(item.val)" />
			<li v-if="totalPage > currentPage" @click="changePage(currentPage + 1)">下一页</li>
		</ul>
	</div>
</template>

<script>
	export default {
		name: 'paging-small',
		props: {
			pageSize: {
				type: Number,
				default: 10
			},
			total: {
				type: Number,
				default: 0
			},
			currentPage: {
				type: Number,
				default: 1
			}
		},
		computed: {
			totalPage: function() {
				return Math.ceil(this.total / this.pageSize);
			},
			pagelist: function() {
				let list = [];
				let count = Math.floor(this.pageGroup / 2), center = this.currentPage;
				let left = 1, right = this.totalPage;

				if (this.totalPage > this.pageGroup) {
					if (this.currentPage > count + 1) {
						if (this.currentPage < this.totalPage - count) {
							left = this.currentPage - count;
							right = this.currentPage + count - 1;
						} else {
							left = this.totalPage - this.pageGroup + 1;
						}
					} else {
						right = this.pageGroup;
					}
				}
				// 遍历添加到数组里
				while (left <= right) {
					list.push({ text: left, val: left });
					left++;
				}
				return list;
			}
		},
		data() {
			return {
				isShowJumper: false,
				isShowTotal: false,
				toPage: '', 			// 跳转到x页
				pageGroup: 10 			// 可见分页数量 默认10个分页数
			};
		},
		methods: {
			// 页码改变事件上报
			changePage: function(idx) {
				if (idx != this.currentPage && idx > 0 && idx <= this.totalPage) {
					this.$emit('change', { curPage: Number(idx) });
				}
			}
		}
	}
</script>
<style lang="scss" scoped>
	.paging-small-container{
		display: flex;
		align-items: center;
		.clearfix:after {
			display: block;
			content: '';
			clear: both;
		}
		.page-size {
			height: 30px;
			line-height: 30px;
			font-size:14px;
			margin-right: 15px;
		}
		ul {
			list-style: none;
			li {
				float: left;
				color: #606266;
				font-size:14px;
				background: #f4f4f5;
				padding: 2px 8px;
				cursor: pointer;
				border-radius: 2px;
				margin: 0 3px;
				&.active {
					background: #409eff;
					color: #fff;
				}
			}
		}
	}
</style>
