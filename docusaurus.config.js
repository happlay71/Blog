// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import {themes as prismThemes} from 'prism-react-renderer';


const beian = '冀ICP备2024076959号-1'

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Web',
  tagline: 'Dinosaurs are cool',
  favicon: 'img/favicon/favicon.ico',

  // Set the production url of your site here
  // url: 'https://your-docusaurus-site.example.com',
  url: 'https://happlay.online',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'facebook', // Usually your GitHub org/user name.
  projectName: 'docusaurus', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      // 'classic',
      '@docusaurus/preset-classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          breadcrumbs: true,  // 收起显示页面的导航
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          // editUrl:
          //   'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        blog: {
          showReadingTime: true,
          blogSidebarTitle: '所有博客',
          blogSidebarCount: 'ALL',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          // editUrl:
          //   'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      // image: 'img/docusaurus-social-card.jpg',
      navbar: {
        // title: '',
        logo: {
          alt: 'Logo',
          src: 'img/logo/logo.png',
        },
        items: [
          {
            label: '首页',
            position: 'right',
            to: '/'
          },
          {to: '/blog', label: '博客', position: 'right'},
          {
            type: 'docSidebar',
            sidebarId: 'docs',
            position: 'right',
            label: '笔记',
            customProps: {
              badges: ['new', 'green'],
              featured: true,  // 底部
            },
          },
          {
            href: 'https://github.com/happlay71',
            label: 'GitHub',
            alt: 'github',
            position: 'right',
            src: 'img/github/github.png'
          },
        ],
      },
      docs: {
        sidebar: {
          autoCollapseCategories: true,  // 自动收起多余打开的文件夹
          hideable: true,  // 隐藏侧边栏
        },
      },
      footer: {
        style: 'dark',
        links: [
          
          // {
          //   title: 'Community',
          //   items: [
          //     {
          //       label: 'Stack Overflow',
          //       href: 'https://stackoverflow.com/questions/tagged/docusaurus',
          //     },
          //     {
          //       label: 'Discord',
          //       href: 'https://discordapp.com/invite/docusaurus',
          //     },
          //     {
          //       label: 'Twitter',
          //       href: 'https://twitter.com/docusaurus',
          //     },
          //   ],
          // },
          {
            title: '学习',
            items: [
              {
                label: '笔记',
                to: '/docs/welcome',
              },
              {
                label: '博客',
                to: '/blog',
              },
            ],
          },
          {
            title: '社交',
            items: [
              {
                label: 'GitHub',
                // src: 'img/github/github.png',
                href: 'https://github.com/happlay71',
              },
            ],
          },
        ],
        copyright: `
        <p style="margin-bottom: 0;"><a href="http://beian.miit.gov.cn/">${beian}</a></p>
        <p>Copyright © ${new Date().getFullYear()} - MADE BY Happlay71, Built with Docusaurus.</p>
        `,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

export default config;
