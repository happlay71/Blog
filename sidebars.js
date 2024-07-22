/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {

  docs: [
    {
      type: 'autogenerated', 
      dirName: '.',
    },

    
    // {
    //   type: 'category',
    //   label: '教程',
    //   link: {
    //     type: 'generated-index',
    //     title: 'Docusaurus 教程',
    //     description: '学习最重要的 Docusaurus 概念!',
    //     slug: '/category/docusaurus-guides',
    //     keywords: ['guides'],
    //     image: '/img/docusaurus.png',
    //   },
    //   items: ['pages', 'docs', 'blog', 'search'],
    // },
  ],
  // By default, Docusaurus generates a sidebar from the docs folder structure
  // tutorialSidebar: [
  //   {
  //     type: 'autogenerated', dirName: '.'
  //   },
  // ],

  // But you can create a sidebar manually

  // tutorialSidebar: [
  //   'intro',
  //   'hello',
  //   {
  //     type: 'category',
  //     label: 'Tutorial',
  //     items: ['tutorial-basics/create-a-document'],
  //   },
  // ],
  // blog: [
  //   {
  //     type: 'autogenerated', 
  //     dirName: '.',
  //   },
  // ],
};

// /** @type {import('@docusaurus/plugin-content-blog').BlogSidebarItem} */
// const blogSidebar = {
//   blog = [

//   ],
// };

export default sidebars;
