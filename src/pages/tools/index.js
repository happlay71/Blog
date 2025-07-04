import React, { useState, useEffect, useRef } from 'react';
import Layout from '@theme/Layout';
import clsx from 'clsx';
import styles from './tools.module.css';
import { toolData } from '../../data/toolData';

export default function ToolsPage() {
  const categories = Object.keys(toolData);
  const [classification, setClassification] = useState('分类');
  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef(null);
  const [animateReveal, setAnimateReveal] = useState(false);

  const handleCategoryClick = (cat) => {
    setActiveCategory(cat);
    setClassification(cat);
    setSidebarOpen(false);
  };

  // 点击空白处自动关闭菜单（仅限移动端）
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        event.target.closest(`.${styles.sidebarToggle}`) == null
      ) {
        setSidebarOpen(false);
      }
    };

    if (isSidebarOpen) {
      document.addEventListener('click', handleClickOutside);
    } else {
      document.removeEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isSidebarOpen]);

  return (
    <Layout title="工具导航" description="常用工具与资源网站合集">
      <div className={styles.pageWrapper}>
        {/* 折叠菜单按钮 */}
        <div
          className={styles.sidebarToggle}
          onClick={() => setSidebarOpen(!isSidebarOpen)}
        >
          <img src="/img/tools/classification.png" className={styles.iconClassification} alt="分类图标" />
          &thinsp;{ classification } {isSidebarOpen ? '▼' : '▶'}
        </div>

        {/* 侧边栏 */}
        <nav
          ref={sidebarRef}
          className={clsx(styles.sidebar, {
            [styles.sidebarOpen]: isSidebarOpen,
          })}
        >
          <ul className={styles.sidebarList}>
            {categories.map((cat) => (
              <li
                key={cat}
                className={clsx(styles.sidebarItem, {
                  [styles.active]: activeCategory === cat,
                })}
                onClick={() => handleCategoryClick(cat)}
              >
                {cat}
              </li>
            ))}
          </ul>
        </nav>

        {/* 内容区域 */}
        <main className={styles.mainContent}>
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
