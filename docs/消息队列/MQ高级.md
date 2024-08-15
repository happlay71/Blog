---
slug: MQ-High
sidebar_position: 3
---

## 发送者的可靠性

### 发送者重连

在发送者的`application.yaml`文件里加入下面内容：

```yml
spring:
  rabbitmq:
    connection-timeout: 1s # 设置MQ的连接超时时间
    template:
      retry:
        enabled: true # 开启超时重试机制
        initial-interval: 1000ms # 失败后的初始等待时间
        multiplier: 1 # 失败后下次的等待时长倍数，下次等待时长 = initial-interval * multiplier
        max-attempts: 3 # 最大重试次数
```

**注意**：当网络不稳定的时候，利用重试机制可以有效提高消息发送的成功率。不过`SpringAMQP`提供的重试机制是**阻塞式**的重试，也就是说多次重试等待的过程中，当前线程是被阻塞的。

### 发送者确认

少数情况下，也会出现消息发送到`MQ`之后丢失的现象，比如：
- `MQ`内部处理消息的进程发生了异常
- 生产者发送消息到达`MQ`后未找到`Exchange`
- 生产者发送消息到达`MQ`的`Exchange`后，未找到合适的`Queue`，因此无法路由

`RabbitMQ`提供了生产者消息确认机制，包括`Publisher Confirm`和`Publisher Return`两种。在开启确认机制的情况下，当生产者发送消息给`MQ`后，`MQ`会根据消息处理的情况返回不同的**回执**。


- 当消息投递到`MQ`，但是路由失败时，通过`Publisher Return`返回异常信息，同时返回`ack`的确认信息，代表投递成功

- 临时消息投递到了`MQ`，并且入队成功，返回`ACK`，告知投递成功

- 持久消息投递到了`MQ`，并且入队完成持久化，返回`ACK` ，告知投递成功

- 其它情况都会返回`NACK`，告知投递失败


`Confirm`机制：检查消息是否发送到`Exchange`，与后续是否发送到`Queue`无关

`Return`机制：用于处理一些不可路由的消息，当消息从`Exchange`到`Queue`失败时会触发



`ack`和`nack`属于`Publisher Confirm`机制，`ack`是投递成功；`nack`是投递失败。而`return`则属于`Publisher Return`机制。

默认两种机制都是关闭状态，需要通过配置文件来开启。

例子：

1. 在发送者的`application.yaml`文件里添加：

    ```yml
    spring:
        rabbitmq:
            publisher-confirm-type: correlated # 开启publisher confirm机制，并设置confirm类型
            publisher-returns: true # 开启publisher return机制
    ```

`publisher-confirm-type`有三种模式：

- `none`：关闭`confirm`机制
- `simple`：同步阻塞等待`MQ`的回执
- `correlated`：`MQ`异步回调返回回执(推荐)

2. 定义`ReturnCallback`

    每个`RabbitTemplate`只能配置一个`ReturnCallback`，因此在配置类中统一设置：

    ```java
    @Slf4j
    @AllArgsConstructor
    @Configuration
    public class MqConfig {
        private final RabbitTemplate rabbitTemplate;

        @PostConstruct
        public void init(){
            rabbitTemplate.setReturnsCallback(new RabbitTemplate.ReturnsCallback() {
                @Override
                public void returnedMessage(ReturnedMessage returned) {
                    log.error("触发return callback,");
                    log.debug("exchange: {}", returned.getExchange());
                    log.debug("routingKey: {}", returned.getRoutingKey());
                    log.debug("message: {}", returned.getMessage());
                    log.debug("replyCode: {}", returned.getReplyCode());
                    log.debug("replyText: {}", returned.getReplyText());
                }
            });
        }
    }
    ```

    lambda表达式：
    
    ```java
    public void init() {
            rabbitTemplate.setReturnsCallback(returned -> {
                log.error("触发return callback,");
                log.debug("exchange: {}", returned.getExchange());
                log.debug("routingKey: {}", returned.getRoutingKey());
                log.debug("message: {}", returned.getMessage());
                log.debug("replyCode: {}", returned.getReplyCode());
                log.debug("replyText: {}", returned.getReplyText());
            });
        }
    ```

3. 定义`ConfirmCallback`

    每个消息发送时的处理逻辑不一定相同，因此`ConfirmCallback`需要在每次发消息时定义：

```java
@Test
    public void testConfirmCallback() {
        // 创建correlationData
        CorrelationData cd = new CorrelationData(UUID.randomUUID().toString());
        cd.getFuture().addCallback(new ListenableFutureCallback<CorrelationData.Confirm>() {
            @Override
            public void onFailure(Throwable ex) {
                // 2.1.Future发生异常时的处理逻辑，基本不会触发
                log.error("send message fail", ex);
            }

            @Override
            public void onSuccess(CorrelationData.Confirm result) {
                // 判断是否成功
                if (result.isAck()) {
                    log.debug("发送消息成功，收到 ack!");
                } else {
                    // 此处应该对失败请求做逻辑处理，如有限次数的重连，而不是单纯的日志输出！！！！！
                    log.error("发送消息失败，收到 nack, reason : {}", result.getReason());
                }
            }
        });


        // 交换机名称
        String exchangeName = "hmall.direct";
        // 消息
        String message = "红色警报！日本乱排核废水，导致海洋生物变异，惊现哥斯拉！";
        // 发送消息
        rabbitTemplate.convertAndSend(exchangeName, "yellow", message, cd);
    }
```

## MQ的可靠性

默认情况下MQ的数据都是在内存存储的临时数据，重启后就会消失。

### 数据持久化

持久化的消息在到达队列时就入盘，而且还可以设置持久化的消息在内存中也保存一份备份，这么做可以提高业务效率，当内存吃紧时会从内存中清除。
非持久化的消息一般只保存在内存中，在内存吃紧的时候会被换入到磁盘中，以节省内存空间。

为了保证数据的可靠性，必须配置数据持久化，包括：
- 交换机持久化
- 队列持久化
- 消息持久化

#### 交换机持久化

在控制台的`Exchanges`页面，添加交换机时可以配置交换机的`Durability`参数：设置为`Durable`就是持久化模式，`Transient`就是临时模式。

#### 队列持久化

在控制台的`Queues`页面，添加队列时，同样可以配置队列的`Durability`参数

#### 消息持久化

在控制台发送消息的时候，可以添加很多参数，而消息的持久化是要配置一个`properties`：

在`Queues`的`Publish message`选项卡里的`Delivery mode`选项中可配置

- `Non-persistent`不持久化
- `Persistent`持久化

发送非持久化消息：

```java
@Test
public void testSend() {
    // 自定义构建消息
    Message message = MessageBuilder
            .withBody("hello, SpringAMQP!".getBytes(StandardCharsets.UTF_8))
            .setDeliveryMode(MessageDeliveryMode.NON_PERSISTENT)
            .build();

    rabbitTemplate.convertAndSend("simple.queue", message);
}
```

通过`rabbitTemplate.convertAndSend`方法发送的消息默认是持久化的。

**注**：发送大量非持久化消息时应关闭消息确认机制，否则会非常影响性能

```yml
publisher-confirm-type: none
publisher-returns: false
```

### LazyQueue

一旦因为某些原因出现消息堆积问题，`RabbitMQ`的内存占用就会越来越高，直到触发内存预警上限。此时`RabbitMQ`会将内存消息刷到磁盘上，这个行为称为`PageOut`. `PageOut`会耗费一段时间，并且会阻塞队列进程。因此在这个过程中`RabbitMQ`不会再处理新的消息，生产者的所有请求都会被阻塞。

为了解决这个问题，从`RabbitMQ`的`3.6.0`版本开始，就增加了`Lazy Queues`的模式，也就是惰性队列。惰性队列的特征如下：

- 接收到消息后直接存入磁盘而非内存
- 消费者要消费消息时才会从磁盘中读取并加载到内存（也就是懒加载）
- 支持数百万条的消息存储

而在`3.12`版本之后，`LazyQueue`已经成为所有队列的默认格式。因此官方推荐升级`MQ`为`3.12`版本或者所有队列都设置为`LazyQueue`模式。

#### 控制台配置Lazy模式

在添加队列的时候，在`Arguments`处添加`x-queue-mod=lazy`参数即可设置队列为`Lazy`模式

#### 代码配置Lazy模式

在利用SpringAMQP声明队列的时候，添加x-queue-mod=lazy参数也可设置队列为Lazy模式：

1. 基于`Bean`容器
    ```java
    @Bean
    public Queue lazyQueue(){
        return QueueBuilder
                .durable("lazy.queue")
                .lazy() // 开启Lazy模式
                .build();
    }
    ```

2. 基于注解声明

    ```java
    @RabbitListener(queuesToDeclare = @Queue(
            name = "lazy.queue",
            durable = "true",
            arguments = @Argument(name = "x-queue-mode", value = "lazy")
    ))
    public void listenLazyQueue(String msg){
        log.info("接收到 lazy.queue的消息：{}", msg);
    }
    ```

#### 更新已有队列为lazy模式

对于已经存在的队列，也可以配置为`lazy`模式，但是要通过设置`policy`实现。

可以基于**命令行**设置`policy`：

```shell
rabbitmqctl set_policy Lazy "^lazy-queue$" '{"queue-mode":"lazy"}' --apply-to queues  
```

解读：

- `rabbitmqctl` ：`RabbitMQ`的命令行工具
- `set_policy` ：添加一个策略
- `Lazy` ：策略名称，可以自定义
- `"^lazy-queue$"` ：用正则表达式匹配队列的名字
- `'{"queue-mode":"lazy"}'` ：设置队列模式为lazy模式
- `--apply-to queues`：策略的作用对象，是所有的队列

也可以在**控制台**配置`policy`，进入在控制台的`Admin`页面，点击`Policies`，即可添加配置

## 消费者的可靠性

当`RabbitMQ`向消费者投递消息以后，需要知道消费者的处理状态如何。因为消息投递给消费者并不代表就一定被正确消费了，可能出现的故障有很多，比如：
- 消息投递的过程中出现了网络故障
- 消费者接收到消息后突然宕机
- 消费者接收到消息后，因处理不当导致异常
- ...
一旦发生上述情况，消息也会丢失。因此，`RabbitMQ`必须知道消费者的处理状态，一旦消息处理失败才能重新投递消息。

### 消费者确认机制

当消费者处理消息结束后，应该向`RabbitMQ`发送一个回执，告知`RabbitMQ`自己消息处理状态。回执有三种可选值：
- `ack`：成功处理消息，`RabbitMQ`从队列中删除该消息
- `nack`：消息处理失败，`RabbitMQ`需要再次投递消息
- `reject`：消息处理失败并拒绝该消息，`RabbitMQ`从队列中删除该消息

`SpringAMQP`实现了消息确认。并允许通过配置文件设置`ACK`处理方式，有三种模式：

- `none`：不处理。即消息投递给消费者后立刻`ack`，消息会立刻从MQ删除。非常不安全，不建议使用
- `manual`：手动模式。需要自己在业务代码中调用`api`，发送`ack`或`reject`，存在业务入侵，但更灵活
- `auto`：自动模式。`SpringAMQP`利用`AOP`对消息处理逻辑做了环绕增强，当业务正常执行时则自动返回`ack`.  当业务出现异常时，根据异常判断返回不同结果：
  - 如果是业务异常，会自动返回`nack`；
  - 如果是消息处理或校验异常，自动返回`reject`;


在消费者中，通过配置修改`SpringAMQP`的`ACK`处理方式：

```yml
spring:
  rabbitmq:
    listener:
      simple:
        acknowledge-mode: none/manual/auto # 不做处理/手动/自动
```

**注**：

`Ready`状态：

- 准备好被消费，但尚未被任何消费者接收。

- 通常发生在消费者拒绝消息且要求重新排队，或消费者处理消息时出现异常未发送 `ACK`

如果消费者告诉 `RabbitMQ` 无法处理该消息，但允许该消息重新排队（使用 `basicReject` 或` basicNack` 并将 `requeu`e 设置为 `true`），那么该消息会被重新放回队列，并标记为“`Ready`”，等待其他消费者重新接收。

### 失败重试机制

当消费者出现异常后，消息会不断`requeue`（重入队）到队列，再重新发送给消费者。如果消费者再次执行依然出错，消息会再次`requeue`到队列，再次投递，直到消息处理成功为止。
极端情况就是消费者一直无法执行成功，那么消息`requeue`就会无限循环，导致`mq`的消息处理飙升，带来不必要的压力

在消费者的配置文件`application.yaml`里配置：

```yml
spring:
  rabbitmq:
    listener:
      simple:
        retry:
          enabled: true # 开启消费者失败重试
          initial-interval: 1000ms # 初识的失败等待时长为1秒
          multiplier: 1 # 失败的等待时长倍数，下次等待时长 = multiplier * last-interval
          max-attempts: 3 # 最大重试次数
          stateless: true # true无状态；false有状态。如果业务中包含事务，这里改为false
```

### 失败处理策略

`Spring`允许自定义重试次数耗尽后的消息处理策略，这个策略是由`MessageRecovery`接口来定义的，它有3个不同实现：
-  `RejectAndDontRequeueRecoverer`：重试耗尽后，直接`reject`，丢弃消息。默认就是这种方式 
-  `ImmediateRequeueMessageRecoverer`：重试耗尽后，返回`nac`k，消息重新入队 
-  `RepublishMessageRecoverer`：重试耗尽后，将失败消息投递到指定的交换机 

例子：

第三种方法

1. 在消费者中定义处理失败消息的交换机和队列

    ```java
    @Bean
    public DirectExchange errorMessageExchange(){
        return new DirectExchange("error.direct");
    }
    @Bean
    public Queue errorQueue(){
        return new Queue("error.queue", true);
    }
    @Bean
    public Binding errorBinding(Queue errorQueue, DirectExchange errorMessageExchange){
        return BindingBuilder.bind(errorQueue).to(errorMessageExchange).with("error");
    }
    ```

2. 定义一个`RepublishMessageRecoverer`，关联队列和交换机

    ```java
    @Bean
    public MessageRecoverer republishMessageRecoverer(RabbitTemplate rabbitTemplate){
        return new RepublishMessageRecoverer(rabbitTemplate, "error.direct", "error");
    }
    ```

消费者如何保证消息一定被消费：

- 开启消费者确认机制为`auto`，由`spring`确认消息处理情况

- 开启消费者失败重试机制，并且设置`MessageRecoverer`，多次重试失败后将异常消息投递到异常交换机，由人工处理

### 业务幂等性

防止消息因宕机等原因重复发送导致重复消费的情况

业务幂等性，在程序开发中，指同一个业务，执行一次或多次对业务状态的影响是一致的。

#### 唯一消息ID

思路：

1. 每一条消息都生成一个唯一的`id`，与消息一起投递给消费者。
2. 消费者接收到消息后处理自己的业务，业务处理成功后将消息ID保存到数据库
3. 如果下次又收到相同消息，去数据库查询判断是否存在，存在则为重复消息放弃处理。

配置：

`SpringAMQP`的`MessageConverter`自带了`MessageID`的功能，只需开启即可


消息需要在刚开始发送的时候就具备唯一`id`，所以应该在发送者中配置

```java
@Bean
public MessageConverter messageConverter(){
    // 1.定义消息转换器
    Jackson2JsonMessageConverter jjmc = new Jackson2JsonMessageConverter();
    // 2.配置自动创建消息id，用于识别不同消息，也可以在业务中基于ID判断是否是重复消息
    jjmc.setCreateMessageIds(true);
    return jjmc;
}
```

消费者获取

```java
@RabbitListener(queues = "simple.queue")
public void listenerSimple(Message message) {

    log.info("spring 消费者接收到消息：ID:【" + message.getMessageProperties().getAppId() + "】");
    log.info("spring 消费者接收到消息：【" + new String(message.getBody()) + "】");
}
```

#### 业务判断

结合业务逻辑，基于业务本身做幂等性判断

如：订单支付流程中，应先根据订单`id`查看是否存在对应订单，且订单状态是否为未支付，再选择直接跳过（订单不存在或已支付等）或继续支付流程。

### 兜底方案

思想：

例子，既然`MQ`通知不一定发送到交易服务，那么交易服务就必须自己主动去查询支付状态。这样即便支付服务的`MQ`通知失败，依然能通过主动查询来保证订单状态的一致。

**注意**：交易服务并不知道用户会在什么时候支付，如果查询的时机不正确（比如查询的时候用户正在支付中），可能查询到的支付状态也不正确。

该在什么时间主动查询支付状态？

这个时间是无法确定的，因此，通常采取的措施就是利用定时任务定期查询，例如每隔20秒就查询一次，并判断支付状态。如果发现订单已经支付，则立刻更新订单状态为已支付即可。


综上，支付服务与交易服务之间的订单状态一致性是如何保证的？
- 首先，支付服务会正在用户支付成功以后利用`MQ`消息通知交易服务，完成订单状态同步。
- 其次，为了保证`MQ`消息的可靠性，我们采用了生产者确认机制、消费者确认、消费者失败重试等策略，确保消息投递的可靠性
- 最后，我们还在交易服务设置了定时任务，定期查询订单支付状态。这样即便`MQ`通知失败，还可以利用定时任务作为兜底方案，确保订单支付状态的最终一致性。

## 延迟消息

发送者发送消息时指定一个时间，消费者不会立刻收到消息，而是在指定事件后才收到消息。

在一段时间以后才执行的任务，我们称之为**延迟任务**

要实现延迟任务，最简单的方案就是利用`MQ`的延迟消息了。

在`RabbitMQ`中实现延迟消息也有两种方案：
- 死信交换机+`TTL`
- 延迟消息插件

### 死信交换机

当一个队列中的消息满足下列情况之一时，就会成为死信（`dead letter`）

- 消费者使用`basic.reject`或`basic.nack`声明消息失败，并且消息的`requeue`参数设为`false`
- 消息是一个过期消息（达到了队列或消息本身设置的过期时间），超时无人消费
- 要投递的队列消息堆积满了，最早的消息可能成为死信

如果一个队列中的消息已经成为死信，并且这个队列通过`dead-letter-exchange`属性指定了一个交换机，那么队列中的死信就会投递到这个交换机中，而这个交换机就称为死信交换机（`Dead Letter Exchange`）。而此时加入有队列与死信交换机绑定，则最终死信就会被投递到这个队列中。

死信交换机的作用：

1. 收集那些因处理失败而被拒绝的消息
2. 收集那些因队列满了而被拒绝的消息
3. 收集因`TTL`（有效期）到期的消息

将死信队列的 binding key 设置为与原队列相同:

优点：
- 一致性：使用相同的 binding key 可以使消息在死信队列中的路由行为与原始队列一致，方便后续的分析和处理。
- 简单性：如果你只需要简单地将未成功处理的消息转发到死信队列，并且后续依然想按照原来的路由规则来处理这些消息，使用相同的 binding key 是最简单的方法。

例子：

1. 消费者设置：

    普通交换机`normal.direct`，队列`normal.queue`，因为必须可以实现死信，所以不能有消费者

    通过设置队列属性`.deadLetterExchange("dlx.direct")`来绑定死信交换机，同时可以设置`.deadLetterRoutingKey("hi").`来设置发送到死信交换机时的`key`

    ```java
        @Bean
        public DirectExchange normalExchange() {
            return ExchangeBuilder.directExchange("normal.direct").build();
        }

        @Bean
        public Queue normalQueue() {
            return QueueBuilder.durable("normal.queue").deadLetterExchange("dlx.direct").build();
        }

        @Bean
        public Binding normalExchangeBinding(Queue normalQueue, DirectExchange normalExchange) {
            return BindingBuilder.bind(normalQueue).to(normalExchange).with("hi");
        }
    ```


    死信交换机`dlx.direct`、队列`dlx.queue`、消费者

    ```java
        @RabbitListener(bindings = @QueueBinding(
                    value = @Queue(name = "dlx.queue", durable = "true"),
                    exchange = @Exchange(name = "dlx.direct", type = ExchangeTypes.DIRECT),
                    key = {"hi"}
            ))
        public void listenDlxQueue1(String msg) {
            System.out.println("消费者1接收到dlx.queue的消息：【" + msg + "】");
        }
    ```

2. 发送者设置：

    发送时携带过期时间

    ```java
        public void testSendDelayMessage() {
            rabbitTemplate.convertAndSend("normal.direct", "hi", "hello", new MessagePostProcessor() {
                @Override
                public Message postProcessMessage(Message message) throws AmqpException {
                    message.getMessageProperties().setExpiration("10000");
                    return message;
                }
            });
        }
    ```

    或`lambda`表达式简化：

    ```java
        public void testSendDelayMessage() {
            rabbitTemplate.convertAndSend("normal.direct", "hi", "hello", message -> {
                message.getMessageProperties().setExpiration("10000");
                return message;
            });
        }
    ```

### [延迟消息插件](https://github.com/rabbitmq/rabbitmq-delayed-message-exchange)

可将普通交换机改造为支持延迟消息功能的交换机，当消息投递到交换机后可以暂存一定时间，到期后再投递到队列

#### 安装

查看`RabbitMQ`的插件目录对应的数据卷

```shell
docker volume inspect mq-plugins
```

结果如下：

```
[
    {
        "CreatedAt": "2024-06-19T09:22:59+08:00",
        "Driver": "local",
        "Labels": null,
        "Mountpoint": "/var/lib/docker/volumes/mq-plugins/_data",
        "Name": "mq-plugins",
        "Options": null,
        "Scope": "local"
    }
]
```

插件目录被挂载到了`/var/lib/docker/volumes/mq-plugins/_data`这个目录，上传插件到该目录下

通过`docker`安装：

```shell
docker exec -it mq rabbitmq-plugins enable rabbitmq_delayed_message_exchange
```

#### 通过代码创建支持延迟消息的交换机

基于注解方式：

`@Exchange(name = "delay.direct", delayed = "true")`：通过`delayed=true`选项开启

```java
@RabbitListener(bindings = @QueueBinding(
        value = @Queue(name = "delay.queue", durable = "true"),
        exchange = @Exchange(name = "delay.direct", delayed = "true"),
        key = "delay"
))
public void listenDelayMessage(String msg){
    log.info("接收到delay.queue的延迟消息：{}", msg);
}

```

基于`@Bean`的方式：

在创建交换机操作时通过`.delayed()`来设置

```java
    @Bean
    public DirectExchange delayExchange(){
        return ExchangeBuilder
                .directExchange("delay.direct") // 指定交换机类型和名称
                .delayed() // 设置delay的属性为true
                .durable(true) // 持久化
                .build();
    }

    @Bean
    public Queue delayedQueue(){
        return new Queue("delay.queue");
    }
    
    @Bean
    public Binding delayQueueBinding(){
        return BindingBuilder.bind(delayedQueue()).to(delayExchange()).with("delay");
    }
```

#### 发送延迟消息

发送消息时，必须通过`x-delay`属性设定延迟时间，`.setDelay(5000)`：

```java
void testPublisherDelayMessage() {
    // 1.创建消息
    String message = "hello, delayed message";
    // 2.发送消息，利用消息后置处理器添加消息头
    rabbitTemplate.convertAndSend("delay.direct", "delay", message, new MessagePostProcessor() {
        @Override
        public Message postProcessMessage(Message message) throws AmqpException {
            // 添加延迟消息属性
            message.getMessageProperties().setDelay(5000);
            return message;
        }
    });
}
```

**注意**：

延迟消息插件内部会维护一个本地数据库表，同时使用`Elang Timers`功能实现计时。如果消息的延迟时间设置较长，可能会导致堆积的延迟消息非常多，会带来较大的`CPU`开销，同时延迟消息的时间会存在误差。

因此，不建议设置延迟时间过长的延迟消息。

