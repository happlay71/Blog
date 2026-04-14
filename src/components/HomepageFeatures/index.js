import React from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: '专注技术成长',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        深入 Java 后端、Spring Boot、Redis、MySQL，用代码记录每一次技术突破与踩坑心得。
      </>
    ),
    tag: 'Backend',
  },
  {
    title: '实战项目经验',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        从理论到落地，展示真实项目案例与解题思路，帮你构建系统化的工程思维。
      </>
    ),
    tag: 'Projects',
  },
  {
    title: '持续更新维护',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        内容持续迭代更新，记录开发日常与技术沉淀，和你一起成为更好的工程师。
      </>
    ),
    tag: 'Growing',
  },
];

function Feature({ Svg, title, description, tag }) {
  return (
    <div className={clsx('col col--4')}>
      <div className={styles.featureCard}>
        <div className={styles.featureCardInner}>
          {/* 图标 */}
          <div className={styles.featureIconWrap}>
            <Svg className={styles.featureSvg} role="img" />
          </div>

          {/* 技术标签 */}
          <span className={styles.featureTag}>{tag}</span>

          {/* 标题 */}
          <Heading as="h3" className={styles.featureTitle}>{title}</Heading>

          {/* 描述 */}
          <p className={styles.featureDesc}>{description}</p>
        </div>

        {/* 悬停光晕 */}
        <div className={styles.featureGlow} />
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      {/* 区块标题 */}
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTag}>WHY THIS SITE</span>
        <h2 className={styles.sectionTitle}>我在这里分享什么</h2>
        <p className={styles.sectionSub}>技术笔记 · 项目经验 · 工具推荐，记录成为工程师的每一步</p>
      </div>

      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}