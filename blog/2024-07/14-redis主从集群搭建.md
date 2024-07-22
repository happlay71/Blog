---
title: redis主从集群搭建
description: 搭建主从集群的时候redis-server 7001/redis.conf执行这个命令后没反应
slug: redis主从集群搭建
authors: happlay
hide_table_of_contents: false
sidebar-position: 4
---

## 遇到情况
```bash
redis-cli -p 7002 -a 密码

127.0.0.1:7002> REPLICAOF 192.168.88.130 7001
OK
127.0.0.1:7001> info replication
# Replication
role:slave
master_host:主机IP
master_port:7001
master_link_status:down  # 此处应为up 
…………


redis-cli -p 7001 -a 

127.0.0.1:7001> info replication
# Replication
role:master
connected_slaves:0  ## 此处为0
```

## 原因

1）主机设置了密码，那么我们需要在从机里面写上你主机的密码
所以我们的redis7002.conf 和 redis7003.conf 文件的内容应该如下：

7002
```redis.conf
replicaof 127.0.0.1 7001
masterauth *****
```
7003同理

参数解析：
replicaof 表明自己是从机，他的主机的ip地址是127.0.0.1（本机），端口号是7001。
masterauth是主机的密码。

解决问题二、也许你的系统防火墙并没有开放主机的端口。这里我们要把6379端口号打开。

```bash
firewall-cmd --permanent --add-port=7001/tcp
firewall-cmd --reload
```


`REPLICAOF NO ONE`：当使用 REPLICAOF NO ONE 命令时，当前 Redis 服务器将停止与主服务器的数据同步，不再充当任何主服务器的从节点

```bash
redis-cli -p 7002 -a 密码


127.0.0.1:7002>REPLICAOF NO ONE  # 用于停止当前 Redis 服务器作为任何主服务器的复制节点
127.0.0.1:7002> REPLICAOF 192.168.88.130 7001
OK
127.0.0.1:7001> info replication
# Replication
role:slave
master_host:主机IP
master_port:7001
master_link_status:up
…………


redis-cli -p 7001 -a 

127.0.0.1:7001> info replication
# Replication
role:master
connected_slaves:1
```