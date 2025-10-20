<!--
 * @Author: wuyifan 1208097313@qq.com
 * @Date: 2025-04-17 00:59:57
 * @LastEditors: wuyifan 1208097313@qq.com
 * @LastEditTime: 2025-04-17 01:15:36
 * @FilePath: /factory-visualization/src/App.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(() => {
  console.log('App.vue mounted');
  console.log('Current route:', router.currentRoute.value);
})
</script>

<style>
#app {
  width: 100%;
  height: 100vh;
}
</style>
