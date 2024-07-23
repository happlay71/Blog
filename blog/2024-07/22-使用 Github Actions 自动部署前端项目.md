---
title: 使用 Github Actions 自动部署前端项目
description: 这篇文章记录的是我使用Github Actions 自动部署前端项目的流程以及一些理解
slug: 使用 Github Actions 自动部署前端项目
authors: happlay
hide_table_of_contents: false
sidebar-position: 4
---

## 创建工作流
点击项目仓库中的 Actions 选项

![](https:\\happlay-docs.oss-cn-beijing.aliyuncs.com/docs/Snipaste_2024-07-22_11-57-48.png)

可以选择set up a workflow yourself创建一个新的工作流然后直接提交空文件，或者在下方选择一个模板 点击start commit，这两种方式都会在项目目录下会新建.github/workflow/main.yml文件

## 修改配置文件
更新本地代码，将远程仓库中的代码拉取下来，在本地修改mian.yml配置文件

```yml
name: Auto Deploy
on:
  push:
    branches:
      - main  # 保持 main 分支作为触发条件

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v2  # 检出代码仓库

      - name: Setup Node.js  
        uses: actions/setup-node@v2  # 设置 Node.js 环境
        with:
          node-version: '20.9.0'  # 更新为你需要的 Node.js 版本

      - name: Install dependencies
        run: npm install  # 使用 npm 安装依赖（根据自身情况修改）

      - name: Build project
        run: npm run build  # 使用 npm 执行构建命令

      - name: Deploy to Aliyun
        uses: easingthemes/ssh-deploy@v4.1.10  # 通过 SSH 部署项目到阿里云
        with:
          SSH_PRIVATE_KEY: ${{ secrets.SERVER_SSH_KEY }}
          REMOTE_HOST: ${{ secrets.USER_HOST }}
          REMOTE_USER: ${{ secrets.USER_NAME }}  # 通常阿里云 CentOS 7 默认用户是 root
          SOURCE: "build/"   # 确保这是你的构建输出目录
          ARGS: "-rltgoDzvO --delete"
          TARGET: /nginx/html/build  # 修改为你想要部署到服务器上的路径
```

接下来在项目仓库中配置设置密钥

## 配置密钥
在服务器配置密钥
在服务器当前用户目录下，输入

`ssh-keygen -m PEM -t rsa -b 4096`

生成密钥文件，然后连续按下两次回车

这时候，就在用户目录下的`.ssh`文件夹中生成了私钥文件`id_dsa`、公钥文件`id_dsa.pub`，根据公钥文件生成`authorized_keys`，并给以上三个文件分别设置权限

```bash
cat id_rsa.pub >> authorized_keys
chmod 600 id_rsa
chmod 600 id_rsa.pub
chmod 600 authorized_keys
```

这样，服务器端就设置完成了

在Github仓库配置密钥
在Settings下的Secrets and variables中的Actions中添加仓库密钥

![](https:\\happlay-docs.oss-cn-beijing.aliyuncs.com/docs/Snipaste_2024-07-23_17-29-13.png)

在服务器中`cat`密钥，将所有内容复制到新的`Repository secrets`中，并填入服务器IP到 `USER_HOST`，填入服务器用户到`USER_NAME`

查看私钥

`cat id_rsa`

配置完成效果

![](https:\\happlay-docs.oss-cn-beijing.aliyuncs.com/docs/Snipaste_2024-07-23_19-54-10.png)

提交代码
将代码提交后，会自动触发工作流，可以在`Ations`界面看工作流工作状况



出现绿色的对号就是运行成功了，现在服务器上文件应该已经更新了

## 注意
打包部署前端的时候，如果文件夹名字有大写，可能会出现找不到文件的情况 原因是 Git 默认是不区分大小写的，可以使用下面的代码进行更改

### 获取当前项目大小写是否忽略

```bash
git config --get core.ignorecase

git config core.ignorecase # 可以用core 核心 ignore 忽略 case 大小写来记忆

true  # 忽略大小写
```

### 关闭大小写忽略

`git config core.ignorecase false`

## 参考文章
[使用 Github Actions 自动部署前端](https://kbws.xyz/blog/use-githubactions-to-deploy/)