---
title: 将已存在的git仓库移动到新建的父仓库下
description: 我在初始化了前端和后端项目以及远程仓库后想到，在本地这两个项目就在父文件夹下，那么我当时为什么不只建立一个远程仓库？后来又想到，同一个远程仓库提交代码的话难免会产生混乱，那么有没有办法让一个新的仓库引用我那两个旧仓库呢？🤔于是问了万能的 AI 娘之后果然得出了答案，于是就有了这篇文章
slug: move-git-repos-into-parent-repo
authors: happlay
# hide_table_of_contents: false
sidebar-position: 9
---

## 还原当时情景🔄️

> 为了方便，库的名称就用仓库1，仓库2...命名了

我当时具有两个本地仓库仓库1，仓库2，并且都已经连接到了远程仓库。

由于在与 AI 讨论下一步开发规划的时候，我引用的是我两个仓库的父文件夹，所以 AI 提供的下一步规划中包含了我父文件夹的 README.md 等的内容。

由于本人具有一点点强迫症😶‍🌫️以及有亿点懒，综合考虑之下，AI 说什么就是什么吧，因此我就考虑该如何不重复提交很多代码的情况下创建一个父仓库

> 如果是直接创建一个父仓库并连接远程的话那就简单多了，但是我之前单独创建的那两个仓库有什么意义呢？

## AI 娘神力

OK，遇事不决，AI 神力。我直接把疑问甩给了 AI，不得不说，确实好使，还有多种方案。这里我就直接仍方案对比了昂，毕竟每个方案的字数也不少（ AI 可是不会省 TOKEN 的😶）

| 方案             | 保持独立 | 保留历史 | 克隆难度 | 适合场景         |
| ---------------- | -------- | -------- | -------- | ---------------- |
| **A. Submodule** | ✅       | ✅       | ⭐⭐     | 团队各自维护     |
| **B. Subtree**   | ❌       | ✅       | ⭐       | 一个仓库管理所有 |
| **C. 直接复制**  | ❌       | ❌       | ⭐       | 历史不重要       |

然后鉴于我既要有要的想法，那当然是选择 A 方案喽

## 解决方案

> 现在的场景有个关键点：仓库1 和 仓库2 已经是完整的 git 仓库了，直接把它们作为 submodule 加进来，需要先把它们"挪出去"再添加

### 创建父仓库

登录你自己的 github ，然后创建一个父仓库，**注意，不要勾选 "Add a README file" 和 ".gitignore"（保持空仓库）**
，然后记住你的这个远程仓库的地址

```
https://github.com/你的用户名/父仓库.git
```

### 本地操作流程

1. 进入父目录，初始化 git `git init`

2. 将两个子仓库移动出去，**因为 git submodule add 要求目标目录不存在或为空**，最后父目录为空即可

3. 添加两个子仓库为 submodule

   > 用远程仓库的 URL（不是本地路径），这样别人克隆时才能拉到代码

   ```bash
   git submodule add https://github.com/你的用户名/仓库1.git 仓库1
   git submodule add https://github.com/你的用户名/仓库2.git 仓库2
   ```

   执行后：
   - 会从远程仓库拉取代码到本地对应目录

   - 生成 .gitmodules 文件（记录两个子模块的 URL）

   - 生成 .git/modules/ 目录（存 submodule 的元数据）

4. 提交父仓库

   ```bash
   git add .
   git commit -m "初始化：引入前端和后端两个 submodule"
   ```

5. 关联父仓库的远程地址并推送

   ```bash
   git remote add origin https://github.com/你的用户名/父仓库.git
   git branch -M main
   git push -u origin main
   ```

6. 删除之前移出去的两个旧目录

最终结构

```
父仓库/                          ← 父仓库
├── .git/
├── .gitmodules                 ← 记录两个 submodule 的 URL
├── .git/modules/               ← submodule 的元数据
├── 仓库1/              ← 指向 仓库1 仓库的某个 commit
│   └── .git                    ← 这是个文件，不是目录，内容指向 .git/modules
└── 仓库2/             ← 指向 仓库2 仓库的某个 commit
    └── .git
```

OK，到这里我们的目的就算达到了，拥有了一个引用连接到两个子仓库的父仓库，非常完美............吗？

其实不然，目前只是可以引用了，但是子仓库要是更新呢？询问 AI 娘之后的结果是，如果子仓库更新，需要手动去更新父仓库才可以。🤡🤡

何意味？合着我给自己加了个麻烦？不可能，绝对不可能[无图，先欠着🌐]

### 父仓库代码自动提交

1. 父仓库配置接收通知的 Actions

   在本地父仓库的根目录下创建 `.github/workflows/update-submodule.yml` 文件

   ```yaml
   name: Update Submodule Reference

   on:
   # 接收来自子仓库的通知
   repository_dispatch:
      types: [frontend-updated, backend-updated]
   # 也支持手动触发
   workflow_dispatch:

   jobs:
   update-submodule:
      runs-on: ubuntu-latest
      steps:
         - name: Checkout parent repo
         uses: actions/checkout@v4
         with:
            token: ${{ secrets.PARENT_REPO_TOKEN }}
            submodules: recursive
            fetch-depth: 0

         - name: Update submodules to latest
         run: |
            git submodule update --remote --merge

         - name: Commit and push if changed
         run: |
            git config user.name "github-actions[bot]"
            git config user.email "github-actions[bot]@users.noreply.github.com"
            git add .
            if git diff --staged --quiet; then
               echo "No changes to commit"
            else
               git commit -m "chore: 自动更新子模块引用"
               git push
            fi
   ```

   - repository_dispatch：监听子仓库发来的自定义事件

   - submodules: recursive：checkout 时拉取所有子模块

   - git submodule update --remote --merge：把子模块更新到最新 commit

   - 用 secrets.PARENT_REPO_TOKEN：因为要 push 回父仓库，需要 Personal Access Token（PAT），而不是默认的 GITHUB_TOKEN（默认 token 无法触发下游 workflow）

2. 生成 Personal Access Token（PAT）
   - 登录 GitHub → 右上角头像 → Settings

   - 左侧底部 → Developer settings

   - Personal access tokens → Generate new token （class）

   - 勾选权限：
     - ✅ repo（完整仓库权限）

     - ✅ workflow（如果需要触发其他 workflow）

     > 有效期我选的是永久，省的再续时间了，毕竟是我个人用，没必要搞得太复杂

   - 生成后立刻复制（只显示一次）

   - 回到父仓库 QLink → Settings → Secrets and variables → Actions

   - 新建 Secret：名字 PARENT_REPO_TOKEN，值粘贴刚才的 token （这里选地下那个 `Repository secrets` 去创建新的 `Secret`）

3. 子仓库配置触发通知的 Actions

   以仓库1为例，同样在根目录下创建 `.github/workflows/update-submodule.yml` 文件

   ```yaml
   name: Notify Parent Repo

   on:
   push:
      branches:
         - main    # 改成你子仓库的默认分支（master 或 main）

   jobs:
   notify:
      runs-on: ubuntu-latest
      steps:
         - name: Trigger parent repo update
         uses: peter-evans/repository-dispatch@v3
         with:
            token: ${{ secrets.PARENT_REPO_TOKEN }}
            repository: 用户名/父仓库名
            event-type: frontend-updated
   ```

   仓库二只需替换 `event-type` 为父仓库 `yaml` 文件中 `repository_dispatch` 里对应的名字即可

4. 给子仓库也配置 Token

   以仓库1为例

   进入 qlink-frontend 仓库 → Settings → Secrets and variables → Actions → New repository secret：
   - Name: PARENT_REPO_TOKEN

   - Value: 粘贴刚才生成的那个 PAT

> 以上的部分内容为我直接CV AI 的结果，因为我懒，不要喷写的像 AI🫡，因为它就是 AI 写的😋

OK了，老铁们。本篇文章应该就到此为止了，毕竟我滴任务完成啦💥。其实后面还可以搞搞脚本的优化，像是父仓库能显示具体的子仓库提交了什么代码？如果自动化流程错误的话邮件通知？

如果大家有更好的想法欢迎联系我，我会找机会去实践的，祝看到这的，没看到这的小伙伴们都天天开心😎
