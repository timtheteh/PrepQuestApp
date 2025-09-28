import { promptAndData, promptAndDataChinese } from '@/constants/promptEngineering';

export interface FileUploadPromptParams {
  mode: string | string[];
  language: 'English' | 'Chinese';
  // Study mode fields
  studyMandatoryQuestion1?: string; // education level
  studyMandatoryQuestion2?: string; // subjects
  // Interview mode fields
  interviewMandatoryQuestion1?: string; // role
  interviewType?: string;
  // File content fields
  pdfCaptionClaudeCaption?: string;
  extractedText?: string;
  imageCaptionClaudeCaption?: string;
  // Flashcard settings
  distribution?: Record<string, number> | null;
  isAIGenerate?: boolean;
}

export const generateFileUploadPrompt = (params: FileUploadPromptParams): string => {
  const {
    mode,
    language,
    studyMandatoryQuestion1,
    studyMandatoryQuestion2,
    interviewMandatoryQuestion1,
    interviewType,
    pdfCaptionClaudeCaption,
    extractedText,
    imageCaptionClaudeCaption,
    distribution,
    isAIGenerate = false
  } = params;

  let prompt = '';
  const modeStr = Array.isArray(mode) ? mode[0] : mode;

  // Build mode-specific prompt sections
  if (modeStr === 'interview' && language === 'English') {
    prompt += `I am preparing for a ${interviewType} interview for the role of ${interviewMandatoryQuestion1}.\n`;
  }
  if (modeStr === 'interview' && language === 'Chinese') {
    prompt += `我正在准备一个${interviewType}面试，角色是${interviewMandatoryQuestion1}。\n`;
  }
  if (modeStr === 'study' && language === 'English') {
    prompt += `I am studying for ${studyMandatoryQuestion2} and my education level is ${studyMandatoryQuestion1}.\n`;
  }
  if (modeStr === 'study' && language === 'Chinese') {
    prompt += `我正在准备${studyMandatoryQuestion2}考试，我的教育水平是${studyMandatoryQuestion1}。\n`;
  }

  // Add file content context
  if (pdfCaptionClaudeCaption && language === 'English') {
    prompt += `Here is additional information and context from a PDF file for my preparation: ${pdfCaptionClaudeCaption}\n`;
  }
  if (pdfCaptionClaudeCaption && language === 'Chinese') {
    prompt += `这里有一些额外的信息和上下文，来自一个PDF文件，用于我的准备：${pdfCaptionClaudeCaption}\n`;
  }
  if (extractedText && extractedText.trim() !== '' && language === 'English') {
    prompt += `Here is additional information and context from a text file for my preparation: ${extractedText}\n`;
  }
  if (extractedText && extractedText.trim() !== '' && language === 'Chinese') {
    prompt += `这里有一些额外的信息和上下文，来自一个文本文件，用于我的准备：${extractedText}\n`;
  }
  if (imageCaptionClaudeCaption && language === 'English') {
    prompt += `Here is additional information and context from some images for my preparation: ${imageCaptionClaudeCaption}\n`;
  }
  if (imageCaptionClaudeCaption && language === 'Chinese') {
    prompt += `这里有一些额外的信息和上下文，来自一些图像，用于我的准备：${imageCaptionClaudeCaption}\n`;
  }

  // Add flashcard distribution and type prompts
  if (distribution) {
    if (language === 'English') {
      for (const [flashcardType, numQuestions] of Object.entries(distribution)) {
        prompt += `Generate ${numQuestions} flashcards of type '${flashcardType}'.\n`;
        // @ts-ignore
        prompt += `${promptAndData[flashcardType].prompt}\n`;
      }
    } else {
      for (const [flashcardType, numQuestions] of Object.entries(distribution)) {
        prompt += `生成${numQuestions}个'${flashcardType}'类型的闪卡。\n`;
        // @ts-ignore
        prompt += `${promptAndDataChinese[flashcardType].prompt}\n`;
      }
    }
  }

  // Add final instructions based on mode, language, and AI generation setting
  if (language === 'English' && modeStr === 'interview' && isAIGenerate) {
    prompt += 'Make sure to generate meaningful, thoughtful and probable questions and answers specific for my interview and for my job role.\n';
    prompt += 'Generate a JSON array of flashcards in this format: [{"flashcardType": <>, "question": <>, "answer": <>}], where each {"flashcardType": <>, "question": <>, "answer": <>} represents a flashcard.';
  }
  if (language === 'English' && modeStr === 'interview' && !isAIGenerate) {
    prompt += 'Make sure to generate meaningful, thoughtful and probable questions and answers specific for my interview and for my job role.\nHowever, it is EXTREMELY CRUCIAL THAT YOU DO NOT DEVIATE from the information and context I have provided from the PDF file, text file or images. STICK ONLY TO CONTENT FROM THE PDF FILE, TEXT FILE OR IMAGES. ';
    prompt += 'Generate a JSON array of flashcards in this format: [{"flashcardType": <>, "question": <>, "answer": <>}], where each {"flashcardType": <>, "question": <>, "answer": <>} represents a flashcard.';
  }
  if (language === 'Chinese' && modeStr === 'interview' && isAIGenerate) {
    prompt += '确保生成有意义、有思考、有概率的问题和答案，针对我的面试和我的工作角色。\n';
    prompt += '生成一个JSON数组，格式为：[{"flashcardType": <>, "question": <>, "answer": <>}], 其中每个 {"flashcardType": <>, "question": <>, "answer": <>} 代表一个闪卡。';
  }
  if (language === 'English' && modeStr === 'study' && isAIGenerate) {
    prompt += 'Make sure to generate meaningful, thoughtful and probable questions and answers specific for the subjects I am studying and my education level.\n The examples I have given for the questions and answers are JUST EXAMPLES to demonstrate the question styles for the question types, YOU MUST ONLY GENERATE questions and answers that are DIRECTLY RELATED to the subjects I am studying and my education level.\nIt is extremely crucial that you do not deviate away from the subjects taht I am studying\n';
    prompt += 'Generate a JSON array of flashcards in this format: [{"flashcardType": <>, "question": <>, "answer": <>}], where each {"flashcardType": <>, "question": <>, "answer": <>} represents a flashcard.';
  }
  if (language === 'Chinese' && modeStr === 'study' && isAIGenerate) {
    prompt += '确保生成有意义、有思考、有概率的问题和答案，针对我正在学习的科目和我的教育水平。\n';
    prompt += '生成一个JSON数组，格式为：[{"flashcardType": <>, "question": <>, "answer": <>}], 其中每个 {"flashcardType": <>, "question": <>, "answer": <>} 代表一个闪卡。';
  }

  return prompt;
};
