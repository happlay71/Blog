import React, { useState } from 'react';
import Layout from '@theme/Layout';
import styles from './tools.module.css'; // 样式文件

// 模拟数据：你可以自己扩展内容
const toolData = {
  '学习资源': [
    {
      name: '菜鸟教程',
      link: 'https://www.runoob.com/',
      desc: '面向初学者的编程教程集合，覆盖各类语言。',
    },
    {
      name: 'MDN 文档',
      link: 'https://developer.mozilla.org/zh-CN/',
      desc: '前端开发必备官方文档，支持多语言。',
    },
  ],
  '开发工具': [
    {
      name: 'JSON 格式化',
      link: 'https://json.cn/',
      desc: '在线 JSON 格式化、美化、校验工具。',
    },
    {
      name: 'RegExr 正则测试',
      link: 'https://regexr.com/',
      desc: '可视化正则表达式测试与解释工具。',
    },
  ],
  '图片/图床': [
    {
      name: 'SM.MS 图床',
      link: 'https://sm.ms/',
      desc: '免费稳定图床，支持匿名上传与 API。',
    },
  ],
};

export default function ToolsPage() {
  // 当前选中的分类（默认第一个）
  const categories = Object.keys(toolData);
  const [activeCategory, setActiveCategory] = useState(categories[0]);

  return (
    <Layout title="工具导航" description="常用网站与工具合集">
      <main className={styles.page}>
        <div className="container">
          <h1>🧰 工具导航</h1>
          <p className={styles.subtitle}>开发常用网站、工具与资源收藏</p>
          <div className={styles.wrapper}>
            {/* 左侧分类 */}
            <aside className={styles.sidebar}>
              {categories.map((cat) => (
                <div
                  key={cat}
                  className={`${styles.category} ${
                    cat === activeCategory ? styles.active : ''
                  }`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </div>
              ))}
            </aside>

            {/* 右侧内容区域 */}
            <section className={styles.content}>
              {toolData[activeCategory].map((tool, idx) => (
                <a
                  className={styles.card}
                  href={tool.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  key={idx}
                >
                  <h3>{tool.name}</h3>
                  <p>{tool.desc}</p>
                </a>
              ))}
            </section>
          </div>
        </div>
      </main>
    </Layout>
  );
}
