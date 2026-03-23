
export const modelData = {
    layout: "force",
    force: {
        repulsion: [-2, 100], //节点之间的斥力因子。支持数组表达斥力范围，值越大斥力越大。
        gravity: 0.03, //节点受到的向中心的引力因子。该值越大节点越往中心点靠拢。
        edgeLength: [20, 200], //边的两个节点之间的距离，这个距离也会受 repulsion:[10, 50]值越小则长度越长
        layoutAnimation: false,
    },

}


export const sampleUtil = {
    setData() {
        for (let i = 0; i < 30; i++) {

        }
    },
    getJson() {
        return [{
            "id": "0",
            "label": "文档",
            "name": "GB4943.1-2011《信息技术设备安全第1部分:通用要求》",
            "children": [{
                    "id": "1",
                    "pid": "0",
                    "label": "标准",
                    "name": "标准",
                    "children": [{
                            "id": "1-1",
                            "pid": "1",
                            "name": "内部相关",
                            "children": [{
                                    "id": "1-1-1",
                                    "pid": "1-1",
                                    "name": "GB 4943.21-2019《信息技术设备安全第21部分：远程馈电》"
                                },
                                {
                                    "id": "1-1-2",
                                    "pid": "1-1",
                                    "name": "GB 4943.23-2012《信息技术设备安全第23部分:大型数据存储设备》"
                                },
                                {
                                    "id": "1-1-3",
                                    "pid": "1-1",
                                    "name": "GB 4943.22-2019《信息技术设备安全第22部分：室外安装设备》"
                                }
                            ]
                        },
                        {
                            "id": "1-2",
                            "pid": "1",
                            "name": "外部引用",
                            "children": [{
                                    "id": "1-2-1",
                                    "pid": "1-2",
                                    "name": "GB/T 1002-2008 《家用和类似用途单相插头插座型式、基本参数和尺寸》"
                                },
                                {
                                    "id": "1-2-2",
                                    "pid": "1-2",
                                    "name": "GB/T 1003-2016《家用和类似用途三相插头插座型式、基本参数和尺寸》"
                                },
                                {
                                    "id": "1-2-3",
                                    "pid": "1-2",
                                    "name": "IEC 60950-1:2005/AMD1:2009《Amendment 1 - Information technology equipment 》"
                                }
                            ]
                        },
                    ]
                },
                {
                    "id": "2",
                    "pid": "0",
                    "label": "产品",
                    "name": "产品",
                    "children": [{
                            "id": "2-1",
                            "pid": "2",
                            "name": "联想智能投影仪"
                        },
                        {
                            "id": "2-2",
                            "pid": "2",
                            "name": "多媒体液晶投影机"

                        },
                        {
                            "id": "2-3",
                            "pid": "2",
                            "name": "监控摄像头"
                        },
                    ]
                },
                {
                    "id": "3",
                    "pid": "0",
                    "label": "指标",
                    "name": "指标",
                    "children": [{
                            "id": "3-1",
                            "pid": "3",
                            "name": "吞吐量"
                        },
                        {
                            "id": "3-2",
                            "pid": "3",
                            "name": "延迟"
                        },
                        {
                            "id": "3-3",
                            "pid": "3",
                            "name": "丢包率"
                        }
                    ]
                },
                {
                    "id": "4",
                    "pid": "0",
                    "label": "专家",
                    "name": "专家",
                    "children": [{
                            "id": "4-1",
                            "pid": "4",
                            "name": "王莹"
                        },
                        {
                            "id": "4-2",
                            "pid": "4",
                            "name": "胡京平"
                        },
                        {
                            "id": "4-3",
                            "pid": "4",
                            "name": "李正"
                        },
                    ]
                },
                {
                    "id": "5",
                    "pid": "0",
                    "label": "单位",
                    "name": "单位",
                    "children": [{
                            "id": "5-1",
                            "pid": "5",
                            "name": "检测单位",
                            "children": [{
                                    "id": "5-1-1",
                                    "pid": "5-1",
                                    "name": "中国检验认证集团"
                                },
                                {
                                    "id": "5-1-2",
                                    "pid": "5-1",
                                    "name": "中国质量认证中心（CQC）"
                                },
                                {
                                    "id": "5-1-3",
                                    "pid": "5-1",
                                    "name": "中国网络安全审查技术与认证中心"
                                }
                            ]
                        },
                        {
                            "id": "5-2",
                            "pid": "5",
                            "name": "发布单位",
                            "children": [{
                                    "id": "5-2-1",
                                    "pid": "5-2",
                                    "name": "国家市场监督管理总局"
                                },
                                {
                                    "id": "5-2-2",
                                    "pid": "5-2",
                                    "name": "国家标准化管理委员会"
                                }
                            ]
                        },
                        {
                            "id": "5-3",
                            "pid": "5",
                            "name": "参编/起草单位",
                            "children": [{
                                    "id": "5-3-1",
                                    "pid": "5-3",
                                    "name": "工业和信息化部电子第四研究院"
                                },
                                {
                                    "id": "5-3-2",
                                    "pid": "5-3",
                                    "name": "工业和信息化部电子第五研究所"
                                },
                                {
                                    "id": "5-3-3",
                                    "pid": "5-3",
                                    "name": "上海市质量监督检验技术研究院"
                                }
                            ]
                        },
                        {
                            "id": "5-4",
                            "pid": "5",
                            "name": "提出单位",
                            "children": [{
                                "id": "5-4-1",
                                "pid": "5-4",
                                "name": "华人民共和国工业和信息化部"
                            }]
                        },
                        {
                            "id": "5-5",
                            "pid": "5",
                            "name": "归口单位",
                            "children": [{
                                "id": "5-5-1",
                                "pid": "5-5",
                                "name": "工业和信息化部电子第四研究院"
                            }]
                        }
                    ]
                }
            ]
        }]
    },
    forceJson() {
        return {
            "categories": [{
                    "name": "文档"
                },
                {
                    "name": "标准"
                },
                {
                    "name": "产品"
                },
                {
                    "name": "指标"
                },
                {
                    "name": "专家"
                },
                {
                    "name": "单位"
                },
                {
                    "name": "引用"
                },
                {
                    "name": "检测单位"
                }
            ],
            "nodes": [{
                    "id": "0",
                    "name": "GB4943.1-2011《信息技术设备安全第1部分:通用要求》",
                    "symbolSize": 76,
                    "category": 0
                },
                {
                    "id": "1",
                    "name": "标准",
                    "symbolSize": 40,
                    "category": 1,
                    x: 206,
                    y: 69
                },
                {
                    "id": "2",
                    "name": "产品",
                    "symbolSize": 36,
                    "category": 2,
                    x: 82.80825,
                    y: -203.1144
                },
                {
                    "id": "3",
                    "name": "指标",
                    "symbolSize": 32,
                    "category": 3,
                    x: -313.42786,
                    y: -289.44803
                },
                {
                    "id": "4",
                    "name": "专家",
                    "symbolSize": 37,
                    "category": 4,
                    x: -385.6842,
                    y: -20.206686
                },
                {
                    "id": "5",
                    "name": "单位",
                    "symbolSize": 31,
                    "category": 5,
                    x: -266.82776,
                    y: 299.6904
                },

                {
                    "id": "1-1",
                    "name": "内部相关",
                    "symbolSize": 30,
                    "category": 6,
                    x: 355.78366,
                    y: -74.882454
                },
                {
                    "id": "1-2",
                    "name": "外部引用",
                    "symbolSize": 30,
                    "category": 6,
                    x: 387.89572,
                    y: 110.462326
                },
                {
                    "id": "2-1",
                    "name": "联想智能投影仪",
                    "symbolSize": 30,
                    "category": 2,
                    x: 238.36697,
                    y: -210.00926
                },
                {
                    "id": "2-2",
                    "name": "多媒体液晶投影机",
                    "symbolSize": 30,
                    "category": 2,
                    x: 150.35959,
                    y: -273.8517

                },
                {
                    "id": "2-3",
                    "name": "监控摄像头",
                    "symbolSize": 30,
                    "category": 2,
                    x: 78.4799,
                    y: -347.15146
                },

                {
                    "id": "3-1",
                    "name": "吞吐量",
                    "symbolSize": 30,
                    "category": 3,
                    x: -385.2226,
                    y: -393.5572
                },
                {
                    "id": "3-2",
                    "name": "延迟",
                    "symbolSize": 30,
                    "category": 3,
                    x: -281.4253,
                    y: -158.45137
                },
                {
                    "id": "3-3",
                    "name": "丢包率",
                    "symbolSize": 30,
                    "category": 3,
                    x: -403.92447,
                    y: -197.69823
                },

                {
                    "id": "4-1",
                    "name": "王莹",
                    "symbolSize": 30,
                    "category": 4,
                    x: -453.26874,
                    y: 58.94648
                },
                {
                    "id": "4-2",
                    "name": "胡京平",
                    "symbolSize": 30,
                    "category": 4,
                    x: -446.7876,
                    y: 123.38005
                },
                {
                    "id": "4-3",
                    "name": "李正",
                    "symbolSize": 30,
                    "category": 4,
                    x: -386.44904,
                    y: 140.05937
                },
                {
                    "id": "5-1",
                    "name": "检测单位",
                    "symbolSize": 30,
                    "category": 5,
                    x: -242.82404,
                    y: 235.26283
                },
                {
                    "id": "5-2",
                    "name": "发布单位",
                    "symbolSize": 30,
                    "category": 5,
                    x: -89.34107,
                    y: 234.56128
                },
                {
                    "id": "5-3",
                    "name": "参编/起草单位",
                    "symbolSize": 30,
                    "category": 5,
                    x: -212.76357,
                    y: 245.29176

                },
                {
                    "id": "5-4",
                    "name": "提出单位",
                    "symbolSize": 30,
                    "category": 5,
                    x: -296.07935,
                    y: 163.11964
                },
                {
                    "id": "5-5",
                    "name": "归口单位",
                    "symbolSize": 30,
                    "category": 5,
                    x: 40.942253,
                    y: 113.78272
                },

                {
                    "id": "1-1-1",
                    "pid": "1-1",
                    "name": "GB 4943.21-2019《信息技术设备安全第21部分：远程馈电》",
                    "symbolSize": 10,
                    "category": 1,
                    x: 355.78366,
                    y: -74.882454
                },
                {
                    "id": "1-1-2",
                    "name": "GB 4943.23-2012《信息技术设备安全第23部分:大型数据存储设备》",
                    "symbolSize": 10,
                    "category": 1,
                    x: 436.17184,
                    y: -12.7286825
                },
                {
                    "id": "1-1-3",
                    "name": "GB 4943.22-2019《信息技术设备安全第22部分：室外安装设备》",
                    "symbolSize": 10,
                    "category": 1,
                    x: 516.40784,
                    y: 47.242233
                },

                {
                    "id": "1-2-1",
                    "name": "GB/T 1002-2008 《家用和类似用途单相插头插座型式、基本参数和尺寸》",
                    "symbolSize": 10,
                    "category": 1,
                    x: 550.1917,
                    y: -128.17537
                },
                {
                    "id": "1-2-2",
                    "name": "GB/T 1003-2016《家用和类似用途三相插头插座型式、基本参数和尺寸》",
                    "symbolSize": 10,
                    "category": 1,
                    x: 614.29285,
                    y: -69.3104
                },
                {
                    "id": "1-2-3",
                    "name": "IEC 60950-1:2005/AMD1:2009《Amendment 1 - Information technology equipment 》",
                    "symbolSize": 10,
                    "category": 1,
                    x: 597.6618,
                    y: 135.18481
                },

                {
                    "id": "5-1-1",
                    "name": "中国检验认证集团",
                    "symbolSize": 10,
                    "category": 5,
                    x: -459.1107,
                    y: -362.5133
                },
                {
                    "id": "5-1-2",
                    "name": "中国质量认证中心（CQC）",
                    "symbolSize": 10,
                    "category": 5,
                    x: -385.2226,
                    y: -393.5572
                },
                {
                    "id": "5-1-3",
                    "name": "中国网络安全审查技术与认证中心",
                    "symbolSize": 10,
                    "category": 5,
                    x: -403.92447,
                    y: -197.69823
                },
                {
                    "id": "5-2-1",
                    "name": "国家市场监督管理总局",
                    "symbolSize": 10,
                    "category": 5,
                    x: -516.55884,
                    y: -393.98975
                },
                {
                    "id": "5-2-2",
                    "name": "国家标准化管理委员会",
                    "symbolSize": 10,
                    "category": 5,
                    x: -234.6001,
                    y: -113.15067
                },

                {
                    "id": "5-3-1",
                    "name": "工业和信息化部电子第四研究院",
                    "symbolSize": 10,
                    "category": 5,
                    x: -334.6001,
                    y: -53.15067
                },
                {
                    "id": "5-3-2",
                    "name": "工业和信息化部电子第五研究所",
                    "symbolSize": 10,
                    "category": 5,
                    x: -254.6001,
                    y: -23.15067
                },
                {
                    "id": "5-3-3",
                    "name": "上海市质量监督检验技术研究院",
                    "symbolSize": 10,
                    "category": 5,
                    x: -294.6001,
                    y: 13.15067
                },

                {
                    "id": "5-4-1",
                    "name": "华人民共和国工业和信息化部",
                    "symbolSize": 10,
                    "category": 5,
                    x: -354.6001,
                    y: 63.15067
                },
                {
                    "id": "5-5-1",
                    "name": "工业和信息化部电子第四研究院",
                    "symbolSize": 10,
                    "category": 5,
                    x: -394.6001,
                    y: 3.15067
                },
            ],
            "links": [{
                    "source": "0",
                    "target": "1"
                },
                {
                    "source": "0",
                    "target": "2"
                },
                {
                    "source": "0",
                    "target": "3"
                },
                {
                    "source": "0",
                    "target": "4"
                },
                {
                    "source": "0",
                    "target": "5"
                },
                {
                    "source": "1",
                    "target": "1-1"
                },
                {
                    "source": "1",
                    "target": "1-2"
                },
                {
                    "source": "1-1",
                    "target": "1-1-1"
                },
                {
                    "source": "1-1",
                    "target": "1-1-2"
                },
                {
                    "source": "1-1",
                    "target": "1-1-3"
                },
                {
                    "source": "1-2",
                    "target": "1-2-1"
                },
                {
                    "source": "1-2",
                    "target": "1-2-2"
                },
                {
                    "source": "1-2",
                    "target": "1-2-3"
                },
                {
                    "source": "2",
                    "target": "2-1"
                },
                {
                    "source": "2",
                    "target": "2-2"
                },
                {
                    "source": "2",
                    "target": "2-3"
                },
                {
                    "source": "3",
                    "target": "3-1"
                },
                {
                    "source": "3",
                    "target": "3-2"
                },
                {
                    "source": "3",
                    "target": "3-3"
                },
                {
                    "source": "4",
                    "target": "4-1"
                },
                {
                    "source": "4",
                    "target": "4-2"
                },
                {
                    "source": "4",
                    "target": "4-3"
                },
                {
                    "source": "5",
                    "target": "5-1"
                },
                {
                    "source": "5",
                    "target": "5-2"
                },
                {
                    "source": "5",
                    "target": "5-3"
                },
                {
                    "source": "5",
                    "target": "5-4"
                },
                {
                    "source": "5",
                    "target": "5-5"
                },
                {
                    "source": "5-1",
                    "target": "5-1-1"
                },
                {
                    "source": "5-1",
                    "target": "5-1-2"
                },
                {
                    "source": "5-1",
                    "target": "5-1-3"
                },
                {
                    "source": "5-2",
                    "target": "5-2-1"
                },
                {
                    "source": "5-2",
                    "target": "5-2-2"
                },
                {
                    "source": "5-3",
                    "target": "5-3-1"
                },
                {
                    "source": "5-3",
                    "target": "5-3-2"
                },
                {
                    "source": "5-3",
                    "target": "5-3-3"
                },
                {
                    "source": "5-4",
                    "target": "5-4-1"
                },
                {
                    "source": "5-5",
                    "target": "5-5-1"
                }
            ]
        }
    }
}
