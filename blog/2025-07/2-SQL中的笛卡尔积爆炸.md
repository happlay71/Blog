---
title: SQL 中的笛卡尔积爆炸💥
description: 在工作中翻看“前人遗产”，第一次看到了800多行的 sql 语句，大为震惊，好奇的问同事，得知这居然只是小 sql 😂。然后同事跟我说多表查询的事，重点要小心笛卡尔积爆炸，好，又是一个新概念，所以我带着好奇的心来了解一下
slug: SQL 中的笛卡尔积爆炸💥
authors: happlay
# hide_table_of_contents: false
sidebar-position: 7
---

## 笛卡尔积

首先，要了解笛卡尔积爆炸就得先了解什么是笛卡尔积

笛卡尔积就是把一个表中的每条数据都和另一个表中的每条数据组合，形成一个新的表

```
y
↑
|    (a1,b3)    (a2,b3)    (a3,b3)
|    ●──────────●──────────●
|    |          |          |
|    |          |          |
|    |          |          |
|    ●──────────●──────────●
|    (a1,b2)    (a2,b2)    (a3,b2)
|    |          |          |
|    |          |          |
|    |          |          |
|    ●──────────●──────────●
|    (a1,b1)    (a2,b1)    (a3,b1)
+──────────────────────────────────→ x
```

> 好了现在你知道笛卡尔积了，来写个 800 多行的多表查询吧（ bush

## sql 中实现笛卡尔积

如果想在 `SQL` 中实现笛卡尔积，其实很简单

使用 `INNER JOIN` 就可以把两张表联合起来

```sql
SELECT *
FROM A
INNER JOIN B
```

这是最简单的方式，不加任何的连接条件。但一般进行多表查询肯定不会是单纯的连接起来，一定会有几个连接条件来查询想要的数据

```sql
SELECT *
FROM A
INNER JOIN B
ON A.NAME = B.NAME
WHERE .....
```

## 笛卡尔积爆炸

名字已经显而易见了，所谓笛卡尔积爆炸就是多个表连接时产生了巨量的数据，导致数据“撑爆”内存，降低查询效率甚至引起服务器宕机

### 怎么产生的

> 都是网上摘抄总结的，欢迎补充

1. 多表查询时，缺少连接条件

   ```sql
   -- 错误写法：缺少ON条件，产生笛卡尔积
   SELECT * FROM table1 JOIN table2;
   -- 等价于
   SELECT * FROM table1, table2;
   ```

2. 连接条件不完整

   当多表连接时，缺少部分表的连接条件：

   ```sql
   -- 三表连接但只指定了两个表的条件
    SELECT *
    FROM A
    JOIN B ON A.id = B.a_id
    JOIN C;  -- 缺少与A或B的连接条件
   ```

3. 多对多关系处理不当

   当两个表之间存在多对多关系且中间表连接条件不完整时：

   ```sql
   -- 假设A和C是多对多关系，通过B作为关联表
   SELECT *
   FROM A
   JOIN B ON A.id = B.a_id  -- 正确
   JOIN C ON B.c_id = C.id  -- 正确
   JOIN D;                  -- 忘记连接D的条件
   ```

### 如何解决

1. 始终明确指定连接条件

   ```sql
   SELECT \* FROM table1 JOIN table2 ON table1.id = table2.t1_id
   ```

2. 使用显式 JOIN 语法

   - 优先使用 INNER JOIN/LEFT JOIN 等明确语法

   - 避免使用隐式连接(逗号分隔)

3. 检查多表连接

   - 确保每个额外连接的表都有明确的连接条件

   - 使用表别名提高可读性

4. 使用 EXISTS 代替 JOIN

   当只需要检查存在性时：

   ```sql
   SELECT \* FROM A
   WHERE EXISTS (SELECT 1 FROM B WHERE B.a_id = A.id)
   ```

5. 限制结果集大小

   ```sql
   SELECT \* FROM table1 JOIN table2 ON ... LIMIT 1000
   ```

## 总结

本文只是我对于笛卡尔积爆炸的初步了解，目前还没有遇到过，也没有实际解决的经验，属于是纸上谈兵了，祝看到这里的网友遇不到笛卡尔积爆炸 😎
