---
title: RAG 中的 SQL 为什么是 PgSQL
description: 在学习RAG的时候突发奇想，我跟着做的项目中使用的是pgsql而不是mysql，所以为了弄清为什么是pgsql才有了这篇文章
slug: rag-sql-why-pgsql
authors: happlay
# hide_table_of_contents: false
sidebar-position: 8
---

## RAG 是什么？

RAG 的官方定义是 **Retrieval-Augmented Generation**，也就是**检索增强生成**技术。

简单来说，RAG 并不是让大语言模型直接回答所有问题，而是在用户提出问题之后，先从外部知识库中检索与问题相关的内容，然后将检索到的内容作为上下文交给大语言模型，最终生成答案。

例如：

```text
用户问题
    ↓
将问题转换为向量
    ↓
在向量数据库中进行相似度搜索
    ↓
获取相关文档
    ↓
将文档作为上下文交给大语言模型
    ↓
生成最终答案
```

假设知识库中存在以下内容：

```text
Spring Boot 是一个基于 Spring 的快速开发框架。
```

当用户提问：

```text
Spring Boot 是什么？
```

RAG 系统会先将用户的问题转换为向量，然后在知识库中寻找语义上最相似的文本。

如果检索到：

```text
Spring Boot 是一个基于 Spring 的快速开发框架。
```

那么这段文本就会作为上下文传递给大语言模型。

因此，RAG 的核心流程可以概括为：

```text
文档
  ↓
文本切分
  ↓
Embedding 模型
  ↓
生成向量
  ↓
存储向量
  ↓
用户提问
  ↓
生成问题向量
  ↓
相似度搜索
  ↓
获取相关文档
  ↓
大语言模型生成答案
```

所以，一个 RAG 系统通常需要具备以下能力：

- 文本数据存储能力
- 向量数据存储能力
- 向量相似度计算能力
- 高效的向量检索能力

这也是为什么数据库是否支持向量搜索，成为构建 RAG 系统时需要考虑的重要问题。

> 所以，RAG 需要的不一定是独立的向量数据库，但至少需要一种能够高效存储和搜索向量数据的方案。

---

## PostgreSQL 和 MySQL 的区别

在我学习的 RAG 项目中，使用的是 PostgreSQL，而不是我更加熟悉的 MySQL。

这让我产生了一个疑问：

> **为什么 RAG 项目经常使用 PostgreSQL？**

要回答这个问题，首先需要了解 PostgreSQL 和 MySQL 在向量搜索方面的能力。

---

## PostgreSQL

PostgreSQL 本身是一款功能强大的开源关系型数据库。

通过安装 `pgvector` 扩展，PostgreSQL 可以支持向量数据的存储和相似度搜索。

首先安装扩展：

```sql
CREATE EXTENSION vector;
```

然后就可以使用：

```sql
VECTOR
```

数据类型。

例如：

```sql
CREATE TABLE vector_store (
    id UUID PRIMARY KEY,
    content TEXT,
    metadata JSONB,
    embedding VECTOR(768)
);
```

这里：

```text
content
```

用于保存原始文本。

```text
metadata
```

用于保存元数据，例如：

```json
{
  "knowledge": "group-buy-market-liergou",
  "fileName": "README.md"
}
```

而：

```text
embedding
```

用于保存文本经过 Embedding 模型转换后的向量。

例如：

```text
原始文本：

Spring Boot 是一个 Java 开发框架。

        ↓

Embedding 模型

        ↓

[0.12, -0.31, 0.55, ...]
```

最终这个向量就可以保存到：

```sql
embedding VECTOR(768)
```

字段中。

这里的 `768` 代表向量的维度。

不同的 Embedding 模型，生成的向量维度可能不同。

例如：

```text
Embedding 模型
        ↓
生成 768 维向量

Embedding 模型
        ↓
生成 1536 维向量

Embedding 模型
        ↓
生成 3072 维向量
```

因此，数据库中的：

```sql
VECTOR(768)
```

必须与 Embedding 模型实际生成的向量维度保持一致。

---

## PostgreSQL 如何进行向量搜索？

假设数据库中存在以下数据：

```text
文档 A → [0.1, 0.2, 0.3]

文档 B → [0.8, 0.7, 0.6]

文档 C → [0.2, 0.3, 0.4]
```

用户的问题经过 Embedding 模型转换之后得到：

```text
查询向量 → [0.1, 0.2, 0.35]
```

接下来就可以计算查询向量与数据库中其他向量之间的距离。

例如：

```sql
SELECT *
FROM vector_store
ORDER BY embedding <=> '[0.1, 0.2, 0.35]'
LIMIT 5;
```

其中：

```text
<=>
```

可以用于计算余弦距离。

距离越小，表示两个向量越相似。

最终数据库就可以找到：

```text
与用户问题最相关的前 5 个文档
```

这就是 RAG 中的检索过程。

---

## pgvector 的索引

如果数据量比较小，直接计算每一条向量之间的距离也许没有问题。

但是，如果数据库中有：

```text
100 万条向量
```

每次查询都与所有向量进行计算，效率就会比较低。

因此，pgvector 支持使用近似最近邻搜索索引。

常见的索引包括：

```text
IVFFlat
HNSW
```

例如：

```sql
CREATE INDEX ON vector_store
USING hnsw (embedding vector_cosine_ops);
```

这样在进行向量搜索时，就可以通过索引提高搜索效率。

需要注意的是：

> 向量搜索的准确率和搜索速度之间通常需要进行权衡。

使用近似最近邻搜索时，并不一定会精确计算所有向量之间的距离，而是通过索引快速找到最可能相关的结果。

---

## MySQL 能不能存储向量？

答案是：

> **可以。**

不能简单地说：

> MySQL 不支持向量。

较新的 MySQL 版本已经提供了 `VECTOR` 数据类型和向量相关函数，可以用于存储和处理向量数据。

例如：

```sql
CREATE TABLE items (
    id BIGINT PRIMARY KEY,
    embedding VECTOR(768)
);
```

MySQL 也提供了向量距离计算相关的功能。

例如：

```text
VECTOR
    ↓
DISTANCE()
    ↓
计算两个向量之间的距离
```

因此，从理论上来说：

```text
MySQL
    +
VECTOR
```

同样可以用于构建向量搜索和 RAG 系统。

那么问题就变成了：

> **既然 MySQL 也能处理向量，为什么很多 RAG 项目仍然选择 PostgreSQL？**

---

# PostgreSQL 和 MySQL 的主要区别

## 1. PostgreSQL 的向量生态更加成熟

PostgreSQL 通过：

```text
PostgreSQL
    +
pgvector
```

可以获得完整的向量存储和检索能力。

`pgvector` 已经被大量 AI 应用和开源项目使用。

目前很多 AI 开发框架都提供了 PostgreSQL + pgvector 的支持。

例如：

```text
Spring AI
LangChain
LlamaIndex
```

在 Spring AI 中，可以直接使用：

```java
PgVectorStore
```

例如：

```java
pgVectorStore.accept(documents);
```

这行代码背后大致完成了：

```text
Document
    ↓
Embedding Model
    ↓
生成向量
    ↓
PostgreSQL
    ↓
pgvector
```

查询时：

```java
SearchRequest request =
        SearchRequest.builder()
                .query(message)
                .topK(5)
                .build();

List<Document> documents =
        pgVectorStore.similaritySearch(request);
```

开发者不需要自己实现：

```text
向量生成
向量存储
向量距离计算
向量检索
```

这些基础功能。

---

## 2. PostgreSQL 的扩展机制非常强大

PostgreSQL 的一个重要特点是：

> **可以通过扩展增加数据库能力。**

例如：

```text
PostGIS
    ↓
地理空间数据

pgvector
    ↓
向量数据

TimescaleDB
    ↓
时序数据
```

这种扩展机制使 PostgreSQL 不仅仅是一个传统的关系型数据库。

它可以根据不同的业务需求，扩展出新的数据处理能力。

对于 RAG 来说：

```text
PostgreSQL
    ↓
安装 pgvector
    ↓
支持向量搜索
```

整个过程比较自然。

---

## 3. 关系查询和向量查询可以结合

这是 PostgreSQL + pgvector 在 RAG 中非常重要的一个优势。

例如，我的知识库中存在：

```text
group-buy-market-liergou
```

这个知识库中保存了：

```text
Java 代码
Spring Boot 配置
项目文档
数据库脚本
README
```

在写入向量时，可以给每个文档添加元数据：

```json
{
  "knowledge": "group-buy-market-liergou"
}
```

查询时：

```java
SearchRequest request =
        SearchRequest.builder()
                .query(message)
                .topK(5)
                .filterExpression(
                    "knowledge == 'group-buy-market-liergou'"
                )
                .build();
```

此时系统执行的实际上是：

```text
用户问题
    ↓
向量相似度搜索
    +
知识库过滤
    ↓
返回最相关的文档
```

例如：

```text
用户问题：

项目使用了什么技术？

        ↓

只在：

group-buy-market-liergou

知识库中搜索

        ↓

返回相关文档
```

这对于多知识库 RAG 系统非常重要。

---

## 4. PostgreSQL 更容易实现混合查询

实际的 RAG 系统通常不会只进行向量搜索。

例如，一个商品知识库可能需要同时满足：

```text
语义相似
    +
商品分类
    +
价格范围
    +
库存状态
```

例如：

```text
用户：

帮我找价格低于 100 元的 Java 书籍。

```

系统可能同时需要：

```text
向量相似度
    +
category = 'Java'
    +
price < 100
```

这就是一种混合查询。

最终的逻辑可能是：

```text
关系型条件过滤
        +
向量相似度搜索
```

而 PostgreSQL 本身就是一个功能非常丰富的关系型数据库。

因此：

```text
传统 SQL 查询
        +
向量检索
```

可以在同一个数据库体系中完成。

---

# PostgreSQL 和 MySQL 的对比

| 对比项         | PostgreSQL + pgvector | MySQL                    |
| -------------- | --------------------- | ------------------------ |
| 关系型数据库   | 支持                  | 支持                     |
| 文本存储       | 支持                  | 支持                     |
| JSON 数据      | JSONB                 | JSON                     |
| 向量类型       | 通过 pgvector         | 新版本提供 VECTOR        |
| 向量相似度搜索 | 支持                  | 支持                     |
| HNSW / IVFFlat | pgvector 支持         | 具体能力取决于版本和产品 |
| AI 框架生态    | 非常成熟              | 发展中                   |
| RAG 使用情况   | 非常常见              | 也可以使用               |
| 扩展能力       | 非常强                | 较强                     |
| 迁移成本       | 需要 PostgreSQL       | MySQL 用户更熟悉         |

所以，不能简单地认为：

```text
PostgreSQL 可以做向量搜索
MySQL 不能做向量搜索
```

更加准确的说法是：

> **PostgreSQL + pgvector 在开源 RAG 生态中发展较早，相关工具链和框架支持更加成熟，因此成为了目前非常常见的 RAG 数据存储方案。**

---

# RAG 的其他存储方案

RAG 可以使用很多不同的存储方案。

例如：

```text
PostgreSQL + pgvector
MySQL
Milvus
Qdrant
Weaviate
Elasticsearch
Chroma
MongoDB
```

不同方案适合不同场景。

如果项目规模比较小：

```text
文档数量较少
数据量较小
部署简单
```

那么：

```text
PostgreSQL + pgvector
```

通常已经足够。

如果是：

```text
超大规模向量数据
```

或者：

```text
复杂的向量检索场景
```

则可以考虑：

```text
Milvus
Qdrant
Weaviate
```

等专门的向量数据库。

---

# 总结

所以，RAG 项目使用 PostgreSQL，并不是因为：

> MySQL 完全不能做向量搜索。

而是因为：

> **PostgreSQL + pgvector 在向量检索能力、扩展机制以及 AI 开发框架生态方面具有较强的优势。**

对于 RAG 系统来说，数据库通常需要同时处理：

```text
文档数据
    +
元数据
    +
向量数据
    +
相似度搜索
```

而 PostgreSQL + pgvector 可以将这些能力整合到一起：

```text
PostgreSQL
├── 文档数据
├── 元数据
├── JSON 数据
└── 向量数据
        ↓
    pgvector
        ↓
    相似度搜索
```

因此，PostgreSQL 并不是 RAG 的唯一选择。

但是在目前的开源 RAG 项目中：

```text
PostgreSQL + pgvector
```

确实是一个非常常见、成熟并且方便使用的方案。

> **选择 PostgreSQL，不是因为 MySQL 不能做 RAG，而是因为 PostgreSQL + pgvector 目前在开源 RAG 技术栈中拥有非常成熟的生态。**

> 注：本文使用 AI 辅助生成，了解的内容比较片面，仅供参考
