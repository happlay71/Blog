// src/pages/introduction.js
import React from 'react';
import Layout from '@theme/Layout';
import '../css/custom.css'; // 确保正确引用样式文件

function Introduction() {
  return (
    <Layout title="自我介绍" description="这里主要是我的后端学习笔记，附带一点粗糙的前端知识，">
      <div className="container introduction-container">
        <h1>这里是我的后端学习笔记，附带一点粗糙的前端知识</h1>
        <h1>以及勉强称得上是博客的问题解决方案</h1>
        <span class="chinese">未完待续...</span>
      </div>
    </Layout>
  );
}

export default Introduction;