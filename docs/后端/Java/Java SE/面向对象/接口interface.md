---
slug: interFace
sidebar_position: 5
---

# 接口interface

## 使用

1. 接口使用interface来定义

2. Java中，接口和类是并列的两个结构

3. 如何定义常量：定义接口中的成员：

4.  JDK7及以前：只能定义全局变量和抽象方法

    		>全局变量：public static final的.但是书写时，可以省略不写
	
    		>抽象方法：public abstract的

    JDK8之后：除了定义全局变量和抽象方法之外，还可以定义静态方法、默认方法

   接口中不能定义构造器！意味着接口不可实例化

5. Java开发中，接口通过让类去实现（implement）的方式来使用

   如果实现类覆盖了接口中的所有的抽象方法，则此实现类就可以实例化

    如果实现类，没有覆盖接口中的所有的抽象方法，则此实现类仍为一个实现类

6. Java类可以实现多个类的继承----->弥补了Java单继承性的局限性

   格式：class AA extends BB implements CC,DD,EE

7. 接口与接口之间可以继承，而且可以多继承

8. 接口的具体使用，体现多态性

9. 接口，实际上可以看作是一种规范

## 包装类

![image-20230828194501814](https://happlay-docs.oss-cn-beijing.aliyuncs.com/docs/image-20230828194501814.png)