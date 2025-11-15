import { promptAndData, promptAndDataChinese, promptAndDataAfrikaans, promptAndDataIndonesian, promptAndDataMalay, promptAndDataCzech, promptAndDataDutch, promptAndDataGerman, promptAndDataSpanish, promptAndDataFrench, promptAndDataItalian, promptAndDataSwahili, promptAndDataHungarian } from '@/constants/promptEngineering';
import { getDistributionOfFlashcardsForInterviewType } from '@/constants/promptEngineering';
import { Language } from '@/contexts/LanguageContext';

/**
 * Smart distribution function that distributes items across 3 prompts
 * Follows specific distribution logic based on item count
 */
function distributeItemsAcrossPrompts(items: string[], promptIndex: number): string[] {
  if (items.length === 0) return [];
  
  if (items.length === 1) {
    // If only 1 item, all 3 prompts get that one
    return [items[0]];
  }
  
  if (items.length === 2) {
    // If 2 items: first prompt gets first, second prompt gets second, third prompt gets random choice
    if (promptIndex === 0) return [items[0]];
    if (promptIndex === 1) return [items[1]];
    // Third prompt gets random choice between the two items
    return [items[Math.random() < 0.5 ? 0 : 1]]; // promptIndex === 2
  }
  
  if (items.length === 3) {
    // If 3 items, each prompt gets a unique one
    return [items[promptIndex]];
  }
  
  // If more than 3 items, randomly pick 3 and distribute them
  const shuffledItems = [...items].sort(() => Math.random() - 0.5);
  const selectedItems = shuffledItems.slice(0, 3);
  
  // Distribute the 3 selected items across prompts
  if (promptIndex === 0) return [selectedItems[0]];
  if (promptIndex === 1) return [selectedItems[1]];
  return [selectedItems[2]]; // promptIndex === 2
}

export interface OnboardingResponses {
  selectedCard: 'study' | 'interview' | null;
  studySubjectInput: string;
  studySelectedSuggestions: Set<string>;
  interviewSubjectInput: string;
  interviewSelectedSuggestions: Set<string>;
  studyEducationInput: string;
  studySelectedEducationSuggestions: Set<string>;
  interviewEducationInput: string;
  interviewSelectedEducationSuggestions: Set<string>;
  experienceLevelInput: string;
  companyInput: string;
  topicsInput: string;
  examInput: string;
  studyTopicsInput: string;
  interviewType?: string; // User-selected interview type
  language: string;
}

export interface OnboardingPromptParams {
  responses: OnboardingResponses;
  isMcqEnabled: boolean;
  isClozeEnabled: boolean;
  isVoiceRecordedEnabled: boolean;
  numberOfQuestions: number;
  questionType: string[];
}

/**
 * Generates a single onboarding prompt based on distributed parameters
 * Similar to generateGenAIPrompt but specifically for onboarding with only 2 optional study questions
 */
export const generateOnboardingPrompt = async (params: {
  mode: string;
  language: Language;
  // Study mode fields
  studyMandatoryQuestion1?: string; // subjects
  studyMandatoryQuestion2?: string; // education level
  studyOptionalQuestion1?: string; // exam
  studyOptionalQuestion2?: string; // topics
  // Interview mode fields
  interviewMandatoryQuestion1?: string; // role
  interviewOptionalQuestion1?: string; // experience level
  interviewOptionalQuestion2?: string; // company
  interviewOptionalQuestion3?: string; // topics
  interviewType?: string;
  // Common fields
  numberOfQuestions: number;
  questionType: string[];
  distributionOfFlashcards?: Record<string, number> | null;
}): Promise<string> => {
  const {
    mode,
    language,
    studyMandatoryQuestion1,
    studyMandatoryQuestion2,
    studyOptionalQuestion1,
    studyOptionalQuestion2,
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
  if (modeStr === 'interview' && language === 'English') {
    prompt += `I am preparing for a ${interviewType} interview for the role of ${interviewMandatoryQuestion1}.\n`
    if (interviewOptionalQuestion1 && interviewOptionalQuestion1.trim() !== '') {
      prompt += `The experience level for this position is ${interviewOptionalQuestion1}.\n`
    }
    if (interviewOptionalQuestion2 && interviewOptionalQuestion2.trim() !== '') {
      prompt += `The company I am preparing my interview for is ${interviewOptionalQuestion2}.\n`
    }
    if (interviewOptionalQuestion3 && interviewOptionalQuestion3.trim() !== '') {
      prompt += `The topics I would like to focus on are ${interviewOptionalQuestion3}.\n`
    }
  }

  if (modeStr === 'interview' && language === 'Chinese') {
    prompt += `我正在准备一个${interviewType}面试，角色是${interviewMandatoryQuestion1}。\n `
    if (interviewOptionalQuestion1 && interviewOptionalQuestion1.trim() !== '') {
      prompt += `这个职位的经验水平是${interviewOptionalQuestion1}。\n`
    }
    if (interviewOptionalQuestion2 && interviewOptionalQuestion2.trim() !== '') {
      prompt += `我准备面试的公司是${interviewOptionalQuestion2}。\n`
    }
    if (interviewOptionalQuestion3 && interviewOptionalQuestion3.trim() !== '') {
      prompt += `我想要聚焦的领域是${interviewOptionalQuestion3}。\n`
    }
  }

  if (modeStr === 'study' && language === 'English') {
    prompt += `I am studying for ${studyMandatoryQuestion1} and my education level is ${studyMandatoryQuestion2}.\n`
    if (studyOptionalQuestion1 && studyOptionalQuestion1.trim() !== '') {
      prompt += `The exam I am preparing for is ${studyOptionalQuestion1}.\n`
    }
    if (studyOptionalQuestion2 && studyOptionalQuestion2.trim() !== '') {
      prompt += `The topics I would like to focus on are ${studyOptionalQuestion2}.\n`
    }
  }

  if (modeStr === 'study' && language === 'Chinese') { 
    prompt += `我正在准备${studyMandatoryQuestion1}考试，我的教育水平是${studyMandatoryQuestion2}。\n`
    if (studyOptionalQuestion1 && studyOptionalQuestion1.trim() !== '') {
      prompt += `我正在准备${studyOptionalQuestion1}考试。\n`
    }
    if (studyOptionalQuestion2 && studyOptionalQuestion2.trim() !== '') {
      prompt += `我想要聚焦的领域是${studyOptionalQuestion2}。\n`
    }
  }

  if (modeStr === 'interview' && language === 'Afrikaans') {
    prompt += `Ek berei voor vir 'n ${interviewType} onderhoud vir die rol van ${interviewMandatoryQuestion1}.\n`
    if (interviewOptionalQuestion1 && interviewOptionalQuestion1.trim() !== '') {
      prompt += `Die ervaringsvlak vir hierdie posisie is ${interviewOptionalQuestion1}.\n`
    }
    if (interviewOptionalQuestion2 && interviewOptionalQuestion2.trim() !== '') {
      prompt += `Die maatskappy waarvoor ek my onderhoud voorberei is ${interviewOptionalQuestion2}.\n`
    }
    if (interviewOptionalQuestion3 && interviewOptionalQuestion3.trim() !== '') {
      prompt += `Die onderwerpe waarop ek wil fokus is ${interviewOptionalQuestion3}.\n`
    }
  }

  if (modeStr === 'study' && language === 'Afrikaans') {
    prompt += `Ek studeer vir ${studyMandatoryQuestion1} en my opvoedingsvlak is ${studyMandatoryQuestion2}.\n`
    if (studyOptionalQuestion1 && studyOptionalQuestion1.trim() !== '') {
      prompt += `Die eksamen waarvoor ek voorberei is ${studyOptionalQuestion1}.\n`
    }
    if (studyOptionalQuestion2 && studyOptionalQuestion2.trim() !== '') {
      prompt += `Die onderwerpe waarop ek wil fokus is ${studyOptionalQuestion2}.\n`
    }
  }

  if (modeStr === 'interview' && language === 'Indonesian') {
    prompt += `Saya sedang mempersiapkan wawancara ${interviewType} untuk peran ${interviewMandatoryQuestion1}.\n`
    if (interviewOptionalQuestion1 && interviewOptionalQuestion1.trim() !== '') {
      prompt += `Tingkat pengalaman untuk posisi ini adalah ${interviewOptionalQuestion1}.\n`
    }
    if (interviewOptionalQuestion2 && interviewOptionalQuestion2.trim() !== '') {
      prompt += `Perusahaan yang saya persiapkan untuk wawancara adalah ${interviewOptionalQuestion2}.\n`
    }
    if (interviewOptionalQuestion3 && interviewOptionalQuestion3.trim() !== '') {
      prompt += `Topik yang ingin saya fokuskan adalah ${interviewOptionalQuestion3}.\n`
    }
  }

  if (modeStr === 'study' && language === 'Indonesian') {
    prompt += `Saya sedang belajar untuk ${studyMandatoryQuestion1} dan tingkat pendidikan saya adalah ${studyMandatoryQuestion2}.\n`
    if (studyOptionalQuestion1 && studyOptionalQuestion1.trim() !== '') {
      prompt += `Ujian yang sedang saya persiapkan adalah ${studyOptionalQuestion1}.\n`
    }
    if (studyOptionalQuestion2 && studyOptionalQuestion2.trim() !== '') {
      prompt += `Topik yang ingin saya fokuskan adalah ${studyOptionalQuestion2}.\n`
    }
  }

  if (modeStr === 'interview' && language === 'Malay') {
    prompt += `Saya sedang mempersiapkan temuduga ${interviewType} untuk peranan ${interviewMandatoryQuestion1}.\n`
    if (interviewOptionalQuestion1 && interviewOptionalQuestion1.trim() !== '') {
      prompt += `Tahap pengalaman untuk posisi ini adalah ${interviewOptionalQuestion1}.\n`
    }
    if (interviewOptionalQuestion2 && interviewOptionalQuestion2.trim() !== '') {
      prompt += `Syarikat yang saya persiapkan untuk temuduga adalah ${interviewOptionalQuestion2}.\n`
    }
    if (interviewOptionalQuestion3 && interviewOptionalQuestion3.trim() !== '') {
      prompt += `Topik yang ingin saya fokuskan adalah ${interviewOptionalQuestion3}.\n`
    }
  }

  if (modeStr === 'study' && language === 'Malay') {
    prompt += `Saya sedang belajar untuk ${studyMandatoryQuestion1} dan tahap pendidikan saya adalah ${studyMandatoryQuestion2}.\n`
    if (studyOptionalQuestion1 && studyOptionalQuestion1.trim() !== '') {
      prompt += `Peperiksaan yang sedang saya persiapkan adalah ${studyOptionalQuestion1}.\n`
    }
    if (studyOptionalQuestion2 && studyOptionalQuestion2.trim() !== '') {
      prompt += `Topik yang ingin saya fokuskan adalah ${studyOptionalQuestion2}.\n`
    }
  }

  if (modeStr === 'interview' && language === 'Czech') {
    prompt += `Připravuji se na ${interviewType} pohovor pro roli ${interviewMandatoryQuestion1}.\n`
    if (interviewOptionalQuestion1 && interviewOptionalQuestion1.trim() !== '') {
      prompt += `Úroveň zkušeností pro tuto pozici je ${interviewOptionalQuestion1}.\n`
    }
    if (interviewOptionalQuestion2 && interviewOptionalQuestion2.trim() !== '') {
      prompt += `Společnost, pro kterou se připravuji na pohovor, je ${interviewOptionalQuestion2}.\n`
    }
    if (interviewOptionalQuestion3 && interviewOptionalQuestion3.trim() !== '') {
      prompt += `Témata, na která se chci zaměřit, jsou ${interviewOptionalQuestion3}.\n`
    }
  }

  if (modeStr === 'study' && language === 'Czech') {
    prompt += `Studuji pro ${studyMandatoryQuestion1} a moje úroveň vzdělání je ${studyMandatoryQuestion2}.\n`
    if (studyOptionalQuestion1 && studyOptionalQuestion1.trim() !== '') {
      prompt += `Zkouška, na kterou se připravuji, je ${studyOptionalQuestion1}.\n`
    }
    if (studyOptionalQuestion2 && studyOptionalQuestion2.trim() !== '') {
      prompt += `Témata, na která se chci zaměřit, jsou ${studyOptionalQuestion2}.\n`
    }
  }

  if (modeStr === 'interview' && language === 'Dutch') {
    prompt += `Ik bereid me voor op een ${interviewType} sollicitatiegesprek voor de rol van ${interviewMandatoryQuestion1}.\n`
    if (interviewOptionalQuestion1 && interviewOptionalQuestion1.trim() !== '') {
      prompt += `Het ervaringsniveau voor deze positie is ${interviewOptionalQuestion1}.\n`
    }
    if (interviewOptionalQuestion2 && interviewOptionalQuestion2.trim() !== '') {
      prompt += `Het bedrijf waarvoor ik mijn sollicitatiegesprek voorbereid is ${interviewOptionalQuestion2}.\n`
    }
    if (interviewOptionalQuestion3 && interviewOptionalQuestion3.trim() !== '') {
      prompt += `De onderwerpen waarop ik me wil focussen zijn ${interviewOptionalQuestion3}.\n`
    }
  }

  if (modeStr === 'study' && language === 'Dutch') {
    prompt += `Ik studeer voor ${studyMandatoryQuestion1} en mijn opleidingsniveau is ${studyMandatoryQuestion2}.\n`
    if (studyOptionalQuestion1 && studyOptionalQuestion1.trim() !== '') {
      prompt += `Het examen waarvoor ik me voorbereid is ${studyOptionalQuestion1}.\n`
    }
    if (studyOptionalQuestion2 && studyOptionalQuestion2.trim() !== '') {
      prompt += `De onderwerpen waarop ik me wil focussen zijn ${studyOptionalQuestion2}.\n`
    }
  }

  if (modeStr === 'interview' && language === 'German') {
    prompt += `Ich bereite mich auf ein ${interviewType} Interview für die Rolle ${interviewMandatoryQuestion1} vor.\n`
    if (interviewOptionalQuestion1 && interviewOptionalQuestion1.trim() !== '') {
      prompt += `Das Erfahrungsniveau für diese Position ist ${interviewOptionalQuestion1}.\n`
    }
    if (interviewOptionalQuestion2 && interviewOptionalQuestion2.trim() !== '') {
      prompt += `Das Unternehmen, für das ich mein Interview vorbereite, ist ${interviewOptionalQuestion2}.\n`
    }
    if (interviewOptionalQuestion3 && interviewOptionalQuestion3.trim() !== '') {
      prompt += `Die Themen, auf die ich mich konzentrieren möchte, sind ${interviewOptionalQuestion3}.\n`
    }
  }

  if (modeStr === 'study' && language === 'German') {
    prompt += `Ich studiere für ${studyMandatoryQuestion1} und mein Bildungsniveau ist ${studyMandatoryQuestion2}.\n`
    if (studyOptionalQuestion1 && studyOptionalQuestion1.trim() !== '') {
      prompt += `Die Prüfung, auf die ich mich vorbereite, ist ${studyOptionalQuestion1}.\n`
    }
    if (studyOptionalQuestion2 && studyOptionalQuestion2.trim() !== '') {
      prompt += `Die Themen, auf die ich mich konzentrieren möchte, sind ${studyOptionalQuestion2}.\n`
    }
  }

  if (modeStr === 'interview' && language === 'Spanish') {
    prompt += `Me estoy preparando para una entrevista ${interviewType} para el rol de ${interviewMandatoryQuestion1}.\n`
    if (interviewOptionalQuestion1 && interviewOptionalQuestion1.trim() !== '') {
      prompt += `El nivel de experiencia para esta posición es ${interviewOptionalQuestion1}.\n`
    }
    if (interviewOptionalQuestion2 && interviewOptionalQuestion2.trim() !== '') {
      prompt += `La empresa para la que me estoy preparando para la entrevista es ${interviewOptionalQuestion2}.\n`
    }
    if (interviewOptionalQuestion3 && interviewOptionalQuestion3.trim() !== '') {
      prompt += `Los temas en los que me gustaría enfocarme son ${interviewOptionalQuestion3}.\n`
    }
  }

  if (modeStr === 'study' && language === 'Spanish') {
    prompt += `Estoy estudiando para ${studyMandatoryQuestion1} y mi nivel educativo es ${studyMandatoryQuestion2}.\n`
    if (studyOptionalQuestion1 && studyOptionalQuestion1.trim() !== '') {
      prompt += `El examen para el que me estoy preparando es ${studyOptionalQuestion1}.\n`
    }
    if (studyOptionalQuestion2 && studyOptionalQuestion2.trim() !== '') {
      prompt += `Los temas en los que me gustaría enfocarme son ${studyOptionalQuestion2}.\n`
    }
  }

  if (modeStr === 'interview' && language === 'French') {
    prompt += `Je me prépare pour un entretien ${interviewType} pour le rôle de ${interviewMandatoryQuestion1}.\n`
    if (interviewOptionalQuestion1 && interviewOptionalQuestion1.trim() !== '') {
      prompt += `Le niveau d'expérience pour ce poste est ${interviewOptionalQuestion1}.\n`
    }
    if (interviewOptionalQuestion2 && interviewOptionalQuestion2.trim() !== '') {
      prompt += `L'entreprise pour laquelle je me prépare pour l'entretien est ${interviewOptionalQuestion2}.\n`
    }
    if (interviewOptionalQuestion3 && interviewOptionalQuestion3.trim() !== '') {
      prompt += `Les sujets sur lesquels je souhaite me concentrer sont ${interviewOptionalQuestion3}.\n`
    }
  }

  if (modeStr === 'study' && language === 'French') {
    prompt += `J'étudie pour ${studyMandatoryQuestion1} et mon niveau d'éducation est ${studyMandatoryQuestion2}.\n`
    if (studyOptionalQuestion1 && studyOptionalQuestion1.trim() !== '') {
      prompt += `L'examen pour lequel je me prépare est ${studyOptionalQuestion1}.\n`
    }
    if (studyOptionalQuestion2 && studyOptionalQuestion2.trim() !== '') {
      prompt += `Les sujets sur lesquels je souhaite me concentrer sont ${studyOptionalQuestion2}.\n`
    }
  }

  if (modeStr === 'interview' && language === 'Italian') {
    prompt += `Mi sto preparando per un colloquio ${interviewType} per il ruolo di ${interviewMandatoryQuestion1}.\n`
    if (interviewOptionalQuestion1 && interviewOptionalQuestion1.trim() !== '') {
      prompt += `Il livello di esperienza per questa posizione è ${interviewOptionalQuestion1}.\n`
    }
    if (interviewOptionalQuestion2 && interviewOptionalQuestion2.trim() !== '') {
      prompt += `L'azienda per cui mi sto preparando per il colloquio è ${interviewOptionalQuestion2}.\n`
    }
    if (interviewOptionalQuestion3 && interviewOptionalQuestion3.trim() !== '') {
      prompt += `Gli argomenti su cui vorrei concentrarmi sono ${interviewOptionalQuestion3}.\n`
    }
  }

  if (modeStr === 'study' && language === 'Italian') {
    prompt += `Sto studiando per ${studyMandatoryQuestion1} e il mio livello di istruzione è ${studyMandatoryQuestion2}.\n`
    if (studyOptionalQuestion1 && studyOptionalQuestion1.trim() !== '') {
      prompt += `L'esame per cui mi sto preparando è ${studyOptionalQuestion1}.\n`
    }
    if (studyOptionalQuestion2 && studyOptionalQuestion2.trim() !== '') {
      prompt += `Gli argomenti su cui vorrei concentrarmi sono ${studyOptionalQuestion2}.\n`
    }
  }

  if (modeStr === 'interview' && language === 'Swahili') {
    prompt += `Ninajiandaa kwa mahojiano ya ${interviewType} kwa jukumu la ${interviewMandatoryQuestion1}.\n`
    if (interviewOptionalQuestion1 && interviewOptionalQuestion1.trim() !== '') {
      prompt += `Kiwango cha uzoefu kwa nafasi hii ni ${interviewOptionalQuestion1}.\n`
    }
    if (interviewOptionalQuestion2 && interviewOptionalQuestion2.trim() !== '') {
      prompt += `Kampuni ambayo ninajiandaa kwa mahojiano ni ${interviewOptionalQuestion2}.\n`
    }
    if (interviewOptionalQuestion3 && interviewOptionalQuestion3.trim() !== '') {
      prompt += `Mada ambazo ningependa kuzingatia ni ${interviewOptionalQuestion3}.\n`
    }
  }

  if (modeStr === 'study' && language === 'Swahili') {
    prompt += `Ninasoma kwa ${studyMandatoryQuestion1} na kiwango changu cha elimu ni ${studyMandatoryQuestion2}.\n`
    if (studyOptionalQuestion1 && studyOptionalQuestion1.trim() !== '') {
      prompt += `Mtihani ambao ninajiandaa ni ${studyOptionalQuestion1}.\n`
    }
    if (studyOptionalQuestion2 && studyOptionalQuestion2.trim() !== '') {
      prompt += `Mada ambazo ningependa kuzingatia ni ${studyOptionalQuestion2}.\n`
    }
  }

  if (modeStr === 'interview' && language === 'Hungarian') {
    prompt += `Felkészülök egy ${interviewType} interjúra a ${interviewMandatoryQuestion1} szerepkörhöz.\n`
    if (interviewOptionalQuestion1 && interviewOptionalQuestion1.trim() !== '') {
      prompt += `A pozíció tapasztalati szintje ${interviewOptionalQuestion1}.\n`
    }
    if (interviewOptionalQuestion2 && interviewOptionalQuestion2.trim() !== '') {
      prompt += `A cég, amelyre az interjúra készülök, ${interviewOptionalQuestion2}.\n`
    }
    if (interviewOptionalQuestion3 && interviewOptionalQuestion3.trim() !== '') {
      prompt += `A témák, amelyekre szeretnék összpontosítani: ${interviewOptionalQuestion3}.\n`
    }
  }

  if (modeStr === 'study' && language === 'Hungarian') {
    prompt += `A ${studyMandatoryQuestion1} tanulok, és az oktatási szintem ${studyMandatoryQuestion2}.\n`
    if (studyOptionalQuestion1 && studyOptionalQuestion1.trim() !== '') {
      prompt += `A vizsga, amelyre készülök: ${studyOptionalQuestion1}.\n`
    }
    if (studyOptionalQuestion2 && studyOptionalQuestion2.trim() !== '') {
      prompt += `A témák, amelyekre szeretnék összpontosítani: ${studyOptionalQuestion2}.\n`
    }
  }

  // Add flashcard distribution and type prompts
  if (distributionOfFlashcards) {   
    if (language === 'English') {
      for (const [flashcardType, numQuestions] of Object.entries(distributionOfFlashcards)) {
        prompt += `Generate ${numQuestions} flashcards of type '${flashcardType}'.\n`
        prompt += `${promptAndData[flashcardType as keyof typeof promptAndData].prompt}\n`
      }
    } 
    if (language === 'Chinese') {
      for (const [flashcardType, numQuestions] of Object.entries(distributionOfFlashcards)) {
        prompt += `生成${numQuestions}个'${flashcardType}'类型的闪卡。\n`
        prompt += `${promptAndDataChinese[flashcardType as keyof typeof promptAndDataChinese].prompt}\n`
      }
    }
    if (language === 'Afrikaans') {
      for (const [flashcardType, numQuestions] of Object.entries(distributionOfFlashcards)) {
        prompt += `Genereer ${numQuestions} flitskaarte van tipe '${flashcardType}'.\n`
        prompt += `${promptAndDataAfrikaans[flashcardType as keyof typeof promptAndDataAfrikaans].prompt}\n`
      }
    }
    if (language === 'Indonesian') {
      for (const [flashcardType, numQuestions] of Object.entries(distributionOfFlashcards)) {
        prompt += `Buat ${numQuestions} kartu flash bertipe '${flashcardType}'.\n`
        prompt += `${promptAndDataIndonesian[flashcardType as keyof typeof promptAndDataIndonesian].prompt}\n`
      }
    }
    if (language === 'Malay') {
      for (const [flashcardType, numQuestions] of Object.entries(distributionOfFlashcards)) {
        prompt += `Jana ${numQuestions} kad imbas jenis '${flashcardType}'.\n`
        prompt += `${promptAndDataMalay[flashcardType as keyof typeof promptAndDataMalay].prompt}\n`
      }
    }
    if (language === 'Czech') {
      for (const [flashcardType, numQuestions] of Object.entries(distributionOfFlashcards)) {
        prompt += `Vygenerujte ${numQuestions} kartiček typu '${flashcardType}'.\n`
        prompt += `${promptAndDataCzech[flashcardType as keyof typeof promptAndDataCzech].prompt}\n`
      }
    }
    if (language === 'Dutch') {
      for (const [flashcardType, numQuestions] of Object.entries(distributionOfFlashcards)) {
        prompt += `Genereer ${numQuestions} flashcards van type '${flashcardType}'.\n`
        prompt += `${promptAndDataDutch[flashcardType as keyof typeof promptAndDataDutch].prompt}\n`
      }
    }
    if (language === 'German') {
      for (const [flashcardType, numQuestions] of Object.entries(distributionOfFlashcards)) {
        prompt += `Generieren Sie ${numQuestions} Karteikarten vom Typ '${flashcardType}'.\n`
        prompt += `${promptAndDataGerman[flashcardType as keyof typeof promptAndDataGerman].prompt}\n`
      }
    }
    if (language === 'Spanish') {
      for (const [flashcardType, numQuestions] of Object.entries(distributionOfFlashcards)) {
        prompt += `Genera ${numQuestions} tarjetas de tipo '${flashcardType}'.\n`
        prompt += `${promptAndDataSpanish[flashcardType as keyof typeof promptAndDataSpanish].prompt}\n`
      }
    }
    if (language === 'French') {
      for (const [flashcardType, numQuestions] of Object.entries(distributionOfFlashcards)) {
        prompt += `Générez ${numQuestions} cartes de type '${flashcardType}'.\n`
        prompt += `${promptAndDataFrench[flashcardType as keyof typeof promptAndDataFrench].prompt}\n`
      }
    }
    if (language === 'Italian') {
      for (const [flashcardType, numQuestions] of Object.entries(distributionOfFlashcards)) {
        prompt += `Genera ${numQuestions} carte di tipo '${flashcardType}'.\n`
        prompt += `${promptAndDataItalian[flashcardType as keyof typeof promptAndDataItalian].prompt}\n`
      }
    }
    if (language === 'Swahili') {
      for (const [flashcardType, numQuestions] of Object.entries(distributionOfFlashcards)) {
        prompt += `Zalisha kadi ${numQuestions} za aina '${flashcardType}'.\n`
        prompt += `${promptAndDataSwahili[flashcardType as keyof typeof promptAndDataSwahili].prompt}\n`
      }
    }
    if (language === 'Hungarian') {
      for (const [flashcardType, numQuestions] of Object.entries(distributionOfFlashcards)) {
        prompt += `Generáljon ${numQuestions} kártyát '${flashcardType}' típusból.\n`
        prompt += `${promptAndDataHungarian[flashcardType as keyof typeof promptAndDataHungarian].prompt}\n`
      }
    }
  }

  // Add final instructions
  if (language === 'English' && modeStr === 'interview') { 
    prompt += "Make sure to generate meaningful, thoughtful and probable questions and answers specific for my interview and for my job role.\n"
    prompt += "Generate a JSON array of flashcards in this format: [{\"flashcardType\": <>, \"question\": <>, \"answer\": <>}], where each {\"flashcardType\": <>, \"question\": <>, \"answer\": <>} represents a flashcard."
  }

  if (language === 'Chinese' && modeStr === 'interview') { 
    prompt += "确保生成有意义、有思考、有概率的问题和答案，针对我的面试和我的工作角色。\n"
    prompt += "生成一个JSON数组，格式为：[{\"flashcardType\": <>, \"question\": <>, \"answer\": <>}], 其中每个 {\"flashcardType\": <>, \"question\": <>, \"answer\": <>} 代表一个闪卡。"
  }

  if (language === 'English' && modeStr === 'study') { 
    prompt += "Make sure to generate meaningful, thoughtful and probable questions and answers specific for the subjects I am studying and my education level.\n The examples I have given for the questions and answers are JUST EXAMPLES to demonstrate the question styles for the question types, YOU MUST ONLY GENERATE questions and answers that are DIRECTLY RELATED to the subjects I am studying and my education level.\nIt is extremely crucial that you do not deviate away from the subjects taht I am studying\n"
    prompt += "Generate a JSON array of flashcards in this format: [{\"flashcardType\": <>, \"question\": <>, \"answer\": <>}], where each {\"flashcardType\": <>, \"question\": <>, \"answer\": <>} represents a flashcard."
  }

  if (language === 'Chinese' && modeStr === 'study') { 
    prompt += "确保生成有意义、有思考、有概率的问题和答案，针对我正在学习的科目和我的教育水平。\n"
    prompt += "生成一个JSON数组，格式为：[{\"flashcardType\": <>, \"question\": <>, \"answer\": <>}], 其中每个 {\"flashcardType\": <>, \"question\": <>, \"answer\": <>} 代表一个闪卡。"
  }

  if (language === 'Afrikaans' && modeStr === 'interview') {
    prompt += "Maak seker om betekenisvolle, deurdagte en waarskynlike vrae en antwoorde te genereer wat spesifiek is vir my onderhoud en my werkrol.\n"
    prompt += "Genereer 'n JSON-array in hierdie formaat: [{\"flashcardType\": <>, \"question\": <>, \"answer\": <>}], waar elke {\"flashcardType\": <>, \"question\": <>, \"answer\": <>} 'n flitskaart verteenwoordig."
  }

  if (language === 'Afrikaans' && modeStr === 'study') {
    prompt += "Maak seker om betekenisvolle, deurdagte en waarskynlike vrae en antwoorde te genereer wat spesifiek is vir die vakke wat ek studeer en my opvoedingsvlak.\n"
    prompt += "Die voorbeelde wat ek gegee het vir die vrae en antwoorde is NET VOORBEELDE om die vraagstyle vir die vraagtipes te demonstreer, JY MOET NET vrae en antwoorde genereer wat DIREK VERWANT is aan die vakke wat ek studeer en my opvoedingsvlak.\n"
    prompt += "Dit is uiters belangrik dat jy nie wegbeweeg van die vakke wat ek studeer nie.\n"
    prompt += "Genereer 'n JSON-array in hierdie formaat: [{\"flashcardType\": <>, \"question\": <>, \"answer\": <>}], waar elke {\"flashcardType\": <>, \"question\": <>, \"answer\": <>} 'n flitskaart verteenwoordig."
  }

  if (language === 'Indonesian' && modeStr === 'interview') {
    prompt += "Pastikan untuk menghasilkan pertanyaan dan jawaban yang bermakna, bijaksana, dan mungkin yang spesifik untuk wawancara saya dan peran pekerjaan saya.\n"
    prompt += "Hasilkan array JSON kartu flash dalam format ini: [{\"flashcardType\": <>, \"question\": <>, \"answer\": <>}], di mana setiap {\"flashcardType\": <>, \"question\": <>, \"answer\": <>} mewakili sebuah kartu flash."
  }

  if (language === 'Indonesian' && modeStr === 'study') {
    prompt += "Pastikan untuk menghasilkan pertanyaan dan jawaban yang bermakna, bijaksana, dan mungkin yang spesifik untuk mata pelajaran yang saya pelajari dan tingkat pendidikan saya.\n"
    prompt += "Contoh yang telah saya berikan untuk pertanyaan dan jawaban HANYALAH CONTOH untuk mendemonstrasikan gaya pertanyaan untuk jenis pertanyaan, ANDA HARUS HANYA MENGHASILKAN pertanyaan dan jawaban yang LANGSUNG TERKAIT dengan mata pelajaran yang saya pelajari dan tingkat pendidikan saya.\n"
    prompt += "Sangat penting bahwa Anda tidak menyimpang dari mata pelajaran yang saya pelajari.\n"
    prompt += "Hasilkan array JSON kartu flash dalam format ini: [{\"flashcardType\": <>, \"question\": <>, \"answer\": <>}], di mana setiap {\"flashcardType\": <>, \"question\": <>, \"answer\": <>} mewakili sebuah kartu flash."
  }

  if (language === 'Malay' && modeStr === 'interview') {
    prompt += "Pastikan untuk menjana soalan dan jawapan yang bermakna, bijaksana, dan mungkin yang spesifik untuk temuduga saya dan peranan pekerjaan saya.\n"
    prompt += "Jana array JSON kad imbas dalam format ini: [{\"flashcardType\": <>, \"question\": <>, \"answer\": <>}], di mana setiap {\"flashcardType\": <>, \"question\": <>, \"answer\": <>} mewakili sebuah kad imbas."
  }

  if (language === 'Malay' && modeStr === 'study') {
    prompt += "Pastikan untuk menjana soalan dan jawapan yang bermakna, bijaksana, dan mungkin yang spesifik untuk subjek yang saya pelajari dan tahap pendidikan saya.\n"
    prompt += "Contoh yang telah saya berikan untuk soalan dan jawapan HANYALAH CONTOH untuk menunjukkan gaya soalan untuk jenis soalan, ANDA HARUS HANYA MENJANA soalan dan jawapan yang LANGSUNG BERKAITAN dengan subjek yang saya pelajari dan tahap pendidikan saya.\n"
    prompt += "Sangat penting bahawa anda tidak menyimpang dari subjek yang saya pelajari.\n"
    prompt += "Jana array JSON kad imbas dalam format ini: [{\"flashcardType\": <>, \"question\": <>, \"answer\": <>}], di mana setiap {\"flashcardType\": <>, \"question\": <>, \"answer\": <>} mewakili sebuah kad imbas."
  }

  if (language === 'Czech' && modeStr === 'interview') {
    prompt += "Ujistěte se, že generujete smysluplné, promyšlené a pravděpodobné otázky a odpovědi specifické pro můj pohovor a mou pracovní roli.\n"
    prompt += "Vygenerujte pole JSON kartiček v tomto formátu: [{\"flashcardType\": <>, \"question\": <>, \"answer\": <>}], kde každá {\"flashcardType\": <>, \"question\": <>, \"answer\": <>} představuje kartičku."
  }

  if (language === 'Czech' && modeStr === 'study') {
    prompt += "Ujistěte se, že generujete smysluplné, promyšlené a pravděpodobné otázky a odpovědi specifické pro předměty, které studuji, a moji úroveň vzdělání.\n"
    prompt += "Příklady, které jsem poskytl pro otázky a odpovědi, JSOU POUZE PŘÍKLADY pro demonstraci stylů otázek pro typy otázek, MUSÍTE GENEROVAT POUZE otázky a odpovědi, které JSOU PŘÍMO SOUVISEJÍCÍ s předměty, které studuji, a moji úrovní vzdělání.\n"
    prompt += "Je nesmírně důležité, abyste neodchýlili od předmětů, které studuji.\n"
    prompt += "Vygenerujte pole JSON kartiček v tomto formátu: [{\"flashcardType\": <>, \"question\": <>, \"answer\": <>}], kde každá {\"flashcardType\": <>, \"question\": <>, \"answer\": <>} představuje kartičku."
  }

  if (language === 'Dutch' && modeStr === 'interview') {
    prompt += "Zorg ervoor dat u betekenisvolle, doordachte en waarschijnlijke vragen en antwoorden genereert die specifiek zijn voor mijn sollicitatiegesprek en mijn functie.\n"
    prompt += "Genereer een JSON-array van flashcards in dit formaat: [{\"flashcardType\": <>, \"question\": <>, \"answer\": <>}], waarbij elke {\"flashcardType\": <>, \"question\": <>, \"answer\": <>} een flashcard vertegenwoordigt."
  }

  if (language === 'Dutch' && modeStr === 'study') {
    prompt += "Zorg ervoor dat u betekenisvolle, doordachte en waarschijnlijke vragen en antwoorden genereert die specifiek zijn voor de vakken die ik studeer en mijn opleidingsniveau.\n"
    prompt += "De voorbeelden die ik heb gegeven voor de vragen en antwoorden zijn ALLEEN VOORBEELDEN om de vraagstijlen voor de vraagtypen te demonstreren, U MOET ALLEEN vragen en antwoorden genereren die DIRECT VERBAND HOUDEN met de vakken die ik studeer en mijn opleidingsniveau.\n"
    prompt += "Het is uiterst belangrijk dat u niet afwijkt van de vakken die ik studeer.\n"
    prompt += "Genereer een JSON-array van flashcards in dit formaat: [{\"flashcardType\": <>, \"question\": <>, \"answer\": <>}], waarbij elke {\"flashcardType\": <>, \"question\": <>, \"answer\": <>} een flashcard vertegenwoordigt."
  }

  if (language === 'German' && modeStr === 'interview') {
    prompt += "Stellen Sie sicher, dass Sie sinnvolle, durchdachte und wahrscheinliche Fragen und Antworten generieren, die spezifisch für mein Interview und meine Arbeitsrolle sind.\n"
    prompt += "Generieren Sie ein JSON-Array von Karteikarten in diesem Format: [{\"flashcardType\": <>, \"question\": <>, \"answer\": <>}], wobei jede {\"flashcardType\": <>, \"question\": <>, \"answer\": <>} eine Karteikarte darstellt."
  }

  if (language === 'German' && modeStr === 'study') {
    prompt += "Stellen Sie sicher, dass Sie sinnvolle, durchdachte und wahrscheinliche Fragen und Antworten generieren, die spezifisch für die Fächer sind, die ich studiere, und mein Bildungsniveau.\n"
    prompt += "Die Beispiele, die ich für die Fragen und Antworten gegeben habe, sind NUR BEISPIELE, um die Fragestile für die Fragetypen zu demonstrieren, SIE MÜSSEN NUR Fragen und Antworten generieren, die DIREKT MIT den Fächern, die ich studiere, und meinem Bildungsniveau VERBUNDEN sind.\n"
    prompt += "Es ist äußerst wichtig, dass Sie nicht von den Fächern abweichen, die ich studiere.\n"
    prompt += "Generieren Sie ein JSON-Array von Karteikarten in diesem Format: [{\"flashcardType\": <>, \"question\": <>, \"answer\": <>}], wobei jede {\"flashcardType\": <>, \"question\": <>, \"answer\": <>} eine Karteikarte darstellt."
  }

  if (language === 'Spanish' && modeStr === 'interview') {
    prompt += "Asegúrate de generar preguntas y respuestas significativas, reflexivas y probables específicas para mi entrevista y para mi rol de trabajo.\n"
    prompt += "Genera un array JSON de tarjetas en este formato: [{\"flashcardType\": <>, \"question\": <>, \"answer\": <>}], donde cada {\"flashcardType\": <>, \"question\": <>, \"answer\": <>} representa una tarjeta."
  }

  if (language === 'Spanish' && modeStr === 'study') {
    prompt += "Asegúrate de generar preguntas y respuestas significativas, reflexivas y probables específicas para las materias que estoy estudiando y mi nivel educativo.\n"
    prompt += "Los ejemplos que he dado para las preguntas y respuestas son SOLO EJEMPLOS para demostrar los estilos de preguntas para los tipos de preguntas, DEBES SOLO GENERAR preguntas y respuestas que estén DIRECTAMENTE RELACIONADAS con las materias que estoy estudiando y mi nivel educativo.\n"
    prompt += "Es extremadamente crucial que no te desvíes de las materias que estoy estudiando.\n"
    prompt += "Genera un array JSON de tarjetas en este formato: [{\"flashcardType\": <>, \"question\": <>, \"answer\": <>}], donde cada {\"flashcardType\": <>, \"question\": <>, \"answer\": <>} representa una tarjeta."
  }

  if (language === 'French' && modeStr === 'interview') {
    prompt += "Assurez-vous de générer des questions et réponses significatives, réfléchies et probables spécifiques à mon entretien et à mon rôle professionnel.\n"
    prompt += "Générez un tableau JSON de cartes dans ce format : [{\"flashcardType\": <>, \"question\": <>, \"answer\": <>}], où chaque {\"flashcardType\": <>, \"question\": <>, \"answer\": <>} représente une carte."
  }

  if (language === 'French' && modeStr === 'study') {
    prompt += "Assurez-vous de générer des questions et réponses significatives, réfléchies et probables spécifiques aux matières que j'étudie et à mon niveau d'éducation.\n"
    prompt += "Les exemples que j'ai donnés pour les questions et réponses sont UNIQUEMENT DES EXEMPLES pour démontrer les styles de questions pour les types de questions, VOUS DEVEZ UNIQUEMENT GÉNÉRER des questions et réponses qui sont DIRECTEMENT LIÉES aux matières que j'étudie et à mon niveau d'éducation.\n"
    prompt += "Il est extrêmement crucial que vous ne vous écartiez pas des matières que j'étudie.\n"
    prompt += "Générez un tableau JSON de cartes dans ce format : [{\"flashcardType\": <>, \"question\": <>, \"answer\": <>}], où chaque {\"flashcardType\": <>, \"question\": <>, \"answer\": <>} représente une carte."
  }

  if (language === 'Italian' && modeStr === 'interview') {
    prompt += "Assicurati di generare domande e risposte significative, riflessive e probabili specifiche per il mio colloquio e per il mio ruolo lavorativo.\n"
    prompt += "Genera un array JSON di carte in questo formato: [{\"flashcardType\": <>, \"question\": <>, \"answer\": <>}], dove ogni {\"flashcardType\": <>, \"question\": <>, \"answer\": <>} rappresenta una carta."
  }

  if (language === 'Italian' && modeStr === 'study') {
    prompt += "Assicurati di generare domande e risposte significative, riflessive e probabili specifiche per le materie che sto studiando e il mio livello di istruzione.\n"
    prompt += "Gli esempi che ho fornito per le domande e le risposte sono SOLO ESEMPI per dimostrare gli stili di domande per i tipi di domande, DEVI SOLO GENERARE domande e risposte che sono DIRETTAMENTE CORRELATE alle materie che sto studiando e al mio livello di istruzione.\n"
    prompt += "È estremamente cruciale che non ti discosti dalle materie che sto studiando.\n"
    prompt += "Genera un array JSON di carte in questo formato: [{\"flashcardType\": <>, \"question\": <>, \"answer\": <>}], dove ogni {\"flashcardType\": <>, \"question\": <>, \"answer\": <>} rappresenta una carta."
  }

  if (language === 'Swahili' && modeStr === 'interview') {
    prompt += "Hakikisha unazalisha maswali na majibu yenye maana, ya kufikirika na yanayowezekana maalum kwa mahojiano yangu na jukumu langu la kazi.\n"
    prompt += "Zalisha safu ya JSON ya kadi katika umbizo hili: [{\"flashcardType\": <>, \"question\": <>, \"answer\": <>}], ambapo kila {\"flashcardType\": <>, \"question\": <>, \"answer\": <>} inawakilisha kadi."
  }

  if (language === 'Swahili' && modeStr === 'study') {
    prompt += "Hakikisha unazalisha maswali na majibu yenye maana, ya kufikirika na yanayowezekana maalum kwa masomo ninayosoma na kiwango changu cha elimu.\n"
    prompt += "Mifano niliyotoa kwa maswali na majibu ni MIFANO TU ili kuonyesha mitindo ya maswali kwa aina za maswali, LAZIMA UZALISHE maswali na majibu ambayo yanahusiana MOJA KWA MOJA na masomo ninayosoma na kiwango changu cha elimu.\n"
    prompt += "Ni muhimu sana kwamba usitoke kwenye masomo ninayosoma.\n"
    prompt += "Zalisha safu ya JSON ya kadi katika umbizo hili: [{\"flashcardType\": <>, \"question\": <>, \"answer\": <>}], ambapo kila {\"flashcardType\": <>, \"question\": <>, \"answer\": <>} inawakilisha kadi."
  }

  if (language === 'Hungarian' && modeStr === 'interview') {
    prompt += "Győződjön meg róla, hogy értelmes, átgondolt és valószínű kérdéseket és válaszokat generál, amelyek specifikusak az interjúmra és a munkakörömre.\n"
    prompt += "Generáljon egy JSON tömböt kártyákból ebben a formátumban: [{\"flashcardType\": <>, \"question\": <>, \"answer\": <>}], ahol minden {\"flashcardType\": <>, \"question\": <>, \"answer\": <>} egy kártyát képvisel."
  }

  if (language === 'Hungarian' && modeStr === 'study') {
    prompt += "Győződjön meg róla, hogy értelmes, átgondolt és valószínű kérdéseket és válaszokat generál, amelyek specifikusak a tanult tárgyaimra és oktatási szintemre.\n"
    prompt += "A példák, amelyeket a kérdésekre és válaszokra adtam, CSAK PÉLDÁK a kérdéstípusok kérdésstílusának bemutatásához, CSAK olyan kérdéseket és válaszokat generáljon, amelyek KÖZVETLENÜL KAPCSOLÓDNAK a tanult tárgyaimhoz és oktatási szintemhez.\n"
    prompt += "Rendkívül fontos, hogy ne térjen el a tanult tárgyaktól.\n"
    prompt += "Generáljon egy JSON tömböt kártyákból ebben a formátumban: [{\"flashcardType\": <>, \"question\": <>, \"answer\": <>}], ahol minden {\"flashcardType\": <>, \"question\": <>, \"answer\": <>} egy kártyát képvisel."
  }

  return prompt;
};

/**
 * Generates 3 prompts for free deck creation based on onboarding responses
 * Distributes user responses across 3 different prompts to create diverse decks
 */
export const generateOnboardingPrompts = async (params: OnboardingPromptParams): Promise<string[]> => {
  const { responses, isMcqEnabled, isClozeEnabled, isVoiceRecordedEnabled, numberOfQuestions, questionType } = params;
  
  // Determine the mode and language
  const mode = responses.selectedCard || 'study';
  const language = (responses.language === 'Chinese' || responses.language === 'Afrikaans' || responses.language === 'Indonesian' || responses.language === 'Malay' || responses.language === 'Czech' || responses.language === 'Dutch' || responses.language === 'German' || responses.language === 'Spanish' || responses.language === 'French' || responses.language === 'Italian' || responses.language === 'Swahili' || responses.language === 'Hungarian') ? responses.language : 'English';
  
  // Create 3 different prompt variations by distributing the responses
  const prompts: string[] = [];
  
  for (let i = 0; i < 3; i++) {
    // Create a copy of responses for this prompt
    const promptResponses = { ...responses };
    
    // Distribute responses differently for each prompt
    const distributedParams = distributeResponsesForPrompt(promptResponses, i, mode, language);
    
    // Generate distribution of flashcards using the same method as genAIForm
    // Use appropriate interview type based on mode
    const interviewTypeForDistribution = mode === 'study' ? 'study' : (distributedParams.interviewType || 'technical');
    const distributionOfFlashcards = getDistributionOfFlashcardsForInterviewType(
      isMcqEnabled,
      isClozeEnabled,
      isVoiceRecordedEnabled,
      interviewTypeForDistribution,
      numberOfQuestions
    );
    
    console.log(`📊 Prompt ${i + 1} distribution:`, {
      mode,
      interviewTypeForDistribution,
      distributionOfFlashcards,
      totalQuestions: numberOfQuestions
    });
    
    // Generate the prompt using the dedicated onboarding function
    const prompt = await generateOnboardingPrompt({
      mode: mode,
      language: language,
      // Study mode fields
      studyMandatoryQuestion1: distributedParams.studyMandatoryQuestion1,
      studyMandatoryQuestion2: distributedParams.studyMandatoryQuestion2,
      studyOptionalQuestion1: distributedParams.studyOptionalQuestion1,
      studyOptionalQuestion2: distributedParams.studyOptionalQuestion2,
      // Interview mode fields
      interviewMandatoryQuestion1: distributedParams.interviewMandatoryQuestion1,
      interviewOptionalQuestion1: distributedParams.interviewOptionalQuestion1,
      interviewOptionalQuestion2: distributedParams.interviewOptionalQuestion2,
      interviewOptionalQuestion3: distributedParams.interviewOptionalQuestion3,
      interviewType: distributedParams.interviewType,
      // Common fields
      numberOfQuestions: numberOfQuestions,
      questionType: questionType,
      distributionOfFlashcards: distributionOfFlashcards
    });
    
    prompts.push(prompt);
  }
  
  return prompts;
}

/**
 * Generates 3 different prompts with their corresponding distributed form fields
 * This allows us to get the correct interview type for each deck
 */
export const generateOnboardingPromptsWithFormFields = async (params: OnboardingPromptParams): Promise<{
  prompts: string[];
  formFields: Array<{
    studyEducationLevel?: string;
    studySubjects?: string;
    studyTopics?: string;
    studyExam?: string;
    interviewJobRole?: string;
    interviewType?: string;
    interviewCompany?: string;
    interviewExperienceLevel?: string;
    interviewTopics?: string;
  }>;
}> => {
  const { responses, isMcqEnabled, isClozeEnabled, isVoiceRecordedEnabled, numberOfQuestions, questionType } = params;
  
  // Determine the mode and language
  const mode = responses.selectedCard || 'study';
  const language = (responses.language === 'Chinese' || responses.language === 'Afrikaans' || responses.language === 'Indonesian' || responses.language === 'Malay' || responses.language === 'Czech' || responses.language === 'Dutch' || responses.language === 'German' || responses.language === 'Spanish' || responses.language === 'French' || responses.language === 'Italian' || responses.language === 'Swahili' || responses.language === 'Hungarian') ? responses.language : 'English';
  
  // Create 3 different prompt variations by distributing the responses
  const prompts: string[] = [];
  const formFields: Array<any> = [];
  
  for (let i = 0; i < 3; i++) {
    // Create a copy of responses for this prompt
    const promptResponses = { ...responses };
    
    // Distribute responses differently for each prompt
    const distributedParams = distributeResponsesForPrompt(promptResponses, i, mode, language);
    
    // Store the distributed form fields for this prompt
    formFields.push({
      studyEducationLevel: distributedParams.studyMandatoryQuestion2,
      studySubjects: distributedParams.studyMandatoryQuestion1,
      studyTopics: distributedParams.studyOptionalQuestion2,
      studyExam: distributedParams.studyOptionalQuestion1,
      interviewJobRole: distributedParams.interviewMandatoryQuestion1,
      interviewType: distributedParams.interviewType,
      interviewCompany: distributedParams.interviewOptionalQuestion2,
      interviewExperienceLevel: distributedParams.interviewOptionalQuestion1,
      interviewTopics: distributedParams.interviewOptionalQuestion3,
    });
    
    // Generate distribution of flashcards using the same method as genAIForm
    // Use appropriate interview type based on mode
    const interviewTypeForDistribution = mode === 'study' ? 'study' : (distributedParams.interviewType || 'technical');
    const distributionOfFlashcards = getDistributionOfFlashcardsForInterviewType(
      isMcqEnabled,
      isClozeEnabled,
      isVoiceRecordedEnabled,
      interviewTypeForDistribution,
      numberOfQuestions
    );
    
    console.log(`📊 Prompt ${i + 1} distribution:`, {
      interviewType: distributedParams.interviewType,
      distributionOfFlashcards
    });
    
    // Generate the prompt using the distributed parameters
    const prompt = await generateOnboardingPrompt({
      mode,
      language,
      studyMandatoryQuestion1: distributedParams.studyMandatoryQuestion1,
      studyMandatoryQuestion2: distributedParams.studyMandatoryQuestion2,
      studyOptionalQuestion1: distributedParams.studyOptionalQuestion1,
      studyOptionalQuestion2: distributedParams.studyOptionalQuestion2,
      interviewMandatoryQuestion1: distributedParams.interviewMandatoryQuestion1,
      interviewType: distributedParams.interviewType,
      interviewOptionalQuestion1: distributedParams.interviewOptionalQuestion1,
      interviewOptionalQuestion2: distributedParams.interviewOptionalQuestion2,
      interviewOptionalQuestion3: distributedParams.interviewOptionalQuestion3,
      distributionOfFlashcards,
      numberOfQuestions,
      questionType
    });
    
    prompts.push(prompt);
  }
  
  return { prompts, formFields };
};

/**
 * Distributes user responses across 3 different prompts to create variety
 */
function distributeResponsesForPrompt(
  responses: OnboardingResponses, 
  promptIndex: number, 
  mode: string, 
  language: string
): {
  studyMandatoryQuestion1?: string;
  studyMandatoryQuestion2?: string;
  studyOptionalQuestion1?: string;
  studyOptionalQuestion2?: string;
  studyOptionalQuestion3?: string;
  interviewMandatoryQuestion1?: string;
  interviewOptionalQuestion1?: string;
  interviewOptionalQuestion2?: string;
  interviewOptionalQuestion3?: string;
  interviewType?: string;
} {
  
  if (mode === 'study') {
    return distributeStudyResponses(responses, promptIndex);
  } else {
    return distributeInterviewResponses(responses, promptIndex);
  }
}

/**
 * Distributes study mode responses across 3 prompts
 */
function distributeStudyResponses(responses: OnboardingResponses, promptIndex: number) {
  // Get all subjects from both suggestions and text input
  const suggestionSubjects = Array.from(responses.studySelectedSuggestions);
  const textInputSubjects = responses.studySubjectInput 
    ? responses.studySubjectInput.split(',').map(s => s.trim()).filter(s => s.length > 0)
    : [];
  const allSubjects = [...suggestionSubjects, ...textInputSubjects];
  
  // Get all education levels from both suggestions and text input
  const suggestionEducationLevels = Array.from(responses.studySelectedEducationSuggestions);
  const textInputEducationLevels = responses.studyEducationInput 
    ? responses.studyEducationInput.split(',').map(s => s.trim()).filter(s => s.length > 0)
    : [];
  const allEducationLevels = [...suggestionEducationLevels, ...textInputEducationLevels];
  
  // Parse study topics from text input (comma-separated)
  const studyTopicsFromInput = responses.studyTopicsInput 
    ? responses.studyTopicsInput.split(',').map(s => s.trim()).filter(s => s.length > 0)
    : [];
  
  // Distribute subjects across 3 prompts with smart distribution
  const promptSubjects = distributeItemsAcrossPrompts(allSubjects, promptIndex);
  
  // Distribute education levels across 3 prompts with smart distribution
  const promptEducationLevels = distributeItemsAcrossPrompts(allEducationLevels, promptIndex);
  
  console.log(`🔍 Study Prompt ${promptIndex + 1} distribution:`, {
    allSubjects,
    promptSubjects,
    allEducationLevels,
    promptEducationLevels,
    studyTopicsFromInput
  });
  
  // Create different combinations for each prompt
  const result: any = {};
  
  // Mandatory fields - use the first available values
  result.studyMandatoryQuestion1 = promptSubjects[0] || 'General Studies';
  result.studyMandatoryQuestion2 = promptEducationLevels[0] || 'High School';
  
  // Parse ALL text inputs with comma-separated parsing
  const examFromInput = responses.examInput 
    ? responses.examInput.split(',').map(s => s.trim()).filter(s => s.length > 0)
    : [];
  
  // Optional fields - distribute different topics and details (only 2 optional questions for study)
  if (promptIndex === 0) {
    // First prompt: Use first items from each category
    result.studyOptionalQuestion1 = examFromInput.length > 0 ? examFromInput[0] : undefined;
    result.studyOptionalQuestion2 = studyTopicsFromInput.length > 0 ? studyTopicsFromInput[0] : undefined;
  } else if (promptIndex === 1) {
    // Second prompt: Use second items (or first if only one exists)
    result.studyOptionalQuestion1 = examFromInput.length > 1 ? examFromInput[1] : (examFromInput.length > 0 ? examFromInput[0] : undefined);
    result.studyOptionalQuestion2 = studyTopicsFromInput.length > 1 ? studyTopicsFromInput[1] : (studyTopicsFromInput.length > 0 ? studyTopicsFromInput[0] : undefined);
  } else {
    // Third prompt: Use third items (or first if only one exists)
    result.studyOptionalQuestion1 = examFromInput.length > 2 ? examFromInput[2] : (examFromInput.length > 0 ? examFromInput[0] : undefined);
    result.studyOptionalQuestion2 = studyTopicsFromInput.length > 2 ? studyTopicsFromInput[2] : (studyTopicsFromInput.length > 0 ? studyTopicsFromInput[0] : undefined);
  }
  
  return result;
}

/**
 * Distributes interview mode responses across 3 prompts
 */
function distributeInterviewResponses(responses: OnboardingResponses, promptIndex: number) {
  // Get all roles from both suggestions and text input
  const suggestionRoles = Array.from(responses.interviewSelectedSuggestions);
  const textInputRoles = responses.interviewSubjectInput 
    ? responses.interviewSubjectInput.split(',').map(s => s.trim()).filter(s => s.length > 0)
    : [];
  const allRoles = [...suggestionRoles, ...textInputRoles];
  
  // Distribute roles across 3 prompts with smart distribution
  const promptRoles = distributeItemsAcrossPrompts(allRoles, promptIndex);
  
  // Create different combinations for each prompt
  const result: any = {};
  
  // Mandatory fields
  result.interviewMandatoryQuestion1 = promptRoles[0] || 'Software Engineer';
  
  // Parse ALL text inputs with comma-separated parsing
  const experienceFromInput = responses.experienceLevelInput 
    ? responses.experienceLevelInput.split(',').map(s => s.trim()).filter(s => s.length > 0)
    : [];
  const companyFromInput = responses.companyInput 
    ? responses.companyInput.split(',').map(s => s.trim()).filter(s => s.length > 0)
    : [];
  const topicsFromInput = responses.topicsInput 
    ? responses.topicsInput.split(',').map(s => s.trim()).filter(s => s.length > 0)
    : [];
  
  // Distribute interview types across prompts
  // Parse interview types from the comma-separated string
  const interviewTypesFromInput = responses.interviewType 
    ? responses.interviewType.split(',').map(s => s.trim().toLowerCase()).filter(s => s.length > 0)
    : [];
  
  console.log(`🔍 Interview Prompt ${promptIndex + 1} distribution:`, {
    originalInterviewType: responses.interviewType,
    parsedInterviewTypes: interviewTypesFromInput,
    promptIndex
  });
  
  // Distribute interview types across 3 prompts with smart distribution
  const promptInterviewTypes = distributeItemsAcrossPrompts(interviewTypesFromInput, promptIndex);
  result.interviewType = promptInterviewTypes[0] || 'technical';
  
  console.log(`🎯 Interview Prompt ${promptIndex + 1} final type:`, result.interviewType);
  
  if (promptIndex === 0) {
    // First prompt: Use first items from each category
    result.interviewOptionalQuestion1 = experienceFromInput.length > 0 ? experienceFromInput[0] : undefined;
    result.interviewOptionalQuestion2 = companyFromInput.length > 0 ? companyFromInput[0] : undefined;
    result.interviewOptionalQuestion3 = topicsFromInput.length > 0 ? topicsFromInput.join(', ') : undefined;
  } else if (promptIndex === 1) {
    // Second prompt: Use second items (or first if only one exists)
    result.interviewOptionalQuestion1 = experienceFromInput.length > 1 ? experienceFromInput[1] : (experienceFromInput.length > 0 ? experienceFromInput[0] : undefined);
    result.interviewOptionalQuestion2 = companyFromInput.length > 1 ? companyFromInput[1] : (companyFromInput.length > 0 ? companyFromInput[0] : undefined);
    result.interviewOptionalQuestion3 = topicsFromInput.length > 0 ? topicsFromInput.join(', ') : undefined;
  } else {
    // Third prompt: Use third items (or first if only one exists)
    result.interviewOptionalQuestion1 = experienceFromInput.length > 2 ? experienceFromInput[2] : (experienceFromInput.length > 0 ? experienceFromInput[0] : undefined);
    result.interviewOptionalQuestion2 = companyFromInput.length > 2 ? companyFromInput[2] : (companyFromInput.length > 0 ? companyFromInput[0] : undefined);
    result.interviewOptionalQuestion3 = topicsFromInput.length > 0 ? topicsFromInput.join(', ') : undefined;
  }
  
  return result;
}
