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