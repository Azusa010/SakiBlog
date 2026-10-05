<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <!--
    博主资料第一阶段为静态站点内容,改动这里不需要修改功能代码
    (SRS §4.4 / NFR-MAINT-003);接入管理端后可改为数据库驱动。
  -->
  <section>
    <h1>关于</h1>

    <h2>关于我</h2>
    <p>你好,我是 Saki,一名正在系统学习前后端分离全栈开发的开发者。</p>

    <h2>关于本博客</h2>
    <p>
      SakiBlog 是我用来实践全栈工程化的个人博客项目:前端 Vue 3 + TypeScript,后端
      FastAPI + MySQL。这里会记录学习和开发过程中的思考与笔记。
    </p>

    <h2>联系我</h2>
    <p>
      如果你想交流,欢迎访问 <RouterLink to="/posts">博客文章</RouterLink> 留下的内容;
      公开联系方式后续补充。
    </p>
  </section>
</template>
