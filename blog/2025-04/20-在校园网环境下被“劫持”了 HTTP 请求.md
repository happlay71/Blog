---
title: 在校园网环境下被“劫持”了 HTTP 请求
description: 本篇文章主要探讨校园网环境下如何被“劫持”了 HTTP 请求及解决方案
slug: 在校园网环境下被“劫持”了 HTTP 请求
authors: happlay
# hide_table_of_contents: false
sidebar-position: 6
---

> 本篇文章的起因是本人偶然在连接校园网的情况下去访问自己的网站，结果发现自己的域名访问到的竟然不是自己的网站，我的第一个反应是 _我不会这么惨吧，建好的网站这么快就被攻击了 T_T_ ， 但是经过我机智的大脑思考以及 AI 的辅助答疑，本人迅速发现了槽点，那就是 _您的校园网正在“攻击”您的网站_

## 问题产生原因

正如前言所说，表面上是由于校园网“劫持”了 `HTTP` 请求，但是问题又来了，我的网站已经是 `HTTPS` 请求了，为什么还是被“劫持”呢，所以我去研究了一下校园网“劫持”的原理

- 🌐 `HTTP` 请求被篡改

  如果你的网站是 `HTTP`（非加密），校园网的网关设备可以：

  - 拦截你的 `HTTP` 请求
  - 在返回数据中插入广告、弹窗、脚本等
  - 直接跳转到别的网站
    > 因为 `HTTP` 的数据是明文传输的，任何经过的节点都能看到并修改内容。

- 🧩 DNS 劫持（域名劫持）

  即使你的网站是 `HTTPS`，如果使用的是校园网提供的 DNS，它可能会：

  - 把你请求的域名（如 `my.com`）解析到 -错误的 `IP` 地址

  - 使你访问的是一个伪造的网站或网关页面，而-不是你的真实服务器

  - `DNS` 查询时没有加密（除非你启用了 `DNS over HTTPS`），所以容易被篡改。

- 🛑 中间人攻击（MITM）
  部分高校使用“透明代理”或伪造 `CA` 证书的手段：

  - 伪造你网站的 `HTTPS` 证书

  - 让浏览器访问的是一个看起来正常但实际上被监控/篡改的站点

  - 这种情况会出现“证书不受信任”、“连接不安全”的提示。（本人遇到的可能就是这个情况）

综上所述，这些都是可能被“劫持”的原因，这毕竟是校园网嘛，有点流量统计、监控数据之类的操作都可以理解。但是！！不能让在学校里使用校园网的渴望知识的大学生无法访问网站从而学不到知识吧 🤔😏，所以我又去研究了一些防“劫持”的方案

## 防止被校园网“劫持”的方案

### 访问他人网站

如果你是一只渴望获取知识的大学生，以下有两个方法可以防止劫持：

- `VPN` 或代理：使用加密隧道来绕过校园网络的劫持。

- 更换网络：既然被校园网劫持了那就不走校园网不就好了 😎

### 自己的网站

如果你是希望分享知识的技术博主，下面是我尝试的解决方案：

- 强制 `HTTP` 跳转到 `HTTPS`：由于某些原因，本人之前配置的跳转方法好像不太成功，导致可以被劫持，现在重新配置了一下

  > 这个方案我尝试之后发现仍然无法解决被劫持问题，仍需寻找其他方案

  ```conf
  # HTTP转HTTPS
  server {
      listen       80;
      server_name 你的域名;
      return 301 https://$host$request_uri; # http跳转https
  }

  # HTTPS服务
  server {
      listen 443 ssl;
      server_name 你的域名;
      default_type 'text/html';
      charset utf-8;

      #---------------- 本人是通过 certd 自动部署的证书，有兴趣的可以去了解 -------------
      # SSL证书配置
      ssl_certificate /etc/letsencrypt_certd/happlay.crt;          # 指定SSL证书文件路径
      ssl_certificate_key /etc/letsencrypt_certd/key/cert.key;     # 指定SSL私钥文件路径

      # SSL会话设置
      ssl_session_timeout 5m;                                      # SSL会话缓存超时时间为5分钟

      # 协议与加密套件配置
      ssl_protocols TLSv1 TLSv1.1 TLSv1.2;                         # 启用TLS 1.0/1.1/1.2协议（注：建议禁用TLSv1和TLSv1.1以提高安全性）
      ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:HIGH:!aNULL:!MD5:!RC4:!DHE;  # 指定加密套件，优先使用前向保密(ECDHE)和强加密算法
      ssl_prefer_server_ciphers on;                                # 优先使用服务端定义的加密套件顺序

      location / {
          root   /usr/share/nginx/html/build;
          index  index.html index.htm;
          try_files $uri $uri/ /index.html;
      }
  }

  ```

- 启用 `HSTS`：告诉浏览器以后只通过 `HTTPS` 访问，防止下一次用 `HTTP` 被劫持。（但是这种方法仍然无法解决在校园网的环境下正常访问对应网站，有兴趣的可以自行研究，此处就不给对应配置了）

- 使用 `Cloudflare` 作为反向代理 🌐：

  `Cloudflare` 提供了免费的反向代理服务，能有效避免 DNS 劫持问题。通过 `Cloudflare` 代理流量，你的流量将经过其加密网络，并且 DNS 查询也会被加密。

  配置步骤：
  注册并配置你的域名在 `Cloudflare`。

  在 `Cloudflare` 设置里启用 `DNS over HTTPS（DoH）`和 自动 `HTTPS` 重定向。

  将你的网站 DNS 指向 `Cloudflare` 提供的 IP，它会代替你的原始 `DNS` 解析，确保安全。

  然后把你的域名以类型为 `A` ，内容为 `IP` 地址解析到 `Cloudflare` 的 `DNS` 记录中

  > 注：如果再次访问网站显示重定向次数过多，是由于 `nginx` 中配置了 `return 301 https://$host$request_uri;` 这条语句。解决办法是： `Cloudflare` 控制台 -> 进入你的站点 -> 点击左侧菜单栏「SSL/TLS」 -> 「Overview（概览）」页面 -> 把 SSL 模式设置为 `Full` 或 `Full (Strict)`

好了，到目前为止可以恭喜你了 🎇，不论是访问他人网站还是作为自己的网站，现在校园网已经“劫持”不到你了，你可以畅快的享受知识了！😏
