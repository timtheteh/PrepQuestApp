export const promptAndData = {
    // Recall, Text to Text
    "Recall Text Question to Text Answer":
    {"prompt": "Recall questions test memory by asking for specific facts, definitions, or information. For 'Recall Text Question to Text Answer', give your output in json format like this: {'flashcardType': 'Recall Text Question to Text Answer', 'question': 'What is the primary purpose of a DNS (Domain Name System) server?', 'answer': 'A DNS server translates human-readable domain names (like www.example.com) into IP addresses that computers use to identify each other on the network.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Recall"
    },
    // Recall, Text to MCQ
    "Recall Text Question to MCQ Answer":
    {"prompt": "Recall questions test memory by asking for specific facts, definitions, or information. For 'Recall Text Question to MCQ Answer', give your output in json format like this: {'flashcardType': 'Recall Text Question to MCQ Answer', 'question': 'Which HTTP status code indicates that a request has succeeded?', 'answer': [{'option': '404', 'ans': false}, {'option': '500', 'ans': false}, {'option': '200', 'ans': true}, {'option': '403', 'ans': false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Recall"
    },
    // Recall, Cloze to Text
    "Recall Cloze Question to Text Answer":
    {"prompt": "Recall questions test memory by asking for specific facts, definitions, or information. For 'Recall Cloze Question to Text Answer', give your output in json format like this: {'flashcardType': 'Recall Cloze Question to Text Answer', 'question': 'In JavaScript, the <blank> keyword is used to declare a variable with block scope and prevent reassignment.', 'answer': 'const'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Recall"
    },
    // Recall, Cloze to MCQ
    "Recall Cloze Question to MCQ Answer":
    {"prompt": "Recall questions test memory by asking for specific facts, definitions, or information. For 'Recall Cloze Question to MCQ Answer', give your output in json format like this: {'flashcardType': 'Recall Cloze Question to MCQ Answer', 'question': 'In SQL, the <blank> command is used to remove all records from a table without logging individual row deletions.', 'answer': [{'option': 'DELETE', 'ans': false}, {'option': 'TRUNCATE', 'ans': true}, {'option': 'REMOVE', 'ans': false}, {'option': 'DROP', 'ans': false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Recall"
    },
    // Comprehension, Text to Text
    "Comprehension Text Question to Text Answer":
    {"prompt": "Comprehension questions test understanding by asking for explanations, interpretations, summaries or comparisons. For 'Comprehension Text Question to Text Answer', give your output in json format like this: {'flashcardType': 'Comprehension Text Question to Text Answer', 'question': 'Explain the difference between a shallow copy and a deep copy in programming.', 'answer': 'A shallow copy copies only the top-level references of an object, meaning nested objects are still shared. A deep copy recursively copies all nested objects, creating entirely independent duplicates of the original structure.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Comprehension"
    },
    // Comprehension, Text to MCQ
    "Comprehension Text Question to MCQ Answer":
    {"prompt": "Comprehension questions test understanding by asking for explanations, interpretations, summaries or comparisons. For 'Comprehension Text Question to MCQ Answer', give your output in json format like this: {'flashcardType': 'Comprehension Text Question to MCQ Answer', 'question': 'What best explains the difference between HTTP and HTTPS?', 'answer': [{'option': 'HTTPS uses port 80, while HTTP uses port 443.', 'ans': false}, {'option': 'HTTP encrypts data during transmission, while HTTPS does not.', 'ans': false}, {'option': 'There is no real difference between HTTP and HTTPS.', 'ans': false}, {'option': 'HTTPS adds a layer of encryption via SSL/TLS to secure data transmission, unlike HTTP.', 'ans': true}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Comprehension"
    },
    // Comprehension, Text to Voice
    "Comprehension Text Question to Voice Answer":
    {"prompt": "Comprehension questions test understanding by asking for explanations, interpretations, summaries or comparisons. For 'Comprehension Text Question to Voice Answer', give your output in json format like this: {'flashcardType': 'Comprehension Text Question to Voice Answer', 'question': 'How does a load balancer improve the reliability and scalability of a web application?', 'answer': ''}",
      "questionType": "text",       
      "answerType": "voice",
      "cognitiveQnType": "Comprehension"
    },
    // Application, Text to Text
    "Application Text Question to Text Answer":
    {"prompt": "Application questions test the ability to apply knowledge to practical, new or real-world situations. For 'Application Text Question to Text Answer', give your output in json format like this: {'flashcardType': 'Application Text Question to Text Answer', 'question': 'You need to store user session data temporarily in a backend system. Which data structure or storage method would you use and why?', 'answer': 'An in-memory key-value store like Redis is a suitable choice because it allows fast read/write access and supports automatic expiration of session data, which is ideal for temporary session management.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Application"
    },
    // Application, Text to MCQ
    "Application Text Question to MCQ Answer":
    {"prompt": "Application questions test the ability to apply knowledge to practical, new or real-world situations. For 'Application Text Question to MCQ Answer', give your output in json format like this: {'flashcardType': 'Application Text Question to MCQ Answer', 'question': 'You are designing a web form that collects sensitive user information. Which of the following actions is most appropriate to enhance security during data transmission?', 'answer': [{'option': 'Submit the form over HTTPS using a POST request.', 'ans': true}, {'option': 'Use a GET request to submit the form for better speed.', 'ans': false}, {'option': 'Minify the HTML to make the source code harder to read.', 'ans': false}, {'option': 'Store the data in cookies for quick access.', 'ans': false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Application"
    },
    // Application, Text to Voice
    "Application Text Question to Voice Answer":
    {"prompt": "Application questions test the ability to apply knowledge to practical, new or real-world situations. For 'Application Text Question to Voice Answer', give your output in json format like this: {'flashcardType': 'Application Text Question to Voice Answer', 'question': 'You're tasked with improving the performance of a REST API that's experiencing high latency under load. What practical steps would you take to identify and address the issue?', 'answer': ''}",
      "questionType": "text",
      "answerType": "voice",
      "cognitiveQnType": "Application"
    },
    // Analysis, Text to Text
    "Analysis Text Question to Text Answer":
    {"prompt": "Analysis questions test the ability to break down complex problems into smaller parts and examining relationships. For 'Analysis Text Question to Text Answer', give your output in json format like this: {'flashcardType': 'Analysis Text Question to Text Answer', 'question': 'A/B testing shows that a new checkout page leads to fewer completed purchases, even though users reach the payment step faster. How would you analyze this outcome?', 'answer': 'I would examine the user journey in detail, focusing on where users drop off in the new flow. I'd analyze session recordings, funnel data, and form abandonment rates. It's possible the faster flow introduces usability issues, confusion, or trust concerns. I'd compare error rates, field validation behavior, and loading times. I'd also look at qualitative feedback or surveys to understand user perception.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Analysis"
    },
    "Analysis Text Question to MCQ Answer":
    {"prompt": "Analysis questions test the ability to break down complex problems into smaller parts and examining relationships. For 'Analysis Text Question to MCQ Answer', give your output in json format like this: {'flashcardType': 'Analysis Text Question to MCQ Answer', 'question': 'Your team is investigating why a newly deployed feature has caused page load times to increase significantly. What is the most logical next step in the analysis process?', 'answer': [{'option': 'Roll back the deployment immediately.', 'ans': false}, {'option': 'Profile the frontend and backend performance to locate specific bottlenecks.', 'ans': true}, {'option': 'Increase the server capacity and observe the results.', 'ans': false}, {'option': 'Switch to a different frontend framework.', 'ans': 'false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Analysis"
    },
    // Analysis, Text to Voice
    "Analysis Text Question to Voice Answer":
    {"prompt": "Analysis questions test the ability to break down complex problems into smaller parts and examining relationships. For 'Analysis Text Question to Voice Answer', give your output in json format like this: {'flashcardType': 'Analysis Text Question to Voice Answer', 'question': 'You're noticing frequent timeouts when users access your application during peak hours. How would you go about identifying the root cause of the issue?', 'answer': ''}",
      "questionType": "text",
      "answerType": "voice",
      "cognitiveQnType": "Analysis"
    },
    // Synthesis, Text to Text
    "Synthesis Text Question to Text Answer":
    {"prompt": "Synthesis questions test the ability to combine or integrate different pieces of information to create a new, coherent whole, or propose solutions. For 'Synthesis Text Question to Text Answer', give your output in json format like this: {'flashcardType': 'Synthesis Text Question to Text Answer', 'question': 'Design a scalable notification system that can send emails, SMS, and push notifications to millions of users. What key components would you include and how would they interact?', 'answer': 'I would design the system with a message queue to handle high throughput, a notification service that processes messages and sends them via appropriate channels (email, SMS, push). The system would use microservices for each notification type, a database to track delivery status, and rate limiting to prevent overload. Load balancers and auto-scaling groups would ensure availability and scalability.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Synthesis"
    },
    // Synthesis, Text to MCQ
    "Synthesis Text Question to MCQ Answer":
    {"prompt": "Synthesis questions test the ability to combine or integrate different pieces of information to create a new, coherent whole, or propose solutions. For 'Synthesis Text Question to MCQ Answer', give your output in json format like this: {'flashcardType': 'Synthesis Text Question to MCQ Answer', 'question': 'You need to design a system that aggregates real-time data from multiple sensors and provides analytics dashboards. Which design choice best balances scalability, reliability, and latency?', 'answer': [{'option': 'Use a centralized database where all sensor data is written synchronously.', 'ans': false}, {'option': 'Store data locally on each sensor and batch upload at the end of the day.', 'ans': false}, {'option': 'Use client-side processing for all analytics to reduce server load.', 'ans': false}, {'option': 'Implement distributed message queues with microservices processing data asynchronously.', 'ans': true}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Synthesis"
    },
    // Synthesis, Text to Voice
    "Synthesis Text Question to Voice Answer":
    {"prompt": "Synthesis questions test the ability to combine or integrate different pieces of information to create a new, coherent whole, or propose solutions. For 'Synthesis Text Question to Voice Answer', give your output in json format like this: {'flashcardType': 'Synthesis Text Question to Voice Answer', 'question': 'Design a system that can handle real-time chat for millions of users, ensuring message delivery, scalability, and data consistency. Describe the key components and how they interact.', 'answer': ''}",
      "questionType": "text",
      "answerType": "voice",
      "cognitiveQnType": "Synthesis"
    },
    // Evaluation, Text to Text
    "Evaluation Text Question to Text Answer":
    {"prompt": "Evaluation questions test the ability to assess the quality, accuracy, or effectiveness of something, and making judgements based on criteria and justifying decisions. For 'Evaluation Text Question to Text Answer', give your output in json format like this: {'flashcardType': 'Evaluation Text Question to Text Answer', 'question': 'You're choosing between SQL and NoSQL databases for a high-traffic e-commerce platform. Which would you choose and why?', 'answer': 'For an e-commerce platform, a SQL database is often a better choice due to the need for strong consistency, complex transactions, and structured relational data such as orders, inventory, and users. However, if scalability and flexibility are more important—such as for handling product reviews or session data—a NoSQL solution like MongoDB or DynamoDB could be integrated alongside SQL in a polyglot architecture.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Evaluation"
    },
    // Evaluation, Text to MCQ
    "Evaluation Text Question to MCQ Answer":
    {"prompt": "Evaluation questions test the ability to assess the quality, accuracy, or effectiveness of something, and making judgements based on criteria and justifying decisions. For 'Evaluation Text Question to MCQ Answer', give your output in json format like this: {'flashcardType': 'Evaluation Text Question to MCQ Answer', 'question': 'You are reviewing two possible frontend frameworks for a large-scale enterprise web app: React and Angular. Which of the following is the most reasonable basis for choosing React over Angular?', 'answer': [{'option': 'React requires no learning curve, so it's always better.', 'ans': false}, {'option': 'React enforces a strict application structure, which is ideal for large teams.', 'ans': false}, {'option': 'React's component-based architecture and large ecosystem provide flexibility and ease of integration with other libraries.', 'ans': true}, {'option': 'Angular is not maintained anymore, so React is the only viable option.', 'ans': false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Evaluation"
    },
    // Evaluation, Text to Voice
    "Evaluation Text Question to Voice Answer":
    {"prompt": "Evaluation questions test the ability to assess the quality, accuracy, or effectiveness of something, and making judgements based on criteria and justifying decisions. For 'Evaluation Text Question to Voice Answer', give your output in json format like this: {'flashcardType': 'Evaluation Text Question to Voice Answer', 'question': 'Your team is deciding between building a feature in-house or using a third-party SaaS solution. What factors would you evaluate to make a recommendation, and what would guide your final decision?', 'answer': ''}",
      "questionType": "text",
      "answerType": "voice",
      "cognitiveQnType": "Evaluation"
    },
    // Problem-Solving, Text to Text
    "Problem-Solving Text Question to Text Answer":
    {"prompt": "Problem-solving questions focus on identifying, diagnosing and resolcing complex issues, and often require creative or strategic thinking. For 'Problem-Solving Text Question to Text Answer', give your output in json format like this: {'flashcardType': 'Problem-Solving Text Question to Text Answer', 'question': 'You're building a search feature that needs to return relevant results quickly, even as the dataset grows. How would you approach designing this system to maintain fast performance?', 'answer': 'I would start by indexing the searchable fields using a full-text search engine like Elasticsearch or integrating database indexing strategies. To improve performance, I'd paginate results, use caching for frequent queries, and consider denormalizing data for faster reads. Additionally, I'd monitor query times and adjust indexing or shard data if needed as the dataset grows.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Problem-Solving"
    },
    // Problem-Solving, Text to MCQ
    "Problem-Solving Text Question to MCQ Answer":
    {"prompt": "Problem-solving questions focus on identifying, diagnosing and resolcing complex issues, and often require creative or strategic thinking. For 'Problem-Solving Text Question to MCQ Answer', give your output in json format like this: {'flashcardType': 'Problem-Solving Text Question to MCQ Answer', 'question': 'Your mobile app is crashing randomly for some users, but you can't reproduce the issue on your devices. What is the best first step to diagnose the problem?', 'answer': [{'option': 'Ask users to delete and reinstall the app.', 'ans': false}, {'option': 'Push an emergency update with minimal changes.', 'ans': false}, {'option': 'Check crash logs and analytics tools like Firebase Crashlytics to identify patterns.', 'ans': true}, {'option': 'Disable features until the crashes stop.', 'ans': false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Problem-Solving"
    },
    // Problem-Solving, Text to Voice
    "Problem-Solving Text Question to Voice Answer":
    {"prompt": "Problem-solving questions focus on identifying, diagnosing and resolcing complex issues, and often require creative or strategic thinking. For 'Problem-Solving Text Question to Voice Answer', give your output in json format like this: {'flashcardType': 'Problem-Solving Text Question to Voice Answer', 'question': 'A critical feature in your web application intermittently fails under high traffic, but no errors appear in the logs. How would you approach identifying and resolving the issue?', 'answer': ''}",
      "questionType": "text",
      "answerType": "voice",
      "cognitiveQnType": "Problem-Solving"
    }
}

export const promptAndDataChinese = {
    // Recall, Text to Text
    "Recall Text Question to Text Answer":
    {"prompt": "回忆问题测试记忆，通过询问具体事实、定义或信息来测试。对于 'Recall Text Question to Text Answer', 请以如下 JSON 格式输出结果： {'flashcardType': 'Recall Text Question to Text Answer', 'question': 'DNS（域名系统）服务器的主要作用是什么？', 'answer': 'DNS 服务器将人类可读的域名（例如 www.example.com）转换为计算机在网络中相互识别所使用的 IP 地址。'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Recall"
    },
    // Recall, Text to MCQ
    "Recall Text Question to MCQ Answer":
    {"prompt": "回忆问题测试记忆，通过询问具体事实、定义或信息来测试。对于 'Recall Text Question to MCQ Answer', 请以如下 JSON 格式输出结果： {'flashcardType': 'Recall Text Question to MCQ Answer', 'question': '哪个 HTTP 状态码表示请求已成功？', 'answer': [{'option': '404', 'ans': false}, {'option': '500', 'ans': false}, {'option': '200', 'ans': true}, {'option': '403', 'ans': false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Recall"
    },
    // Recall, Cloze to Text
    "Recall Cloze Question to Text Answer":
    {"prompt": "回忆问题测试记忆，通过询问具体事实、定义或信息来测试。对于 'Recall Cloze Question to Text Answer', 请以如下 JSON 格式输出结果：{'flashcardType': 'Recall Cloze Question to Text Answer', 'question': '在 JavaScript 中，关键字 <blank> 用于声明具有块作用域且不可重新赋值的变量。', 'answer': 'const'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Recall"
    },
    // Recall, Cloze to MCQ
    "Recall Cloze Question to MCQ Answer":
    {"prompt": "回忆问题测试记忆，通过询问具体事实、定义或信息来测试。对于 'Recall Cloze Question to MCQ Answer', 请以如下 JSON 格式输出结果： {'flashcardType': 'Recall Cloze Question to MCQ Answer', 'question': '在 SQL 中，<blank> 命令用于在不记录每一行删除操作的情况下删除表中的所有记录。', 'answer': [{'option': 'DELETE', 'ans': false}, {'option': 'TRUNCATE', 'ans': true}, {'option': 'REMOVE', 'ans': false}, {'option': 'DROP', 'ans': false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Recall"
    },
    // Comprehension, Text to Text
    "Comprehension Text Question to Text Answer":
    {"prompt": "理解问题测试理解，通过询问解释、解释、总结或比较来测试。对于 'Comprehension Text Question to Text Answer', 请以如下 JSON 格式输出结果： {'flashcardType': 'Comprehension Text Question to Text Answer', 'question': '请解释在编程中浅拷贝和深拷贝之间的区别。', 'answer': '浅拷贝只复制对象的顶层引用，这意味着嵌套的对象仍然是共享的。深拷贝会递归地复制所有嵌套的对象，从而创建出与原始结构完全独立的副本。'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Comprehension"
    },
    // Comprehension, Text to MCQ
    "Comprehension Text Question to MCQ Answer":
    {"prompt": "理解问题测试理解，通过询问解释、解释、总结或比较来测试。对于 'Comprehension Text Question to MCQ Answer', 请以如下 JSON 格式输出结果： {'flashcardType': 'Comprehension Text Question to MCQ Answer', 'question': '以下哪项最能解释 HTTP 和 HTTPS 之间的区别？', 'answer': [{'option': 'HTTPS 使用 80 端口，而 HTTP 使用 443 端口。', 'ans': false}, {'option': 'HTTP 在传输过程中加密数据，而 HTTPS 不加密。', 'ans': false}, {'option': 'HTTP 和 HTTPS 之间没有实质性区别。', 'ans': false}, {'option': 'HTTPS 通过 SSL/TLS 添加加密层来保护数据传输，而 HTTP 不加密。', 'ans': true}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Comprehension"
    },
    // Comprehension, Text to Voice
    "Comprehension Text Question to Voice Answer":
    {"prompt": "理解问题测试理解，通过询问解释、解释、总结或比较来测试。对于 'Comprehension Text Question to Voice Answer', 请以如下 JSON 格式输出结果： {'flashcardType': 'Comprehension Text Question to Voice Answer', 'question': '负载均衡器如何提高 Web 应用程序的可靠性和可扩展性？', 'answer': ''}",
      "questionType": "text",       
      "answerType": "voice",
      "cognitiveQnType": "Comprehension"
    },
    // Application, Text to Text
    "Application Text Question to Text Answer":
    {"prompt": "应用问题测试将知识应用于实际、新或现实世界的情况。对于 'Application Text Question to Text Answer', 请以如下 JSON 格式输出结果： {'flashcardType': 'Application Text Question to Text Answer', 'question': '您需要将用户会话数据暂时存储在后台系统中。您会选择哪种数据结构或存储方法，并解释原因。', 'answer': '使用 Redis 等内存键值存储是一个合适的选择，因为它允许快速读写访问，并支持会话数据的自动过期，这非常适合临时会话管理。'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Application"
    },
    // Application, Text to MCQ
    "Application Text Question to MCQ Answer":
    {"prompt": "应用问题测试将知识应用于实际、新或现实世界的情况。对于 'Application Text Question to MCQ Answer', 请以如下 JSON 格式输出结果： {'flashcardType': 'Application Text Question to MCQ Answer', 'question': '您正在设计一个收集敏感用户信息的网页表单。以下哪项操作最有助于在数据传输过程中增强安全性？', 'answer': [{'option': '使用 HTTPS 通过 POST 请求提交表单。', 'ans': true}, {'option': '使用 GET 请求提交表单以提高速度。', 'ans': false}, {'option': '压缩 HTML 以使源代码更难读取。', 'ans': false}, {'option': '将数据存储在 cookies 中以快速访问。', 'ans': false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Application"
    },
    // Application, Text to Voice
    "Application Text Question to Voice Answer":
    {"prompt": "应用问题测试将知识应用于实际、新或现实世界的情况。对于 'Application Text Question to Voice Answer', 请以如下 JSON 格式输出结果： {'flashcardType': 'Application Text Question to Voice Answer', 'question': '您被分配了一个 REST API，它在负载下经历了高延迟。您会采取哪些实际步骤来识别和解决这个问题？', 'answer': ''}",
      "questionType": "text",
      "answerType": "voice",
      "cognitiveQnType": "Application"
    },
    // Analysis, Text to Text
    "Analysis Text Question to Text Answer":
    {"prompt": "分析问题涉及将信息分解成部分并检查其关系。对于 'Analysis Text Question to Text Answer', 请以如下 JSON 格式输出结果： {'flashcardType': 'Analysis Text Question to Text Answer', 'question': 'A/B 测试显示，新的结账页面虽然用户更快地到达支付步骤，但完成的购买数量却更少。您会如何分析这一结果？', 'answer': '我会详细分析用户旅程，重点关注用户在新流程中在哪里流失。我会分析会话记录、漏斗数据和表单放弃率。可能是因为新流程引入了可用性问题、混淆或信任问题。我会比较错误率、字段验证行为和加载时间。我还会查看定性反馈或调查以了解用户感知。'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Analysis"
    },
    // Analysis, Text to MCQ
    "Analysis Text Question to MCQ Answer":
    {"prompt": "分析问题涉及将信息分解成部分并检查其关系。对于  'Analysis Text Question to MCQ Answer', 请以如下 JSON 格式输出结果： {'flashcardType': 'Analysis Text Question to MCQ Answer', 'question': '你的团队正在调查为何新部署的功能导致页面加载时间显著增加。分析过程中最合理的下一步是什么？', 'answer': [{'option': '立即回滚部署。', 'ans': false}, {'option': '切换到另一个前端框架。', 'ans': false}, {'option': '分析前端和后端的性能，定位具体的瓶颈。', 'ans': true}, {'option': '增加服务器容量并观察结果。', 'ans': false}]}",
        "questionType": "text",
        "answerType": "mcq",
        "cognitiveQnType": "Analysis"
    },
    // Analysis, Text to Voice
    "Analysis Text Question to Voice Answer":
    {"prompt": "分析问题涉及将信息分解成部分并检查其关系。对于  'Analysis Text Question to Voice Answer', 请以如下 JSON 格式输出结果： {'flashcardType': 'Analysis Text Question to Voice Answer', 'question': '您注意到用户在高峰时段访问您的应用程序时经常超时。您会采取哪些步骤来识别问题的根本原因？', 'answer': ''}",
      "questionType": "text",
      "answerType": "voice",
      "cognitiveQnType": "Analysis"
    },
    // Synthesis, Text to Text
    "Synthesis Text Question to Text Answer":
    {"prompt": "综合问题涉及将多个想法组合形成新的整体或提出解决方案。对于 'Synthesis Text Question to Text Answer', 请以如下 JSON 格式输出结果：{'flashcardType': 'Synthesis Text Question to Text Answer', 'question': '设计一个可扩展的通知系统，能够向数百万用户发送电子邮件、短信和推送通知。您会包括哪些关键组件，以及它们如何交互？', 'answer': '我会设计一个系统，使用消息队列处理高吞吐量，一个通知服务处理消息并通过适当通道（电子邮件、短信、推送）发送。该系统会为每种通知类型使用微服务，一个数据库跟踪交付状态，以及速率限制以防止过载。负载均衡器和自动伸缩组将确保可用性和可扩展性。'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Synthesis"
    },
    // Synthesis, Text to MCQ
    "Synthesis Text Question to MCQ Answer":
    {"prompt": "综合问题涉及将多个想法组合形成新的整体或提出解决方案。对于  'Synthesis Text Question to MCQ Answer', 请以如下 JSON 格式输出结果： {'flashcardType': 'Synthesis Text Question to MCQ Answer', 'question': '您需要设计一个系统，从多个传感器收集实时数据并提供分析仪表板。哪种设计选择最能平衡可扩展性、可靠性和延迟？', 'answer': [{'option': '使用集中式数据库，所有传感器数据同步写入。', 'ans': false}, {'option': '在每个传感器上本地存储数据，并在一天结束时批量上传。', 'ans': false}, {'option': '使用客户端处理所有分析以减少服务器负载。', 'ans': false}, {'option': '实现分布式消息队列，使用微服务异步处理数据。', 'ans': true}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Synthesis"
    },
    // Synthesis, Text to Voice
    "Synthesis Text Question to Voice Answer":
    {"prompt": "综合问题涉及将多个想法组合形成新的整体或提出解决方案。对于  'Synthesis Text Question to Voice Answer', 请以如下 JSON 格式输出结果： {'flashcardType': 'Synthesis Text Question to Voice Answer', 'question': '设计一个系统，能够处理数百万用户的实时聊天，确保消息传递、可扩展性和数据一致性。描述关键组件及其交互。', 'answer': ''}",
      "questionType": "text",
      "answerType": "voice",
      "cognitiveQnType": "Synthesis"
    },
    // Evaluation, Text to Text
    "Evaluation Text Question to Text Answer":
    {"prompt": "评价问题要求基于标准做出判断并给出理由。对于 'Evaluation Text Question to Text Answer', 请以如下 JSON 格式输出结果： {'flashcardType': 'Evaluation Text Question to Text Answer', 'question': '您正在为高流量电子商务平台选择 SQL 和 NoSQL 数据库。您会选择哪个，并解释原因？', 'answer': '对于电子商务平台，SQL 数据库通常是更好的选择，因为需要强一致性、复杂交易和结构化关系数据（如订单、库存和用户）。然而，如果可扩展性和灵活性更重要（例如处理产品评论或会话数据），可以在多语言架构中集成 MongoDB 或 DynamoDB 等 NoSQL 解决方案。'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Evaluation"
    },
    // Evaluation, Text to MCQ
    "Evaluation Text Question to MCQ Answer":
    {"prompt": "评价问题要求基于标准做出判断并给出理由。对于 'Evaluation Text Question to MCQ Answer', 请以如下 JSON 格式输出结果： {'flashcardType': 'Evaluation Text Question to MCQ Answer', 'question': '您正在为大型企业 Web 应用程序选择两个可能的前端框架：React 和 Angular。以下哪个是选择 React 而非 Angular 的最合理依据？', 'answer': [{'option': 'React 不需要学习曲线，所以总是更好。', 'ans': false}, {'option': 'React 强制实施严格的应用程序结构，这对于大型团队来说很理想。', 'ans': false}, {'option': 'React 的组件化架构和庞大的生态系统提供了灵活性和与其他库的轻松集成。', 'ans': true}, {'option': 'Angular 不再维护，所以 React 是唯一可行的选项。', 'ans': false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Evaluation"
    },
    // Evaluation, Text to Voice
    "Evaluation Text Question to Voice Answer":
    {"prompt": "评价问题要求基于标准做出判断并给出理由。对于 'Evaluation Text Question to Voice Answer', 请以如下 JSON 格式输出结果：{'flashcardType': 'Evaluation Text Question to Voice Answer', 'question': '您的团队正在决定是构建内部功能还是使用第三方 SaaS 解决方案。您会评估哪些因素来做出推荐，以及什么因素会引导您的最终决策？', 'answer': ''}",
      "questionType": "text",
      "answerType": "voice",
      "cognitiveQnType": "Evaluation"
    },
    // Problem-Solving, Text to Text
    "Problem-Solving Text Question to Text Answer":
    {"prompt": "解决问题侧重于识别、诊断和解决复杂问题。对于 'Problem-Solving Text Question to Text Answer', 请以如下 JSON 格式输出结果： {'flashcardType': 'Problem-Solving Text Question to Text Answer', 'question': '您正在构建一个搜索功能，需要快速返回相关结果，即使数据集不断增长。您会如何设计这个系统以保持快速性能？', 'answer': '我会开始使用全文本搜索引擎（如 Elasticsearch）或数据库索引策略来索引可搜索字段。为了提高性能，我会分页结果，使用缓存处理频繁查询，并考虑非规范化数据以更快地读取。此外，我会监控查询时间并根据需要调整索引或分片数据。'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Problem-Solving"
    },
    // Problem-Solving, Text to MCQ
    "Problem-Solving Text Question to MCQ Answer":
    {"prompt": "解决问题侧重于识别、诊断和解决复杂问题。对于 'Problem-Solving Text Question to MCQ Answer', 请以如下 JSON 格式输出结果： {'flashcardType': 'Problem-Solving Text Question to MCQ Answer', 'question': '您的移动应用程序随机崩溃，但您无法在设备上重现该问题。诊断问题的最佳第一步是什么？', 'answer': [{'option': '要求用户删除并重新安装应用程序。', 'ans': false}, {'option': '推送紧急更新，但只进行最小更改。', 'ans': false}, {'option': '检查崩溃日志和分析工具（如 Firebase Crashlytics）以识别模式。', 'ans': true}, {'option': '禁用功能，直到崩溃停止。', 'ans': false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Problem-Solving"
    },
    // Problem-Solving, Text to Voice
    "Problem-Solving Text Question to Voice Answer":
    {"prompt": "解决问题侧重于识别、诊断和解决复杂问题。对于 'Problem-Solving Text Question to Voice Answer', 请以如下 JSON 格式输出结果： {'flashcardType': 'Problem-Solving Text Question to Voice Answer', 'question': '您的 Web 应用程序中的一个关键功能在高流量下间歇性失败，但日志中没有错误。您会如何识别和解决这个问题？', 'answer': ''}",
      "questionType": "text",
      "answerType": "voice",
      "cognitiveQnType": "Problem-Solving"
    }
}

export const promptAndDataAfrikaans = {
    // Recall, Text to Text
    "Recall Text Question to Text Answer":
    {"prompt": "Herroepingsvrae toets geheue deur spesifieke feite, definisies of inligting te vra. Vir 'Recall Text Question to Text Answer', gee jou uitset in json-formaat soos volg: {'flashcardType': 'Recall Text Question to Text Answer', 'question': 'Wat is die primêre doel van 'n DNS (Domain Name System) bediener?', 'answer': 'A DNS-bediener vertaal mensleesbare domeinname (soos www.example.com) na IP-adresse wat rekenaars gebruik om mekaar op die netwerk te identifiseer.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Recall"
    },
    // Recall, Text to MCQ
    "Recall Text Question to MCQ Answer":
    {"prompt": "Herroepingsvrae toets geheue deur spesifieke feite, definisies of inligting te vra. Vir 'Recall Text Question to MCQ Answer', gee jou uitset in json-formaat soos volg: {'flashcardType': 'Recall Text Question to MCQ Answer', 'question': 'Watter HTTP-statuskode dui aan dat 'n versoek suksesvol was?', 'answer': [{'option': '404', 'ans': false}, {'option': '500', 'ans': false}, {'option': '200', 'ans': true}, {'option': '403', 'ans': false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Recall"
    },
    // Recall, Cloze to Text
    "Recall Cloze Question to Text Answer":
    {"prompt": "Herroepingsvrae toets geheue deur spesifieke feite, definisies of inligting te vra. Vir 'Recall Cloze Question to Text Answer', gee jou uitset in json-formaat soos volg: {'flashcardType': 'Recall Cloze Question to Text Answer', 'question': 'In JavaScript word die <blank> sleutelwoord gebruik om 'n veranderlike met blokomvang te verklaar en hertoekenning te voorkom.', 'answer': 'const'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Recall"
    },
    // Recall, Cloze to MCQ
    "Recall Cloze Question to MCQ Answer":
    {"prompt": "Herroepingsvrae toets geheue deur spesifieke feite, definisies of inligting te vra. Vir 'Recall Cloze Question to MCQ Answer', gee jou uitset in json-formaat soos volg: {'flashcardType': 'Recall Cloze Question to MCQ Answer', 'question': 'In SQL word die <blank> opdrag gebruik om alle rekords van 'n tabel te verwyder sonder om individuele ryverwyerings te log.', 'answer': [{'option': 'DELETE', 'ans': false}, {'option': 'TRUNCATE', 'ans': true}, {'option': 'REMOVE', 'ans': false}, {'option': 'DROP', 'ans': false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Recall"
    },
    // Comprehension, Text to Text
    "Comprehension Text Question to Text Answer":
    {"prompt": "Begripsvrae toets begrip deur verduidelikings, interpretasies, opsommings of vergelykings te vra. Vir 'Comprehension Text Question to Text Answer', gee jou uitset in json-formaat soos volg: {'flashcardType': 'Comprehension Text Question to Text Answer', 'question': 'Verduidelik die verskil tussen 'n vlak kopie en 'n diep kopie in programmering.', 'answer': 'A vlak kopie kopieer slegs die boonste vlak verwysings van 'n objek, wat beteken dat geneste voorwerpe steeds gedeel word. A diep kopie kopieer rekursief alle geneste voorwerpe, wat heeltemal onafhanklike duplikate van die oorspronklike struktuur skep.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Comprehension"
    },
    // Comprehension, Text to MCQ
    "Comprehension Text Question to MCQ Answer":
    {"prompt": "Begripsvrae toets begrip deur verduidelikings, interpretasies, opsommings of vergelykings te vra. Vir 'Comprehension Text Question to MCQ Answer', gee jou uitset in json-formaat soos volg: {'flashcardType': 'Comprehension Text Question to MCQ Answer', 'question': 'Wat verduidelik die beste die verskil tussen HTTP en HTTPS?', 'answer': [{'option': 'HTTPS gebruik poort 80, terwyl HTTP poort 443 gebruik.', 'ans': false}, {'option': 'HTTP enkripteer data tydens transmissie, terwyl HTTPS nie.', 'ans': false}, {'option': 'Daar is geen werklike verskil tussen HTTP en HTTPS nie.', 'ans': false}, {'option': 'HTTPS voeg 'n laag enkripsie via SSL/TLS toe om datatransmissie te beveilig, anders as HTTP.', 'ans': true}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Comprehension"
    },
    // Comprehension, Text to Voice
    "Comprehension Text Question to Voice Answer":
    {"prompt": "Begripsvrae toets begrip deur verduidelikings, interpretasies, opsommings of vergelykings te vra. Vir 'Comprehension Text Question to Voice Answer', gee jou uitset in json-formaat soos volg: {'flashcardType': 'Comprehension Text Question to Voice Answer', 'question': 'Hoe verbeter 'n lasbalanseerder die betroubaarheid en skaalbaarheid van 'n webtoepassing?', 'answer': ''}",
      "questionType": "text",       
      "answerType": "voice",
      "cognitiveQnType": "Comprehension"
    },
    // Application, Text to Text
    "Application Text Question to Text Answer":
    {"prompt": "Toepassingsvrae toets die vermoë om kennis toe te pas op praktiese, nuwe of werklike situasies. Vir 'Application Text Question to Text Answer', gee jou uitset in json-formaat soos volg: {'flashcardType': 'Application Text Question to Text Answer', 'question': 'Jy moet gebruikersessiedata tydelik in 'n agtergrondsisteem stoor. Watter datastruktuur of stoor metode sou jy gebruik en waarom?', 'answer': 'A geheue-sleutelwaarde stoor soos Redis is 'n geskikte keuse omdat dit vinnige lees/skryf toegang toelaat en outomatiese verval van sessiedata ondersteun, wat ideaal is vir tydelike sessiebestuur.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Application"
    },
    // Application, Text to MCQ
    "Application Text Question to MCQ Answer":
    {"prompt": "Toepassingsvrae toets die vermoë om kennis toe te pas op praktiese, nuwe of werklike situasies. Vir 'Application Text Question to MCQ Answer', gee jou uitset in json-formaat soos volg: {'flashcardType': 'Application Text Question to MCQ Answer', 'question': 'Jy ontwerp 'n webvorm wat sensitiewe gebruikersinligting versamel. Watter van die volgende aksies is die mees toepaslike om sekuriteit tydens datatransmissie te verbeter?', 'answer': [{'option': 'Dien die vorm oor HTTPS in met 'n POST-versoek.', 'ans': true}, {'option': 'Gebruik 'n GET-versoek om die vorm vir beter spoed in te dien.', 'ans': false}, {'option': 'Minifiseer die HTML om die bronkode moeiliker leesbaar te maak.', 'ans': false}, {'option': 'Stoor die data in koekies vir vinnige toegang.', 'ans': false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Application"
    },
    // Application, Text to Voice
    "Application Text Question to Voice Answer":
    {"prompt": "Toepassingsvrae toets die vermoë om kennis toe te pas op praktiese, nuwe of werklike situasies. Vir 'Application Text Question to Voice Answer', gee jou uitset in json-formaat soos volg: {'flashcardType': 'Application Text Question to Voice Answer', 'question': 'Jy is belas met die verbetering van die prestasie van 'n REST API wat hoë vertraging onder las ervaar. Watter praktiese stappe sou jy neem om die probleem te identifiseer en aan te spreek?', 'answer': ''}",
      "questionType": "text",
      "answerType": "voice",
      "cognitiveQnType": "Application"
    },
    // Analysis, Text to Text
    "Analysis Text Question to Text Answer":
    {"prompt": "Analisevrae toets die vermoë om komplekse probleme in kleiner dele op te breek en verhoudings te ondersoek. Vir 'Analysis Text Question to Text Answer', gee jou uitset in json-formaat soos volg: {'flashcardType': 'Analysis Text Question to Text Answer', 'question': 'A/B-toetsing toon dat 'n nuwe betaalbladsy tot minder voltooide aankope lei, selfs al bereik gebruikers die betalingsstap vinniger. Hoe sou jy hierdie uitkoms analiseer?', 'answer': 'Ek sou die gebruikersreis in detail ondersoek, met fokus op waar gebruikers in die nuwe vloei afval. Ek sou sessieopnames, tregterdata en vormverlatingstempo's analiseer. Dit is moontlik dat die vinniger vloei bruikbaarheidsprobleme, verwarring of vertrouenskwessies inbring. Ek sou fouttempo's, veldvalidasiegedrag en laaitye vergelyk. Ek sou ook kwalitatiewe terugvoer of opnames bekyk om gebruikerspersepsie te verstaan.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Analysis"
    },
    "Analysis Text Question to MCQ Answer":
    {"prompt": "Analisevrae toets die vermoë om komplekse probleme in kleiner dele op te breek en verhoudings te ondersoek. Vir 'Analysis Text Question to MCQ Answer', gee jou uitset in json-formaat soos volg: {'flashcardType': 'Analysis Text Question to MCQ Answer', 'question': 'Jou span ondersoek waarom 'n nuut ontplooide funksie bladsy laaitye aansienlik laat toeneem het. Wat is die mees logiese volgende stap in die analiseproses?', 'answer': [{'option': 'Rol die ontplooiing onmiddellik terug.', 'ans': false}, {'option': 'Profilieer die voorgrond en agtergrondprestasie om spesifieke knelpunte te lokaliseer.', 'ans': true}, {'option': 'Vermeerder die bedienerkapasiteit en neem die resultate waar.', 'ans': false}, {'option': 'Skakel oor na 'n ander voorgrondraamwerk.', 'ans': false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Analysis"
    },
    // Analysis, Text to Voice
    "Analysis Text Question to Voice Answer":
    {"prompt": "Analisevrae toets die vermoë om komplekse probleme in kleiner dele op te breek en verhoudings te ondersoek. Vir 'Analysis Text Question to Voice Answer', gee jou uitset in json-formaat soos volg: {'flashcardType': 'Analysis Text Question to Voice Answer', 'question': 'Jy merk gereelde tydperke op wanneer gebruikers jou toepassing tydens spitsure toegang. Hoe sou jy te werk gaan om die oorsaak van die probleem te identifiseer?', 'answer': ''}",
      "questionType": "text",
      "answerType": "voice",
      "cognitiveQnType": "Analysis"
    },
    // Synthesis, Text to Text
    "Synthesis Text Question to Text Answer":
    {"prompt": "Sintesevrae toets die vermoë om verskillende stukke inligting te kombineer of te integreer om 'n nuwe, samehangende geheel te skep, of oplossings voor te stel. Vir 'Synthesis Text Question to Text Answer', gee jou uitset in json-formaat soos volg: {'flashcardType': 'Synthesis Text Question to Text Answer', 'question': 'Ontwerp 'n skaalbare kennisgewingsisteem wat e-posse, SMS'e en stootkennisgewings aan miljoene gebruikers kan stuur. Watter sleutelkomponente sou jy insluit en hoe sou hulle interaksie hê?', 'answer': 'Ek sou die sisteem ontwerp met 'n boodskapry om hoë deurset te hanteer, 'n kennisgewingsdiens wat boodskappe verwerk en via toepaslike kanale (e-pos, SMS, stoot) stuur. Die sisteem sou mikrodienste vir elke kennisgewingstipe gebruik, 'n databasis om afleweringsstatus te volg, en tempo beperking om oorlading te voorkom. Lasbalanseerders en outomatiese skaalgroepe sal beskikbaarheid en skaalbaarheid verseker.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Synthesis"
    },
    // Synthesis, Text to MCQ
    "Synthesis Text Question to MCQ Answer":
    {"prompt": "Sintesevrae toets die vermoë om verskillende stukke inligting te kombineer of te integreer om 'n nuwe, samehangende geheel te skep, of oplossings voor te stel. Vir 'Synthesis Text Question to MCQ Answer', gee jou uitset in json-formaat soos volg: {'flashcardType': 'Synthesis Text Question to MCQ Answer', 'question': 'Jy moet 'n sisteem ontwerp wat intydse data van verskeie sensors aggregeer en analitiese dashboards verskaf. Watter ontwerpkeuse balanseer skaalbaarheid, betroubaarheid en vertraging die beste?', 'answer': [{'option': 'Gebruik 'n gesentraliseerde databasis waar alle sensordata sinchronies geskryf word.', 'ans': false}, {'option': 'Stoor data plaaslik op elke sensor en laai dit aan die einde van die dag in groepe op.', 'ans': false}, {'option': 'Gebruik kliëntkant verwerking vir alle analise om bedienerlas te verminder.', 'ans': false}, {'option': 'Implementeer verspreide boodskaprye met mikrodienste wat data asinchronies verwerk.', 'ans': true}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Synthesis"
    },
    // Synthesis, Text to Voice
    "Synthesis Text Question to Voice Answer":
    {"prompt": "Sintesevrae toets die vermoë om verskillende stukke inligting te kombineer of te integreer om 'n nuwe, samehangende geheel te skep, of oplossings voor te stel. Vir 'Synthesis Text Question to Voice Answer', gee jou uitset in json-formaat soos volg: {'flashcardType': 'Synthesis Text Question to Voice Answer', 'question': 'Ontwerp 'n sisteem wat intydse klets vir miljoene gebruikers kan hanteer, met versekering van boodskapaflewering, skaalbaarheid en datakonsekwentheid. Beskryf die sleutelkomponente en hoe hulle interaksie hê.', 'answer': ''}",
      "questionType": "text",
      "answerType": "voice",
      "cognitiveQnType": "Synthesis"
    },
    // Evaluation, Text to Text
    "Evaluation Text Question to Text Answer":
    {"prompt": "Evaluasievrae toets die vermoë om die kwaliteit, akkuraatheid of doeltreffendheid van iets te assesseer, en oordele te maak gebaseer op kriteria en besluite te regverdig. Vir 'Evaluation Text Question to Text Answer', gee jou uitset in json-formaat soos volg: {'flashcardType': 'Evaluation Text Question to Text Answer', 'question': 'Jy kies tussen SQL en NoSQL databasisse vir 'n hoë verkeer e-handelsplatform. Watter een sou jy kies en waarom?', 'answer': 'Vir 'n e-handelsplatform is 'n SQL-databasis dikwels 'n beter keuse as gevolg van die behoefte aan sterk konsekwentheid, komplekse transaksies en gestruktureerde verwantskapsdata soos bestellings, voorraad en gebruikers. As skaalbaarheid en buigsaamheid egter belangriker is—soos vir die hantering van produkresensies of sessiedata—kan 'n NoSQL-oplossing soos MongoDB of DynamoDB saam met SQL in 'n poligloot argitektuur geïntegreer word.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Evaluation"
    },
    // Evaluation, Text to MCQ
    "Evaluation Text Question to MCQ Answer":
    {"prompt": "Evaluasievrae toets die vermoë om die kwaliteit, akkuraatheid of doeltreffendheid van iets te assesseer, en oordele te maak gebaseer op kriteria en besluite te regverdig. Vir 'Evaluation Text Question to MCQ Answer', gee jou uitset in json-formaat soos volg: {'flashcardType': 'Evaluation Text Question to MCQ Answer', 'question': 'Jy hersien twee moontlike voorgrondraamwerke vir 'n grootskaalse onderneming webtoepassing: React en Angular. Watter van die volgende is die mees redelike basis om React bo Angular te kies?', 'answer': [{'option': 'React vereis geen leerkurwe nie, so dit is altyd beter.', 'ans': false}, {'option': 'React dwing 'n streng toepassingsstruktuur af, wat ideaal is vir groot spanne.', 'ans': false}, {'option': 'React se komponentgebaseerde argitektuur en groot ekosisteem verskaf buigsaamheid en maklike integrasie met ander biblioteke.', 'ans': true}, {'option': 'Angular word nie meer onderhou nie, so React is die enigste lewensvatbare opsie.', 'ans': false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Evaluation"
    },
    // Evaluation, Text to Voice
    "Evaluation Text Question to Voice Answer":
    {"prompt": "Evaluasievrae toets die vermoë om die kwaliteit, akkuraatheid of doeltreffendheid van iets te assesseer, en oordele te maak gebaseer op kriteria en besluite te regverdig. Vir 'Evaluation Text Question to Voice Answer', gee jou uitset in json-formaat soos volg: {'flashcardType': 'Evaluation Text Question to Voice Answer', 'question': 'Jou span besluit tussen die bou van 'n funksie in-huis of die gebruik van 'n derdeparty SaaS-oplossing. Watter faktore sou jy evalueer om 'n aanbeveling te maak, en wat sou jou finale beslissing lei?', 'answer': ''}",
      "questionType": "text",
      "answerType": "voice",
      "cognitiveQnType": "Evaluation"
    },
    // Problem-Solving, Text to Text
    "Problem-Solving Text Question to Text Answer":
    {"prompt": "Probleemoplossingsvrae fokus op die identifisering, diagnose en oplossing van komplekse kwessies, en vereis dikwels kreatiewe of strategiese denke. Vir 'Problem-Solving Text Question to Text Answer', gee jou uitset in json-formaat soos volg: {'flashcardType': 'Problem-Solving Text Question to Text Answer', 'question': 'Jy bou 'n soekfunksie wat vinnig relevante resultate moet teruggee, selfs as die datastel groei. Hoe sou jy hierdie sisteem ontwerp om vinnige prestasie te handhaaf?', 'answer': 'Ek sou begin deur die soekbare velde te indekseer met 'n volledige teks soekenjin soos Elasticsearch of databasis indekseringsstrategieë te integreer. Om prestasie te verbeter, sou ek resultate bladsy maak, kas vir gereelde navrae gebruik, en denormalisering van data vir vinniger lees oorweeg. Daarbenewens sou ek navraagtye monitor en indeksering of skaafdata aanpas indien nodig soos die datastel groei.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Problem-Solving"
    },
    // Problem-Solving, Text to MCQ
    "Problem-Solving Text Question to MCQ Answer":
    {"prompt": "Probleemoplossingsvrae fokus op die identifisering, diagnose en oplossing van komplekse kwessies, en vereis dikwels kreatiewe of strategiese denke. Vir 'Problem-Solving Text Question to MCQ Answer', gee jou uitset in json-formaat soos volg: {'flashcardType': 'Problem-Solving Text Question to MCQ Answer', 'question': 'Jou mobiele toepassing val lukraak vir sommige gebruikers neer, maar jy kan nie die probleem op jou toestelle reproduseer nie. Wat is die beste eerste stap om die probleem te diagnoseer?', 'answer': [{'option': 'Vra gebruikers om die toepassing te verwyder en weer te installeer.', 'ans': false}, {'option': 'Stoot 'n noodgeval opdatering met minimale veranderinge.', 'ans': false}, {'option': 'Kontroleer ineenstorting logs en analitiese gereedskap soos Firebase Crashlytics om patrone te identifiseer.', 'ans': true}, {'option': 'Deaktiveer funksies totdat die ineenstortings stop.', 'ans': false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Problem-Solving"
    },
    // Problem-Solving, Text to Voice
    "Problem-Solving Text Question to Voice Answer":
    {"prompt": "Probleemoplossingsvrae fokus op die identifisering, diagnose en oplossing van komplekse kwessies, en vereis dikwels kreatiewe of strategiese denke. Vir 'Problem-Solving Text Question to Voice Answer', gee jou uitset in json-formaat soos volg: {'flashcardType': 'Problem-Solving Text Question to Voice Answer', 'question': 'A kritieke funksie in jou webtoepassing misluk intermitterend onder hoë verkeer, maar geen foute verskyn in die logs nie. Hoe sou jy te werk gaan om die probleem te identifiseer en op te los?', 'answer': ''}",
      "questionType": "text",
      "answerType": "voice",
      "cognitiveQnType": "Problem-Solving"
    }
}

export const promptAndDataIndonesian = {
    // Recall, Text to Text
    "Recall Text Question to Text Answer":
    {"prompt": "Pertanyaan ingatan menguji memori dengan meminta fakta, definisi, atau informasi spesifik. Untuk 'Recall Text Question to Text Answer', berikan output Anda dalam format json seperti ini: {'flashcardType': 'Recall Text Question to Text Answer', 'question': 'Apa tujuan utama dari server DNS (Domain Name System)?', 'answer': 'Server DNS menerjemahkan nama domain yang dapat dibaca manusia (seperti www.example.com) ke alamat IP yang digunakan komputer untuk mengidentifikasi satu sama lain di jaringan.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Recall"
    },
    // Recall, Text to MCQ
    "Recall Text Question to MCQ Answer":
    {"prompt": "Pertanyaan ingatan menguji memori dengan meminta fakta, definisi, atau informasi spesifik. Untuk 'Recall Text Question to MCQ Answer', berikan output Anda dalam format json seperti ini: {'flashcardType': 'Recall Text Question to MCQ Answer', 'question': 'Kode status HTTP mana yang menunjukkan bahwa permintaan berhasil?', 'answer': [{'option': '404', 'ans': false}, {'option': '500', 'ans': false}, {'option': '200', 'ans': true}, {'option': '403', 'ans': false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Recall"
    },
    // Recall, Cloze to Text
    "Recall Cloze Question to Text Answer":
    {"prompt": "Pertanyaan ingatan menguji memori dengan meminta fakta, definisi, atau informasi spesifik. Untuk 'Recall Cloze Question to Text Answer', berikan output Anda dalam format json seperti ini: {'flashcardType': 'Recall Cloze Question to Text Answer', 'question': 'Dalam JavaScript, kata kunci <blank> digunakan untuk mendeklarasikan variabel dengan lingkup blok dan mencegah penugasan ulang.', 'answer': 'const'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Recall"
    },
    // Recall, Cloze to MCQ
    "Recall Cloze Question to MCQ Answer":
    {"prompt": "Pertanyaan ingatan menguji memori dengan meminta fakta, definisi, atau informasi spesifik. Untuk 'Recall Cloze Question to MCQ Answer', berikan output Anda dalam format json seperti ini: {'flashcardType': 'Recall Cloze Question to MCQ Answer', 'question': 'Dalam SQL, perintah <blank> digunakan untuk menghapus semua record dari tabel tanpa mencatat penghapusan baris individual.', 'answer': [{'option': 'DELETE', 'ans': false}, {'option': 'TRUNCATE', 'ans': true}, {'option': 'REMOVE', 'ans': false}, {'option': 'DROP', 'ans': false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Recall"
    },
    // Comprehension, Text to Text
    "Comprehension Text Question to Text Answer":
    {"prompt": "Pertanyaan pemahaman menguji pemahaman dengan meminta penjelasan, interpretasi, ringkasan, atau perbandingan. Untuk 'Comprehension Text Question to Text Answer', berikan output Anda dalam format json seperti ini: {'flashcardType': 'Comprehension Text Question to Text Answer', 'question': 'Jelaskan perbedaan antara salinan dangkal dan salinan dalam dalam pemrograman.', 'answer': 'Salinan dangkal hanya menyalin referensi tingkat atas dari objek, yang berarti objek bersarang masih dibagikan. Salinan dalam secara rekursif menyalin semua objek bersarang, menciptakan duplikat yang sepenuhnya independen dari struktur asli.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Comprehension"
    },
    // Comprehension, Text to MCQ
    "Comprehension Text Question to MCQ Answer":
    {"prompt": "Pertanyaan pemahaman menguji pemahaman dengan meminta penjelasan, interpretasi, ringkasan, atau perbandingan. Untuk 'Comprehension Text Question to MCQ Answer', berikan output Anda dalam format json seperti ini: {'flashcardType': 'Comprehension Text Question to MCQ Answer', 'question': 'Apa yang paling baik menjelaskan perbedaan antara HTTP dan HTTPS?', 'answer': [{'option': 'HTTPS menggunakan port 80, sementara HTTP menggunakan port 443.', 'ans': false}, {'option': 'HTTP mengenkripsi data selama transmisi, sementara HTTPS tidak.', 'ans': false}, {'option': 'Tidak ada perbedaan nyata antara HTTP dan HTTPS.', 'ans': false}, {'option': 'HTTPS menambahkan lapisan enkripsi melalui SSL/TLS untuk mengamankan transmisi data, tidak seperti HTTP.', 'ans': true}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Comprehension"
    },
    // Comprehension, Text to Voice
    "Comprehension Text Question to Voice Answer":
    {"prompt": "Pertanyaan pemahaman menguji pemahaman dengan meminta penjelasan, interpretasi, ringkasan, atau perbandingan. Untuk 'Comprehension Text Question to Voice Answer', berikan output Anda dalam format json seperti ini: {'flashcardType': 'Comprehension Text Question to Voice Answer', 'question': 'Bagaimana load balancer meningkatkan keandalan dan skalabilitas aplikasi web?', 'answer': ''}",
      "questionType": "text",       
      "answerType": "voice",
      "cognitiveQnType": "Comprehension"
    },
    // Application, Text to Text
    "Application Text Question to Text Answer":
    {"prompt": "Pertanyaan aplikasi menguji kemampuan untuk menerapkan pengetahuan pada situasi praktis, baru, atau dunia nyata. Untuk 'Application Text Question to Text Answer', berikan output Anda dalam format json seperti ini: {'flashcardType': 'Application Text Question to Text Answer', 'question': 'Anda perlu menyimpan data sesi pengguna sementara di sistem backend. Struktur data atau metode penyimpanan apa yang akan Anda gunakan dan mengapa?', 'answer': 'Penyimpanan key-value dalam memori seperti Redis adalah pilihan yang cocok karena memungkinkan akses baca/tulis yang cepat dan mendukung kedaluwarsa otomatis data sesi, yang ideal untuk manajemen sesi sementara.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Application"
    },
    // Application, Text to MCQ
    "Application Text Question to MCQ Answer":
    {"prompt": "Pertanyaan aplikasi menguji kemampuan untuk menerapkan pengetahuan pada situasi praktis, baru, atau dunia nyata. Untuk 'Application Text Question to MCQ Answer', berikan output Anda dalam format json seperti ini: {'flashcardType': 'Application Text Question to MCQ Answer', 'question': 'Anda sedang merancang formulir web yang mengumpulkan informasi pengguna yang sensitif. Manakah dari tindakan berikut yang paling tepat untuk meningkatkan keamanan selama transmisi data?', 'answer': [{'option': 'Kirim formulir melalui HTTPS menggunakan permintaan POST.', 'ans': true}, {'option': 'Gunakan permintaan GET untuk mengirim formulir untuk kecepatan yang lebih baik.', 'ans': false}, {'option': 'Minifikasi HTML untuk membuat kode sumber lebih sulit dibaca.', 'ans': false}, {'option': 'Simpan data dalam cookie untuk akses cepat.', 'ans': false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Application"
    },
    // Application, Text to Voice
    "Application Text Question to Voice Answer":
    {"prompt": "Pertanyaan aplikasi menguji kemampuan untuk menerapkan pengetahuan pada situasi praktis, baru, atau dunia nyata. Untuk 'Application Text Question to Voice Answer', berikan output Anda dalam format json seperti ini: {'flashcardType': 'Application Text Question to Voice Answer', 'question': 'Anda ditugaskan untuk meningkatkan kinerja REST API yang mengalami latensi tinggi di bawah beban. Langkah praktis apa yang akan Anda ambil untuk mengidentifikasi dan mengatasi masalah tersebut?', 'answer': ''}",
      "questionType": "text",
      "answerType": "voice",
      "cognitiveQnType": "Application"
    },
    // Analysis, Text to Text
    "Analysis Text Question to Text Answer":
    {"prompt": "Pertanyaan analisis menguji kemampuan untuk memecah masalah kompleks menjadi bagian-bagian yang lebih kecil dan memeriksa hubungan. Untuk 'Analysis Text Question to Text Answer', berikan output Anda dalam format json seperti ini: {'flashcardType': 'Analysis Text Question to Text Answer', 'question': 'Pengujian A/B menunjukkan bahwa halaman checkout baru mengarah ke lebih sedikit pembelian yang diselesaikan, meskipun pengguna mencapai langkah pembayaran lebih cepat. Bagaimana Anda akan menganalisis hasil ini?', 'answer': 'Saya akan memeriksa perjalanan pengguna secara detail, fokus pada di mana pengguna meninggalkan alur baru. Saya akan menganalisis rekaman sesi, data funnel, dan tingkat pengabaian formulir. Kemungkinan alur yang lebih cepat memperkenalkan masalah kegunaan, kebingungan, atau masalah kepercayaan. Saya akan membandingkan tingkat kesalahan, perilaku validasi field, dan waktu pemuatan. Saya juga akan melihat umpan balik kualitatif atau survei untuk memahami persepsi pengguna.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Analysis"
    },
    "Analysis Text Question to MCQ Answer":
    {"prompt": "Pertanyaan analisis menguji kemampuan untuk memecah masalah kompleks menjadi bagian-bagian yang lebih kecil dan memeriksa hubungan. Untuk 'Analysis Text Question to MCQ Answer', berikan output Anda dalam format json seperti ini: {'flashcardType': 'Analysis Text Question to MCQ Answer', 'question': 'Tim Anda sedang menyelidiki mengapa fitur yang baru di-deploy menyebabkan waktu muat halaman meningkat secara signifikan. Apa langkah paling logis berikutnya dalam proses analisis?', 'answer': [{'option': 'Rollback deployment segera.', 'ans': false}, {'option': 'Profil kinerja frontend dan backend untuk menemukan bottleneck spesifik.', 'ans': true}, {'option': 'Tingkatkan kapasitas server dan amati hasilnya.', 'ans': false}, {'option': 'Beralih ke framework frontend yang berbeda.', 'ans': false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Analysis"
    },
    // Analysis, Text to Voice
    "Analysis Text Question to Voice Answer":
    {"prompt": "Pertanyaan analisis menguji kemampuan untuk memecah masalah kompleks menjadi bagian-bagian yang lebih kecil dan memeriksa hubungan. Untuk 'Analysis Text Question to Voice Answer', berikan output Anda dalam format json seperti ini: {'flashcardType': 'Analysis Text Question to Voice Answer', 'question': 'Anda memperhatikan timeout yang sering terjadi ketika pengguna mengakses aplikasi Anda selama jam sibuk. Bagaimana Anda akan mengidentifikasi akar penyebab masalah tersebut?', 'answer': ''}",
      "questionType": "text",
      "answerType": "voice",
      "cognitiveQnType": "Analysis"
    },
    // Synthesis, Text to Text
    "Synthesis Text Question to Text Answer":
    {"prompt": "Pertanyaan sintesis menguji kemampuan untuk menggabungkan atau mengintegrasikan berbagai informasi untuk menciptakan keseluruhan yang baru dan koheren, atau mengusulkan solusi. Untuk 'Synthesis Text Question to Text Answer', berikan output Anda dalam format json seperti ini: {'flashcardType': 'Synthesis Text Question to Text Answer', 'question': 'Rancang sistem notifikasi yang dapat diskalakan yang dapat mengirim email, SMS, dan push notification ke jutaan pengguna. Komponen kunci apa yang akan Anda sertakan dan bagaimana mereka berinteraksi?', 'answer': 'Saya akan merancang sistem dengan antrian pesan untuk menangani throughput tinggi, layanan notifikasi yang memproses pesan dan mengirimkannya melalui saluran yang sesuai (email, SMS, push). Sistem akan menggunakan microservices untuk setiap jenis notifikasi, database untuk melacak status pengiriman, dan pembatasan laju untuk mencegah kelebihan beban. Load balancer dan grup auto-scaling akan memastikan ketersediaan dan skalabilitas.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Synthesis"
    },
    // Synthesis, Text to MCQ
    "Synthesis Text Question to MCQ Answer":
    {"prompt": "Pertanyaan sintesis menguji kemampuan untuk menggabungkan atau mengintegrasikan berbagai informasi untuk menciptakan keseluruhan yang baru dan koheren, atau mengusulkan solusi. Untuk 'Synthesis Text Question to MCQ Answer', berikan output Anda dalam format json seperti ini: {'flashcardType': 'Synthesis Text Question to MCQ Answer', 'question': 'Anda perlu merancang sistem yang mengagregasi data real-time dari beberapa sensor dan menyediakan dashboard analitik. Pilihan desain mana yang paling baik menyeimbangkan skalabilitas, keandalan, dan latensi?', 'answer': [{'option': 'Gunakan database terpusat di mana semua data sensor ditulis secara sinkron.', 'ans': false}, {'option': 'Simpan data secara lokal di setiap sensor dan unggah batch di akhir hari.', 'ans': false}, {'option': 'Gunakan pemrosesan sisi klien untuk semua analitik untuk mengurangi beban server.', 'ans': false}, {'option': 'Implementasikan antrian pesan terdistribusi dengan microservices yang memproses data secara asinkron.', 'ans': true}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Synthesis"
    },
    // Synthesis, Text to Voice
    "Synthesis Text Question to Voice Answer":
    {"prompt": "Pertanyaan sintesis menguji kemampuan untuk menggabungkan atau mengintegrasikan berbagai informasi untuk menciptakan keseluruhan yang baru dan koheren, atau mengusulkan solusi. Untuk 'Synthesis Text Question to Voice Answer', berikan output Anda dalam format json seperti ini: {'flashcardType': 'Synthesis Text Question to Voice Answer', 'question': 'Rancang sistem yang dapat menangani obrolan real-time untuk jutaan pengguna, memastikan pengiriman pesan, skalabilitas, dan konsistensi data. Jelaskan komponen kunci dan bagaimana mereka berinteraksi.', 'answer': ''}",
      "questionType": "text",
      "answerType": "voice",
      "cognitiveQnType": "Synthesis"
    },
    // Evaluation, Text to Text
    "Evaluation Text Question to Text Answer":
    {"prompt": "Pertanyaan evaluasi menguji kemampuan untuk menilai kualitas, akurasi, atau efektivitas sesuatu, dan membuat penilaian berdasarkan kriteria dan membenarkan keputusan. Untuk 'Evaluation Text Question to Text Answer', berikan output Anda dalam format json seperti ini: {'flashcardType': 'Evaluation Text Question to Text Answer', 'question': 'Anda memilih antara database SQL dan NoSQL untuk platform e-commerce ber-traffic tinggi. Mana yang akan Anda pilih dan mengapa?', 'answer': 'Untuk platform e-commerce, database SQL seringkali merupakan pilihan yang lebih baik karena kebutuhan akan konsistensi yang kuat, transaksi kompleks, dan data relasional terstruktur seperti pesanan, inventaris, dan pengguna. Namun, jika skalabilitas dan fleksibilitas lebih penting—seperti untuk menangani ulasan produk atau data sesi—solusi NoSQL seperti MongoDB atau DynamoDB dapat diintegrasikan bersama SQL dalam arsitektur poliglot.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Evaluation"
    },
    // Evaluation, Text to MCQ
    "Evaluation Text Question to MCQ Answer":
    {"prompt": "Pertanyaan evaluasi menguji kemampuan untuk menilai kualitas, akurasi, atau efektivitas sesuatu, dan membuat penilaian berdasarkan kriteria dan membenarkan keputusan. Untuk 'Evaluation Text Question to MCQ Answer', berikan output Anda dalam format json seperti ini: {'flashcardType': 'Evaluation Text Question to MCQ Answer', 'question': 'Anda sedang meninjau dua framework frontend yang mungkin untuk aplikasi web perusahaan skala besar: React dan Angular. Manakah dari berikut ini yang merupakan dasar paling masuk akal untuk memilih React daripada Angular?', 'answer': [{'option': 'React tidak memerlukan kurva pembelajaran, jadi selalu lebih baik.', 'ans': false}, {'option': 'React memberlakukan struktur aplikasi yang ketat, yang ideal untuk tim besar.', 'ans': false}, {'option': 'Arsitektur berbasis komponen React dan ekosistem besar memberikan fleksibilitas dan kemudahan integrasi dengan library lain.', 'ans': true}, {'option': 'Angular tidak lagi dirawat, jadi React adalah satu-satunya opsi yang layak.', 'ans': false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Evaluation"
    },
    // Evaluation, Text to Voice
    "Evaluation Text Question to Voice Answer":
    {"prompt": "Pertanyaan evaluasi menguji kemampuan untuk menilai kualitas, akurasi, atau efektivitas sesuatu, dan membuat penilaian berdasarkan kriteria dan membenarkan keputusan. Untuk 'Evaluation Text Question to Voice Answer', berikan output Anda dalam format json seperti ini: {'flashcardType': 'Evaluation Text Question to Voice Answer', 'question': 'Tim Anda memutuskan antara membangun fitur secara internal atau menggunakan solusi SaaS pihak ketiga. Faktor apa yang akan Anda evaluasi untuk membuat rekomendasi, dan apa yang akan memandu keputusan akhir Anda?', 'answer': ''}",
      "questionType": "text",
      "answerType": "voice",
      "cognitiveQnType": "Evaluation"
    },
    // Problem-Solving, Text to Text
    "Problem-Solving Text Question to Text Answer":
    {"prompt": "Pertanyaan pemecahan masalah berfokus pada mengidentifikasi, mendiagnosis, dan menyelesaikan masalah kompleks, dan seringkali memerlukan pemikiran kreatif atau strategis. Untuk 'Problem-Solving Text Question to Text Answer', berikan output Anda dalam format json seperti ini: {'flashcardType': 'Problem-Solving Text Question to Text Answer', 'question': 'Anda sedang membangun fitur pencarian yang perlu mengembalikan hasil yang relevan dengan cepat, bahkan saat dataset tumbuh. Bagaimana Anda akan merancang sistem ini untuk mempertahankan kinerja yang cepat?', 'answer': 'Saya akan mulai dengan mengindeks field yang dapat dicari menggunakan mesin pencari teks lengkap seperti Elasticsearch atau mengintegrasikan strategi pengindeksan database. Untuk meningkatkan kinerja, saya akan mem-paginate hasil, menggunakan cache untuk kueri yang sering, dan mempertimbangkan denormalisasi data untuk pembacaan yang lebih cepat. Selain itu, saya akan memantau waktu kueri dan menyesuaikan pengindeksan atau shard data jika diperlukan saat dataset tumbuh.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Problem-Solving"
    },
    // Problem-Solving, Text to MCQ
    "Problem-Solving Text Question to MCQ Answer":
    {"prompt": "Pertanyaan pemecahan masalah berfokus pada mengidentifikasi, mendiagnosis, dan menyelesaikan masalah kompleks, dan seringkali memerlukan pemikiran kreatif atau strategis. Untuk 'Problem-Solving Text Question to MCQ Answer', berikan output Anda dalam format json seperti ini: {'flashcardType': 'Problem-Solving Text Question to MCQ Answer', 'question': 'Aplikasi seluler Anda crash secara acak untuk beberapa pengguna, tetapi Anda tidak dapat mereproduksi masalah pada perangkat Anda. Apa langkah terbaik pertama untuk mendiagnosis masalah tersebut?', 'answer': [{'option': 'Minta pengguna untuk menghapus dan menginstal ulang aplikasi.', 'ans': false}, {'option': 'Push pembaruan darurat dengan perubahan minimal.', 'ans': false}, {'option': 'Periksa log crash dan alat analitik seperti Firebase Crashlytics untuk mengidentifikasi pola.', 'ans': true}, {'option': 'Nonaktifkan fitur sampai crash berhenti.', 'ans': false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Problem-Solving"
    },
    // Problem-Solving, Text to Voice
    "Problem-Solving Text Question to Voice Answer":
    {"prompt": "Pertanyaan pemecahan masalah berfokus pada mengidentifikasi, mendiagnosis, dan menyelesaikan masalah kompleks, dan seringkali memerlukan pemikiran kreatif atau strategis. Untuk 'Problem-Solving Text Question to Voice Answer', berikan output Anda dalam format json seperti ini: {'flashcardType': 'Problem-Solving Text Question to Voice Answer', 'question': 'Fitur kritis dalam aplikasi web Anda gagal secara intermiten di bawah traffic tinggi, tetapi tidak ada error yang muncul di log. Bagaimana Anda akan mengidentifikasi dan menyelesaikan masalah tersebut?', 'answer': ''}",
      "questionType": "text",
      "answerType": "voice",
      "cognitiveQnType": "Problem-Solving"
    }
}

export const promptAndDataMalay = {
    // Recall, Text to Text
    "Recall Text Question to Text Answer":
    {"prompt": "Soalan ingatan menguji memori dengan meminta fakta, definisi, atau maklumat spesifik. Untuk 'Recall Text Question to Text Answer', berikan output anda dalam format json seperti ini: {'flashcardType': 'Recall Text Question to Text Answer', 'question': 'Apakah tujuan utama pelayan DNS (Domain Name System)?', 'answer': 'Pelayan DNS menterjemahkan nama domain yang boleh dibaca manusia (seperti www.example.com) kepada alamat IP yang digunakan komputer untuk mengenal pasti satu sama lain di rangkaian.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Recall"
    },
    // Recall, Text to MCQ
    "Recall Text Question to MCQ Answer":
    {"prompt": "Soalan ingatan menguji memori dengan meminta fakta, definisi, atau maklumat spesifik. Untuk 'Recall Text Question to MCQ Answer', berikan output anda dalam format json seperti ini: {'flashcardType': 'Recall Text Question to MCQ Answer', 'question': 'Kod status HTTP manakah yang menunjukkan bahawa permintaan berjaya?', 'answer': [{'option': '404', 'ans': false}, {'option': '500', 'ans': false}, {'option': '200', 'ans': true}, {'option': '403', 'ans': false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Recall"
    },
    // Recall, Cloze to Text
    "Recall Cloze Question to Text Answer":
    {"prompt": "Soalan ingatan menguji memori dengan meminta fakta, definisi, atau maklumat spesifik. Untuk 'Recall Cloze Question to Text Answer', berikan output anda dalam format json seperti ini: {'flashcardType': 'Recall Cloze Question to Text Answer', 'question': 'Dalam JavaScript, kata kunci <blank> digunakan untuk mengisytiharkan pemboleh ubah dengan skop blok dan mencegah penugasan semula.', 'answer': 'const'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Recall"
    },
    // Recall, Cloze to MCQ
    "Recall Cloze Question to MCQ Answer":
    {"prompt": "Soalan ingatan menguji memori dengan meminta fakta, definisi, atau maklumat spesifik. Untuk 'Recall Cloze Question to MCQ Answer', berikan output anda dalam format json seperti ini: {'flashcardType': 'Recall Cloze Question to MCQ Answer', 'question': 'Dalam SQL, arahan <blank> digunakan untuk membuang semua rekod dari jadual tanpa mencatat penghapusan baris individu.', 'answer': [{'option': 'DELETE', 'ans': false}, {'option': 'TRUNCATE', 'ans': true}, {'option': 'REMOVE', 'ans': false}, {'option': 'DROP', 'ans': false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Recall"
    },
    // Comprehension, Text to Text
    "Comprehension Text Question to Text Answer":
    {"prompt": "Soalan kefahaman menguji pemahaman dengan meminta penjelasan, tafsiran, ringkasan, atau perbandingan. Untuk 'Comprehension Text Question to Text Answer', berikan output anda dalam format json seperti ini: {'flashcardType': 'Comprehension Text Question to Text Answer', 'question': 'Terangkan perbezaan antara salinan cetek dan salinan dalam dalam pengaturcaraan.', 'answer': 'Salinan cetek hanya menyalin rujukan peringkat atas objek, yang bermaksud objek bersarang masih dikongsi. Salinan dalam secara rekursif menyalin semua objek bersarang, mencipta duplikat yang sepenuhnya bebas dari struktur asal.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Comprehension"
    },
    // Comprehension, Text to MCQ
    "Comprehension Text Question to MCQ Answer":
    {"prompt": "Soalan kefahaman menguji pemahaman dengan meminta penjelasan, tafsiran, ringkasan, atau perbandingan. Untuk 'Comprehension Text Question to MCQ Answer', berikan output anda dalam format json seperti ini: {'flashcardType': 'Comprehension Text Question to MCQ Answer', 'question': 'Apakah yang paling baik menerangkan perbezaan antara HTTP dan HTTPS?', 'answer': [{'option': 'HTTPS menggunakan port 80, manakala HTTP menggunakan port 443.', 'ans': false}, {'option': 'HTTP menyulitkan data semasa penghantaran, manakala HTTPS tidak.', 'ans': false}, {'option': 'Tidak ada perbezaan sebenar antara HTTP dan HTTPS.', 'ans': false}, {'option': 'HTTPS menambah lapisan penyulitan melalui SSL/TLS untuk mengamankan penghantaran data, tidak seperti HTTP.', 'ans': true}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Comprehension"
    },
    // Comprehension, Text to Voice
    "Comprehension Text Question to Voice Answer":
    {"prompt": "Soalan kefahaman menguji pemahaman dengan meminta penjelasan, tafsiran, ringkasan, atau perbandingan. Untuk 'Comprehension Text Question to Voice Answer', berikan output anda dalam format json seperti ini: {'flashcardType': 'Comprehension Text Question to Voice Answer', 'question': 'Bagaimanakah pengimbang beban meningkatkan kebolehpercayaan dan kebolehskalaan aplikasi web?', 'answer': ''}",
      "questionType": "text",       
      "answerType": "voice",
      "cognitiveQnType": "Comprehension"
    },
    // Application, Text to Text
    "Application Text Question to Text Answer":
    {"prompt": "Soalan aplikasi menguji keupayaan untuk menerapkan pengetahuan pada situasi praktikal, baharu, atau dunia sebenar. Untuk 'Application Text Question to Text Answer', berikan output anda dalam format json seperti ini: {'flashcardType': 'Application Text Question to Text Answer', 'question': 'Anda perlu menyimpan data sesi pengguna sementara dalam sistem backend. Struktur data atau kaedah penyimpanan manakah yang akan anda gunakan dan mengapa?', 'answer': 'Penyimpanan nilai-kunci dalam memori seperti Redis adalah pilihan yang sesuai kerana membolehkan akses baca/tulis yang pantas dan menyokong luput automatik data sesi, yang sesuai untuk pengurusan sesi sementara.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Application"
    },
    // Application, Text to MCQ
    "Application Text Question to MCQ Answer":
    {"prompt": "Soalan aplikasi menguji keupayaan untuk menerapkan pengetahuan pada situasi praktikal, baharu, atau dunia sebenar. Untuk 'Application Text Question to MCQ Answer', berikan output anda dalam format json seperti ini: {'flashcardType': 'Application Text Question to MCQ Answer', 'question': 'Anda sedang mereka bentuk borang web yang mengumpulkan maklumat pengguna yang sensitif. Manakah dari tindakan berikut yang paling sesuai untuk meningkatkan keselamatan semasa penghantaran data?', 'answer': [{'option': 'Hantar borang melalui HTTPS menggunakan permintaan POST.', 'ans': true}, {'option': 'Gunakan permintaan GET untuk menghantar borang untuk kelajuan yang lebih baik.', 'ans': false}, {'option': 'Minifikasi HTML untuk menjadikan kod sumber lebih sukar dibaca.', 'ans': false}, {'option': 'Simpan data dalam kuki untuk akses pantas.', 'ans': false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Application"
    },
    // Application, Text to Voice
    "Application Text Question to Voice Answer":
    {"prompt": "Soalan aplikasi menguji keupayaan untuk menerapkan pengetahuan pada situasi praktikal, baharu, atau dunia sebenar. Untuk 'Application Text Question to Voice Answer', berikan output anda dalam format json seperti ini: {'flashcardType': 'Application Text Question to Voice Answer', 'question': 'Anda ditugaskan untuk meningkatkan prestasi REST API yang mengalami latensi tinggi di bawah beban. Langkah praktikal apakah yang akan anda ambil untuk mengenal pasti dan menangani isu tersebut?', 'answer': ''}",
      "questionType": "text",
      "answerType": "voice",
      "cognitiveQnType": "Application"
    },
    // Analysis, Text to Text
    "Analysis Text Question to Text Answer":
    {"prompt": "Soalan analisis menguji keupayaan untuk memecahkan masalah kompleks menjadi bahagian yang lebih kecil dan memeriksa hubungan. Untuk 'Analysis Text Question to Text Answer', berikan output anda dalam format json seperti ini: {'flashcardType': 'Analysis Text Question to Text Answer', 'question': 'Ujian A/B menunjukkan bahawa halaman checkout baharu membawa kepada kurang pembelian yang diselesaikan, walaupun pengguna mencapai langkah pembayaran lebih cepat. Bagaimanakah anda akan menganalisis hasil ini?', 'answer': 'Saya akan memeriksa perjalanan pengguna secara terperinci, fokus pada di mana pengguna meninggalkan aliran baharu. Saya akan menganalisis rakaman sesi, data corong, dan kadar pengabaian borang. Kemungkinan aliran yang lebih cepat memperkenalkan masalah kebolehgunaan, kekeliruan, atau kebimbangan kepercayaan. Saya akan membandingkan kadar ralat, tingkah laku pengesahan medan, dan masa pemuatan. Saya juga akan melihat maklum balas kualitatif atau tinjauan untuk memahami persepsi pengguna.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Analysis"
    },
    "Analysis Text Question to MCQ Answer":
    {"prompt": "Soalan analisis menguji keupayaan untuk memecahkan masalah kompleks menjadi bahagian yang lebih kecil dan memeriksa hubungan. Untuk 'Analysis Text Question to MCQ Answer', berikan output anda dalam format json seperti ini: {'flashcardType': 'Analysis Text Question to MCQ Answer', 'question': 'Pasukan anda sedang menyiasat mengapa ciri yang baru dikerahkan menyebabkan masa muat halaman meningkat dengan ketara. Apakah langkah paling logik seterusnya dalam proses analisis?', 'answer': [{'option': 'Kembalikan penyebaran dengan segera.', 'ans': false}, {'option': 'Profil prestasi frontend dan backend untuk mencari bottleneck spesifik.', 'ans': true}, {'option': 'Tingkatkan kapasiti pelayan dan perhatikan hasilnya.', 'ans': false}, {'option': 'Tukar ke rangka kerja frontend yang berbeza.', 'ans': false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Analysis"
    },
    // Analysis, Text to Voice
    "Analysis Text Question to Voice Answer":
    {"prompt": "Soalan analisis menguji keupayaan untuk memecahkan masalah kompleks menjadi bahagian yang lebih kecil dan memeriksa hubungan. Untuk 'Analysis Text Question to Voice Answer', berikan output anda dalam format json seperti ini: {'flashcardType': 'Analysis Text Question to Voice Answer', 'question': 'Anda perasan timeout yang kerap berlaku apabila pengguna mengakses aplikasi anda semasa waktu puncak. Bagaimanakah anda akan mengenal pasti punca akar isu tersebut?', 'answer': ''}",
      "questionType": "text",
      "answerType": "voice",
      "cognitiveQnType": "Analysis"
    },
    // Synthesis, Text to Text
    "Synthesis Text Question to Text Answer":
    {"prompt": "Soalan sintesis menguji keupayaan untuk menggabungkan atau mengintegrasikan pelbagai maklumat untuk mencipta keseluruhan baharu yang koheren, atau mencadangkan penyelesaian. Untuk 'Synthesis Text Question to Text Answer', berikan output anda dalam format json seperti ini: {'flashcardType': 'Synthesis Text Question to Text Answer', 'question': 'Reka sistem notifikasi yang boleh diskalakan yang boleh menghantar e-mel, SMS, dan notifikasi push kepada berjuta-juta pengguna. Komponen utama apakah yang akan anda sertakan dan bagaimana mereka berinteraksi?', 'answer': 'Saya akan mereka bentuk sistem dengan barisan mesej untuk menangani throughput tinggi, perkhidmatan notifikasi yang memproses mesej dan menghantarnya melalui saluran yang sesuai (e-mel, SMS, push). Sistem akan menggunakan mikros perkhidmatan untuk setiap jenis notifikasi, pangkalan data untuk menjejaki status penghantaran, dan had kadar untuk mencegah beban berlebihan. Pengimbang beban dan kumpulan auto-scaling akan memastikan ketersediaan dan kebolehskalaan.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Synthesis"
    },
    // Synthesis, Text to MCQ
    "Synthesis Text Question to MCQ Answer":
    {"prompt": "Soalan sintesis menguji keupayaan untuk menggabungkan atau mengintegrasikan pelbagai maklumat untuk mencipta keseluruhan baharu yang koheren, atau mencadangkan penyelesaian. Untuk 'Synthesis Text Question to MCQ Answer', berikan output anda dalam format json seperti ini: {'flashcardType': 'Synthesis Text Question to MCQ Answer', 'question': 'Anda perlu mereka bentuk sistem yang mengagregat data masa nyata dari beberapa sensor dan menyediakan papan pemuka analitik. Pilihan reka bentuk manakah yang paling baik mengimbangkan kebolehskalaan, kebolehpercayaan, dan latensi?', 'answer': [{'option': 'Gunakan pangkalan data berpusat di mana semua data sensor ditulis secara segerak.', 'ans': false}, {'option': 'Simpan data secara tempatan pada setiap sensor dan muat naik kumpulan pada akhir hari.', 'ans': false}, {'option': 'Gunakan pemprosesan sisi klien untuk semua analitik untuk mengurangkan beban pelayan.', 'ans': false}, {'option': 'Laksanakan barisan mesej teragih dengan mikros perkhidmatan yang memproses data secara tidak segerak.', 'ans': true}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Synthesis"
    },
    // Synthesis, Text to Voice
    "Synthesis Text Question to Voice Answer":
    {"prompt": "Soalan sintesis menguji keupayaan untuk menggabungkan atau mengintegrasikan pelbagai maklumat untuk mencipta keseluruhan baharu yang koheren, atau mencadangkan penyelesaian. Untuk 'Synthesis Text Question to Voice Answer', berikan output anda dalam format json seperti ini: {'flashcardType': 'Synthesis Text Question to Voice Answer', 'question': 'Reka sistem yang boleh menangani sembang masa nyata untuk berjuta-juta pengguna, memastikan penghantaran mesej, kebolehskalaan, dan konsistensi data. Terangkan komponen utama dan bagaimana mereka berinteraksi.', 'answer': ''}",
      "questionType": "text",
      "answerType": "voice",
      "cognitiveQnType": "Synthesis"
    },
    // Evaluation, Text to Text
    "Evaluation Text Question to Text Answer":
    {"prompt": "Soalan penilaian menguji keupayaan untuk menilai kualiti, ketepatan, atau keberkesanan sesuatu, dan membuat pertimbangan berdasarkan kriteria dan membenarkan keputusan. Untuk 'Evaluation Text Question to Text Answer', berikan output anda dalam format json seperti ini: {'flashcardType': 'Evaluation Text Question to Text Answer', 'question': 'Anda memilih antara pangkalan data SQL dan NoSQL untuk platform e-dagang ber-traffic tinggi. Manakah yang akan anda pilih dan mengapa?', 'answer': 'Untuk platform e-dagang, pangkalan data SQL selalunya merupakan pilihan yang lebih baik kerana keperluan untuk konsistensi yang kuat, transaksi kompleks, dan data hubungan berstruktur seperti pesanan, inventori, dan pengguna. Walau bagaimanapun, jika kebolehskalaan dan fleksibiliti lebih penting—seperti untuk menangani ulasan produk atau data sesi—penyelesaian NoSQL seperti MongoDB atau DynamoDB boleh diintegrasikan bersama SQL dalam seni bina poliglot.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Evaluation"
    },
    // Evaluation, Text to MCQ
    "Evaluation Text Question to MCQ Answer":
    {"prompt": "Soalan penilaian menguji keupayaan untuk menilai kualiti, ketepatan, atau keberkesanan sesuatu, dan membuat pertimbangan berdasarkan kriteria dan membenarkan keputusan. Untuk 'Evaluation Text Question to MCQ Answer', berikan output anda dalam format json seperti ini: {'flashcardType': 'Evaluation Text Question to MCQ Answer', 'question': 'Anda sedang meninjau dua rangka kerja frontend yang mungkin untuk aplikasi web perusahaan berskala besar: React dan Angular. Manakah dari berikut ini yang merupakan asas paling munasabah untuk memilih React berbanding Angular?', 'answer': [{'option': 'React tidak memerlukan lengkung pembelajaran, jadi ia sentiasa lebih baik.', 'ans': false}, {'option': 'React menguatkuasakan struktur aplikasi yang ketat, yang sesuai untuk pasukan besar.', 'ans': false}, {'option': 'Seni bina berasaskan komponen React dan ekosistem besar memberikan fleksibiliti dan kemudahan integrasi dengan perpustakaan lain.', 'ans': true}, {'option': 'Angular tidak lagi dikekalkan, jadi React adalah satu-satunya pilihan yang boleh dilaksanakan.', 'ans': false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Evaluation"
    },
    // Evaluation, Text to Voice
    "Evaluation Text Question to Voice Answer":
    {"prompt": "Soalan penilaian menguji keupayaan untuk menilai kualiti, ketepatan, atau keberkesanan sesuatu, dan membuat pertimbangan berdasarkan kriteria dan membenarkan keputusan. Untuk 'Evaluation Text Question to Voice Answer', berikan output anda dalam format json seperti ini: {'flashcardType': 'Evaluation Text Question to Voice Answer', 'question': 'Pasukan anda memutuskan antara membina ciri dalam rumah atau menggunakan penyelesaian SaaS pihak ketiga. Faktor apakah yang akan anda nilai untuk membuat cadangan, dan apakah yang akan membimbing keputusan akhir anda?', 'answer': ''}",
      "questionType": "text",
      "answerType": "voice",
      "cognitiveQnType": "Evaluation"
    },
    // Problem-Solving, Text to Text
    "Problem-Solving Text Question to Text Answer":
    {"prompt": "Soalan penyelesaian masalah memberi tumpuan kepada mengenal pasti, mendiagnosis, dan menyelesaikan isu kompleks, dan selalunya memerlukan pemikiran kreatif atau strategik. Untuk 'Problem-Solving Text Question to Text Answer', berikan output anda dalam format json seperti ini: {'flashcardType': 'Problem-Solving Text Question to Text Answer', 'question': 'Anda sedang membina ciri carian yang perlu mengembalikan hasil yang relevan dengan cepat, walaupun set data berkembang. Bagaimanakah anda akan mereka bentuk sistem ini untuk mengekalkan prestasi yang pantas?', 'answer': 'Saya akan bermula dengan mengindeks medan yang boleh dicari menggunakan enjin carian teks penuh seperti Elasticsearch atau mengintegrasikan strategi pengindeksan pangkalan data. Untuk meningkatkan prestasi, saya akan mem-paginate hasil, menggunakan cache untuk pertanyaan yang kerap, dan mempertimbangkan denormalisasi data untuk bacaan yang lebih pantas. Selain itu, saya akan memantau masa pertanyaan dan menyesuaikan pengindeksan atau shard data jika diperlukan semasa set data berkembang.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Problem-Solving"
    },
    // Problem-Solving, Text to MCQ
    "Problem-Solving Text Question to MCQ Answer":
    {"prompt": "Soalan penyelesaian masalah memberi tumpuan kepada mengenal pasti, mendiagnosis, dan menyelesaikan isu kompleks, dan selalunya memerlukan pemikiran kreatif atau strategik. Untuk 'Problem-Solving Text Question to MCQ Answer', berikan output anda dalam format json seperti ini: {'flashcardType': 'Problem-Solving Text Question to MCQ Answer', 'question': 'Aplikasi mudah alih anda crash secara rawak untuk beberapa pengguna, tetapi anda tidak dapat menghasilkan semula masalah pada peranti anda. Apakah langkah terbaik pertama untuk mendiagnosis masalah tersebut?', 'answer': [{'option': 'Minta pengguna untuk memadam dan memasang semula aplikasi.', 'ans': false}, {'option': 'Tolak kemas kini kecemasan dengan perubahan minimum.', 'ans': false}, {'option': 'Periksa log crash dan alat analitik seperti Firebase Crashlytics untuk mengenal pasti corak.', 'ans': true}, {'option': 'Lumpuhkan ciri sehingga crash berhenti.', 'ans': false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Problem-Solving"
    },
    // Problem-Solving, Text to Voice
    "Problem-Solving Text Question to Voice Answer":
    {"prompt": "Soalan penyelesaian masalah memberi tumpuan kepada mengenal pasti, mendiagnosis, dan menyelesaikan isu kompleks, dan selalunya memerlukan pemikiran kreatif atau strategik. Untuk 'Problem-Solving Text Question to Voice Answer', berikan output anda dalam format json seperti ini: {'flashcardType': 'Problem-Solving Text Question to Voice Answer', 'question': 'Ciri kritikal dalam aplikasi web anda gagal secara berselang-selang di bawah trafik tinggi, tetapi tiada ralat muncul dalam log. Bagaimanakah anda akan mengenal pasti dan menyelesaikan isu tersebut?', 'answer': ''}",
      "questionType": "text",
      "answerType": "voice",
      "cognitiveQnType": "Problem-Solving"
    }
}

export const promptAndDataCzech = {
    // Recall, Text to Text
    "Recall Text Question to Text Answer":
    {"prompt": "Otázky na paměť testují paměť tím, že žádají konkrétní fakta, definice nebo informace. Pro 'Recall Text Question to Text Answer' uveďte svůj výstup ve formátu json takto: {'flashcardType': 'Recall Text Question to Text Answer', 'question': 'Jaký je hlavní účel DNS (Domain Name System) serveru?', 'answer': 'DNS server překládá lidsky čitelné názvy domén (jako www.example.com) na IP adresy, které počítače používají k identifikaci navzájem v síti.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Recall"
    },
    // Recall, Text to MCQ
    "Recall Text Question to MCQ Answer":
    {"prompt": "Otázky na paměť testují paměť tím, že žádají konkrétní fakta, definice nebo informace. Pro 'Recall Text Question to MCQ Answer' uveďte svůj výstup ve formátu json takto: {'flashcardType': 'Recall Text Question to MCQ Answer', 'question': 'Který HTTP status kód označuje, že požadavek byl úspěšný?', 'answer': [{'option': '404', 'ans': false}, {'option': '500', 'ans': false}, {'option': '200', 'ans': true}, {'option': '403', 'ans': false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Recall"
    },
    // Recall, Cloze to Text
    "Recall Cloze Question to Text Answer":
    {"prompt": "Otázky na paměť testují paměť tím, že žádají konkrétní fakta, definice nebo informace. Pro 'Recall Cloze Question to Text Answer' uveďte svůj výstup ve formátu json takto: {'flashcardType': 'Recall Cloze Question to Text Answer', 'question': 'V JavaScriptu se klíčové slovo <blank> používá k deklaraci proměnné s blokovým rozsahem a zabránění přepisování.', 'answer': 'const'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Recall"
    },
    // Recall, Cloze to MCQ
    "Recall Cloze Question to MCQ Answer":
    {"prompt": "Otázky na paměť testují paměť tím, že žádají konkrétní fakta, definice nebo informace. Pro 'Recall Cloze Question to MCQ Answer' uveďte svůj výstup ve formátu json takto: {'flashcardType': 'Recall Cloze Question to MCQ Answer', 'question': 'V SQL se příkaz <blank> používá k odstranění všech záznamů z tabulky bez zaznamenávání jednotlivých mazání řádků.', 'answer': [{'option': 'DELETE', 'ans': false}, {'option': 'TRUNCATE', 'ans': true}, {'option': 'REMOVE', 'ans': false}, {'option': 'DROP', 'ans': false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Recall"
    },
    // Comprehension, Text to Text
    "Comprehension Text Question to Text Answer":
    {"prompt": "Otázky na porozumění testují pochopení tím, že žádají vysvětlení, interpretace, shrnutí nebo srovnání. Pro 'Comprehension Text Question to Text Answer' uveďte svůj výstup ve formátu json takto: {'flashcardType': 'Comprehension Text Question to Text Answer', 'question': 'Vysvětlete rozdíl mezi mělkou kopií a hlubokou kopií v programování.', 'answer': 'Mělká kopie kopíruje pouze odkazy na nejvyšší úrovni objektu, což znamená, že vnořené objekty jsou stále sdíleny. Hluboká kopie rekurzivně kopíruje všechny vnořené objekty, čímž vytváří zcela nezávislé duplikáty původní struktury.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Comprehension"
    },
    // Comprehension, Text to MCQ
    "Comprehension Text Question to MCQ Answer":
    {"prompt": "Otázky na porozumění testují pochopení tím, že žádají vysvětlení, interpretace, shrnutí nebo srovnání. Pro 'Comprehension Text Question to MCQ Answer' uveďte svůj výstup ve formátu json takto: {'flashcardType': 'Comprehension Text Question to MCQ Answer', 'question': 'Co nejlépe vysvětluje rozdíl mezi HTTP a HTTPS?', 'answer': [{'option': 'HTTPS používá port 80, zatímco HTTP používá port 443.', 'ans': false}, {'option': 'HTTP šifruje data během přenosu, zatímco HTTPS ne.', 'ans': false}, {'option': 'Mezi HTTP a HTTPS není žádný skutečný rozdíl.', 'ans': false}, {'option': 'HTTPS přidává vrstvu šifrování prostřednictvím SSL/TLS pro zabezpečení přenosu dat, na rozdíl od HTTP.', 'ans': true}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Comprehension"
    },
    // Comprehension, Text to Voice
    "Comprehension Text Question to Voice Answer":
    {"prompt": "Otázky na porozumění testují pochopení tím, že žádají vysvětlení, interpretace, shrnutí nebo srovnání. Pro 'Comprehension Text Question to Voice Answer' uveďte svůj výstup ve formátu json takto: {'flashcardType': 'Comprehension Text Question to Voice Answer', 'question': 'Jak zlepšuje vyvažovač zátěže spolehlivost a škálovatelnost webové aplikace?', 'answer': ''}",
      "questionType": "text",       
      "answerType": "voice",
      "cognitiveQnType": "Comprehension"
    },
    // Application, Text to Text
    "Application Text Question to Text Answer":
    {"prompt": "Aplikační otázky testují schopnost aplikovat znalosti na praktické, nové nebo reálné situace. Pro 'Application Text Question to Text Answer' uveďte svůj výstup ve formátu json takto: {'flashcardType': 'Application Text Question to Text Answer', 'question': 'Potřebujete dočasně uložit data uživatelské relace v backendovém systému. Kterou datovou strukturu nebo metodu úložiště byste použili a proč?', 'answer': 'Úložiště typu klíč-hodnota v paměti jako Redis je vhodná volba, protože umožňuje rychlý přístup pro čtení/zápis a podporuje automatické vypršení dat relace, což je ideální pro dočasnou správu relací.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Application"
    },
    // Application, Text to MCQ
    "Application Text Question to MCQ Answer":
    {"prompt": "Aplikační otázky testují schopnost aplikovat znalosti na praktické, nové nebo reálné situace. Pro 'Application Text Question to MCQ Answer' uveďte svůj výstup ve formátu json takto: {'flashcardType': 'Application Text Question to MCQ Answer', 'question': 'Navrhujete webový formulář, který shromažďuje citlivé informace o uživatelích. Která z následujících akcí je nejvhodnější pro zvýšení bezpečnosti během přenosu dat?', 'answer': [{'option': 'Odeslat formulář přes HTTPS pomocí POST požadavku.', 'ans': true}, {'option': 'Použít GET požadavek k odeslání formuláře pro lepší rychlost.', 'ans': false}, {'option': 'Minifikovat HTML, aby byl zdrojový kód obtížněji čitelný.', 'ans': false}, {'option': 'Uložit data do cookies pro rychlý přístup.', 'ans': false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Application"
    },
    // Application, Text to Voice
    "Application Text Question to Voice Answer":
    {"prompt": "Aplikační otázky testují schopnost aplikovat znalosti na praktické, nové nebo reálné situace. Pro 'Application Text Question to Voice Answer' uveďte svůj výstup ve formátu json takto: {'flashcardType': 'Application Text Question to Voice Answer', 'question': 'Máte za úkol zlepšit výkon REST API, které zažívá vysokou latenci pod zátěží. Jaké praktické kroky byste podnikli k identifikaci a řešení tohoto problému?', 'answer': ''}",
      "questionType": "text",
      "answerType": "voice",
      "cognitiveQnType": "Application"
    },
    // Analysis, Text to Text
    "Analysis Text Question to Text Answer":
    {"prompt": "Analytické otázky testují schopnost rozložit složité problémy na menší části a zkoumat vztahy. Pro 'Analysis Text Question to Text Answer' uveďte svůj výstup ve formátu json takto: {'flashcardType': 'Analysis Text Question to Text Answer', 'question': 'A/B testování ukazuje, že nová stránka pokladny vede k méně dokončeným nákupům, i když se uživatelé dostanou k platebnímu kroku rychleji. Jak byste analyzovali tento výsledek?', 'answer': 'Podrobně bych prozkoumala uživatelskou cestu, zaměřila bych se na to, kde uživatelé opouštějí nový tok. Analyzovala bych nahrávky relací, data z trychtýře a míru opuštění formulářů. Je možné, že rychlejší tok zavádí problémy s použitelností, zmatení nebo obavy z důvěry. Porovnala bych míru chyb, chování ověřování polí a doby načítání. Podívala bych se také na kvalitativní zpětnou vazbu nebo průzkumy, abych pochopila vnímání uživatelů.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Analysis"
    },
    "Analysis Text Question to MCQ Answer":
    {"prompt": "Analytické otázky testují schopnost rozložit složité problémy na menší části a zkoumat vztahy. Pro 'Analysis Text Question to MCQ Answer' uveďte svůj výstup ve formátu json takto: {'flashcardType': 'Analysis Text Question to MCQ Answer', 'question': 'Váš tým zkoumá, proč nově nasazená funkce způsobila výrazné zvýšení doby načítání stránek. Jaký je nejlogičtější další krok v procesu analýzy?', 'answer': [{'option': 'Okamžitě vrátit nasazení zpět.', 'ans': false}, {'option': 'Profilovat výkon frontendu a backendu, abyste našli konkrétní úzká místa.', 'ans': true}, {'option': 'Zvýšit kapacitu serveru a pozorovat výsledky.', 'ans': false}, {'option': 'Přepnout na jiný frontendový framework.', 'ans': false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Analysis"
    },
    // Analysis, Text to Voice
    "Analysis Text Question to Voice Answer":
    {"prompt": "Analytické otázky testují schopnost rozložit složité problémy na menší části a zkoumat vztahy. Pro 'Analysis Text Question to Voice Answer' uveďte svůj výstup ve formátu json takto: {'flashcardType': 'Analysis Text Question to Voice Answer', 'question': 'Všimnete si častých timeoutů, když uživatelé přistupují k vaší aplikaci během špičky. Jak byste identifikovali hlavní příčinu tohoto problému?', 'answer': ''}",
      "questionType": "text",
      "answerType": "voice",
      "cognitiveQnType": "Analysis"
    },
    // Synthesis, Text to Text
    "Synthesis Text Question to Text Answer":
    {"prompt": "Syntetické otázky testují schopnost kombinovat nebo integrovat různé informace k vytvoření nového, koherentního celku nebo navrhnout řešení. Pro 'Synthesis Text Question to Text Answer' uveďte svůj výstup ve formátu json takto: {'flashcardType': 'Synthesis Text Question to Text Answer', 'question': 'Navrhněte škálovatelný systém oznámení, který může posílat e-maily, SMS a push oznámení milionům uživatelů. Jaké klíčové komponenty byste zahrnuli a jak by spolu interagovaly?', 'answer': 'Navrhl bych systém s frontou zpráv pro zpracování vysoké propustnosti, službu oznámení, která zpracovává zprávy a posílá je přes příslušné kanály (e-mail, SMS, push). Systém by používal mikroslužby pro každý typ oznámení, databázi pro sledování stavu doručení a omezení rychlosti pro prevenci přetížení. Vyvažovače zátěže a skupiny automatického škálování by zajistily dostupnost a škálovatelnost.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Synthesis"
    },
    // Synthesis, Text to MCQ
    "Synthesis Text Question to MCQ Answer":
    {"prompt": "Syntetické otázky testují schopnost kombinovat nebo integrovat různé informace k vytvoření nového, koherentního celku nebo navrhnout řešení. Pro 'Synthesis Text Question to MCQ Answer' uveďte svůj výstup ve formátu json takto: {'flashcardType': 'Synthesis Text Question to MCQ Answer', 'question': 'Potřebujete navrhnout systém, který agreguje data v reálném čase z několika senzorů a poskytuje analytické dashboardy. Která volba návrhu nejlépe vyvažuje škálovatelnost, spolehlivost a latenci?', 'answer': [{'option': 'Použít centralizovanou databázi, kde jsou všechna data ze senzorů zapisována synchronně.', 'ans': false}, {'option': 'Ukládat data lokálně na každém senzoru a nahrávat dávky na konci dne.', 'ans': false}, {'option': 'Použít zpracování na straně klienta pro veškerou analýzu, aby se snížilo zatížení serveru.', 'ans': false}, {'option': 'Implementovat distribuované fronty zpráv s mikroslužbami, které zpracovávají data asynchronně.', 'ans': true}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Synthesis"
    },
    // Synthesis, Text to Voice
    "Synthesis Text Question to Voice Answer":
    {"prompt": "Syntetické otázky testují schopnost kombinovat nebo integrovat různé informace k vytvoření nového, koherentního celku nebo navrhnout řešení. Pro 'Synthesis Text Question to Voice Answer' uveďte svůj výstup ve formátu json takto: {'flashcardType': 'Synthesis Text Question to Voice Answer', 'question': 'Navrhněte systém, který může zpracovat chat v reálném čase pro miliony uživatelů, zajistit doručení zpráv, škálovatelnost a konzistenci dat. Popište klíčové komponenty a jak spolu interagují.', 'answer': ''}",
      "questionType": "text",
      "answerType": "voice",
      "cognitiveQnType": "Synthesis"
    },
    // Evaluation, Text to Text
    "Evaluation Text Question to Text Answer":
    {"prompt": "Hodnotící otázky testují schopnost posoudit kvalitu, přesnost nebo účinnost něčeho a činit úsudky na základě kritérií a zdůvodňovat rozhodnutí. Pro 'Evaluation Text Question to Text Answer' uveďte svůj výstup ve formátu json takto: {'flashcardType': 'Evaluation Text Question to Text Answer', 'question': 'Vyberete si mezi SQL a NoSQL databázemi pro platformu elektronického obchodu s vysokým provozem. Kterou byste zvolili a proč?', 'answer': 'Pro platformu elektronického obchodu je SQL databáze často lepší volbou kvůli potřebě silné konzistence, složitých transakcí a strukturovaných relačních dat, jako jsou objednávky, inventář a uživatelé. Pokud jsou však škálovatelnost a flexibilita důležitější—například pro zpracování recenzí produktů nebo dat relací—mohlo by být NoSQL řešení jako MongoDB nebo DynamoDB integrováno společně se SQL v polyglotní architektuře.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Evaluation"
    },
    // Evaluation, Text to MCQ
    "Evaluation Text Question to MCQ Answer":
    {"prompt": "Hodnotící otázky testují schopnost posoudit kvalitu, přesnost nebo účinnost něčeho a činit úsudky na základě kritérií a zdůvodňovat rozhodnutí. Pro 'Evaluation Text Question to MCQ Answer' uveďte svůj výstup ve formátu json takto: {'flashcardType': 'Evaluation Text Question to MCQ Answer', 'question': 'Posuzujete dvě možné frontendové frameworky pro rozsáhlou podnikovou webovou aplikaci: React a Angular. Který z následujících je nejrozumnějším základem pro výběr Reactu oproti Angularu?', 'answer': [{'option': 'React nevyžaduje žádnou křivku učení, takže je vždy lepší.', 'ans': false}, {'option': 'React vynucuje přísnou strukturu aplikace, což je ideální pro velké týmy.', 'ans': false}, {'option': 'Komponentová architektura Reactu a velký ekosystém poskytují flexibilitu a snadnou integraci s jinými knihovnami.', 'ans': true}, {'option': 'Angular už není udržován, takže React je jedinou životaschopnou možností.', 'ans': false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Evaluation"
    },
    // Evaluation, Text to Voice
    "Evaluation Text Question to Voice Answer":
    {"prompt": "Hodnotící otázky testují schopnost posoudit kvalitu, přesnost nebo účinnost něčeho a činit úsudky na základě kritérií a zdůvodňovat rozhodnutí. Pro 'Evaluation Text Question to Voice Answer' uveďte svůj výstup ve formátu json takto: {'flashcardType': 'Evaluation Text Question to Voice Answer', 'question': 'Váš tým se rozhoduje mezi vytvořením funkce interně nebo použitím řešení SaaS třetí strany. Jaké faktory byste hodnotili pro vytvoření doporučení a co by vedlo vaše konečné rozhodnutí?', 'answer': ''}",
      "questionType": "text",
      "answerType": "voice",
      "cognitiveQnType": "Evaluation"
    },
    // Problem-Solving, Text to Text
    "Problem-Solving Text Question to Text Answer":
    {"prompt": "Otázky na řešení problémů se zaměřují na identifikaci, diagnostiku a řešení složitých problémů a často vyžadují kreativní nebo strategické myšlení. Pro 'Problem-Solving Text Question to Text Answer' uveďte svůj výstup ve formátu json takto: {'flashcardType': 'Problem-Solving Text Question to Text Answer', 'question': 'Vytváříte vyhledávací funkci, která musí rychle vracet relevantní výsledky, i když datová sada roste. Jak byste navrhli tento systém, aby udržel rychlý výkon?', 'answer': 'Začal bych indexováním prohledávatelných polí pomocí fulltextového vyhledávače jako Elasticsearch nebo integrací strategií indexování databáze. Pro zlepšení výkonu bych stránkoval výsledky, používal cache pro časté dotazy a zvažoval denormalizaci dat pro rychlejší čtení. Navíc bych sledoval časy dotazů a upravoval indexování nebo shardování dat podle potřeby, jak datová sada roste.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Problem-Solving"
    },
    // Problem-Solving, Text to MCQ
    "Problem-Solving Text Question to MCQ Answer":
    {"prompt": "Otázky na řešení problémů se zaměřují na identifikaci, diagnostiku a řešení složitých problémů a často vyžadují kreativní nebo strategické myšlení. Pro 'Problem-Solving Text Question to MCQ Answer' uveďte svůj výstup ve formátu json takto: {'flashcardType': 'Problem-Solving Text Question to MCQ Answer', 'question': 'Vaše mobilní aplikace se náhodně zhroutí u některých uživatelů, ale nemůžete problém reprodukovat na svých zařízeních. Jaký je nejlepší první krok k diagnostice problému?', 'answer': [{'option': 'Požádat uživatele, aby aplikaci smazali a znovu nainstalovali.', 'ans': false}, {'option': 'Odeslat nouzovou aktualizaci s minimálními změnami.', 'ans': false}, {'option': 'Zkontrolovat protokoly o pádech a analytické nástroje jako Firebase Crashlytics pro identifikaci vzorů.', 'ans': true}, {'option': 'Zakázat funkce, dokud se pády nezastaví.', 'ans': false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Problem-Solving"
    },
    // Problem-Solving, Text to Voice
    "Problem-Solving Text Question to Voice Answer":
    {"prompt": "Otázky na řešení problémů se zaměřují na identifikaci, diagnostiku a řešení složitých problémů a často vyžadují kreativní nebo strategické myšlení. Pro 'Problem-Solving Text Question to Voice Answer' uveďte svůj výstup ve formátu json takto: {'flashcardType': 'Problem-Solving Text Question to Voice Answer', 'question': 'Kritická funkce ve vaší webové aplikaci občas selhává při vysokém provozu, ale v protokolech se neobjevují žádné chyby. Jak byste identifikovali a vyřešili tento problém?', 'answer': ''}",
      "questionType": "text",
      "answerType": "voice",
      "cognitiveQnType": "Problem-Solving"
    }
}

export const promptAndDataDutch = {
    // Recall, Text to Text
    "Recall Text Question to Text Answer":
    {"prompt": "Herinneringsvragen testen het geheugen door te vragen naar specifieke feiten, definities of informatie. Voor 'Recall Text Question to Text Answer', geef uw output in json-formaat zoals dit: {'flashcardType': 'Recall Text Question to Text Answer', 'question': 'Wat is het primaire doel van een DNS (Domain Name System) server?', 'answer': 'Een DNS-server vertaalt door mensen leesbare domeinnamen (zoals www.example.com) naar IP-adressen die computers gebruiken om elkaar te identificeren op het netwerk.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Recall"
    },
    // Recall, Text to MCQ
    "Recall Text Question to MCQ Answer":
    {"prompt": "Herinneringsvragen testen het geheugen door te vragen naar specifieke feiten, definities of informatie. Voor 'Recall Text Question to MCQ Answer', geef uw output in json-formaat zoals dit: {'flashcardType': 'Recall Text Question to MCQ Answer', 'question': 'Welke HTTP-statuscode geeft aan dat een verzoek is geslaagd?', 'answer': [{'option': '404', 'ans': false}, {'option': '500', 'ans': false}, {'option': '200', 'ans': true}, {'option': '403', 'ans': false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Recall"
    },
    // Recall, Cloze to Text
    "Recall Cloze Question to Text Answer":
    {"prompt": "Herinneringsvragen testen het geheugen door te vragen naar specifieke feiten, definities of informatie. Voor 'Recall Cloze Question to Text Answer', geef uw output in json-formaat zoals dit: {'flashcardType': 'Recall Cloze Question to Text Answer', 'question': 'In JavaScript wordt het trefwoord <blank> gebruikt om een variabele met blokbereik te declareren en hertoewijzing te voorkomen.', 'answer': 'const'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Recall"
    },
    // Recall, Cloze to MCQ
    "Recall Cloze Question to MCQ Answer":
    {"prompt": "Herinneringsvragen testen het geheugen door te vragen naar specifieke feiten, definities of informatie. Voor 'Recall Cloze Question to MCQ Answer', geef uw output in json-formaat zoals dit: {'flashcardType': 'Recall Cloze Question to MCQ Answer', 'question': 'In SQL wordt het commando <blank> gebruikt om alle records uit een tabel te verwijderen zonder individuele rijverwijderingen te loggen.', 'answer': [{'option': 'DELETE', 'ans': false}, {'option': 'TRUNCATE', 'ans': true}, {'option': 'REMOVE', 'ans': false}, {'option': 'DROP', 'ans': false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Recall"
    },
    // Comprehension, Text to Text
    "Comprehension Text Question to Text Answer":
    {"prompt": "Begripsvragen testen het begrip door te vragen naar uitleg, interpretaties, samenvattingen of vergelijkingen. Voor 'Comprehension Text Question to Text Answer', geef uw output in json-formaat zoals dit: {'flashcardType': 'Comprehension Text Question to Text Answer', 'question': 'Leg het verschil uit tussen een oppervlakkige kopie en een diepe kopie in programmeren.', 'answer': 'Een oppervlakkige kopie kopieert alleen de referenties op het hoogste niveau van een object, wat betekent dat geneste objecten nog steeds worden gedeeld. Een diepe kopie kopieert recursief alle geneste objecten, waardoor volledig onafhankelijke duplicaten van de oorspronkelijke structuur worden gemaakt.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Comprehension"
    },
    // Comprehension, Text to MCQ
    "Comprehension Text Question to MCQ Answer":
    {"prompt": "Begripsvragen testen het begrip door te vragen naar uitleg, interpretaties, samenvattingen of vergelijkingen. Voor 'Comprehension Text Question to MCQ Answer', geef uw output in json-formaat zoals dit: {'flashcardType': 'Comprehension Text Question to MCQ Answer', 'question': 'Wat verklaart het beste het verschil tussen HTTP en HTTPS?', 'answer': [{'option': 'HTTPS gebruikt poort 80, terwijl HTTP poort 443 gebruikt.', 'ans': false}, {'option': 'HTTP versleutelt gegevens tijdens verzending, terwijl HTTPS dat niet doet.', 'ans': false}, {'option': 'Er is geen echt verschil tussen HTTP en HTTPS.', 'ans': false}, {'option': 'HTTPS voegt een versleutelingslaag toe via SSL/TLS om gegevensoverdracht te beveiligen, in tegenstelling tot HTTP.', 'ans': true}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Comprehension"
    },
    // Comprehension, Text to Voice
    "Comprehension Text Question to Voice Answer":
    {"prompt": "Begripsvragen testen het begrip door te vragen naar uitleg, interpretaties, samenvattingen of vergelijkingen. Voor 'Comprehension Text Question to Voice Answer', geef uw output in json-formaat zoals dit: {'flashcardType': 'Comprehension Text Question to Voice Answer', 'question': 'Hoe verbetert een load balancer de betrouwbaarheid en schaalbaarheid van een webapplicatie?', 'answer': ''}",
      "questionType": "text",       
      "answerType": "voice",
      "cognitiveQnType": "Comprehension"
    },
    // Application, Text to Text
    "Application Text Question to Text Answer":
    {"prompt": "Toepassingsvragen testen het vermogen om kennis toe te passen op praktische, nieuwe of realistische situaties. Voor 'Application Text Question to Text Answer', geef uw output in json-formaat zoals dit: {'flashcardType': 'Application Text Question to Text Answer', 'question': 'U moet gebruikerssessiegegevens tijdelijk opslaan in een backend-systeem. Welke gegevensstructuur of opslagmethode zou u gebruiken en waarom?', 'answer': 'Een in-memory key-value store zoals Redis is een geschikte keuze omdat het snelle lees/schrijftoegang mogelijk maakt en automatische vervaldatums van sessiegegevens ondersteunt, wat ideaal is voor tijdelijk sessiebeheer.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Application"
    },
    // Application, Text to MCQ
    "Application Text Question to MCQ Answer":
    {"prompt": "Toepassingsvragen testen het vermogen om kennis toe te passen op praktische, nieuwe of realistische situaties. Voor 'Application Text Question to MCQ Answer', geef uw output in json-formaat zoals dit: {'flashcardType': 'Application Text Question to MCQ Answer', 'question': 'U ontwerpt een webformulier dat gevoelige gebruikersinformatie verzamelt. Welke van de volgende acties is het meest geschikt om de beveiliging tijdens gegevensoverdracht te verbeteren?', 'answer': [{'option': 'Verzend het formulier via HTTPS met een POST-verzoek.', 'ans': true}, {'option': 'Gebruik een GET-verzoek om het formulier te verzenden voor betere snelheid.', 'ans': false}, {'option': 'Minificeer de HTML om de broncode moeilijker leesbaar te maken.', 'ans': false}, {'option': 'Bewaar de gegevens in cookies voor snelle toegang.', 'ans': false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Application"
    },
    // Application, Text to Voice
    "Application Text Question to Voice Answer":
    {"prompt": "Toepassingsvragen testen het vermogen om kennis toe te passen op praktische, nieuwe of realistische situaties. Voor 'Application Text Question to Voice Answer', geef uw output in json-formaat zoals dit: {'flashcardType': 'Application Text Question to Voice Answer', 'question': 'U krijgt de taak om de prestaties van een REST API te verbeteren die onder belasting hoge latentie ervaart. Welke praktische stappen zou u nemen om het probleem te identificeren en aan te pakken?', 'answer': ''}",
      "questionType": "text",
      "answerType": "voice",
      "cognitiveQnType": "Application"
    },
    // Analysis, Text to Text
    "Analysis Text Question to Text Answer":
    {"prompt": "Analysevragen testen het vermogen om complexe problemen op te splitsen in kleinere delen en relaties te onderzoeken. Voor 'Analysis Text Question to Text Answer', geef uw output in json-formaat zoals dit: {'flashcardType': 'Analysis Text Question to Text Answer', 'question': 'A/B-testen toont aan dat een nieuwe checkoutpagina leidt tot minder voltooide aankopen, hoewel gebruikers sneller bij de betaalstap komen. Hoe zou u dit resultaat analyseren?', 'answer': 'Ik zou de gebruikersreis in detail onderzoeken, met focus op waar gebruikers afhaken in de nieuwe flow. Ik zou sessieopnames, funnelgegevens en formulierverlatingspercentages analyseren. Het is mogelijk dat de snellere flow gebruiksvriendelijkheidsproblemen, verwarring of vertrouwensproblemen introduceert. Ik zou foutpercentages, veldvalidatiegedrag en laadtijden vergelijken. Ik zou ook kijken naar kwalitatieve feedback of enquêtes om gebruikersperceptie te begrijpen.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Analysis"
    },
    "Analysis Text Question to MCQ Answer":
    {"prompt": "Analysevragen testen het vermogen om complexe problemen op te splitsen in kleinere delen en relaties te onderzoeken. Voor 'Analysis Text Question to MCQ Answer', geef uw output in json-formaat zoals dit: {'flashcardType': 'Analysis Text Question to MCQ Answer', 'question': 'Uw team onderzoekt waarom een nieuw geïmplementeerde functie heeft geleid tot een aanzienlijke toename van paginalaadtijden. Wat is de meest logische volgende stap in het analyseproces?', 'answer': [{'option': 'Rol de implementatie onmiddellijk terug.', 'ans': false}, {'option': 'Profileer de frontend- en backendprestaties om specifieke knelpunten te lokaliseren.', 'ans': true}, {'option': 'Verhoog de servercapaciteit en observeer de resultaten.', 'ans': false}, {'option': 'Schakel over naar een ander frontend-framework.', 'ans': false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Analysis"
    },
    // Analysis, Text to Voice
    "Analysis Text Question to Voice Answer":
    {"prompt": "Analysevragen testen het vermogen om complexe problemen op te splitsen in kleinere delen en relaties te onderzoeken. Voor 'Analysis Text Question to Voice Answer', geef uw output in json-formaat zoals dit: {'flashcardType': 'Analysis Text Question to Voice Answer', 'question': 'U merkt frequente time-outs op wanneer gebruikers tijdens piekuren toegang krijgen tot uw applicatie. Hoe zou u de hoofdoorzaak van het probleem identificeren?', 'answer': ''}",
      "questionType": "text",
      "answerType": "voice",
      "cognitiveQnType": "Analysis"
    },
    // Synthesis, Text to Text
    "Synthesis Text Question to Text Answer":
    {"prompt": "Synthesevragen testen het vermogen om verschillende stukken informatie te combineren of te integreren om een nieuw, coherent geheel te creëren of oplossingen voor te stellen. Voor 'Synthesis Text Question to Text Answer', geef uw output in json-formaat zoals dit: {'flashcardType': 'Synthesis Text Question to Text Answer', 'question': 'Ontwerp een schaalbare notificatiesysteem dat e-mails, SMS en pushmeldingen kan verzenden naar miljoenen gebruikers. Welke belangrijke componenten zou u opnemen en hoe zouden ze interacteren?', 'answer': 'Ik zou het systeem ontwerpen met een berichtenwachtrij om hoge doorvoer te verwerken, een notificatieservice die berichten verwerkt en via geschikte kanalen (e-mail, SMS, push) verzendt. Het systeem zou microservices gebruiken voor elk notificatietype, een database om leveringsstatus bij te houden, en snelheidsbeperkingen om overbelasting te voorkomen. Load balancers en automatische schaalingsgroepen zouden beschikbaarheid en schaalbaarheid waarborgen.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Synthesis"
    },
    // Synthesis, Text to MCQ
    "Synthesis Text Question to MCQ Answer":
    {"prompt": "Synthesevragen testen het vermogen om verschillende stukken informatie te combineren of te integreren om een nieuw, coherent geheel te creëren of oplossingen voor te stellen. Voor 'Synthesis Text Question to MCQ Answer', geef uw output in json-formaat zoals dit: {'flashcardType': 'Synthesis Text Question to MCQ Answer', 'question': 'U moet een systeem ontwerpen dat real-time gegevens van meerdere sensoren aggregeert en analytische dashboards biedt. Welke ontwerpkeuze balanceert het beste schaalbaarheid, betrouwbaarheid en latentie?', 'answer': [{'option': 'Gebruik een gecentraliseerde database waar alle sensorgegevens synchroon worden geschreven.', 'ans': false}, {'option': 'Bewaar gegevens lokaal op elke sensor en upload in batches aan het einde van de dag.', 'ans': false}, {'option': 'Gebruik client-side verwerking voor alle analyses om de serverbelasting te verminderen.', 'ans': false}, {'option': 'Implementeer gedistribueerde berichtenwachtrijen met microservices die gegevens asynchroon verwerken.', 'ans': true}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Synthesis"
    },
    // Synthesis, Text to Voice
    "Synthesis Text Question to Voice Answer":
    {"prompt": "Synthesevragen testen het vermogen om verschillende stukken informatie te combineren of te integreren om een nieuw, coherent geheel te creëren of oplossingen voor te stellen. Voor 'Synthesis Text Question to Voice Answer', geef uw output in json-formaat zoals dit: {'flashcardType': 'Synthesis Text Question to Voice Answer', 'question': 'Ontwerp een systeem dat real-time chat kan verwerken voor miljoenen gebruikers, waarbij berichtlevering, schaalbaarheid en gegevensconsistentie worden gegarandeerd. Beschrijf de belangrijke componenten en hoe ze interacteren.', 'answer': ''}",
      "questionType": "text",
      "answerType": "voice",
      "cognitiveQnType": "Synthesis"
    },
    // Evaluation, Text to Text
    "Evaluation Text Question to Text Answer":
    {"prompt": "Evaluatievragen testen het vermogen om de kwaliteit, nauwkeurigheid of effectiviteit van iets te beoordelen en oordelen te vellen op basis van criteria en beslissingen te rechtvaardigen. Voor 'Evaluation Text Question to Text Answer', geef uw output in json-formaat zoals dit: {'flashcardType': 'Evaluation Text Question to Text Answer', 'question': 'U kiest tussen SQL- en NoSQL-databases voor een e-commerceplatform met veel verkeer. Welke zou u kiezen en waarom?', 'answer': 'Voor een e-commerceplatform is een SQL-database vaak een betere keuze vanwege de behoefte aan sterke consistentie, complexe transacties en gestructureerde relationele gegevens zoals bestellingen, voorraad en gebruikers. Als schaalbaarheid en flexibiliteit echter belangrijker zijn—zoals voor het verwerken van productrecensies of sessiegegevens—kan een NoSQL-oplossing zoals MongoDB of DynamoDB naast SQL worden geïntegreerd in een polyglot-architectuur.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Evaluation"
    },
    // Evaluation, Text to MCQ
    "Evaluation Text Question to MCQ Answer":
    {"prompt": "Evaluatievragen testen het vermogen om de kwaliteit, nauwkeurigheid of effectiviteit van iets te beoordelen en oordelen te vellen op basis van criteria en beslissingen te rechtvaardigen. Voor 'Evaluation Text Question to MCQ Answer', geef uw output in json-formaat zoals dit: {'flashcardType': 'Evaluation Text Question to MCQ Answer', 'question': 'U beoordeelt twee mogelijke frontend-frameworks voor een grootschalige enterprise webapp: React en Angular. Welke van de volgende is de meest redelijke basis om React te kiezen boven Angular?', 'answer': [{'option': 'React vereist geen leercurve, dus het is altijd beter.', 'ans': false}, {'option': 'React dwingt een strikte applicatiestructuur af, wat ideaal is voor grote teams.', 'ans': false}, {'option': 'De componentgebaseerde architectuur van React en het grote ecosysteem bieden flexibiliteit en gemakkelijke integratie met andere bibliotheken.', 'ans': true}, {'option': 'Angular wordt niet meer onderhouden, dus React is de enige levensvatbare optie.', 'ans': false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Evaluation"
    },
    // Evaluation, Text to Voice
    "Evaluation Text Question to Voice Answer":
    {"prompt": "Evaluatievragen testen het vermogen om de kwaliteit, nauwkeurigheid of effectiviteit van iets te beoordelen en oordelen te vellen op basis van criteria en beslissingen te rechtvaardigen. Voor 'Evaluation Text Question to Voice Answer', geef uw output in json-formaat zoals dit: {'flashcardType': 'Evaluation Text Question to Voice Answer', 'question': 'Uw team besluit tussen het intern bouwen van een functie of het gebruik van een SaaS-oplossing van derden. Welke factoren zou u evalueren om een aanbeveling te doen, en wat zou uw uiteindelijke beslissing bepalen?', 'answer': ''}",
      "questionType": "text",
      "answerType": "voice",
      "cognitiveQnType": "Evaluation"
    },
    // Problem-Solving, Text to Text
    "Problem-Solving Text Question to Text Answer":
    {"prompt": "Probleemoplossingsvragen richten zich op het identificeren, diagnosticeren en oplossen van complexe problemen en vereisen vaak creatief of strategisch denken. Voor 'Problem-Solving Text Question to Text Answer', geef uw output in json-formaat zoals dit: {'flashcardType': 'Problem-Solving Text Question to Text Answer', 'question': 'U bouwt een zoekfunctie die snel relevante resultaten moet retourneren, zelfs wanneer de dataset groeit. Hoe zou u dit systeem benaderen om snelle prestaties te behouden?', 'answer': 'Ik zou beginnen met het indexeren van de doorzoekbare velden met behulp van een full-text zoekmachine zoals Elasticsearch of het integreren van database-indexeringsstrategieën. Om de prestaties te verbeteren, zou ik resultaten pagineren, caching gebruiken voor frequente queries en denormalisatie van gegevens overwegen voor snellere leesbewerkingen. Bovendien zou ik querytijden monitoren en indexering of sharding van gegevens aanpassen indien nodig naarmate de dataset groeit.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Problem-Solving"
    },
    // Problem-Solving, Text to MCQ
    "Problem-Solving Text Question to MCQ Answer":
    {"prompt": "Probleemoplossingsvragen richten zich op het identificeren, diagnosticeren en oplossen van complexe problemen en vereisen vaak creatief of strategisch denken. Voor 'Problem-Solving Text Question to MCQ Answer', geef uw output in json-formaat zoals dit: {'flashcardType': 'Problem-Solving Text Question to MCQ Answer', 'question': 'Uw mobiele app crasht willekeurig voor sommige gebruikers, maar u kunt het probleem niet reproduceren op uw apparaten. Wat is de beste eerste stap om het probleem te diagnosticeren?', 'answer': [{'option': 'Vraag gebruikers om de app te verwijderen en opnieuw te installeren.', 'ans': false}, {'option': 'Push een noodupdate met minimale wijzigingen.', 'ans': false}, {'option': 'Controleer crashlogs en analytische tools zoals Firebase Crashlytics om patronen te identificeren.', 'ans': true}, {'option': 'Schakel functies uit totdat de crashes stoppen.', 'ans': false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Problem-Solving"
    },
    // Problem-Solving, Text to Voice
    "Problem-Solving Text Question to Voice Answer":
    {"prompt": "Probleemoplossingsvragen richten zich op het identificeren, diagnosticeren en oplossen van complexe problemen en vereisen vaak creatief of strategisch denken. Voor 'Problem-Solving Text Question to Voice Answer', geef uw output in json-formaat zoals dit: {'flashcardType': 'Problem-Solving Text Question to Voice Answer', 'question': 'Een kritieke functie in uw webapplicatie faalt af en toe onder hoge verkeersbelasting, maar er verschijnen geen fouten in de logs. Hoe zou u het probleem identificeren en oplossen?', 'answer': ''}",
      "questionType": "text",
      "answerType": "voice",
      "cognitiveQnType": "Problem-Solving"
    }
}

export const promptAndDataGerman = {
    // Recall, Text to Text
    "Recall Text Question to Text Answer":
    {"prompt": "Erinnerungsfragen testen das Gedächtnis, indem sie nach spezifischen Fakten, Definitionen oder Informationen fragen. Für 'Recall Text Question to Text Answer' geben Sie Ihre Ausgabe im JSON-Format wie folgt an: {'flashcardType': 'Recall Text Question to Text Answer', 'question': 'Was ist der Hauptzweck eines DNS (Domain Name System) Servers?', 'answer': 'Ein DNS-Server übersetzt menschenlesbare Domänennamen (wie www.example.com) in IP-Adressen, die Computer verwenden, um sich im Netzwerk zu identifizieren.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Recall"
    },
    // Recall, Text to MCQ
    "Recall Text Question to MCQ Answer":
    {"prompt": "Erinnerungsfragen testen das Gedächtnis, indem sie nach spezifischen Fakten, Definitionen oder Informationen fragen. Für 'Recall Text Question to MCQ Answer' geben Sie Ihre Ausgabe im JSON-Format wie folgt an: {'flashcardType': 'Recall Text Question to MCQ Answer', 'question': 'Welcher HTTP-Statuscode zeigt an, dass eine Anfrage erfolgreich war?', 'answer': [{'option': '404', 'ans': false}, {'option': '500', 'ans': false}, {'option': '200', 'ans': true}, {'option': '403', 'ans': false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Recall"
    },
    // Recall, Cloze to Text
    "Recall Cloze Question to Text Answer":
    {"prompt": "Erinnerungsfragen testen das Gedächtnis, indem sie nach spezifischen Fakten, Definitionen oder Informationen fragen. Für 'Recall Cloze Question to Text Answer' geben Sie Ihre Ausgabe im JSON-Format wie folgt an: {'flashcardType': 'Recall Cloze Question to Text Answer', 'question': 'In JavaScript wird das Schlüsselwort <blank> verwendet, um eine Variable mit Blockgültigkeitsbereich zu deklarieren und Neuzuweisung zu verhindern.', 'answer': 'const'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Recall"
    },
    // Recall, Cloze to MCQ
    "Recall Cloze Question to MCQ Answer":
    {"prompt": "Erinnerungsfragen testen das Gedächtnis, indem sie nach spezifischen Fakten, Definitionen oder Informationen fragen. Für 'Recall Cloze Question to MCQ Answer' geben Sie Ihre Ausgabe im JSON-Format wie folgt an: {'flashcardType': 'Recall Cloze Question to MCQ Answer', 'question': 'In SQL wird der Befehl <blank> verwendet, um alle Datensätze aus einer Tabelle zu entfernen, ohne einzelne Zeilenlöschungen zu protokollieren.', 'answer': [{'option': 'DELETE', 'ans': false}, {'option': 'TRUNCATE', 'ans': true}, {'option': 'REMOVE', 'ans': false}, {'option': 'DROP', 'ans': false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Recall"
    },
    // Comprehension, Text to Text
    "Comprehension Text Question to Text Answer":
    {"prompt": "Verständnisfragen testen das Verständnis, indem sie nach Erklärungen, Interpretationen, Zusammenfassungen oder Vergleichen fragen. Für 'Comprehension Text Question to Text Answer' geben Sie Ihre Ausgabe im JSON-Format wie folgt an: {'flashcardType': 'Comprehension Text Question to Text Answer', 'question': 'Erklären Sie den Unterschied zwischen einer flachen Kopie und einer tiefen Kopie in der Programmierung.', 'answer': 'Eine flache Kopie kopiert nur die Referenzen auf oberster Ebene eines Objekts, was bedeutet, dass verschachtelte Objekte weiterhin geteilt werden. Eine tiefe Kopie kopiert rekursiv alle verschachtelten Objekte und erstellt vollständig unabhängige Duplikate der ursprünglichen Struktur.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Comprehension"
    },
    // Comprehension, Text to MCQ
    "Comprehension Text Question to MCQ Answer":
    {"prompt": "Verständnisfragen testen das Verständnis, indem sie nach Erklärungen, Interpretationen, Zusammenfassungen oder Vergleichen fragen. Für 'Comprehension Text Question to MCQ Answer' geben Sie Ihre Ausgabe im JSON-Format wie folgt an: {'flashcardType': 'Comprehension Text Question to MCQ Answer', 'question': 'Was erklärt am besten den Unterschied zwischen HTTP und HTTPS?', 'answer': [{'option': 'HTTPS verwendet Port 80, während HTTP Port 443 verwendet.', 'ans': false}, {'option': 'HTTP verschlüsselt Daten während der Übertragung, während HTTPS dies nicht tut.', 'ans': false}, {'option': 'Es gibt keinen wirklichen Unterschied zwischen HTTP und HTTPS.', 'ans': false}, {'option': 'HTTPS fügt eine Verschlüsselungsschicht über SSL/TLS hinzu, um die Datenübertragung zu sichern, im Gegensatz zu HTTP.', 'ans': true}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Comprehension"
    },
    // Comprehension, Text to Voice
    "Comprehension Text Question to Voice Answer":
    {"prompt": "Verständnisfragen testen das Verständnis, indem sie nach Erklärungen, Interpretationen, Zusammenfassungen oder Vergleichen fragen. Für 'Comprehension Text Question to Voice Answer' geben Sie Ihre Ausgabe im JSON-Format wie folgt an: {'flashcardType': 'Comprehension Text Question to Voice Answer', 'question': 'Wie verbessert ein Load Balancer die Zuverlässigkeit und Skalierbarkeit einer Webanwendung?', 'answer': ''}",
      "questionType": "text",       
      "answerType": "voice",
      "cognitiveQnType": "Comprehension"
    },
    // Application, Text to Text
    "Application Text Question to Text Answer":
    {"prompt": "Anwendungsfragen testen die Fähigkeit, Wissen auf praktische, neue oder realistische Situationen anzuwenden. Für 'Application Text Question to Text Answer' geben Sie Ihre Ausgabe im JSON-Format wie folgt an: {'flashcardType': 'Application Text Question to Text Answer', 'question': 'Sie müssen Benutzersitzungsdaten vorübergehend in einem Backend-System speichern. Welche Datenstruktur oder Speichermethode würden Sie verwenden und warum?', 'answer': 'Ein In-Memory-Key-Value-Store wie Redis ist eine geeignete Wahl, da er schnellen Lese-/Schreibzugriff ermöglicht und automatisches Ablaufen von Sitzungsdaten unterstützt, was ideal für die temporäre Sitzungsverwaltung ist.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Application"
    },
    // Application, Text to MCQ
    "Application Text Question to MCQ Answer":
    {"prompt": "Anwendungsfragen testen die Fähigkeit, Wissen auf praktische, neue oder realistische Situationen anzuwenden. Für 'Application Text Question to MCQ Answer' geben Sie Ihre Ausgabe im JSON-Format wie folgt an: {'flashcardType': 'Application Text Question to MCQ Answer', 'question': 'Sie entwerfen ein Webformular, das sensible Benutzerinformationen sammelt. Welche der folgenden Aktionen ist am besten geeignet, um die Sicherheit während der Datenübertragung zu verbessern?', 'answer': [{'option': 'Senden Sie das Formular über HTTPS mit einer POST-Anfrage.', 'ans': true}, {'option': 'Verwenden Sie eine GET-Anfrage, um das Formular für bessere Geschwindigkeit zu senden.', 'ans': false}, {'option': 'Minifizieren Sie den HTML-Code, um den Quellcode schwerer lesbar zu machen.', 'ans': false}, {'option': 'Speichern Sie die Daten in Cookies für schnellen Zugriff.', 'ans': false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Application"
    },
    // Application, Text to Voice
    "Application Text Question to Voice Answer":
    {"prompt": "Anwendungsfragen testen die Fähigkeit, Wissen auf praktische, neue oder realistische Situationen anzuwenden. Für 'Application Text Question to Voice Answer' geben Sie Ihre Ausgabe im JSON-Format wie folgt an: {'flashcardType': 'Application Text Question to Voice Answer', 'question': 'Ihnen wird die Aufgabe gestellt, die Leistung einer REST-API zu verbessern, die unter Last hohe Latenz aufweist. Welche praktischen Schritte würden Sie unternehmen, um das Problem zu identifizieren und zu beheben?', 'answer': ''}",
      "questionType": "text",
      "answerType": "voice",
      "cognitiveQnType": "Application"
    },
    // Analysis, Text to Text
    "Analysis Text Question to Text Answer":
    {"prompt": "Analysefragen testen die Fähigkeit, komplexe Probleme in kleinere Teile zu zerlegen und Beziehungen zu untersuchen. Für 'Analysis Text Question to Text Answer' geben Sie Ihre Ausgabe im JSON-Format wie folgt an: {'flashcardType': 'Analysis Text Question to Text Answer', 'question': 'A/B-Tests zeigen, dass eine neue Checkout-Seite zu weniger abgeschlossenen Käufen führt, obwohl Benutzer schneller zum Zahlungsschritt gelangen. Wie würden Sie dieses Ergebnis analysieren?', 'answer': 'Ich würde die Benutzerreise im Detail untersuchen und mich darauf konzentrieren, wo Benutzer im neuen Ablauf abspringen. Ich würde Sitzungsaufzeichnungen, Funnel-Daten und Formularabbruchraten analysieren. Es ist möglich, dass der schnellere Ablauf Benutzerfreundlichkeitsprobleme, Verwirrung oder Vertrauensprobleme einführt. Ich würde Fehlerraten, Feldvalidierungsverhalten und Ladezeiten vergleichen. Ich würde auch qualitative Rückmeldungen oder Umfragen betrachten, um die Benutzerwahrnehmung zu verstehen.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Analysis"
    },
    "Analysis Text Question to MCQ Answer":
    {"prompt": "Analysefragen testen die Fähigkeit, komplexe Probleme in kleinere Teile zu zerlegen und Beziehungen zu untersuchen. Für 'Analysis Text Question to MCQ Answer' geben Sie Ihre Ausgabe im JSON-Format wie folgt an: {'flashcardType': 'Analysis Text Question to MCQ Answer', 'question': 'Ihr Team untersucht, warum eine neu bereitgestellte Funktion zu einer erheblichen Zunahme der Seitenladezeiten geführt hat. Was ist der logischste nächste Schritt im Analyseprozess?', 'answer': [{'option': 'Rollback der Bereitstellung sofort.', 'ans': false}, {'option': 'Profilieren Sie die Frontend- und Backend-Leistung, um spezifische Engpässe zu lokalisieren.', 'ans': true}, {'option': 'Erhöhen Sie die Serverkapazität und beobachten Sie die Ergebnisse.', 'ans': false}, {'option': 'Wechseln Sie zu einem anderen Frontend-Framework.', 'ans': false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Analysis"
    },
    // Analysis, Text to Voice
    "Analysis Text Question to Voice Answer":
    {"prompt": "Analysefragen testen die Fähigkeit, komplexe Probleme in kleinere Teile zu zerlegen und Beziehungen zu untersuchen. Für 'Analysis Text Question to Voice Answer' geben Sie Ihre Ausgabe im JSON-Format wie folgt an: {'flashcardType': 'Analysis Text Question to Voice Answer', 'question': 'Sie bemerken häufige Timeouts, wenn Benutzer während der Hauptverkehrszeiten auf Ihre Anwendung zugreifen. Wie würden Sie vorgehen, um die Hauptursache des Problems zu identifizieren?', 'answer': ''}",
      "questionType": "text",
      "answerType": "voice",
      "cognitiveQnType": "Analysis"
    },
    // Synthesis, Text to Text
    "Synthesis Text Question to Text Answer":
    {"prompt": "Synthesefragen testen die Fähigkeit, verschiedene Informationsstücke zu kombinieren oder zu integrieren, um ein neues, kohärentes Ganzes zu erstellen oder Lösungen vorzuschlagen. Für 'Synthesis Text Question to Text Answer' geben Sie Ihre Ausgabe im JSON-Format wie folgt an: {'flashcardType': 'Synthesis Text Question to Text Answer', 'question': 'Entwerfen Sie ein skalierbares Benachrichtigungssystem, das E-Mails, SMS und Push-Benachrichtigungen an Millionen von Benutzern senden kann. Welche wichtigen Komponenten würden Sie einbeziehen und wie würden sie interagieren?', 'answer': 'Ich würde das System mit einer Nachrichtenwarteschlange entwerfen, um hohen Durchsatz zu bewältigen, einen Benachrichtigungsdienst, der Nachrichten verarbeitet und über geeignete Kanäle (E-Mail, SMS, Push) sendet. Das System würde Microservices für jeden Benachrichtigungstyp verwenden, eine Datenbank zur Verfolgung des Lieferstatus und Ratenbegrenzung, um Überlastung zu verhindern. Load Balancer und Auto-Scaling-Gruppen würden Verfügbarkeit und Skalierbarkeit gewährleisten.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Synthesis"
    },
    // Synthesis, Text to MCQ
    "Synthesis Text Question to MCQ Answer":
    {"prompt": "Synthesefragen testen die Fähigkeit, verschiedene Informationsstücke zu kombinieren oder zu integrieren, um ein neues, kohärentes Ganzes zu erstellen oder Lösungen vorzuschlagen. Für 'Synthesis Text Question to MCQ Answer' geben Sie Ihre Ausgabe im JSON-Format wie folgt an: {'flashcardType': 'Synthesis Text Question to MCQ Answer', 'question': 'Sie müssen ein System entwerfen, das Echtzeitdaten von mehreren Sensoren aggregiert und Analyse-Dashboards bereitstellt. Welche Designentscheidung balanciert am besten Skalierbarkeit, Zuverlässigkeit und Latenz?', 'answer': [{'option': 'Verwenden Sie eine zentralisierte Datenbank, in die alle Sensordaten synchron geschrieben werden.', 'ans': false}, {'option': 'Speichern Sie Daten lokal auf jedem Sensor und laden Sie sie am Ende des Tages in Batches hoch.', 'ans': false}, {'option': 'Verwenden Sie clientseitige Verarbeitung für alle Analysen, um die Serverlast zu reduzieren.', 'ans': false}, {'option': 'Implementieren Sie verteilte Nachrichtenwarteschlangen mit Microservices, die Daten asynchron verarbeiten.', 'ans': true}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Synthesis"
    },
    // Synthesis, Text to Voice
    "Synthesis Text Question to Voice Answer":
    {"prompt": "Synthesefragen testen die Fähigkeit, verschiedene Informationsstücke zu kombinieren oder zu integrieren, um ein neues, kohärentes Ganzes zu erstellen oder Lösungen vorzuschlagen. Für 'Synthesis Text Question to Voice Answer' geben Sie Ihre Ausgabe im JSON-Format wie folgt an: {'flashcardType': 'Synthesis Text Question to Voice Answer', 'question': 'Entwerfen Sie ein System, das Echtzeit-Chat für Millionen von Benutzern verarbeiten kann und dabei Nachrichtenlieferung, Skalierbarkeit und Datenkonsistenz gewährleistet. Beschreiben Sie die wichtigen Komponenten und wie sie interagieren.', 'answer': ''}",
      "questionType": "text",
      "answerType": "voice",
      "cognitiveQnType": "Synthesis"
    },
    // Evaluation, Text to Text
    "Evaluation Text Question to Text Answer":
    {"prompt": "Evaluationsfragen testen die Fähigkeit, die Qualität, Genauigkeit oder Effektivität von etwas zu bewerten und Urteile auf der Grundlage von Kriterien zu fällen und Entscheidungen zu rechtfertigen. Für 'Evaluation Text Question to Text Answer' geben Sie Ihre Ausgabe im JSON-Format wie folgt an: {'flashcardType': 'Evaluation Text Question to Text Answer', 'question': 'Sie wählen zwischen SQL- und NoSQL-Datenbanken für eine E-Commerce-Plattform mit hohem Verkehrsaufkommen. Welche würden Sie wählen und warum?', 'answer': 'Für eine E-Commerce-Plattform ist eine SQL-Datenbank oft die bessere Wahl aufgrund der Notwendigkeit starker Konsistenz, komplexer Transaktionen und strukturierter relationaler Daten wie Bestellungen, Inventar und Benutzer. Wenn jedoch Skalierbarkeit und Flexibilität wichtiger sind—wie für die Verarbeitung von Produktbewertungen oder Sitzungsdaten—könnte eine NoSQL-Lösung wie MongoDB oder DynamoDB neben SQL in einer Polyglot-Architektur integriert werden.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Evaluation"
    },
    // Evaluation, Text to MCQ
    "Evaluation Text Question to MCQ Answer":
    {"prompt": "Evaluationsfragen testen die Fähigkeit, die Qualität, Genauigkeit oder Effektivität von etwas zu bewerten und Urteile auf der Grundlage von Kriterien zu fällen und Entscheidungen zu rechtfertigen. Für 'Evaluation Text Question to MCQ Answer' geben Sie Ihre Ausgabe im JSON-Format wie folgt an: {'flashcardType': 'Evaluation Text Question to MCQ Answer', 'question': 'Sie bewerten zwei mögliche Frontend-Frameworks für eine groß angelegte Enterprise-Webanwendung: React und Angular. Welche der folgenden ist die vernünftigste Grundlage, um React über Angular zu wählen?', 'answer': [{'option': 'React erfordert keine Lernkurve, daher ist es immer besser.', 'ans': false}, {'option': 'React erzwingt eine strikte Anwendungsstruktur, was ideal für große Teams ist.', 'ans': false}, {'option': 'Die komponentenbasierte Architektur von React und das große Ökosystem bieten Flexibilität und einfache Integration mit anderen Bibliotheken.', 'ans': true}, {'option': 'Angular wird nicht mehr gewartet, daher ist React die einzige lebensfähige Option.', 'ans': false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Evaluation"
    },
    // Evaluation, Text to Voice
    "Evaluation Text Question to Voice Answer":
    {"prompt": "Evaluationsfragen testen die Fähigkeit, die Qualität, Genauigkeit oder Effektivität von etwas zu bewerten und Urteile auf der Grundlage von Kriterien zu fällen und Entscheidungen zu rechtfertigen. Für 'Evaluation Text Question to Voice Answer' geben Sie Ihre Ausgabe im JSON-Format wie folgt an: {'flashcardType': 'Evaluation Text Question to Voice Answer', 'question': 'Ihr Team entscheidet zwischen dem internen Aufbau einer Funktion oder der Verwendung einer SaaS-Lösung von Drittanbietern. Welche Faktoren würden Sie bewerten, um eine Empfehlung abzugeben, und was würde Ihre endgültige Entscheidung bestimmen?', 'answer': ''}",
      "questionType": "text",
      "answerType": "voice",
      "cognitiveQnType": "Evaluation"
    },
    // Problem-Solving, Text to Text
    "Problem-Solving Text Question to Text Answer":
    {"prompt": "Problemlösungsfragen konzentrieren sich auf die Identifizierung, Diagnose und Lösung komplexer Probleme und erfordern oft kreatives oder strategisches Denken. Für 'Problem-Solving Text Question to Text Answer' geben Sie Ihre Ausgabe im JSON-Format wie folgt an: {'flashcardType': 'Problem-Solving Text Question to Text Answer', 'question': 'Sie erstellen eine Suchfunktion, die schnell relevante Ergebnisse zurückgeben muss, auch wenn der Datensatz wächst. Wie würden Sie dieses System angehen, um schnelle Leistung aufrechtzuerhalten?', 'answer': 'Ich würde damit beginnen, die durchsuchbaren Felder mit einer Volltextsuchmaschine wie Elasticsearch zu indizieren oder Datenbankindizierungsstrategien zu integrieren. Um die Leistung zu verbessern, würde ich Ergebnisse paginieren, Caching für häufige Abfragen verwenden und die Denormalisierung von Daten für schnellere Lesevorgänge in Betracht ziehen. Zusätzlich würde ich Abfragezeiten überwachen und die Indizierung oder Sharding von Daten bei Bedarf anpassen, wenn der Datensatz wächst.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Problem-Solving"
    },
    // Problem-Solving, Text to MCQ
    "Problem-Solving Text Question to MCQ Answer":
    {"prompt": "Problemlösungsfragen konzentrieren sich auf die Identifizierung, Diagnose und Lösung komplexer Probleme und erfordern oft kreatives oder strategisches Denken. Für 'Problem-Solving Text Question to MCQ Answer' geben Sie Ihre Ausgabe im JSON-Format wie folgt an: {'flashcardType': 'Problem-Solving Text Question to MCQ Answer', 'question': 'Ihre mobile App stürzt zufällig für einige Benutzer ab, aber Sie können das Problem auf Ihren Geräten nicht reproduzieren. Was ist der beste erste Schritt, um das Problem zu diagnostizieren?', 'answer': [{'option': 'Bitten Sie Benutzer, die App zu löschen und neu zu installieren.', 'ans': false}, {'option': 'Senden Sie ein Notfall-Update mit minimalen Änderungen.', 'ans': false}, {'option': 'Überprüfen Sie Absturzprotokolle und Analysetools wie Firebase Crashlytics, um Muster zu identifizieren.', 'ans': true}, {'option': 'Deaktivieren Sie Funktionen, bis die Abstürze aufhören.', 'ans': false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Problem-Solving"
    },
    // Problem-Solving, Text to Voice
    "Problem-Solving Text Question to Voice Answer":
    {"prompt": "Problemlösungsfragen konzentrieren sich auf die Identifizierung, Diagnose und Lösung komplexer Probleme und erfordern oft kreatives oder strategisches Denken. Für 'Problem-Solving Text Question to Voice Answer' geben Sie Ihre Ausgabe im JSON-Format wie folgt an: {'flashcardType': 'Problem-Solving Text Question to Voice Answer', 'question': 'Eine kritische Funktion in Ihrer Webanwendung schlägt unter hoher Verkehrslast intermittierend fehl, aber es erscheinen keine Fehler in den Protokollen. Wie würden Sie vorgehen, um das Problem zu identifizieren und zu lösen?', 'answer': ''}",
      "questionType": "text",
      "answerType": "voice",
      "cognitiveQnType": "Problem-Solving"
    }
}

export const promptAndDataSpanish = {
    // Recall, Text to Text
    "Recall Text Question to Text Answer":
    {"prompt": "Las preguntas de recuerdo prueban la memoria pidiendo hechos específicos, definiciones o información. Para 'Recall Text Question to Text Answer', proporcione su salida en formato JSON así: {'flashcardType': 'Recall Text Question to Text Answer', 'question': '¿Cuál es el propósito principal de un servidor DNS (Sistema de Nombres de Dominio)?', 'answer': 'Un servidor DNS traduce nombres de dominio legibles por humanos (como www.example.com) en direcciones IP que las computadoras usan para identificarse entre sí en la red.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Recall"
    },
    // Recall, Text to MCQ
    "Recall Text Question to MCQ Answer":
    {"prompt": "Las preguntas de recuerdo prueban la memoria pidiendo hechos específicos, definiciones o información. Para 'Recall Text Question to MCQ Answer', proporcione su salida en formato JSON así: {'flashcardType': 'Recall Text Question to MCQ Answer', 'question': '¿Qué código de estado HTTP indica que una solicitud ha tenido éxito?', 'answer': [{'option': '404', 'ans': false}, {'option': '500', 'ans': false}, {'option': '200', 'ans': true}, {'option': '403', 'ans': false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Recall"
    },
    // Recall, Cloze to Text
    "Recall Cloze Question to Text Answer":
    {"prompt": "Las preguntas de recuerdo prueban la memoria pidiendo hechos específicos, definiciones o información. Para 'Recall Cloze Question to Text Answer', proporcione su salida en formato JSON así: {'flashcardType': 'Recall Cloze Question to Text Answer', 'question': 'En JavaScript, la palabra clave <blank> se usa para declarar una variable con alcance de bloque y prevenir la reasignación.', 'answer': 'const'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Recall"
    },
    // Recall, Cloze to MCQ
    "Recall Cloze Question to MCQ Answer":
    {"prompt": "Las preguntas de recuerdo prueban la memoria pidiendo hechos específicos, definiciones o información. Para 'Recall Cloze Question to MCQ Answer', proporcione su salida en formato JSON así: {'flashcardType': 'Recall Cloze Question to MCQ Answer', 'question': 'En SQL, el comando <blank> se usa para eliminar todos los registros de una tabla sin registrar eliminaciones de filas individuales.', 'answer': [{'option': 'DELETE', 'ans': false}, {'option': 'TRUNCATE', 'ans': true}, {'option': 'REMOVE', 'ans': false}, {'option': 'DROP', 'ans': false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Recall"
    },
    // Comprehension, Text to Text
    "Comprehension Text Question to Text Answer":
    {"prompt": "Las preguntas de comprensión prueban el entendimiento pidiendo explicaciones, interpretaciones, resúmenes o comparaciones. Para 'Comprehension Text Question to Text Answer', proporcione su salida en formato JSON así: {'flashcardType': 'Comprehension Text Question to Text Answer', 'question': 'Explique la diferencia entre una copia superficial y una copia profunda en programación.', 'answer': 'Una copia superficial copia solo las referencias de nivel superior de un objeto, lo que significa que los objetos anidados aún se comparten. Una copia profunda copia recursivamente todos los objetos anidados, creando duplicados completamente independientes de la estructura original.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Comprehension"
    },
    // Comprehension, Text to MCQ
    "Comprehension Text Question to MCQ Answer":
    {"prompt": "Las preguntas de comprensión prueban el entendimiento pidiendo explicaciones, interpretaciones, resúmenes o comparaciones. Para 'Comprehension Text Question to MCQ Answer', proporcione su salida en formato JSON así: {'flashcardType': 'Comprehension Text Question to MCQ Answer', 'question': '¿Qué explica mejor la diferencia entre HTTP y HTTPS?', 'answer': [{'option': 'HTTPS usa el puerto 80, mientras que HTTP usa el puerto 443.', 'ans': false}, {'option': 'HTTP encripta datos durante la transmisión, mientras que HTTPS no lo hace.', 'ans': false}, {'option': 'No hay diferencia real entre HTTP y HTTPS.', 'ans': false}, {'option': 'HTTPS agrega una capa de encriptación mediante SSL/TLS para asegurar la transmisión de datos, a diferencia de HTTP.', 'ans': true}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Comprehension"
    },
    // Comprehension, Text to Voice
    "Comprehension Text Question to Voice Answer":
    {"prompt": "Las preguntas de comprensión prueban el entendimiento pidiendo explicaciones, interpretaciones, resúmenes o comparaciones. Para 'Comprehension Text Question to Voice Answer', proporcione su salida en formato JSON así: {'flashcardType': 'Comprehension Text Question to Voice Answer', 'question': '¿Cómo mejora un balanceador de carga la confiabilidad y escalabilidad de una aplicación web?', 'answer': ''}",
      "questionType": "text",       
      "answerType": "voice",
      "cognitiveQnType": "Comprehension"
    },
    // Application, Text to Text
    "Application Text Question to Text Answer":
    {"prompt": "Las preguntas de aplicación prueban la capacidad de aplicar conocimiento a situaciones prácticas, nuevas o del mundo real. Para 'Application Text Question to Text Answer', proporcione su salida en formato JSON así: {'flashcardType': 'Application Text Question to Text Answer', 'question': 'Necesita almacenar datos de sesión de usuario temporalmente en un sistema backend. ¿Qué estructura de datos o método de almacenamiento usaría y por qué?', 'answer': 'Un almacén clave-valor en memoria como Redis es una opción adecuada porque permite acceso rápido de lectura/escritura y soporta expiración automática de datos de sesión, lo cual es ideal para la gestión temporal de sesiones.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Application"
    },
    // Application, Text to MCQ
    "Application Text Question to MCQ Answer":
    {"prompt": "Las preguntas de aplicación prueban la capacidad de aplicar conocimiento a situaciones prácticas, nuevas o del mundo real. Para 'Application Text Question to MCQ Answer', proporcione su salida en formato JSON así: {'flashcardType': 'Application Text Question to MCQ Answer', 'question': 'Está diseñando un formulario web que recopila información sensible del usuario. ¿Cuál de las siguientes acciones es más apropiada para mejorar la seguridad durante la transmisión de datos?', 'answer': [{'option': 'Enviar el formulario sobre HTTPS usando una solicitud POST.', 'ans': true}, {'option': 'Usar una solicitud GET para enviar el formulario para mayor velocidad.', 'ans': false}, {'option': 'Minificar el HTML para hacer el código fuente más difícil de leer.', 'ans': false}, {'option': 'Almacenar los datos en cookies para acceso rápido.', 'ans': false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Application"
    },
    // Application, Text to Voice
    "Application Text Question to Voice Answer":
    {"prompt": "Las preguntas de aplicación prueban la capacidad de aplicar conocimiento a situaciones prácticas, nuevas o del mundo real. Para 'Application Text Question to Voice Answer', proporcione su salida en formato JSON así: {'flashcardType': 'Application Text Question to Voice Answer', 'question': 'Se le asigna la tarea de mejorar el rendimiento de una API REST que está experimentando alta latencia bajo carga. ¿Qué pasos prácticos tomaría para identificar y abordar el problema?', 'answer': ''}",
      "questionType": "text",
      "answerType": "voice",
      "cognitiveQnType": "Application"
    },
    // Analysis, Text to Text
    "Analysis Text Question to Text Answer":
    {"prompt": "Las preguntas de análisis prueban la capacidad de descomponer problemas complejos en partes más pequeñas y examinar relaciones. Para 'Analysis Text Question to Text Answer', proporcione su salida en formato JSON así: {'flashcardType': 'Analysis Text Question to Text Answer', 'question': 'Las pruebas A/B muestran que una nueva página de pago lleva a menos compras completadas, aunque los usuarios llegan al paso de pago más rápido. ¿Cómo analizaría este resultado?', 'answer': 'Examinaría el recorrido del usuario en detalle, enfocándome en dónde los usuarios abandonan en el nuevo flujo. Analizaría grabaciones de sesiones, datos de embudo y tasas de abandono de formularios. Es posible que el flujo más rápido introduzca problemas de usabilidad, confusión o problemas de confianza. Compararía tasas de error, comportamiento de validación de campos y tiempos de carga. También consideraría comentarios cualitativos o encuestas para entender la percepción del usuario.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Analysis"
    },
    "Analysis Text Question to MCQ Answer":
    {"prompt": "Las preguntas de análisis prueban la capacidad de descomponer problemas complejos en partes más pequeñas y examinar relaciones. Para 'Analysis Text Question to MCQ Answer', proporcione su salida en formato JSON así: {'flashcardType': 'Analysis Text Question to MCQ Answer', 'question': 'Su equipo está investigando por qué una función recién implementada ha causado que los tiempos de carga de página aumenten significativamente. ¿Cuál es el paso más lógico siguiente en el proceso de análisis?', 'answer': [{'option': 'Revertir la implementación inmediatamente.', 'ans': false}, {'option': 'Perfilar el rendimiento del frontend y backend para localizar cuellos de botella específicos.', 'ans': true}, {'option': 'Aumentar la capacidad del servidor y observar los resultados.', 'ans': false}, {'option': 'Cambiar a un framework frontend diferente.', 'ans': false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Analysis"
    },
    // Analysis, Text to Voice
    "Analysis Text Question to Voice Answer":
    {"prompt": "Las preguntas de análisis prueban la capacidad de descomponer problemas complejos en partes más pequeñas y examinar relaciones. Para 'Analysis Text Question to Voice Answer', proporcione su salida en formato JSON así: {'flashcardType': 'Analysis Text Question to Voice Answer', 'question': 'Está notando timeouts frecuentes cuando los usuarios acceden a su aplicación durante las horas pico. ¿Cómo procedería para identificar la causa raíz del problema?', 'answer': ''}",
      "questionType": "text",
      "answerType": "voice",
      "cognitiveQnType": "Analysis"
    },
    // Synthesis, Text to Text
    "Synthesis Text Question to Text Answer":
    {"prompt": "Las preguntas de síntesis prueban la capacidad de combinar o integrar diferentes piezas de información para crear un todo nuevo y coherente, o proponer soluciones. Para 'Synthesis Text Question to Text Answer', proporcione su salida en formato JSON así: {'flashcardType': 'Synthesis Text Question to Text Answer', 'question': 'Diseñe un sistema de notificaciones escalable que pueda enviar correos electrónicos, SMS y notificaciones push a millones de usuarios. ¿Qué componentes clave incluiría y cómo interactuarían?', 'answer': 'Diseñaría el sistema con una cola de mensajes para manejar alto rendimiento, un servicio de notificaciones que procesa mensajes y los envía a través de canales apropiados (correo electrónico, SMS, push). El sistema usaría microservicios para cada tipo de notificación, una base de datos para rastrear el estado de entrega y limitación de velocidad para prevenir sobrecarga. Los balanceadores de carga y grupos de autoescalado asegurarían disponibilidad y escalabilidad.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Synthesis"
    },
    // Synthesis, Text to MCQ
    "Synthesis Text Question to MCQ Answer":
    {"prompt": "Las preguntas de síntesis prueban la capacidad de combinar o integrar diferentes piezas de información para crear un todo nuevo y coherente, o proponer soluciones. Para 'Synthesis Text Question to MCQ Answer', proporcione su salida en formato JSON así: {'flashcardType': 'Synthesis Text Question to MCQ Answer', 'question': 'Necesita diseñar un sistema que agregue datos en tiempo real de múltiples sensores y proporcione paneles de análisis. ¿Qué decisión de diseño equilibra mejor escalabilidad, confiabilidad y latencia?', 'answer': [{'option': 'Usar una base de datos centralizada donde todos los datos del sensor se escriban sincrónicamente.', 'ans': false}, {'option': 'Almacenar datos localmente en cada sensor y cargarlos en lotes al final del día.', 'ans': false}, {'option': 'Usar procesamiento del lado del cliente para todos los análisis para reducir la carga del servidor.', 'ans': false}, {'option': 'Implementar colas de mensajes distribuidas con microservicios que procesen datos de forma asíncrona.', 'ans': true}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Synthesis"
    },
    // Synthesis, Text to Voice
    "Synthesis Text Question to Voice Answer":
    {"prompt": "Las preguntas de síntesis prueban la capacidad de combinar o integrar diferentes piezas de información para crear un todo nuevo y coherente, o proponer soluciones. Para 'Synthesis Text Question to Voice Answer', proporcione su salida en formato JSON así: {'flashcardType': 'Synthesis Text Question to Voice Answer', 'question': 'Diseñe un sistema que pueda manejar chat en tiempo real para millones de usuarios, asegurando entrega de mensajes, escalabilidad y consistencia de datos. Describa los componentes clave y cómo interactúan.', 'answer': ''}",
      "questionType": "text",
      "answerType": "voice",
      "cognitiveQnType": "Synthesis"
    },
    // Evaluation, Text to Text
    "Evaluation Text Question to Text Answer":
    {"prompt": "Las preguntas de evaluación prueban la capacidad de evaluar la calidad, precisión o efectividad de algo, y hacer juicios basados en criterios y justificar decisiones. Para 'Evaluation Text Question to Text Answer', proporcione su salida en formato JSON así: {'flashcardType': 'Evaluation Text Question to Text Answer', 'question': 'Está eligiendo entre bases de datos SQL y NoSQL para una plataforma de comercio electrónico de alto tráfico. ¿Cuál elegiría y por qué?', 'answer': 'Para una plataforma de comercio electrónico, una base de datos SQL a menudo es la mejor opción debido a la necesidad de consistencia fuerte, transacciones complejas y datos relacionales estructurados como pedidos, inventario y usuarios. Sin embargo, si la escalabilidad y flexibilidad son más importantes—como para manejar reseñas de productos o datos de sesión—una solución NoSQL como MongoDB o DynamoDB podría integrarse junto con SQL en una arquitectura políglota.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Evaluation"
    },
    // Evaluation, Text to MCQ
    "Evaluation Text Question to MCQ Answer":
    {"prompt": "Las preguntas de evaluación prueban la capacidad de evaluar la calidad, precisión o efectividad de algo, y hacer juicios basados en criterios y justificar decisiones. Para 'Evaluation Text Question to MCQ Answer', proporcione su salida en formato JSON así: {'flashcardType': 'Evaluation Text Question to MCQ Answer', 'question': 'Está evaluando dos posibles frameworks frontend para una aplicación web empresarial a gran escala: React y Angular. ¿Cuál de las siguientes es la base más razonable para elegir React sobre Angular?', 'answer': [{'option': 'React no requiere curva de aprendizaje, por lo que siempre es mejor.', 'ans': false}, {'option': 'React impone una estructura de aplicación estricta, lo cual es ideal para equipos grandes.', 'ans': false}, {'option': 'La arquitectura basada en componentes de React y su gran ecosistema proporcionan flexibilidad y fácil integración con otras bibliotecas.', 'ans': true}, {'option': 'Angular ya no se mantiene, por lo que React es la única opción viable.', 'ans': false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Evaluation"
    },
    // Evaluation, Text to Voice
    "Evaluation Text Question to Voice Answer":
    {"prompt": "Las preguntas de evaluación prueban la capacidad de evaluar la calidad, precisión o efectividad de algo, y hacer juicios basados en criterios y justificar decisiones. Para 'Evaluation Text Question to Voice Answer', proporcione su salida en formato JSON así: {'flashcardType': 'Evaluation Text Question to Voice Answer', 'question': 'Su equipo está decidiendo entre construir una función internamente o usar una solución SaaS de terceros. ¿Qué factores evaluaría para hacer una recomendación, y qué guiaría su decisión final?', 'answer': ''}",
      "questionType": "text",
      "answerType": "voice",
      "cognitiveQnType": "Evaluation"
    },
    // Problem-Solving, Text to Text
    "Problem-Solving Text Question to Text Answer":
    {"prompt": "Las preguntas de resolución de problemas se enfocan en identificar, diagnosticar y resolver problemas complejos, y a menudo requieren pensamiento creativo o estratégico. Para 'Problem-Solving Text Question to Text Answer', proporcione su salida en formato JSON así: {'flashcardType': 'Problem-Solving Text Question to Text Answer', 'question': 'Está construyendo una función de búsqueda que necesita devolver resultados relevantes rápidamente, incluso cuando el conjunto de datos crece. ¿Cómo abordaría el diseño de este sistema para mantener un rendimiento rápido?', 'answer': 'Comenzaría indexando los campos buscables usando un motor de búsqueda de texto completo como Elasticsearch o integrando estrategias de indexación de base de datos. Para mejorar el rendimiento, paginaría resultados, usaría caché para consultas frecuentes y consideraría desnormalizar datos para lecturas más rápidas. Además, monitorearía los tiempos de consulta y ajustaría la indexación o fragmentación de datos según sea necesario a medida que el conjunto de datos crece.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Problem-Solving"
    },
    // Problem-Solving, Text to MCQ
    "Problem-Solving Text Question to MCQ Answer":
    {"prompt": "Las preguntas de resolución de problemas se enfocan en identificar, diagnosticar y resolver problemas complejos, y a menudo requieren pensamiento creativo o estratégico. Para 'Problem-Solving Text Question to MCQ Answer', proporcione su salida en formato JSON así: {'flashcardType': 'Problem-Solving Text Question to MCQ Answer', 'question': 'Su aplicación móvil se está cerrando aleatoriamente para algunos usuarios, pero no puede reproducir el problema en sus dispositivos. ¿Cuál es el mejor primer paso para diagnosticar el problema?', 'answer': [{'option': 'Pedir a los usuarios que eliminen y reinstalen la aplicación.', 'ans': false}, {'option': 'Enviar una actualización de emergencia con cambios mínimos.', 'ans': false}, {'option': 'Revisar registros de cierre y herramientas de análisis como Firebase Crashlytics para identificar patrones.', 'ans': true}, {'option': 'Deshabilitar funciones hasta que los cierres se detengan.', 'ans': false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Problem-Solving"
    },
    // Problem-Solving, Text to Voice
    "Problem-Solving Text Question to Voice Answer":
    {"prompt": "Las preguntas de resolución de problemas se enfocan en identificar, diagnosticar y resolver problemas complejos, y a menudo requieren pensamiento creativo o estratégico. Para 'Problem-Solving Text Question to Voice Answer', proporcione su salida en formato JSON así: {'flashcardType': 'Problem-Solving Text Question to Voice Answer', 'question': 'Una función crítica en su aplicación web falla intermitentemente bajo alto tráfico, pero no aparecen errores en los registros. ¿Cómo procedería para identificar y resolver el problema?', 'answer': ''}",
      "questionType": "text",
      "answerType": "voice",
      "cognitiveQnType": "Problem-Solving"
    }
}

export const promptAndDataFrench = {
    // Recall, Text to Text
    "Recall Text Question to Text Answer":
    {"prompt": "Les questions de rappel testent la mémoire en demandant des faits spécifiques, des définitions ou des informations. Pour 'Recall Text Question to Text Answer', fournissez votre sortie au format JSON comme suit : {'flashcardType': 'Recall Text Question to Text Answer', 'question': 'Quel est l'objectif principal d'un serveur DNS (Système de noms de domaine) ?', 'answer': 'Un serveur DNS traduit les noms de domaine lisibles par l'homme (comme www.example.com) en adresses IP que les ordinateurs utilisent pour s'identifier sur le réseau.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Recall"
    },
    // Recall, Text to MCQ
    "Recall Text Question to MCQ Answer":
    {"prompt": "Les questions de rappel testent la mémoire en demandant des faits spécifiques, des définitions ou des informations. Pour 'Recall Text Question to MCQ Answer', fournissez votre sortie au format JSON comme suit : {'flashcardType': 'Recall Text Question to MCQ Answer', 'question': 'Quel code de statut HTTP indique qu'une requête a réussi ?', 'answer': [{'option': '404', 'ans': false}, {'option': '500', 'ans': false}, {'option': '200', 'ans': true}, {'option': '403', 'ans': false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Recall"
    },
    // Recall, Cloze to Text
    "Recall Cloze Question to Text Answer":
    {"prompt": "Les questions de rappel testent la mémoire en demandant des faits spécifiques, des définitions ou des informations. Pour 'Recall Cloze Question to Text Answer', fournissez votre sortie au format JSON comme suit : {'flashcardType': 'Recall Cloze Question to Text Answer', 'question': 'En JavaScript, le mot-clé <blank> est utilisé pour déclarer une variable avec une portée de bloc et empêcher la réassignation.', 'answer': 'const'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Recall"
    },
    // Recall, Cloze to MCQ
    "Recall Cloze Question to MCQ Answer":
    {"prompt": "Les questions de rappel testent la mémoire en demandant des faits spécifiques, des définitions ou des informations. Pour 'Recall Cloze Question to MCQ Answer', fournissez votre sortie au format JSON comme suit : {'flashcardType': 'Recall Cloze Question to MCQ Answer', 'question': 'En SQL, la commande <blank> est utilisée pour supprimer tous les enregistrements d'une table sans enregistrer les suppressions de lignes individuelles.', 'answer': [{'option': 'DELETE', 'ans': false}, {'option': 'TRUNCATE', 'ans': true}, {'option': 'REMOVE', 'ans': false}, {'option': 'DROP', 'ans': false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Recall"
    },
    // Comprehension, Text to Text
    "Comprehension Text Question to Text Answer":
    {"prompt": "Les questions de compréhension testent la compréhension en demandant des explications, des interprétations, des résumés ou des comparaisons. Pour 'Comprehension Text Question to Text Answer', fournissez votre sortie au format JSON comme suit : {'flashcardType': 'Comprehension Text Question to Text Answer', 'question': 'Expliquez la différence entre une copie superficielle et une copie profonde en programmation.', 'answer': 'Une copie superficielle copie uniquement les références de niveau supérieur d'un objet, ce qui signifie que les objets imbriqués sont encore partagés. Une copie profonde copie récursivement tous les objets imbriqués, créant des duplicatas entièrement indépendants de la structure originale.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Comprehension"
    },
    // Comprehension, Text to MCQ
    "Comprehension Text Question to MCQ Answer":
    {"prompt": "Les questions de compréhension testent la compréhension en demandant des explications, des interprétations, des résumés ou des comparaisons. Pour 'Comprehension Text Question to MCQ Answer', fournissez votre sortie au format JSON comme suit : {'flashcardType': 'Comprehension Text Question to MCQ Answer', 'question': 'Qu'est-ce qui explique le mieux la différence entre HTTP et HTTPS ?', 'answer': [{'option': 'HTTPS utilise le port 80, tandis qu'HTTP utilise le port 443.', 'ans': false}, {'option': 'HTTP crypte les données pendant la transmission, tandis qu'HTTPS ne le fait pas.', 'ans': false}, {'option': 'Il n'y a pas de vraie différence entre HTTP et HTTPS.', 'ans': false}, {'option': 'HTTPS ajoute une couche de cryptage via SSL/TLS pour sécuriser la transmission des données, contrairement à HTTP.', 'ans': true}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Comprehension"
    },
    // Comprehension, Text to Voice
    "Comprehension Text Question to Voice Answer":
    {"prompt": "Les questions de compréhension testent la compréhension en demandant des explications, des interprétations, des résumés ou des comparaisons. Pour 'Comprehension Text Question to Voice Answer', fournissez votre sortie au format JSON comme suit : {'flashcardType': 'Comprehension Text Question to Voice Answer', 'question': 'Comment un équilibreur de charge améliore-t-il la fiabilité et l'évolutivité d'une application Web ?', 'answer': ''}",
      "questionType": "text",       
      "answerType": "voice",
      "cognitiveQnType": "Comprehension"
    },
    // Application, Text to Text
    "Application Text Question to Text Answer":
    {"prompt": "Les questions d'application testent la capacité à appliquer des connaissances à des situations pratiques, nouvelles ou réelles. Pour 'Application Text Question to Text Answer', fournissez votre sortie au format JSON comme suit : {'flashcardType': 'Application Text Question to Text Answer', 'question': 'Vous devez stocker temporairement les données de session utilisateur dans un système backend. Quelle structure de données ou méthode de stockage utiliseriez-vous et pourquoi ?', 'answer': 'Un magasin clé-valeur en mémoire comme Redis est un choix approprié car il permet un accès rapide en lecture/écriture et prend en charge l'expiration automatique des données de session, ce qui est idéal pour la gestion temporaire des sessions.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Application"
    },
    // Application, Text to MCQ
    "Application Text Question to MCQ Answer":
    {"prompt": "Les questions d'application testent la capacité à appliquer des connaissances à des situations pratiques, nouvelles ou réelles. Pour 'Application Text Question to MCQ Answer', fournissez votre sortie au format JSON comme suit : {'flashcardType': 'Application Text Question to MCQ Answer', 'question': 'Vous concevez un formulaire Web qui collecte des informations sensibles sur l'utilisateur. Laquelle des actions suivantes est la plus appropriée pour améliorer la sécurité pendant la transmission des données ?', 'answer': [{'option': 'Soumettre le formulaire via HTTPS en utilisant une requête POST.', 'ans': true}, {'option': 'Utiliser une requête GET pour soumettre le formulaire pour une meilleure vitesse.', 'ans': false}, {'option': 'Minifier le HTML pour rendre le code source plus difficile à lire.', 'ans': false}, {'option': 'Stocker les données dans des cookies pour un accès rapide.', 'ans': false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Application"
    },
    // Application, Text to Voice
    "Application Text Question to Voice Answer":
    {"prompt": "Les questions d'application testent la capacité à appliquer des connaissances à des situations pratiques, nouvelles ou réelles. Pour 'Application Text Question to Voice Answer', fournissez votre sortie au format JSON comme suit : {'flashcardType': 'Application Text Question to Voice Answer', 'question': 'Vous êtes chargé d'améliorer les performances d'une API REST qui connaît une latence élevée sous charge. Quelles étapes pratiques prendriez-vous pour identifier et résoudre le problème ?', 'answer': ''}",
      "questionType": "text",
      "answerType": "voice",
      "cognitiveQnType": "Application"
    },
    // Analysis, Text to Text
    "Analysis Text Question to Text Answer":
    {"prompt": "Les questions d'analyse testent la capacité à décomposer des problèmes complexes en parties plus petites et à examiner les relations. Pour 'Analysis Text Question to Text Answer', fournissez votre sortie au format JSON comme suit : {'flashcardType': 'Analysis Text Question to Text Answer', 'question': 'Les tests A/B montrent qu'une nouvelle page de paiement conduit à moins d'achats complétés, même si les utilisateurs atteignent l'étape de paiement plus rapidement. Comment analyseriez-vous ce résultat ?', 'answer': 'J'examinerais le parcours utilisateur en détail, en me concentrant sur l'endroit où les utilisateurs abandonnent dans le nouveau flux. J'analyserais les enregistrements de session, les données d'entonnoir et les taux d'abandon de formulaire. Il est possible que le flux plus rapide introduise des problèmes d'utilisabilité, de confusion ou de confiance. Je comparerais les taux d'erreur, le comportement de validation des champs et les temps de chargement. Je regarderais également les commentaires qualitatifs ou les enquêtes pour comprendre la perception de l'utilisateur.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Analysis"
    },
    "Analysis Text Question to MCQ Answer":
    {"prompt": "Les questions d'analyse testent la capacité à décomposer des problèmes complexes en parties plus petites et à examiner les relations. Pour 'Analysis Text Question to MCQ Answer', fournissez votre sortie au format JSON comme suit : {'flashcardType': 'Analysis Text Question to MCQ Answer', 'question': 'Votre équipe enquête sur la raison pour laquelle une fonctionnalité nouvellement déployée a causé une augmentation significative des temps de chargement de page. Quelle est l'étape la plus logique suivante dans le processus d'analyse ?', 'answer': [{'option': 'Annuler le déploiement immédiatement.', 'ans': false}, {'option': 'Profiler les performances frontend et backend pour localiser des goulots d'étranglement spécifiques.', 'ans': true}, {'option': 'Augmenter la capacité du serveur et observer les résultats.', 'ans': false}, {'option': 'Passer à un framework frontend différent.', 'ans': false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Analysis"
    },
    // Analysis, Text to Voice
    "Analysis Text Question to Voice Answer":
    {"prompt": "Les questions d'analyse testent la capacité à décomposer des problèmes complexes en parties plus petites et à examiner les relations. Pour 'Analysis Text Question to Voice Answer', fournissez votre sortie au format JSON comme suit : {'flashcardType': 'Analysis Text Question to Voice Answer', 'question': 'Vous remarquez des timeouts fréquents lorsque les utilisateurs accèdent à votre application pendant les heures de pointe. Comment procéderiez-vous pour identifier la cause racine du problème ?', 'answer': ''}",
      "questionType": "text",
      "answerType": "voice",
      "cognitiveQnType": "Analysis"
    },
    // Synthesis, Text to Text
    "Synthesis Text Question to Text Answer":
    {"prompt": "Les questions de synthèse testent la capacité à combiner ou intégrer différentes informations pour créer un tout nouveau et cohérent, ou proposer des solutions. Pour 'Synthesis Text Question to Text Answer', fournissez votre sortie au format JSON comme suit : {'flashcardType': 'Synthesis Text Question to Text Answer', 'question': 'Concevez un système de notification évolutif qui peut envoyer des e-mails, des SMS et des notifications push à des millions d'utilisateurs. Quels composants clés incluriez-vous et comment interagiraient-ils ?', 'answer': 'Je concevrais le système avec une file d'attente de messages pour gérer un débit élevé, un service de notification qui traite les messages et les envoie via des canaux appropriés (e-mail, SMS, push). Le système utiliserait des microservices pour chaque type de notification, une base de données pour suivre l'état de livraison et une limitation de débit pour prévenir la surcharge. Les équilibreurs de charge et les groupes de mise à l'échelle automatique assureraient la disponibilité et l'évolutivité.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Synthesis"
    },
    // Synthesis, Text to MCQ
    "Synthesis Text Question to MCQ Answer":
    {"prompt": "Les questions de synthèse testent la capacité à combiner ou intégrer différentes informations pour créer un tout nouveau et cohérent, ou proposer des solutions. Pour 'Synthesis Text Question to MCQ Answer', fournissez votre sortie au format JSON comme suit : {'flashcardType': 'Synthesis Text Question to MCQ Answer', 'question': 'Vous devez concevoir un système qui agrège des données en temps réel provenant de plusieurs capteurs et fournit des tableaux de bord d'analyse. Quel choix de conception équilibre le mieux l'évolutivité, la fiabilité et la latence ?', 'answer': [{'option': 'Utiliser une base de données centralisée où toutes les données des capteurs sont écrites de manière synchrone.', 'ans': false}, {'option': 'Stocker les données localement sur chaque capteur et les télécharger par lots à la fin de la journée.', 'ans': false}, {'option': 'Utiliser le traitement côté client pour toutes les analyses pour réduire la charge du serveur.', 'ans': false}, {'option': 'Implémenter des files d'attente de messages distribuées avec des microservices traitant les données de manière asynchrone.', 'ans': true}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Synthesis"
    },
    // Synthesis, Text to Voice
    "Synthesis Text Question to Voice Answer":
    {"prompt": "Les questions de synthèse testent la capacité à combiner ou intégrer différentes informations pour créer un tout nouveau et cohérent, ou proposer des solutions. Pour 'Synthesis Text Question to Voice Answer', fournissez votre sortie au format JSON comme suit : {'flashcardType': 'Synthesis Text Question to Voice Answer', 'question': 'Concevez un système qui peut gérer le chat en temps réel pour des millions d'utilisateurs, en assurant la livraison des messages, l'évolutivité et la cohérence des données. Décrivez les composants clés et comment ils interagissent.', 'answer': ''}",
      "questionType": "text",
      "answerType": "voice",
      "cognitiveQnType": "Synthesis"
    },
    // Evaluation, Text to Text
    "Evaluation Text Question to Text Answer":
    {"prompt": "Les questions d'évaluation testent la capacité à évaluer la qualité, la précision ou l'efficacité de quelque chose, et à faire des jugements basés sur des critères et à justifier les décisions. Pour 'Evaluation Text Question to Text Answer', fournissez votre sortie au format JSON comme suit : {'flashcardType': 'Evaluation Text Question to Text Answer', 'question': 'Vous choisissez entre des bases de données SQL et NoSQL pour une plateforme de commerce électronique à fort trafic. Laquelle choisiriez-vous et pourquoi ?', 'answer': 'Pour une plateforme de commerce électronique, une base de données SQL est souvent le meilleur choix en raison du besoin de cohérence forte, de transactions complexes et de données relationnelles structurées telles que les commandes, l'inventaire et les utilisateurs. Cependant, si l'évolutivité et la flexibilité sont plus importantes—comme pour gérer les avis produits ou les données de session—une solution NoSQL comme MongoDB ou DynamoDB pourrait être intégrée aux côtés de SQL dans une architecture polyglotte.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Evaluation"
    },
    // Evaluation, Text to MCQ
    "Evaluation Text Question to MCQ Answer":
    {"prompt": "Les questions d'évaluation testent la capacité à évaluer la qualité, la précision ou l'efficacité de quelque chose, et à faire des jugements basés sur des critères et à justifier les décisions. Pour 'Evaluation Text Question to MCQ Answer', fournissez votre sortie au format JSON comme suit : {'flashcardType': 'Evaluation Text Question to MCQ Answer', 'question': 'Vous examinez deux frameworks frontend possibles pour une application Web d'entreprise à grande échelle : React et Angular. Laquelle des suivantes est la base la plus raisonnable pour choisir React plutôt qu'Angular ?', 'answer': [{'option': 'React ne nécessite aucune courbe d'apprentissage, donc c'est toujours mieux.', 'ans': false}, {'option': 'React impose une structure d'application stricte, ce qui est idéal pour les grandes équipes.', 'ans': false}, {'option': 'L'architecture basée sur les composants de React et son vaste écosystème offrent flexibilité et facilité d'intégration avec d'autres bibliothèques.', 'ans': true}, {'option': 'Angular n'est plus maintenu, donc React est la seule option viable.', 'ans': false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Evaluation"
    },
    // Evaluation, Text to Voice
    "Evaluation Text Question to Voice Answer":
    {"prompt": "Les questions d'évaluation testent la capacité à évaluer la qualité, la précision ou l'efficacité de quelque chose, et à faire des jugements basés sur des critères et à justifier les décisions. Pour 'Evaluation Text Question to Voice Answer', fournissez votre sortie au format JSON comme suit : {'flashcardType': 'Evaluation Text Question to Voice Answer', 'question': 'Votre équipe décide entre construire une fonctionnalité en interne ou utiliser une solution SaaS tierce. Quels facteurs évalueriez-vous pour faire une recommandation, et qu'est-ce qui guiderait votre décision finale ?', 'answer': ''}",
      "questionType": "text",
      "answerType": "voice",
      "cognitiveQnType": "Evaluation"
    },
    // Problem-Solving, Text to Text
    "Problem-Solving Text Question to Text Answer":
    {"prompt": "Les questions de résolution de problèmes se concentrent sur l'identification, le diagnostic et la résolution de problèmes complexes, et nécessitent souvent une pensée créative ou stratégique. Pour 'Problem-Solving Text Question to Text Answer', fournissez votre sortie au format JSON comme suit : {'flashcardType': 'Problem-Solving Text Question to Text Answer', 'question': 'Vous construisez une fonctionnalité de recherche qui doit retourner des résultats pertinents rapidement, même lorsque l'ensemble de données grandit. Comment aborderiez-vous la conception de ce système pour maintenir des performances rapides ?', 'answer': 'Je commencerais par indexer les champs recherchables en utilisant un moteur de recherche en texte intégral comme Elasticsearch ou en intégrant des stratégies d'indexation de base de données. Pour améliorer les performances, je paginerais les résultats, utiliserais la mise en cache pour les requêtes fréquentes et envisagerais de dénormaliser les données pour des lectures plus rapides. De plus, je surveillerais les temps de requête et ajusterais l'indexation ou le partitionnement des données si nécessaire à mesure que l'ensemble de données grandit.'}",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Problem-Solving"
    },
    // Problem-Solving, Text to MCQ
    "Problem-Solving Text Question to MCQ Answer":
    {"prompt": "Les questions de résolution de problèmes se concentrent sur l'identification, le diagnostic et la résolution de problèmes complexes, et nécessitent souvent une pensée créative ou stratégique. Pour 'Problem-Solving Text Question to MCQ Answer', fournissez votre sortie au format JSON comme suit : {'flashcardType': 'Problem-Solving Text Question to MCQ Answer', 'question': 'Votre application mobile plante aléatoirement pour certains utilisateurs, mais vous ne pouvez pas reproduire le problème sur vos appareils. Quelle est la meilleure première étape pour diagnostiquer le problème ?', 'answer': [{'option': 'Demander aux utilisateurs de supprimer et réinstaller l'application.', 'ans': false}, {'option': 'Pousser une mise à jour d'urgence avec des changements minimaux.', 'ans': false}, {'option': 'Vérifier les journaux de plantage et les outils d'analyse comme Firebase Crashlytics pour identifier les modèles.', 'ans': true}, {'option': 'Désactiver les fonctionnalités jusqu'à ce que les plantages s'arrêtent.', 'ans': false}]}",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Problem-Solving"
    },
    // Problem-Solving, Text to Voice
    "Problem-Solving Text Question to Voice Answer":
    {"prompt": "Les questions de résolution de problèmes se concentrent sur l'identification, le diagnostic et la résolution de problèmes complexes, et nécessitent souvent une pensée créative ou stratégique. Pour 'Problem-Solving Text Question to Voice Answer', fournissez votre sortie au format JSON comme suit : {'flashcardType': 'Problem-Solving Text Question to Voice Answer', 'question': 'Une fonctionnalité critique de votre application Web échoue de manière intermittente sous un trafic élevé, mais aucune erreur n'apparaît dans les journaux. Comment procéderiez-vous pour identifier et résoudre le problème ?', 'answer': ''}",
      "questionType": "text",
      "answerType": "voice",
      "cognitiveQnType": "Problem-Solving"
    }
}

const cognitiveQnTypeWeightsForInterviewType = {
    "technical": {
        "Recall": 0.15,
        "Comprehension": 0.1,
        "Application": 0.2,
        "Analysis": 0.2,
        "Synthesis": 0.1,
        "Evaluation": 0.05,
        "Problem-Solving": 0.2,
    },
    "behavioral": {
        "Recall": 0.05,
        "Comprehension": 0.2,
        "Application": 0.15,
        "Analysis": 0.15,
        "Synthesis": 0.15,
        "Evaluation": 0.15,
        "Problem-Solving": 0.15,
    },
    "brainteasers": {
        "Recall": 0.05,
        "Comprehension": 0.1,
        "Application": 0.1,
        "Analysis": 0.25,
        "Synthesis": 0.05,
        "Evaluation": 0.05,
        "Problem-Solving": 0.4,
    },
    "case study": {
        "Recall": 0.05,
        "Comprehension": 0.1,
        "Application": 0.15,
        "Analysis": 0.25,
        "Synthesis": 0.15,
        "Evaluation": 0.15,
        "Problem-Solving": 0.15,
    },
    "others": {
        "Recall": 0.1,
        "Comprehension": 0.15,
        "Application": 0.2,
        "Analysis": 0.15,
        "Synthesis": 0.1,
        "Evaluation": 0.1,
        "Problem-Solving": 0.2,
    },
    "study": {
        "Recall": 0.15,
        "Comprehension": 0.15,
        "Application": 0.15,
        "Analysis": 0.15,
        "Synthesis": 0.1,
        "Evaluation": 0.15,
        "Problem-Solving": 0.15,
    }
}


// Helper: Get all flashcard type weights for a cognitive type
function getFlashcardTypeWeightsForCognitiveType(
  isMcqEnabled: boolean,
  isClozeEnabled: boolean,
  isVoiceRecordedEnabled: boolean,
  cognitiveType: string
): { [key: string]: number } {
    const recallWeights = {
        "Recall Text Question to Text Answer": 1,
        "Recall Text Question to MCQ Answer": 0,
        "Recall Cloze Question to Text Answer": 0,
        "Recall Cloze Question to MCQ Answer": 0,
    }
    if (isMcqEnabled && isClozeEnabled) {
        recallWeights["Recall Text Question to Text Answer"] = 0.25
        recallWeights["Recall Text Question to MCQ Answer"] = 0.25  
        recallWeights["Recall Cloze Question to Text Answer"] = 0.25    
        recallWeights["Recall Cloze Question to MCQ Answer"] = 0.25
    }
    if (isMcqEnabled && !isClozeEnabled) {
        recallWeights["Recall Text Question to Text Answer"] = 0.5
        recallWeights["Recall Text Question to MCQ Answer"] = 0.5  
        recallWeights["Recall Cloze Question to Text Answer"] = 0
        recallWeights["Recall Cloze Question to MCQ Answer"] = 0
    }
    if (!isMcqEnabled && isClozeEnabled) {
        recallWeights["Recall Text Question to Text Answer"] = 0.5
        recallWeights["Recall Text Question to MCQ Answer"] = 0
        recallWeights["Recall Cloze Question to Text Answer"] = 0.5
        recallWeights["Recall Cloze Question to MCQ Answer"] = 0
    }

    const comprehensionWeights = {
        "Comprehension Text Question to Text Answer": 1,
        "Comprehension Text Question to MCQ Answer": 0,
        "Comprehension Text Question to Voice Answer": 0,
    }
    if (isMcqEnabled && isVoiceRecordedEnabled) {
        comprehensionWeights["Comprehension Text Question to Text Answer"] = 0.25
        comprehensionWeights["Comprehension Text Question to MCQ Answer"] = 0.5  
        comprehensionWeights["Comprehension Text Question to Voice Answer"] = 0.25    
    }
    if (isMcqEnabled && !isVoiceRecordedEnabled) {
        comprehensionWeights["Comprehension Text Question to Text Answer"] = 0.3
        comprehensionWeights["Comprehension Text Question to MCQ Answer"] = 0.7  
        comprehensionWeights["Comprehension Text Question to Voice Answer"] = 0    
    }
    if (!isMcqEnabled && isVoiceRecordedEnabled) {
        comprehensionWeights["Comprehension Text Question to Text Answer"] = 0.3
        comprehensionWeights["Comprehension Text Question to MCQ Answer"] = 0  
        comprehensionWeights["Comprehension Text Question to Voice Answer"] = 0.7    
    }

    const applicationWeights = {
        "Application Text Question to Text Answer": 1,
        "Application Text Question to MCQ Answer": 0,
        "Application Text Question to Voice Answer": 0,
    }
    if (isMcqEnabled && isVoiceRecordedEnabled) {
        applicationWeights["Application Text Question to Text Answer"] = 0.25
        applicationWeights["Application Text Question to MCQ Answer"] = 0.25  
        applicationWeights["Application Text Question to Voice Answer"] = 0.5   
    }
    if (isMcqEnabled && !isVoiceRecordedEnabled) {
        applicationWeights["Application Text Question to Text Answer"] = 0.5
        applicationWeights["Application Text Question to MCQ Answer"] = 0.5  
        applicationWeights["Application Text Question to Voice Answer"] = 0    
    }
    if (!isMcqEnabled && isVoiceRecordedEnabled) {
        applicationWeights["Application Text Question to Text Answer"] = 0.5
        applicationWeights["Application Text Question to MCQ Answer"] = 0  
        applicationWeights["Application Text Question to Voice Answer"] = 0.5    
    }

    const analysisWeights = {
        "Analysis Text Question to Text Answer": 1,
        "Analysis Text Question to MCQ Answer": 0,
        "Analysis Text Question to Voice Answer": 0,
    }
    if (isMcqEnabled && isVoiceRecordedEnabled) {
        analysisWeights["Analysis Text Question to Text Answer"] = 0.25
        analysisWeights["Analysis Text Question to MCQ Answer"] = 0.5  
        analysisWeights["Analysis Text Question to Voice Answer"] = 0.25    
    }   
    if (isMcqEnabled && !isVoiceRecordedEnabled) {
        analysisWeights["Analysis Text Question to Text Answer"] = 0.3
        analysisWeights["Analysis Text Question to MCQ Answer"] = 0.7  
        analysisWeights["Analysis Text Question to Voice Answer"] = 0    
    }
    if (!isMcqEnabled && isVoiceRecordedEnabled) {
        analysisWeights["Analysis Text Question to Text Answer"] = 0.3
        analysisWeights["Analysis Text Question to MCQ Answer"] = 0  
        analysisWeights["Analysis Text Question to Voice Answer"] = 0.7    
    }

    const synthesisWeights = {
        "Synthesis Text Question to Text Answer": 1,
        "Synthesis Text Question to MCQ Answer": 0,
        "Synthesis Text Question to Voice Answer": 0,
    }
    if (isMcqEnabled && isVoiceRecordedEnabled) {
        synthesisWeights["Synthesis Text Question to Text Answer"] = 0.25
        synthesisWeights["Synthesis Text Question to MCQ Answer"] = 0.25  
        synthesisWeights["Synthesis Text Question to Voice Answer"] = 0.5    
    }
    if (isMcqEnabled && !isVoiceRecordedEnabled) {
        synthesisWeights["Synthesis Text Question to Text Answer"] = 0.5
        synthesisWeights["Synthesis Text Question to MCQ Answer"] = 0.5  
        synthesisWeights["Synthesis Text Question to Voice Answer"] = 0    
    }
    if (!isMcqEnabled && isVoiceRecordedEnabled) {
        synthesisWeights["Synthesis Text Question to Text Answer"] = 0.5
        synthesisWeights["Synthesis Text Question to MCQ Answer"] = 0  
        synthesisWeights["Synthesis Text Question to Voice Answer"] = 0.5      
    }

    const evaluationWeights = {
        "Evaluation Text Question to Text Answer": 1,
        "Evaluation Text Question to MCQ Answer": 0,
        "Evaluation Text Question to Voice Answer": 0,
    }
    if (isMcqEnabled && isVoiceRecordedEnabled) {
        evaluationWeights["Evaluation Text Question to Text Answer"] = 0.25
        evaluationWeights["Evaluation Text Question to MCQ Answer"] = 0.25  
        evaluationWeights["Evaluation Text Question to Voice Answer"] = 0.5    
    }   
    if (isMcqEnabled && !isVoiceRecordedEnabled) {
        evaluationWeights["Evaluation Text Question to Text Answer"] = 0.5
        evaluationWeights["Evaluation Text Question to MCQ Answer"] = 0.5  
        evaluationWeights["Evaluation Text Question to Voice Answer"] = 0   
    }
    if (!isMcqEnabled && isVoiceRecordedEnabled) {
        evaluationWeights["Evaluation Text Question to Text Answer"] = 0.5
        evaluationWeights["Evaluation Text Question to MCQ Answer"] = 0  
        evaluationWeights["Evaluation Text Question to Voice Answer"] = 0.5    
    }

    const problemSolvingWeights = {
        "Problem-Solving Text Question to Text Answer": 1,
        "Problem-Solving Text Question to MCQ Answer": 0,
        "Problem-Solving Text Question to Voice Answer": 0,
    }
    if (isMcqEnabled && isVoiceRecordedEnabled) {
        problemSolvingWeights["Problem-Solving Text Question to Text Answer"] = 0.3
        problemSolvingWeights["Problem-Solving Text Question to MCQ Answer"] = 0.3  
        problemSolvingWeights["Problem-Solving Text Question to Voice Answer"] = 0.4    
    }   
    if (isMcqEnabled && !isVoiceRecordedEnabled) {
        problemSolvingWeights["Problem-Solving Text Question to Text Answer"] = 0.5
        problemSolvingWeights["Problem-Solving Text Question to MCQ Answer"] = 0.5  
        problemSolvingWeights["Problem-Solving Text Question to Voice Answer"] = 0   
    }
    if (!isMcqEnabled && isVoiceRecordedEnabled) {
        problemSolvingWeights["Problem-Solving Text Question to Text Answer"] = 0.5
        problemSolvingWeights["Problem-Solving Text Question to MCQ Answer"] = 0  
        problemSolvingWeights["Problem-Solving Text Question to Voice Answer"] = 0.5    
    }

    if (cognitiveType === "Recall") return recallWeights;
    else if (cognitiveType === "Comprehension") return comprehensionWeights;
    else if (cognitiveType === "Application") return applicationWeights;
    else if (cognitiveType === "Analysis") return analysisWeights;
    else if (cognitiveType === "Synthesis") return synthesisWeights;
    else if (cognitiveType === "Evaluation") return evaluationWeights;
    else if (cognitiveType === "Problem-Solving") return problemSolvingWeights;
    return {};
}

export function getDistributionOfFlashcardsForInterviewType(
    isMcqEnabled: boolean,
    isClozeEnabled: boolean,
    isVoiceRecordedEnabled: boolean,
    interviewType: string,
    numberOfQuestions: number,
    allowedCognitiveTypes?: string[],
  ): Record<string, number> | null {
    // 1. Get cognitive type weights for the interview type
    const allWeights = (cognitiveQnTypeWeightsForInterviewType as Record<string, Record<string, number>>)[interviewType] || cognitiveQnTypeWeightsForInterviewType["others"];
    let cognitiveWeights: Record<string, number> = {};
    if (allowedCognitiveTypes && allowedCognitiveTypes.length > 0) {
        for (const type of allowedCognitiveTypes) {
            if (allWeights[type] !== undefined) {
                cognitiveWeights[type] = allWeights[type];
            }
        }
    } else {
        cognitiveWeights = { ...allWeights };
    }
    // 2. For each cognitive type, get flashcard type weights and accumulate
    const flashcardTypeProbs: Record<string, number> = {};
    for (const [cognitiveType, cogWeight] of Object.entries(cognitiveWeights)) {
        if (cogWeight <= 0) continue;
        const flashcardWeights = getFlashcardTypeWeightsForCognitiveType(
            isMcqEnabled, isClozeEnabled, isVoiceRecordedEnabled, cognitiveType
        );
        const totalFlashcardWeight = Object.values(flashcardWeights).reduce((a, b) => a + b, 0);
        if (totalFlashcardWeight === 0) continue;
        for (const [flashcardType, flashcardWeight] of Object.entries(flashcardWeights)) {
            if (flashcardWeight <= 0) continue;
            const prob = cogWeight * (flashcardWeight / totalFlashcardWeight);
            flashcardTypeProbs[flashcardType] = (flashcardTypeProbs[flashcardType] || 0) + prob;
        }
    }
    // 3. Normalize so total probability is 1
    const totalProb = Object.values(flashcardTypeProbs).reduce((a, b) => a + b, 0);
    if (totalProb === 0) return null;
    const entries: [string, number][] = Object.entries(flashcardTypeProbs).map(([k, v]) => [k, v / totalProb] as [string, number]);
    // 4. Weighted random sampling
    const flashcardTypes = entries.map(([k]) => k);
    const weights = entries.map(([, v]) => v);
    // Build cumulative distribution
    const cumulative: number[] = [];
    weights.reduce((acc, w, i) => cumulative[i] = acc + w, 0);
    // Sampling
    const rawCounts: Record<string, number> = {};
    for (let i = 0; i < numberOfQuestions; i++) {
        const r = Math.random();
        let idx = 0;
        while (idx < cumulative.length && r >= cumulative[idx]) idx++;
        const chosen = flashcardTypes[idx];
        rawCounts[chosen] = (rawCounts[chosen] || 0) + 1;
    }
    return rawCounts;
}