import React, { useState } from 'react';
import Layout from '@theme/Layout';
import clsx from 'clsx';
import styles from './tools.module.css';
import { toolData } from '../../data/toolData'; // 抽离数据

export default function ToolsPage() {
  const categories = Object.keys(toolData);
  const [activeCategory, setActiveCategory] = useState(categories[0]);

  return (
    <Layout title="工具导航" description="常用工具与资源网站合集">
      <div className={styles.pageWrapper}>
        {/* 左侧侧边栏 */}
        <nav className={styles.sidebar}>
          <div className={styles.sidebarTitle}>🧰 分类</div>
          <ul className={styles.sidebarList}>
            {categories.map((cat) => (
              <li
                key={cat}
                className={clsx(styles.sidebarItem, {
                  [styles.active]: activeCategory === cat,
                })}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </li>
            ))}
          </ul>
        </nav>

        {/* 右侧内容区域 */}
        <main className={styles.mainContent}>
          <h1>{activeCategory}</h1>
          <div className={styles.grid}>
            {toolData[activeCategory].map((tool, index) => (
              <a
                key={index}
                className={styles.card}
                href={tool.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                <h3>{tool.name}</h3>
                <p>{tool.desc}</p>
              </a>
            ))}
          </div>
        </main>
      </div>
    </Layout>
  );
}
