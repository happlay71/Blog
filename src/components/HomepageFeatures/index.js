import React from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading'; // Docusaurus 提供的标题组件
import styles from './styles.module.css'; // 引入模块化样式

// Feature 列表数据，每个对象表示一个功能展示卡片
const FeatureList = [
  {
    title: '专注技术成长',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default, // SVG 图标路径
    description: (
      <>
        分享 Java、Spring Boot、前端、后端等学习笔记，记录技术成长之路。
      </>
    ),
  },
  {
    title: '实战项目经验',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        展示真实项目案例与实战经验，帮你提升编程思维与落地能力。
      </>
    ),
  },
  {
    title: '持续更新维护',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        网站内容保持持续更新，记录我的开发日常和技术沉淀。
      </>
    ),
  },
];

// 单个 Feature 组件，渲染一个卡片
function Feature({ Svg, title, description }) {
  return (
    <div className={clsx('col col--4')}>
      <div className={styles.featureCard}> {/* 添加样式包裹卡片整体 */}
        {/* 图标区域 */}
        <div className="text--center">
          <Svg className={styles.featureSvg} role="img" />
        </div>

        {/* 标题和描述 */}
        <div className="text--center padding-horiz--md">
          <Heading as="h3">{title}</Heading>
          <p>{description}</p>
        </div>
      </div>
    </div>
  );
}

// 整个 Feature 区块的导出组件
export default function HomepageFeatures() {
  return (
    // 包裹整个 Features 区域，样式用于设置背景/间距等
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {/* 遍历 FeatureList 渲染多个卡片 */}
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
