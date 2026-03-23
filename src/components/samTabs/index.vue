<template>
	<el-tabs class="sam-tabs" v-model="activeName" type="card" @tab-click="handleClick">
		<el-tab-pane v-for="(item, idx) in data" :key="idx" :name="item.act" :disabled="item.disabled">
			<span slot="label"><i v-if="item.icon" :class="item.icon" />{{item.label}}</span>
		</el-tab-pane>
	</el-tabs>
</template>

<script>
	export default{
		name: "sam-tabs",
		props:{
			data:{
				type: Array,
				deafault: ()=>{
					return [];
				}
			},
			tabIndex: {
				type: String,
				deafault: "0"
			}
		},
		watch:{
			tabIndex:{
				handler(val) {
					this.activeName = val;
				},
				deep: true,
				immediate: true
			},
		},
		data() {
            return {
                activeName: '0'
            }
        },
		methods:{
			handleClick(tab){
				this.$emit("change", this.data[Number(tab.index)])
			}
		}
	}
</script>

<style lang="scss" scoped>
	.sam-tabs{
        height: 100%;
		::v-deep .el-tabs__header{
			margin:0;
			padding-left: 20px;
			box-sizing: border-box;
			border-bottom: 1px solid #eaeaea;
            .el-tabs__nav-wrap{
                // padding-left: 15px;
                &.is-left{
                    padding:10px 0 0 !important;
                    .is-active{
                        border-color: #d1dbe5 transparent #d1dbe5 #d1dbe5 !important ;
                        margin: 0;
                    }
                }
                .el-tabs__nav{
                    &:after{
                        background-color: rgba(0,0,0,.08);
                        width: 1px !important;
                    }
                    .el-tabs__item {
                    	height: 25px;
                    	line-height: 25px;
                        padding: 0 10px;
                    	color:#888;
                    	background: linear-gradient(#efefef, transparent);
                    	font-size: 12px;
                    	&:hover{
                    		color: #3791de;
                    	}
                    	>span>i{
                    		margin-right: 5px;
                    		font-size:14px;
                    	}
                    	&.is-active{
                    		background: #FFF;
                    		color: #3791de;
                    		font-weight: bold;
                    	}
                    }
                }
            }

		}
	}
	.samtab-list{
		padding: 0 15px;
		border-bottom: 1px solid #DDD;
		box-sizing: border-box;
		height: 30px;
		>li{
			display: inline-flex;
			justify-content: center;
			align-items: center;
			margin: 0 0 0 -1px;
			background: #eee;
			padding: 0px 15px;
			border: 1px solid #DDD;
			border-bottom-color: transparent;
			box-sizing: border-box;
			height: 100%;
			line-height: 100%;
			cursor: pointer;
			&.active{
				background: #FFF;
				color: #3482d2;
				font-weight: bold;
			}
			&:hover{
				color: #3482d2;
			}
			&.lines{
				background: linear-gradient(#f7f7f7,#e8e8e8,#f5f5f5);
			}
			&:first-child{
				border-top-left-radius: 3px;
			}
			&:last-child{
				border-top-right-radius: 3px;
			}
		}

	}
</style>
