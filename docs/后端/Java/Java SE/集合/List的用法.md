---
slug: Map
sidebar_position: 4
---



| **方法**                              | **描述**                                              | **示例**                                        |
| ------------------------------------- | ----------------------------------------------------- | ----------------------------------------------- |
| `add(E e)`                            | 向列表末尾添加元素。                                  | `list.add("Java");`                             |
| `get(int index)`                      | 返回指定索引位置的元素。                              | `String language = list.get(0);`                |
| `remove(int index)`                   | 删除指定索引位置的元素。                              | `list.remove(1);`                               |
| `remove(Object o)`                    | 删除指定元素的第一次出现。                            | `list.remove("Python");`                        |
| `set(int index, E element)`           | 设置指定索引位置的元素。                              | `list.set(0, "Go");`                            |
| `size()`                              | 返回列表中的元素个数。                                | `int size = list.size();`                       |
| `isEmpty()`                           | 判断列表是否为空。                                    | `boolean empty = list.isEmpty();`               |
| `contains(Object o)`                  | 判断列表中是否包含指定的元素。                        | `boolean contains = list.contains("Java");`     |
| `indexOf(Object o)`                   | 返回指定元素在列表中的索引位置。如果不存在，返回 -1。 | `int index = list.indexOf("Java");`             |
| `clear()`                             | 清空列表中的所有元素。                                | `list.clear();`                                 |
| `toArray()`                           | 将列表转换为数组。                                    | `String[] array = list.toArray(new String[0]);` |
| `forEach(Consumer<? super E> action)` | 遍历列表中的每个元素并执行操作。                      | `list.forEach(System.out::println);`            |
| `addAll(Collection<? extends E> c)`   | 添加另一个集合中的所有元素。                          | `list.addAll(otherList);`                       |
| `removeAll(Collection<?> c)`          | 删除列表中与另一个集合相同的所有元素。                | `list.removeAll(otherList);`                    |
| `retainAll(Collection<?> c)`          | 保留列表中与另一个集合相同的元素。                    | `list.retainAll(otherList);`                    |
| `subList(int fromIndex, int toIndex)` | 获取列表的子集。                                      | `List<String> subList = list.subList(1, 3);`    |
