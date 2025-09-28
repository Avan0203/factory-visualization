<!--
 * @Author: wuyifan 1208097313@qq.com
 * @Date: 2025-04-17 01:06:23
 * @LastEditors: wuyifan 1208097313@qq.com
 * @LastEditTime: 2025-06-05 16:32:08
 * @FilePath: /factory-visualization/src/layout/index.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
    <el-container>
        <el-header>
            <el-row>
                <el-col :span="4" class="header-title">
                    <span>
                        工厂可视化系统
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
                <el-col :span="8" class="button-list">
                    <el-button type="primary" :icon="Refresh">警报复位</el-button>
                    <el-button type="primary" :icon="Operation" />
                    <el-button type="primary" :icon="Setting" />
                    <el-button type="danger" :icon="SwitchButton" @click="handleLogout">退出系统</el-button>
                </el-col>
            </el-row>

        </el-header>
        <el-main>
            <div v-show="activeIndex == 1" style="width: 100%; height: 100%;">
                <monitor />
            </div>
            <div v-show="activeIndex == 2" style="width: 100%; height: 100%;">
                <chart />
            </div>
            <div v-show="activeIndex == 3" style="width: 100%; height: 100%;">
                <table-ref />
            </div>
        </el-main>
    </el-container>
</template>

<script setup>
import { ElMenu, ElMenuItem, ElContainer, ElHeader, ElMain, ElCol, ElRow, ElButton, ElMessage, ElMessageBox } from 'element-plus';
import { Operation, Setting, SwitchButton, Refresh } from '@element-plus/icons-vue';
import { ref, onMounted, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import chart from './chart/chart.vue';
import tableRef from './table/table.vue';
import monitor from './monitor/monitor.vue';

const router = useRouter();
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

// 处理退出登录
const handleLogout = () => {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    }).then(() => {
        // 清除本地存储的认证信息
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userInfo');
        
        // 跳转到登录页面
        router.push('/login');
        
        ElMessage.success('已退出登录');
    }).catch(() => {
        // 用户取消退出
    });
}

// 检查认证状态
const checkAuth = () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn !== 'true') {
        router.push('/login');
    }
}

onMounted(() => {
    checkAuth();
});

</script>