import { promptAndData, promptAndDataChinese } from '@/constants/promptEngineering';
import { Language } from '@/contexts/LanguageContext';

export interface YouTubeLinkPromptParams {
  mode: string | string[];
  language: Language;
  // Study mode fields
  studyMandatoryQuestion1?: string; // education level
  studyMandatoryQuestion2?: string; // subjects
  // Interview mode fields
  interviewMandatoryQuestion1?: string; // role
  interviewType?: string;
  // YouTube content
  transcript: string;
  // Flashcard settings
  distribution?: Record<string, number> | null;
  isAIGenerate?: boolean;
}

export const generateYouTubeLinkPrompt = (params: YouTubeLinkPromptParams): string => {
  const {
    mode,
    language,
    studyMandatoryQuestion1,
    studyMandatoryQuestion2,
    interviewMandatoryQuestion1,
    interviewType,
    transcript,
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
  if (modeStr === 'interview' && language === 'Afrikaans') {
    prompt += `Ek berei voor vir 'n ${interviewType} onderhoud vir die rol van ${interviewMandatoryQuestion1}.\n`;
  }
  if (modeStr === 'study' && language === 'Afrikaans') {
    prompt += `Ek studeer vir ${studyMandatoryQuestion2} en my opvoedingsvlak is ${studyMandatoryQuestion1}.\n`;
  }

  // Add YouTube transcript context
  if (language === 'English') {
    prompt += `Here is additional information and context from a YouTube video transcript for my preparation: ${transcript}\n`;
  } else if (language === 'Chinese') {
    prompt += `这里有一些额外的信息和上下文，来自一个YouTube视频的文字稿，用于我的准备：${transcript}\n`;
  } else if (language === 'Afrikaans') {
    prompt += `Hier is addisionele inligting en konteks van 'n YouTube-video transkripsie vir my voorbereiding: ${transcript}\n`;
  }

  // Add flashcard distribution and type prompts
  if (distribution) {
    if (language === 'English') {
      for (const [flashcardType, numQuestions] of Object.entries(distribution)) {
        prompt += `Generate ${numQuestions} flashcards of type '${flashcardType}'.\n`;
        // @ts-ignore
        prompt += `${promptAndData[flashcardType].prompt}\n`;
      }
    } else if (language === 'Chinese') {
      for (const [flashcardType, numQuestions] of Object.entries(distribution)) {
        prompt += `生成${numQuestions}个'${flashcardType}'类型的闪卡。\n`;
        // @ts-ignore
        prompt += `${promptAndDataChinese[flashcardType].prompt}\n`;
      }
    } else if (language === 'Afrikaans') {
      for (const [flashcardType, numQuestions] of Object.entries(distribution)) {
        prompt += `Genereer ${numQuestions} flitskaarte van tipe '${flashcardType}'.\n`;
        // @ts-ignore
        prompt += `${promptAndData[flashcardType].prompt}\n`;
      }
    }
  }

  // Add final instructions based on mode, language, and AI generation setting
  if (language === 'English' && modeStr === 'interview' && isAIGenerate) {
    prompt += 'Make sure to generate meaningful, thoughtful and probable questions and answers specific for my interview and for my job role.\n';
    prompt += 'Generate a JSON array of flashcards in this format: [{"flashcardType": <>, "question": <>, "answer": <>}], where each {"flashcardType": <>, "question": <>, "answer": <>} represents a flashcard.';
  }
  if (language === 'English' && modeStr === 'interview' && !isAIGenerate) {
    prompt += 'Make sure to generate meaningful, thoughtful and probable questions and answers specific for my interview and for my job role.\nHowever, it is EXTREMELY CRUCIAL THAT YOU DO NOT DEVIATE from the information and context I have provided from the YouTube video transcript. STICK ONLY TO CONTENT FROM THE TRANSCRIPT. ';
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
  if (language === 'Afrikaans' && modeStr === 'interview' && isAIGenerate) {
    prompt += 'Maak seker om betekenisvolle, deurdagte en waarskynlike vrae en antwoorde te genereer wat spesifiek is vir my onderhoud en my werkrol.\n';
    prompt += 'Genereer \'n JSON-array in hierdie formaat: [{"flashcardType": <>, "question": <>, "answer": <>}], waar elke {"flashcardType": <>, "question": <>, "answer": <>} \'n flitskaart verteenwoordig.';
  }
  if (language === 'Afrikaans' && modeStr === 'interview' && !isAIGenerate) {
    prompt += 'Maak seker om betekenisvolle, deurdagte en waarskynlike vrae en antwoorde te genereer wat spesifiek is vir my onderhoud en my werkrol.\n';
    prompt += 'Dit is EKSTREEM BELANGRIK DAT JY NIE AFWYK van die inligting en konteks wat ek verskaf het van die YouTube-video transkripsie nie. BLY NET BY INHOUD VAN DIE TRANSKRIPSIE. ';
    prompt += 'Genereer \'n JSON-array in hierdie formaat: [{"flashcardType": <>, "question": <>, "answer": <>}], waar elke {"flashcardType": <>, "question": <>, "answer": <>} \'n flitskaart verteenwoordig.';
  }
  if (language === 'Afrikaans' && modeStr === 'study' && isAIGenerate) {
    prompt += 'Maak seker om betekenisvolle, deurdagte en waarskynlike vrae en antwoorde te genereer wat spesifiek is vir die vakke wat ek studeer en my opvoedingsvlak.\n';
    prompt += 'Die voorbeelde wat ek gegee het vir die vrae en antwoorde is NET VOORBEELDE om die vraagstyle vir die vraagtipes te demonstreer, JY MOET NET vrae en antwoorde genereer wat DIREK VERWANT is aan die vakke wat ek studeer en my opvoedingsvlak.\n';
    prompt += 'Dit is uiters belangrik dat jy nie wegbeweeg van die vakke wat ek studeer nie.\n';
    prompt += 'Genereer \'n JSON-array in hierdie formaat: [{"flashcardType": <>, "question": <>, "answer": <>}], waar elke {"flashcardType": <>, "question": <>, "answer": <>} \'n flitskaart verteenwoordig.';
  }

  return prompt;
};
