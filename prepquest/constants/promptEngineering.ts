const promptAndData = {
    // Recall, Text to Text
    "Recall Text to Text":
    {"prompt": "Give your output in json format like this: [{'question': 'What is the primary purpose of a DNS (Domain Name System) server?', 'answer': 'A DNS server translates human-readable domain names (like www.example.com) into IP addresses that computers use to identify each other on the network.'}]",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Recall"
    },
    // Recall, Text to MCQ
    "Recall Text to MCQ":
    {"prompt": "Give your output in json format like this: [{'question': 'Which HTTP status code indicates that a request has succeeded?', 'answer': [{'option': '404', 'ans': false}, {'option': '500', 'ans': false}, {'option': '200', 'ans': true}, {'option': '403', 'ans': false}]}]",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Recall"
    },
    // Recall, Cloze to Text
    "Recall Cloze to Text":
    {"prompt": "Give your output in json format like this: [{'question': 'In JavaScript, the <blank> keyword is used to declare a variable with block scope and prevent reassignment.', 'answer': 'const'}]",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Recall"
    },
    // Recall, Cloze to MCQ
    "Recall Cloze to MCQ":
    {"prompt": "Give your output in json format like this: [{'question': 'In SQL, the <blank> command is used to remove all records from a table without logging individual row deletions.', 'answer': [{'option': 'DELETE', 'ans': false}, {'option': 'TRUNCATE', 'ans': true}, {'option': 'REMOVE', 'ans': false}, {'option': 'DROP', 'ans': false}]}]",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Recall"
    },
    // Comprehension, Text to Text
    "Comprehension Text to Text":
    {"prompt": "Give your output in json format like this: [{'question': 'Explain the difference between a shallow copy and a deep copy in programming.', 'answer': 'A shallow copy copies only the top-level references of an object, meaning nested objects are still shared. A deep copy recursively copies all nested objects, creating entirely independent duplicates of the original structure.'}]",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Comprehension"
    },
    // Comprehension, Text to MCQ
    "Comprehension Text to MCQ":
    {"prompt": "Give your output in json format like this: [{'question': 'What best explains the difference between HTTP and HTTPS?', 'answer': [{'option': 'HTTPS uses port 80, while HTTP uses port 443.', 'ans': false}, {'option': 'HTTP encrypts data during transmission, while HTTPS does not.', 'ans': false}, {'option': 'There is no real difference between HTTP and HTTPS.', 'ans': false}, {'option': 'HTTPS adds a layer of encryption via SSL/TLS to secure data transmission, unlike HTTP.', 'ans': true}]}]",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Comprehension"
    },
    // Comprehension, Text to Voice
    "Comprehension Text to Voice":
    {"prompt": "Give your output in json format like this: [{'question': 'How does a load balancer improve the reliability and scalability of a web application?', 'answer': ''}]",
      "questionType": "text",       
      "answerType": "voice",
      "cognitiveQnType": "Comprehension"
    },
    // Application, Text to Text
    "Application Text to Text":
    {"prompt": "Give your output in json format like this: [{'question': 'You need to store user session data temporarily in a backend system. Which data structure or storage method would you use and why?', 'answer': 'An in-memory key-value store like Redis is a suitable choice because it allows fast read/write access and supports automatic expiration of session data, which is ideal for temporary session management.'}]",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Application"
    },
    // Application, Text to MCQ
    "Application Text to MCQ":
    {"prompt": "Give your output in json format like this: [{'question': 'You are designing a web form that collects sensitive user information. Which of the following actions is most appropriate to enhance security during data transmission?', 'answer': [{'option': 'Submit the form over HTTPS using a POST request.', 'ans': true}, {'option': 'Use a GET request to submit the form for better speed.', 'ans': false}, {'option': 'Minify the HTML to make the source code harder to read.', 'ans': false}, {'option': 'Store the data in cookies for quick access.', 'ans': false}]}]",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Application"
    },
    // Application, Text to Voice
    "Application Text to Voice":
    {"prompt": "Give your output in json format like this: [{'question': 'You're tasked with improving the performance of a REST API that's experiencing high latency under load. What practical steps would you take to identify and address the issue?', 'answer': ''}]",
      "questionType": "text",
      "answerType": "voice",
      "cognitiveQnType": "Application"
    },
    // Analysis, Text to Text
    "Analysis Text to Text":
    {"prompt": "Give your output in json format like this: [{'question': 'A/B testing shows that a new checkout page leads to fewer completed purchases, even though users reach the payment step faster. How would you analyze this outcome?', 'answer': 'I would examine the user journey in detail, focusing on where users drop off in the new flow. I'd analyze session recordings, funnel data, and form abandonment rates. It's possible the faster flow introduces usability issues, confusion, or trust concerns. I'd compare error rates, field validation behavior, and loading times. I'd also look at qualitative feedback or surveys to understand user perception.'}]",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Analysis"
    },
    // Analysis, Text to Voice
    "Analysis Text to Voice":
    {"prompt": "Give your output in json format like this: [{'question': 'You're noticing frequent timeouts when users access your application during peak hours. How would you go about identifying the root cause of the issue?', 'answer': ''}]",
      "questionType": "text",
      "answerType": "voice",
      "cognitiveQnType": "Analysis"
    },
    // Synthesis, Text to Text
    "Synthesis Text to Text":
    {"prompt": "Give your output in json format like this: [{'question': 'Design a scalable notification system that can send emails, SMS, and push notifications to millions of users. What key components would you include and how would they interact?', 'answer': 'I would design the system with a message queue to handle high throughput, a notification service that processes messages and sends them via appropriate channels (email, SMS, push). The system would use microservices for each notification type, a database to track delivery status, and rate limiting to prevent overload. Load balancers and auto-scaling groups would ensure availability and scalability.'}]",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Synthesis"
    },
    // Synthesis, Text to MCQ
    "Synthesis Text to MCQ":
    {"prompt": "Give your output in json format like this: [{'question': 'You need to design a system that aggregates real-time data from multiple sensors and provides analytics dashboards. Which design choice best balances scalability, reliability, and latency?', 'answer': [{'option': 'Use a centralized database where all sensor data is written synchronously.', 'ans': false}, {'option': 'Store data locally on each sensor and batch upload at the end of the day.', 'ans': false}, {'option': 'Use client-side processing for all analytics to reduce server load.', 'ans': false}, {'option': 'Implement distributed message queues with microservices processing data asynchronously.', 'ans': true}]}]",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Synthesis"
    },
    // Synthesis, Text to Voice
    "Synthesis Text to Voice":
    {"prompt": "Give your output in json format like this: [{'question': 'Design a system that can handle real-time chat for millions of users, ensuring message delivery, scalability, and data consistency. Describe the key components and how they interact.', 'answer': ''}]",
      "questionType": "text",
      "answerType": "voice",
      "cognitiveQnType": "Synthesis"
    },
    // Evaluation, Text to Text
    "Evaluation Text to Text":
    {"prompt": "Give your output in json format like this: [{'question': 'You're choosing between SQL and NoSQL databases for a high-traffic e-commerce platform. Which would you choose and why?', 'answer': 'For an e-commerce platform, a SQL database is often a better choice due to the need for strong consistency, complex transactions, and structured relational data such as orders, inventory, and users. However, if scalability and flexibility are more important—such as for handling product reviews or session data—a NoSQL solution like MongoDB or DynamoDB could be integrated alongside SQL in a polyglot architecture.'}]",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Evaluation"
    },
    // Evaluation, Text to MCQ
    "Evaluation Text to MCQ":
    {"prompt": "Give your output in json format like this: [{'question': 'You are reviewing two possible frontend frameworks for a large-scale enterprise web app: React and Angular. Which of the following is the most reasonable basis for choosing React over Angular?', 'answer': [{'option': 'React requires no learning curve, so it's always better.', 'ans': false}, {'option': 'React enforces a strict application structure, which is ideal for large teams.', 'ans': false}, {'option': 'React's component-based architecture and large ecosystem provide flexibility and ease of integration with other libraries.', 'ans': true}, {'option': 'Angular is not maintained anymore, so React is the only viable option.', 'ans': false}]}]",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Evaluation"
    },
    // Evaluation, Text to Voice
    "Evaluation Text to Voice":
    {"prompt": "Give your output in json format like this: [{'question': 'Your team is deciding between building a feature in-house or using a third-party SaaS solution. What factors would you evaluate to make a recommendation, and what would guide your final decision?', 'answer': ''}]",
      "questionType": "text",
      "answerType": "voice",
      "cognitiveQnType": "Evaluation"
    },
    // Problem-Solving, Text to Text
    "Problem-Solving Text to Text":
    {"prompt": "Give your output in json format like this: [{'question': 'You're building a search feature that needs to return relevant results quickly, even as the dataset grows. How would you approach designing this system to maintain fast performance?', 'answer': 'I would start by indexing the searchable fields using a full-text search engine like Elasticsearch or integrating database indexing strategies. To improve performance, I'd paginate results, use caching for frequent queries, and consider denormalizing data for faster reads. Additionally, I'd monitor query times and adjust indexing or shard data if needed as the dataset grows.'}]",
      "questionType": "text",
      "answerType": "text",
      "cognitiveQnType": "Problem-Solving"
    },
    // Problem-Solving, Text to MCQ
    "Problem-Solving Text to MCQ":
    {"prompt": "Give your output in json format like this: [{'question': 'Your mobile app is crashing randomly for some users, but you can't reproduce the issue on your devices. What is the best first step to diagnose the problem?', 'answer': [{'option': 'Ask users to delete and reinstall the app.', 'ans': false}, {'option': 'Push an emergency update with minimal changes.', 'ans': false}, {'option': 'Check crash logs and analytics tools like Firebase Crashlytics to identify patterns.', 'ans': true}, {'option': 'Disable features until the crashes stop.', 'ans': false}]}]",
      "questionType": "text",
      "answerType": "mcq",
      "cognitiveQnType": "Problem-Solving"
    },
    // Problem-Solving, Text to Voice
    "Problem-Solving Text to Voice":
    {"prompt": "Give your output in json format like this: [{'question': 'A critical feature in your web application intermittently fails under high traffic, but no errors appear in the logs. How would you approach identifying and resolving the issue?', 'answer': ''}]",
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

// Helper: Weighted random selection
function weightedRandomKey(weights: { [key: string]: number }): string | null {
    const entries = Object.entries(weights).filter(([_, w]) => w > 0);
    const total = entries.reduce((sum, [_, w]) => sum + w, 0);
    if (total === 0) return null;
    let r = Math.random() * total;
    for (const [key, weight] of entries) {
        if (r < weight) return key;
        r -= weight;
    }
    return entries[entries.length - 1][0]; // fallback
}

function getFlashcardTypeForCognitiveType(
  isMcqEnabled: boolean,
  isClozeEnabled: boolean,
  isVoiceRecordedEnabled: boolean,
  cognitiveType: string
): string | null {
    const recallWeights = {
        "Recall Text to Text": 1,
        "Recall Text to MCQ": 0,
        "Recall Cloze to Text": 0,
        "Recall Cloze to MCQ": 0,
    }
    if (isMcqEnabled && isClozeEnabled) {
        recallWeights["Recall Text to Text"] = 0.25
        recallWeights["Recall Text to MCQ"] = 0.25  
        recallWeights["Recall Cloze to Text"] = 0.25    
        recallWeights["Recall Cloze to MCQ"] = 0.25
    }
    if (isMcqEnabled && !isClozeEnabled) {
        recallWeights["Recall Text to Text"] = 0.5
        recallWeights["Recall Text to MCQ"] = 0.5  
        recallWeights["Recall Cloze to Text"] = 0
        recallWeights["Recall Cloze to MCQ"] = 0
    }
    if (!isMcqEnabled && isClozeEnabled) {
        recallWeights["Recall Text to Text"] = 0.5
        recallWeights["Recall Text to MCQ"] = 0
        recallWeights["Recall Cloze to Text"] = 0.5
        recallWeights["Recall Cloze to MCQ"] = 0
    }

    const comprehensionWeights = {
        "Comprehension Text to Text": 1,
        "Comprehension Text to MCQ": 0,
        "Comprehension Text to Voice": 0,
    }
    if (isMcqEnabled && isVoiceRecordedEnabled) {
        comprehensionWeights["Comprehension Text to Text"] = 0.25
        comprehensionWeights["Comprehension Text to MCQ"] = 0.5  
        comprehensionWeights["Comprehension Text to Voice"] = 0.25    
    }
    if (isMcqEnabled && !isVoiceRecordedEnabled) {
        comprehensionWeights["Comprehension Text to Text"] = 0.3
        comprehensionWeights["Comprehension Text to MCQ"] = 0.7  
        comprehensionWeights["Comprehension Text to Voice"] = 0    
    }
    if (!isMcqEnabled && isVoiceRecordedEnabled) {
        comprehensionWeights["Comprehension Text to Text"] = 0.3
        comprehensionWeights["Comprehension Text to MCQ"] = 0  
        comprehensionWeights["Comprehension Text to Voice"] = 0.7    
    }

    const applicationWeights = {
        "Application Text to Text": 1,
        "Application Text to MCQ": 0,
        "Application Text to Voice": 0,
    }
    if (isMcqEnabled && isVoiceRecordedEnabled) {
        applicationWeights["Application Text to Text"] = 0.25
        applicationWeights["Application Text to MCQ"] = 0.25  
        applicationWeights["Application Text to Voice"] = 0.5   
    }
    if (isMcqEnabled && !isVoiceRecordedEnabled) {
        applicationWeights["Application Text to Text"] = 0.5
        applicationWeights["Application Text to MCQ"] = 0.5  
        applicationWeights["Application Text to Voice"] = 0    
    }
    if (!isMcqEnabled && isVoiceRecordedEnabled) {
        applicationWeights["Application Text to Text"] = 0.5
        applicationWeights["Application Text to MCQ"] = 0  
        applicationWeights["Application Text to Voice"] = 0.5    
    }

    const analysisWeights = {
        "Analysis Text to Text": 1,
        "Analysis Text to MCQ": 0,
        "Analysis Text to Voice": 0,
    }
    if (isMcqEnabled && isVoiceRecordedEnabled) {
        analysisWeights["Analysis Text to Text"] = 0.25
        analysisWeights["Analysis Text to MCQ"] = 0.5  
        analysisWeights["Analysis Text to Voice"] = 0.25    
    }   
    if (isMcqEnabled && !isVoiceRecordedEnabled) {
        analysisWeights["Analysis Text to Text"] = 0.3
        analysisWeights["Analysis Text to MCQ"] = 0.7  
        analysisWeights["Analysis Text to Voice"] = 0    
    }
    if (!isMcqEnabled && isVoiceRecordedEnabled) {
        analysisWeights["Analysis Text to Text"] = 0.3
        analysisWeights["Analysis Text to MCQ"] = 0  
        analysisWeights["Analysis Text to Voice"] = 0.7    
    }

    const synthesisWeights = {
        "Synthesis Text to Text": 1,
        "Synthesis Text to MCQ": 0,
        "Synthesis Text to Voice": 0,
    }
    if (isMcqEnabled && isVoiceRecordedEnabled) {
        synthesisWeights["Synthesis Text to Text"] = 0.25
        synthesisWeights["Synthesis Text to MCQ"] = 0.25  
        synthesisWeights["Synthesis Text to Voice"] = 0.5    
    }
    if (isMcqEnabled && !isVoiceRecordedEnabled) {
        synthesisWeights["Synthesis Text to Text"] = 0.5
        synthesisWeights["Synthesis Text to MCQ"] = 0.5  
        synthesisWeights["Synthesis Text to Voice"] = 0    
    }
    if (!isMcqEnabled && isVoiceRecordedEnabled) {
        synthesisWeights["Synthesis Text to Text"] = 0.5
        synthesisWeights["Synthesis Text to MCQ"] = 0  
        synthesisWeights["Synthesis Text to Voice"] = 0.5      
    }

    const evaluationWeights = {
        "Evaluation Text to Text": 1,
        "Evaluation Text to MCQ": 0,
        "Evaluation Text to Voice": 0,
    }
    if (isMcqEnabled && isVoiceRecordedEnabled) {
        evaluationWeights["Evaluation Text to Text"] = 0.25
        evaluationWeights["Evaluation Text to MCQ"] = 0.25  
        evaluationWeights["Evaluation Text to Voice"] = 0.5    
    }   
    if (isMcqEnabled && !isVoiceRecordedEnabled) {
        evaluationWeights["Evaluation Text to Text"] = 0.5
        evaluationWeights["Evaluation Text to MCQ"] = 0.5  
        evaluationWeights["Evaluation Text to Voice"] = 0   
    }
    if (!isMcqEnabled && isVoiceRecordedEnabled) {
        evaluationWeights["Evaluation Text to Text"] = 0.5
        evaluationWeights["Evaluation Text to MCQ"] = 0  
        evaluationWeights["Evaluation Text to Voice"] = 0.5    
    }

    const problemSolvingWeights = {
        "Problem-Solving Text to Text": 1,
        "Problem-Solving Text to MCQ": 0,
        "Problem-Solving Text to Voice": 0,
    }
    if (isMcqEnabled && isVoiceRecordedEnabled) {
        problemSolvingWeights["Problem-Solving Text to Text"] = 0.3
        problemSolvingWeights["Problem-Solving Text to MCQ"] = 0.3  
        problemSolvingWeights["Problem-Solving Text to Voice"] = 0.4    
    }   
    if (isMcqEnabled && !isVoiceRecordedEnabled) {
        problemSolvingWeights["Problem-Solving Text to Text"] = 0.5
        problemSolvingWeights["Problem-Solving Text to MCQ"] = 0.5  
        problemSolvingWeights["Problem-Solving Text to Voice"] = 0   
    }
    if (!isMcqEnabled && isVoiceRecordedEnabled) {
        problemSolvingWeights["Problem-Solving Text to Text"] = 0.5
        problemSolvingWeights["Problem-Solving Text to MCQ"] = 0  
        problemSolvingWeights["Problem-Solving Text to Voice"] = 0.5    
    }

    let weights: { [key: string]: number } = {};
    if (cognitiveType === "Recall") weights = recallWeights;
    else if (cognitiveType === "Comprehension") weights = comprehensionWeights;
    else if (cognitiveType === "Application") weights = applicationWeights;
    else if (cognitiveType === "Analysis") weights = analysisWeights;
    else if (cognitiveType === "Synthesis") weights = synthesisWeights;
    else if (cognitiveType === "Evaluation") weights = evaluationWeights;
    else if (cognitiveType === "Problem-Solving") weights = problemSolvingWeights;

    return weightedRandomKey(weights);
}

function getCognitiveQnTypeForInterviewType(
  interviewType: string,
  allowedTypes?: string[]
): string | null {
    const allWeights = (cognitiveQnTypeWeightsForInterviewType as Record<string, Record<string, number>>)[interviewType] || cognitiveQnTypeWeightsForInterviewType["others"];
    let weights: Record<string, number> = {};
    if (allowedTypes && allowedTypes.length > 0) {
        // Only include allowed types
        for (const type of allowedTypes) {
            if (allWeights[type] !== undefined) {
                weights[type] = allWeights[type];
            }
        }
    } else {
        weights = { ...allWeights };
    }
    return weightedRandomKey(weights);
}

export function getPromptAndDataForInterviewType(
    isMcqEnabled: boolean,
    isClozeEnabled: boolean,
    isVoiceRecordedEnabled: boolean,
    interviewType: string,
    allowedCognitiveTypes?: string[]
  ): Record<string, unknown> | null {
  
      const cognitiveType = getCognitiveQnTypeForInterviewType(interviewType, allowedCognitiveTypes);
      if (!cognitiveType) return null;
      
      const key = getFlashcardTypeForCognitiveType(
        isMcqEnabled, isClozeEnabled, isVoiceRecordedEnabled, cognitiveType
      );
      if (!key) return null;
      const exampleObj = (promptAndData as Record<string, Record<string, unknown>>)[key];
      return exampleObj || null;
  }