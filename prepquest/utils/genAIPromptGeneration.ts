import { promptAndData, promptAndDataChinese } from '@/constants/promptEngineering';
import { Language } from '@/contexts/LanguageContext';

export interface GenAIPromptParams {
  mode: string | string[];
  language: Language;
  // Study mode fields
  studyMandatoryQuestion1?: string; // education level
  studyMandatoryQuestion2?: string; // subjects
  studyOptionalQuestion1?: string; // topics
  studyOptionalQuestion2?: string; // subtopics
  studyOptionalQuestion3?: string; // exam
  // Interview mode fields
  interviewMandatoryQuestion1?: string; // role
  interviewOptionalQuestion1?: string; // company
  interviewOptionalQuestion2?: string; // experience level
  interviewOptionalQuestion3?: string; // topics
  interviewType?: string;
  // Common fields
  numberOfQuestions: number;
  questionType: string[];
  distributionOfFlashcards?: Record<string, number> | null;
}

export const generateGenAIPrompt = async (params: GenAIPromptParams): Promise<string> => {
  const {
    mode,
    language,
    studyMandatoryQuestion1,
    studyMandatoryQuestion2,
    studyOptionalQuestion1,
    studyOptionalQuestion2,
    studyOptionalQuestion3,
    interviewMandatoryQuestion1,
    interviewOptionalQuestion1,
    interviewOptionalQuestion2,
    interviewOptionalQuestion3,
    interviewType,
    numberOfQuestions,
    questionType,
    distributionOfFlashcards
  } = params;

  let prompt = "";

  // Build mode-specific prompt sections
  const modeStr = Array.isArray(mode) ? mode[0] : mode;
  // Default to English for languages not yet supported in prompts
  const effectiveLanguage = (language === 'Chinese' || language === 'Afrikaans') ? language : 'English';
  if (modeStr === 'interview' && effectiveLanguage === 'English') {
    prompt += `I am preparing for a ${interviewType} interview for the role of ${interviewMandatoryQuestion1}.\n`
    if (interviewOptionalQuestion1 && interviewOptionalQuestion1.trim() !== '') {
      prompt += `The company I am preparing my interview for is ${interviewOptionalQuestion1}.\n`
    }
    if (interviewOptionalQuestion2 && interviewOptionalQuestion2.trim() !== '') {
      prompt += `The experience level for this position is ${interviewOptionalQuestion2}.\n`
    }
    if (interviewOptionalQuestion3 && interviewOptionalQuestion3.trim() !== '') {
      prompt += `The topics I would like to focus on are ${interviewOptionalQuestion3}.\n`
    }
  }

  if (modeStr === 'interview' && effectiveLanguage === 'Chinese') {
    prompt += `我正在准备一个${interviewType}面试，角色是${interviewMandatoryQuestion1}。\n `
    if (interviewOptionalQuestion1 && interviewOptionalQuestion1.trim() !== '') {
      prompt += `我准备面试的公司是${interviewOptionalQuestion1}。\n`
    }
    if (interviewOptionalQuestion2 && interviewOptionalQuestion2.trim() !== '') {
      prompt += `这个职位的经验水平是${interviewOptionalQuestion2}。\n`
    }
    if (interviewOptionalQuestion3 && interviewOptionalQuestion3.trim() !== '') {
      prompt += `我想要聚焦的领域是${interviewOptionalQuestion3}。\n`
    }
  }

  if (modeStr === 'study' && effectiveLanguage === 'English') {
    prompt += `I am studying for ${studyMandatoryQuestion2} and my education level is ${studyMandatoryQuestion1}.\n`
    if (studyOptionalQuestion1 && studyOptionalQuestion1.trim() !== '') {
      prompt += `The topics I would like to study are ${studyOptionalQuestion1}.\n`
    }
    if (studyOptionalQuestion2 && studyOptionalQuestion2.trim() !== '') {
      prompt += `The subtopics I would like to focus on are ${studyOptionalQuestion2}.\n`
    }
    if (studyOptionalQuestion3 && studyOptionalQuestion3.trim() !== '') {
      prompt += `The exam I am preparing for is ${studyOptionalQuestion3}.\n`
    }
  }

  if (modeStr === 'study' && effectiveLanguage === 'Chinese') { 
    prompt += `我正在准备${studyMandatoryQuestion2}考试，我的教育水平是${studyMandatoryQuestion1}。\n`
    if (studyOptionalQuestion1 && studyOptionalQuestion1.trim() !== '') {
      prompt += `我想要学习的领域是${studyOptionalQuestion1}。\n`
    }
    if (studyOptionalQuestion2 && studyOptionalQuestion2.trim() !== '') {
      prompt += `我想要聚焦的子领域是${studyOptionalQuestion2}。\n`
    }
    if (studyOptionalQuestion3 && studyOptionalQuestion3.trim() !== '') {
      prompt += `我正在准备${studyOptionalQuestion3}考试。\n`
    }
  }

  if (modeStr === 'interview' && effectiveLanguage === 'Afrikaans') {
    prompt += `Ek berei voor vir 'n ${interviewType} onderhoud vir die rol van ${interviewMandatoryQuestion1}.\n`
    if (interviewOptionalQuestion1 && interviewOptionalQuestion1.trim() !== '') {
      prompt += `Die maatskappy waarvoor ek my onderhoud voorberei is ${interviewOptionalQuestion1}.\n`
    }
    if (interviewOptionalQuestion2 && interviewOptionalQuestion2.trim() !== '') {
      prompt += `Die ervaringsvlak vir hierdie posisie is ${interviewOptionalQuestion2}.\n`
    }
    if (interviewOptionalQuestion3 && interviewOptionalQuestion3.trim() !== '') {
      prompt += `Die onderwerpe waarop ek wil fokus is ${interviewOptionalQuestion3}.\n`
    }
  }

  if (modeStr === 'study' && effectiveLanguage === 'Afrikaans') {
    prompt += `Ek studeer vir ${studyMandatoryQuestion2} en my opvoedingsvlak is ${studyMandatoryQuestion1}.\n`
    if (studyOptionalQuestion1 && studyOptionalQuestion1.trim() !== '') {
      prompt += `Die onderwerpe wat ek wil studeer is ${studyOptionalQuestion1}.\n`
    }
    if (studyOptionalQuestion2 && studyOptionalQuestion2.trim() !== '') {
      prompt += `Die subonderwerpe waarop ek wil fokus is ${studyOptionalQuestion2}.\n`
    }
    if (studyOptionalQuestion3 && studyOptionalQuestion3.trim() !== '') {
      prompt += `Die eksamen waarvoor ek voorberei is ${studyOptionalQuestion3}.\n`
    }
  }

  // Add flashcard distribution and type prompts
  if (distributionOfFlashcards) {   
    if (effectiveLanguage === 'English') {
      for (const [flashcardType, numQuestions] of Object.entries(distributionOfFlashcards)) {
        prompt += `Generate ${numQuestions} flashcards of type '${flashcardType}'.\n`
        prompt += `${promptAndData[flashcardType as keyof typeof promptAndData].prompt}\n`
      }
    } 
    if (effectiveLanguage === 'Chinese') {
      for (const [flashcardType, numQuestions] of Object.entries(distributionOfFlashcards)) {
        prompt += `生成${numQuestions}个'${flashcardType}'类型的闪卡。\n`
        prompt += `${promptAndDataChinese[flashcardType as keyof typeof promptAndDataChinese].prompt}\n`
      }
    }
    if (effectiveLanguage === 'Afrikaans') {
      for (const [flashcardType, numQuestions] of Object.entries(distributionOfFlashcards)) {
        prompt += `Genereer ${numQuestions} flitskaarte van tipe '${flashcardType}'.\n`
        prompt += `${promptAndData[flashcardType as keyof typeof promptAndData].prompt}\n`
      }
    }
  }

  // Add final instructions
  if (effectiveLanguage === 'English' && modeStr === 'interview') { 
    prompt += "Make sure to generate meaningful, thoughtful and probable questions and answers specific for my interview and for my job role.\n"
    prompt += "Generate a JSON array of flashcards in this format: [{\"flashcardType\": <>, \"question\": <>, \"answer\": <>}], where each {\"flashcardType\": <>, \"question\": <>, \"answer\": <>} represents a flashcard."
  }

  if (effectiveLanguage === 'English' && modeStr === 'study') { 
    prompt += "Make sure to generate meaningful, thoughtful and probable questions and answers specific for the subjects I am studying and my education level.\n The examples I have given for the questions and answers are JUST EXAMPLES to demonstrate the question styles for the question types, YOU MUST ONLY GENERATE questions and answers that are DIRECTLY RELATED to the subjects I am studying and my education level.\nIt is extremely crucial that you do not deviate away from the subjects taht I am studying\n"
    prompt += "Generate a JSON array of flashcards in this format: [{\"flashcardType\": <>, \"question\": <>, \"answer\": <>}], where each {\"flashcardType\": <>, \"question\": <>, \"answer\": <>} represents a flashcard."
  }

  if (effectiveLanguage === 'Chinese' && modeStr === 'interview') { 
    prompt += "确保生成有意义、有思考、有概率的问题和答案，针对我的面试和我的工作角色。\n"
    prompt += "生成一个JSON数组，格式为：[{\"flashcardType\": <>, \"question\": <>, \"answer\": <>}], 其中每个 {\"flashcardType\": <>, \"question\": <>, \"answer\": <>} 代表一个闪卡。"
  }

  if (effectiveLanguage === 'Chinese' && modeStr === 'study') { 
    prompt += "确保生成有意义、有思考、有概率的问题和答案，针对我正在学习的科目和我的教育水平。\n"
    prompt += "生成一个JSON数组，格式为：[{\"flashcardType\": <>, \"question\": <>, \"answer\": <>}], 其中每个 {\"flashcardType\": <>, \"question\": <>, \"answer\": <>} 代表一个闪卡。"
  }

  if (effectiveLanguage === 'Afrikaans' && modeStr === 'interview') {
    prompt += "Maak seker om betekenisvolle, deurdagte en waarskynlike vrae en antwoorde te genereer wat spesifiek is vir my onderhoud en my werkrol.\n"
    prompt += "Genereer 'n JSON-array in hierdie formaat: [{\"flashcardType\": <>, \"question\": <>, \"answer\": <>}], waar elke {\"flashcardType\": <>, \"question\": <>, \"answer\": <>} 'n flitskaart verteenwoordig."
  }

  if (effectiveLanguage === 'Afrikaans' && modeStr === 'study') {
    prompt += "Maak seker om betekenisvolle, deurdagte en waarskynlike vrae en antwoorde te genereer wat spesifiek is vir die vakke wat ek studeer en my opvoedingsvlak.\n"
    prompt += "Die voorbeelde wat ek gegee het vir die vrae en antwoorde is NET VOORBEELDE om die vraagstyle vir die vraagtipes te demonstreer, JY MOET NET vrae en antwoorde genereer wat DIREK VERWANT is aan die vakke wat ek studeer en my opvoedingsvlak.\n"
    prompt += "Dit is uiters belangrik dat jy nie wegbeweeg van die vakke wat ek studeer nie.\n"
    prompt += "Genereer 'n JSON-array in hierdie formaat: [{\"flashcardType\": <>, \"question\": <>, \"answer\": <>}], waar elke {\"flashcardType\": <>, \"question\": <>, \"answer\": <>} 'n flitskaart verteenwoordig."
  }

  return prompt;
};
