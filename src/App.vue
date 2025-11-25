<!--
 * @Author: wuyifan 1208097313@qq.com
 * @Date: 2025-04-17 00:59:57
 * @LastEditors: wuyifan 1208097313@qq.com
 * @LastEditTime: 2025-11-21 10:36:56
 * @FilePath: /factory-visualization/src/App.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <div id="app">
    <Layout/>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import Layout from './layout/index.vue';
import { getConfiguration } from './api/sensor';
import { setFactoryConfig } from './config/factoryConfig';

// 应用启动时调用配置接口
onMounted(async () => {
  try {
    const config = await getConfiguration();
    console.log('配置信息加载成功:', config);
    // 存储到全局配置
    setFactoryConfig(config);
  } catch (error) {
    console.error('加载配置信息失败:', error);
    ElMessage.error('加载配置信息失败，请检查后端服务是否正常运行');
  }
});
</script>

<style>
#app {
  width: 100%;
  height: 100vh;
}
</style>
