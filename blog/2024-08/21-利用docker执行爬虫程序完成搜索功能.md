---
title: 利用docker执行爬虫程序完成搜索功能
description: 一篇拥有搜索功能的网站可以有效优化用户的使用体验(本文使用的是创建docker容器爬取本地内容的方式，未尝试新版的DocSearch)
slug: 利用docker执行爬虫程序完成搜索功能
authors: happlay
# hide_table_of_contents: false
sidebar-position: 5
---

## 前提

- 网站由Docusaurus创建
- 注册了Algolia账户（本文使用Github登录）
- 创建过数据源

## algolia数据源里创建索引

准备好的数据源中

![](https://happlay-docs.oss-cn-beijing.aliyuncs.com/docs/Snipaste_2024-07-28_13-49-39.png)

## 配置algolia

配置`docusaurus.config.js`
```js

themeConfig: {
        // ...
    algolia: {
      apiKey: "Admin API Key",
      indexName: "刚才创建索引的 name，不是数据源的 name",
      appId: "Application ID",
    },
}

```

上述三个配置的查询位置

![](https://happlay-docs.oss-cn-beijing.aliyuncs.com/docs/Snipaste_2024-07-28_13-30-18.png)

![](https://happlay-docs.oss-cn-beijing.aliyuncs.com/docs/Snipaste_2024-07-28_13-32-08.png)

**注意**：key应具有相应的权限，建议使用`Admin API Key`

这时就能看到博客的右上角出现了熟悉的搜索框了

![](https://happlay-docs.oss-cn-beijing.aliyuncs.com/docs/Snipaste_2024-07-28_13-52-39.png)

接下来我们继续实现它的搜索功能

## Docker 爬取本地内容推送到 Algolia

### 安装`jq`

在服务器中安装`jq`用来解析`json`文件

```bash
# 系统：Centos7

yum install -y epel-release && yum install -y jq

```
### 完成配置文件

在项目根目录下创建`.env`，`docsearch.json`

`.env`-存放环境变量

```
ALGOLIA_APP_ID=xxx
ALGOLIA_API_KEY=xxx
```

`docsearch.json`

```json
{
  // 修改部分
  "index_name": "对应上config文件里面的indexName，也是创建的索引名",
  "start_urls": ["https://xxx.xxx/"], // 自己的域名网站地址
  // 更换自己的域名地址，Docusaurus 官方会有配置生成 sitemap.xml 的方式
  "sitemap_urls": ["https://xxx.xxx/sitemap.xml"],
  // end
  "stop_urls": ["/search"], // 排除不需要爬取页面的路由地址
  "selectors": {
    "lvl0": {
      "selector": "(//ul[contains(@class,'menu__list')]//a[contains(@class, 'menu__link menu__link--sublist menu__link--active')]/text() | //nav[contains(@class, 'navbar')]//a[contains(@class, 'navbar__link--active')]/text())[last()]",
      "type": "xpath",
      "global": true,
      "default_value": "Documentation"
    },
    "lvl1": "header h1, article h1",
    "lvl2": "article h2",
    "lvl3": "article h3",
    "lvl4": "article h4",
    "lvl5": "article h5, article td:first-child",
    "lvl6": "article h6",
    "text": "article p, article li, article td:last-child"
  },
  "custom_settings": {
    "attributesForFaceting": [
      "type",
      "lang",
      "language",
      "version",
      "docusaurus_tag"
    ],
    "attributesToRetrieve": [
      "hierarchy",
      "content",
      "anchor",
      "url",
      "url_without_anchor",
      "type"
    ],
    "attributesToHighlight": ["hierarchy", "content"],
    "attributesToSnippet": ["content:10"],
    "camelCaseAttributes": ["hierarchy", "content"],
    "searchableAttributes": [
      "unordered(hierarchy.lvl0)",
      "unordered(hierarchy.lvl1)",
      "unordered(hierarchy.lvl2)",
      "unordered(hierarchy.lvl3)",
      "unordered(hierarchy.lvl4)",
      "unordered(hierarchy.lvl5)",
      "unordered(hierarchy.lvl6)",
      "content"
    ],
    "distinct": true,
    "attributeForDistinct": "url",
    "customRanking": [
      "desc(weight.pageRank)",
      "desc(weight.level)",
      "asc(weight.position)"
    ],
    "ranking": [
      "words",
      "filters",
      "typo",
      "attribute",
      "proximity",
      "exact",
      "custom"
    ],
    "highlightPreTag": "<span class='algolia-docsearch-suggestion--highlight'>",
    "highlightPostTag": "</span>",
    "minWordSizefor1Typo": 3,
    "minWordSizefor2Typos": 7,
    "allowTyposOnNumericTokens": false,
    "minProximity": 1,
    "ignorePlurals": true,
    "advancedSyntax": true,
    "attributeCriteriaComputedByMinProximity": true,
    "removeWordsIfNoResults": "allOptional",
    "separatorsToIndex": "_",
    "synonyms": [
      ["js", "javascript"],
      ["ts", "typescript"]
    ]
  }
}
```

### 服务器配置

在服务器创建固定位置存放`.env` 和 `docsearch.json` 文件

打开该文件，执行
```bash
docker run -it --network 网络名称 --env-file=.env -e "CONFIG=$(cat docsearch.json | jq -r tostring)" algolia/docsearch-scraper
```

服务器出现`> DocSearch: https://……`时说明正在推送本地爬取的内容到`algolia`

## 利用GitHub实现自动化部署

在项目的根目录下找到`.github/workflows/docsearch.yml`文件（没有则创建一个）

```
name: docsearch

on:
  push:
    branches:
      - main
jobs:
  algolia:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Get the content of docsearch.json as config
        id: algolia_config
        run: echo "::set-output name=config::$(cat docsearch.json | jq -r tostring)"

      - name: Run algolia/docsearch-scraper image
        env:
          ALGOLIA_APP_ID: ${{ secrets.ALGOLIA_APP_ID }}
          ALGOLIA_API_KEY: ${{ secrets.ALGOLIA_API_KEY }}
          CONFIG: ${{ steps.algolia_config.outputs.config }}
        run: |
          docker run \
            --env APPLICATION_ID=${ALGOLIA_APP_ID} \
            --env API_KEY=${ALGOLIA_API_KEY} \
            --env "CONFIG=${CONFIG}" \
            algolia/docsearch-scraper
```

可更改`github action`触发条件：

- `push`到`main`分支触发：
  ```
  on:
    push:
      branches:
        - master
  ```

- 发布成功后触发：

  ```
  on: deployment
  ```

- 定时触发：

  ```
  on: deployment
  ```

- 手动触发：

  ```
  on: deployment
  ```


## 问题&解决方案

1. 执行拉取`algolia/docsearch-scraper`命令时超时

- 可尝试在虚拟机中安装`clash`---未尝试

- 可从[`github`](https://github.com/algolia/docsearch-scraper)网站中获取压缩包，然后解压，构建镜像

- `cloudflare`注册部署:

  `Cloudflare`是一个全球性的云平台，它为世界各地的各种规模的企业提供广泛的网络服务，从而使企业更加安全，同时提高其关键互联网资产的性能和可靠性。

  1. 在[官网](https://dash.cloudflare.com/)注册用户

  2. 在自己的`github`中`fork` [` CF-Workers-docker.io`](https://github.com/happlay71/CF-Workers-docker.io)项目

  3. 进入`CF`官网按照一下步骤执行

  ![](https://happlay-docs.oss-cn-beijing.aliyuncs.com/docs/Snipaste_2024-08-21_13-29-22.png)

  ![](https://happlay-docs.oss-cn-beijing.aliyuncs.com/docs/Snipaste_2024-08-21_13-33-23.png)

  按照流程默认创建即可。

  后续可能需要自备域名、构建站点等操作，未实现……

- 使用他人构建好的站点：

  (目前可用)
  ```
  Docker 镜像站1：docker.888666222.xyz
  Docker 镜像站2：docker.1panel.live
  ```
