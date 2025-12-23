<!--
 * @Author: wuyifan 1208097313@qq.com
 * @Date: 2025-04-17 01:06:23
 * @LastEditors: wuyifan wuyifan@udschina.com
 * @LastEditTime: 2025-12-23 13:28:18
 * @FilePath: /factory-visualization/src/layout/index.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
    <el-container>
        <el-header>
            <el-row>
                <el-col :span="4" class="header-title">
                    <span>
                        徐州仓库可视化系统
                    </span>
                </el-col>
                <el-col :span="12">
                    <el-menu :default-active="activeIndex" class="el-menu-demo" mode="horizontal"
                        @select="handleSelect">
                        <el-menu-item index="1">首页</el-menu-item>
                        <el-menu-item index="2">统计分析</el-menu-item>
                        <el-menu-item index="3">表格展示</el-menu-item>
                    </el-menu>
                </el-col>
            </el-row>

        </el-header>
        <el-main>
            <div v-show="activeIndex == '1'" style="width: 100%; height: 100%;">
                <monitor />
            </div>
            <div v-show="activeIndex == '2'" style="width: 100%; height: 100%;">
                <chart />
            </div>
            <div v-show="activeIndex == '3'" style="width: 100%; height: 100%;">
                <table-ref />
            </div>
        </el-main>
    </el-container>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { ElMenu, ElMenuItem, ElContainer, ElHeader, ElMain, ElCol, ElRow } from 'element-plus';

import chart from './chart/chart.vue';
import tableRef from './table/table.vue';
import monitor from './monitor/monitor.vue';

const activeIndex = ref('1');

const handleSelect = (key) => {
    activeIndex.value = key;
    console.log(key);
}

// 监听页面切换，当切换到统计分析页面时，延迟重新渲染图表
watch(activeIndex, async (newIndex) => {
    if (newIndex === '2') {
        // 等待DOM更新
        await nextTick();
        // 延迟一点时间确保图表容器完全显示
        setTimeout(() => {
            // 触发窗口resize事件，让图表重新计算尺寸
            window.dispatchEvent(new Event('resize'));
        }, 200);
    }
});
</script>