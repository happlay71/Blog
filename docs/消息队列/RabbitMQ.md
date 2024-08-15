---
slug: RabbitMQ
sidebar_position: 2
---

# [RabbitMQ](https://www.rabbitmq.com/)

## 安装

```shell
docker run \
 -e RABBITMQ_DEFAULT_USER=用户名 \
 -e RABBITMQ_DEFAULT_PASS=密码 \
 -v mq-plugins:/plugins \
 --name mq \
 --hostname mq \
 -p 15672:15672 \  
 -p 5672:5672 \
 --network 网络名\
 -d \
 rabbitmq:3.8-management
```

`15672`：控制台端口
`5672`：收发消息的端口

概念：

- publisher：生产者，也就是发送消息的一方
- consumer：消费者，也就是消费消息的一方
- queue：队列，存储消息。生产者投递的消息会暂存在消息队列中，等待消费者处理
- exchange：交换机，负责消息路由。生产者发送的消息由交换机决定投递到哪个队列。
- virtual host：虚拟主机，起到数据隔离的作用。每个虚拟主机相互独立，有各自的exchange、queue


![](https://happlay-docs.oss-cn-beijing.aliyuncs.com/docs/Snipaste_2024-08-08_17-08-37.png)


## JAVA客户端-[SpringAMQP](https://spring.io/projects/spring-amqp)

1. 引入依赖

    ```yml
        <!--AMQP依赖，包含RabbitMQ-->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-amqp</artifactId>
        </dependency>
    ```

2. 配置`application.yaml`文件

    ```yml
    spring:
        rabbitmq:
            host: 192.168.150.101 # 你的虚拟机IP
            port: 5672 # 端口
            virtual-host: /hmall # 虚拟主机
            username: hmall # 用户名
            password: 123 # 密码
    ```

3. 然后在类中注入容器

    发送消息：
    ```java
    @SpringBootTest
    public class SpringAmqpTest {

        @Autowired
        private RabbitTemplate rabbitTemplate;

        @Test
        public void testSimpleQueue() {
            // 队列名称
            String queueName = "simple.queue";
            // 消息
            String message = "hello, spring amqp!";
            // 发送消息
            rabbitTemplate.convertAndSend(queueName, message);
        }
    }
    ```

    接收消息：
    ```java
    @Component
    public class SpringRabbitListener {
            // 利用RabbitListener来声明要监听的队列信息
        // 将来一旦监听的队列中有了消息，就会推送给当前服务，调用当前方法，处理消息。
        // 可以看到方法体中接收的就是消息体的内容
        @RabbitListener(queues = "simple.queue")
        public void listenSimpleQueueMessage(String msg) throws InterruptedException {
            System.out.println("spring 消费者接收到消息：【" + msg + "】");
        }
    }
    ```

## Work Queue

任务模型，让多个消费者绑定到一个队列，共同消费队列中的消息。同一条消息只能被一个消费者处理。

但是默认情况下，每个消费者分配到的消息数都是平均的，不会因消费者的处理速度差异而改变，这会导致效率降低

在spring中有一个简单的配置，可以解决这个问题：

```yml
spring:
  rabbitmq:
    listener:
      simple:
        prefetch: 1 # 每次只能获取一条消息，处理完成才能获取下一个消息
```

## 交换机

接受发送者发送的消息，并将消息路由到与其绑定的队列。

### `Fanout`交换机 - 广播

会将接收到的消息路由到每一个跟其绑定的队列，也叫广播模式

- 1）  可以有多个队列
- 2）  每个队列都要绑定到`Exchange`（交换机）
- 3）  生产者发送的消息，只能发送到交换机
- 4）  交换机把消息发送给绑定过的所有队列
- 5）  订阅队列的消费者都能拿到消息

发送消息：

```java
@Test
public void testFanoutExchange() {
    // 交换机名称
    String exchangeName = "hmall.fanout";
    // 消息
    String message = "hello, everyone!";
    // 三个值，交换机名，交换机密码，信息
    rabbitTemplate.convertAndSend(exchangeName, "", message);
}
```

接收消息：

```java
@RabbitListener(queues = "fanout.queue1")
public void listenFanoutQueue1(String msg) {
    System.out.println("消费者1接收到Fanout消息：【" + msg + "】");
}

@RabbitListener(queues = "fanout.queue2")
public void listenFanoutQueue2(String msg) {
    System.out.println("消费者2接收到Fanout消息：【" + msg + "】");
}
```

### `Direct`交换机 - 定向

会将接收到的消息根据规则路由到指定的队列，称为定向路由

在`Direct`模型下：

- 队列与交换机的绑定，不能是任意绑定了，而是要指定一个`RoutingKey`（路由key）
- 消息的发送方在 向 `Exchange`发送消息时，也必须指定消息的 `RoutingKey`。
- `Exchange`不再把消息交给每一个绑定的队列，而是根据消息的`Routing Key`进行判断，只有队列的`Routingkey`与消息的 `Routing key`完全一致，才会接收到消息


发送消息

```java
@Test
public void testSendDirectExchange() {
    // 交换机名称
    String exchangeName = "hmall.direct";
    // 消息
    String message = "红色警报！日本乱排核废水，导致海洋生物变异，惊现哥斯拉！";
    // 发送消息
    rabbitTemplate.convertAndSend(exchangeName, "red", message);
}
```

接收消息

```java
@RabbitListener(queues = "direct.queue1")
public void listenDirectQueue1(String msg) {
    System.out.println("消费者1接收到direct.queue1的消息：【" + msg + "】");
}

@RabbitListener(queues = "direct.queue2")
public void listenDirectQueue2(String msg) {
    System.out.println("消费者2接收到direct.queue2的消息：【" + msg + "】");
}
```

### `Topic`交换机 - 通配符订阅

基于`RoutingKey`做消息路由，但是`routingKey`通常是多个单词的组合，并且以`.`分割

队列与交换机指定`BindingKey`时可以使用通配符：

- `#`：代指0个或多个单词
- `*`：代指一个单词

在交换机绑定队列时，指定对应的`BindingKey`

例子：

- `topic.queue1`：绑定的是`china.#` ，凡是以 `china.`开头的`routing key` 都会被匹配到，包括：
  - `china.news`
  - `china.weather`


发送消息

```java
/**
 * topicExchange
 */
@Test
public void testSendTopicExchange() {
    // 交换机名称
    String exchangeName = "hmall.topic";
    // 消息
    String message = "喜报！孙悟空大战哥斯拉，胜!";
    // 发送消息
    rabbitTemplate.convertAndSend(exchangeName, "china.news", message);
}
```

接收消息

```java
@RabbitListener(queues = "topic.queue1")
public void listenTopicQueue1(String msg){
    System.out.println("消费者1接收到topic.queue1的消息：【" + msg + "】");
}

@RabbitListener(queues = "topic.queue2")
public void listenTopicQueue2(String msg){
    System.out.println("消费者2接收到topic.queue2的消息：【" + msg + "】");
}
```

### 声明队列和交换机

`SpringAMQP`提供了类来声明队列、交换机及其绑定关系：

- `Queue`：用于声明队列，可以用工厂类`QueueBuilder`构建
- `Exchange`：用于声明交换机，可以用工厂类`ExchangeBuilder`构建
- `Binding`：用于声明队列和交换机的绑定关系，可以用工厂类`BindingBuilder`构建

#### 基于`Bean`声明

两种创建方式：

示例，声明`Fanout`交换机

```java
@Configuration
public class FanoutConfiguration {
    @Bean
    public FanoutExchange fanoutExchange() {
//        return new FanoutExchange("hmall.fanout");
        return ExchangeBuilder.fanoutExchange("hmall.fanout").build();
    }

    @Bean
    public Queue fanoutQueue1() {
//        return new Queue("fanout.queue1");
        return QueueBuilder.durable("fanout.queue1").build();
    }

    @Bean
    public Binding fanoutQueue1Binding(Queue fanoutQueue, FanoutExchange fanoutExchange) {
        return BindingBuilder.bind(fanoutQueue).to(fanoutExchange);
    }
}
```
#### 基于注解声明

```java
@Component
public class SpringRabbitListener {
    @RabbitListener(bindings = @QueueBinding(
        value = @Queue(name = "direct.queue1", durable = "true"),
        exchange = @Exchange(name = "hmall.direct", type = ExchangeTypes.DIRECT),
        key = {"red, blue"}
))
    public void listenDirectQueue1(String msg) {
        System.out.println("消费者1接收到direct.queue1的消息：【" + msg + "】");
    }
}
```

### 消息转换器

默认情况下Spring采用的序列化方式是JDK序列化。JDK序列化存在下列问题：
- 数据体积过大
- 有安全漏洞
- 可读性差

#### 配置JSON转换器

1. 在接收和发送消息的服务中加入依赖：

    ```xml
    <dependency>
        <groupId>com.fasterxml.jackson.dataformat</groupId>
        <artifactId>jackson-dataformat-xml</artifactId>
        <version>2.9.10</version>
    </dependency>
    ```
**注意**：如果项目中引入了`spring-boot-starter-web`依赖，则无需再次引入`Jackson`依赖。


2. 配置消息转换器，在接收和发送消息的服务的启动类中加入`Bean`：

    ```java
    @Bean
    public MessageConverter messageConverter(){
        // 1.定义消息转换器
        Jackson2JsonMessageConverter jackson2JsonMessageConverter = new Jackson2JsonMessageConverter();
        // 2.配置自动创建消息id，用于识别不同消息，也可以在业务中基于ID判断是否是重复消息
        jackson2JsonMessageConverter.setCreateMessageIds(true);
        return jackson2JsonMessageConverter;
    }
    ```

#### 消费者接收`Object`
publisher是用Map发送，那么消费者也一定要用Map接收，格式如下：

```java
@RabbitListener(queues = "object.queue")
public void listenSimpleQueueMessage(Map<String, Object> msg) throws InterruptedException {
    System.out.println("消费者接收到object.queue消息：【" + msg + "】");
}
```
