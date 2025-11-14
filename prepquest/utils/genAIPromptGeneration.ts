import { promptAndData, promptAndDataChinese, promptAndDataAfrikaans, promptAndDataIndonesian, promptAndDataMalay, promptAndDataCzech, promptAndDataDutch, promptAndDataGerman, promptAndDataSpanish, promptAndDataFrench } from '@/constants/promptEngineering';
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
  const effectiveLanguage = (language === 'Chinese' || language === 'Afrikaans' || language === 'Indonesian' || language === 'Malay' || language === 'Czech' || language === 'Dutch' || language === 'German' || language === 'Spanish' || language === 'French') ? language : 'English';
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

  if (modeStr === 'interview' && effectiveLanguage === 'Indonesian') {
    prompt += `Saya sedang mempersiapkan wawancara ${interviewType} untuk peran ${interviewMandatoryQuestion1}.\n`
    if (interviewOptionalQuestion1 && interviewOptionalQuestion1.trim() !== '') {
      prompt += `Perusahaan yang saya persiapkan untuk wawancara adalah ${interviewOptionalQuestion1}.\n`
    }
    if (interviewOptionalQuestion2 && interviewOptionalQuestion2.trim() !== '') {
      prompt += `Tingkat pengalaman untuk posisi ini adalah ${interviewOptionalQuestion2}.\n`
    }
    if (interviewOptionalQuestion3 && interviewOptionalQuestion3.trim() !== '') {
      prompt += `Topik yang ingin saya fokuskan adalah ${interviewOptionalQuestion3}.\n`
    }
  }

  if (modeStr === 'study' && effectiveLanguage === 'Indonesian') {
    prompt += `Saya sedang belajar untuk ${studyMandatoryQuestion2} dan tingkat pendidikan saya adalah ${studyMandatoryQuestion1}.\n`
    if (studyOptionalQuestion1 && studyOptionalQuestion1.trim() !== '') {
      prompt += `Topik yang ingin saya pelajari adalah ${studyOptionalQuestion1}.\n`
    }
    if (studyOptionalQuestion2 && studyOptionalQuestion2.trim() !== '') {
      prompt += `Subtopik yang ingin saya fokuskan adalah ${studyOptionalQuestion2}.\n`
    }
    if (studyOptionalQuestion3 && studyOptionalQuestion3.trim() !== '') {
      prompt += `Ujian yang sedang saya persiapkan adalah ${studyOptionalQuestion3}.\n`
    }
  }

  if (modeStr === 'interview' && effectiveLanguage === 'Malay') {
    prompt += `Saya sedang mempersiapkan temuduga ${interviewType} untuk peranan ${interviewMandatoryQuestion1}.\n`
    if (interviewOptionalQuestion1 && interviewOptionalQuestion1.trim() !== '') {
      prompt += `Syarikat yang saya persiapkan untuk temuduga adalah ${interviewOptionalQuestion1}.\n`
    }
    if (interviewOptionalQuestion2 && interviewOptionalQuestion2.trim() !== '') {
      prompt += `Tahap pengalaman untuk posisi ini adalah ${interviewOptionalQuestion2}.\n`
    }
    if (interviewOptionalQuestion3 && interviewOptionalQuestion3.trim() !== '') {
      prompt += `Topik yang ingin saya fokuskan adalah ${interviewOptionalQuestion3}.\n`
    }
  }

  if (modeStr === 'study' && effectiveLanguage === 'Malay') {
    prompt += `Saya sedang belajar untuk ${studyMandatoryQuestion2} dan tahap pendidikan saya adalah ${studyMandatoryQuestion1}.\n`
    if (studyOptionalQuestion1 && studyOptionalQuestion1.trim() !== '') {
      prompt += `Topik yang ingin saya pelajari adalah ${studyOptionalQuestion1}.\n`
    }
    if (studyOptionalQuestion2 && studyOptionalQuestion2.trim() !== '') {
      prompt += `Subtopik yang ingin saya fokuskan adalah ${studyOptionalQuestion2}.\n`
    }
    if (studyOptionalQuestion3 && studyOptionalQuestion3.trim() !== '') {
      prompt += `Peperiksaan yang sedang saya persiapkan adalah ${studyOptionalQuestion3}.\n`
    }
  }

  if (modeStr === 'interview' && effectiveLanguage === 'Czech') {
    prompt += `Připravuji se na ${interviewType} pohovor pro roli ${interviewMandatoryQuestion1}.\n`
    if (interviewOptionalQuestion1 && interviewOptionalQuestion1.trim() !== '') {
      prompt += `Společnost, pro kterou se připravuji na pohovor, je ${interviewOptionalQuestion1}.\n`
    }
    if (interviewOptionalQuestion2 && interviewOptionalQuestion2.trim() !== '') {
      prompt += `Úroveň zkušeností pro tuto pozici je ${interviewOptionalQuestion2}.\n`
    }
    if (interviewOptionalQuestion3 && interviewOptionalQuestion3.trim() !== '') {
      prompt += `Témata, na která se chci zaměřit, jsou ${interviewOptionalQuestion3}.\n`
    }
  }

  if (modeStr === 'study' && effectiveLanguage === 'Czech') {
    prompt += `Studuji pro ${studyMandatoryQuestion2} a moje úroveň vzdělání je ${studyMandatoryQuestion1}.\n`
    if (studyOptionalQuestion1 && studyOptionalQuestion1.trim() !== '') {
      prompt += `Témata, která chci studovat, jsou ${studyOptionalQuestion1}.\n`
    }
    if (studyOptionalQuestion2 && studyOptionalQuestion2.trim() !== '') {
      prompt += `Podtémata, na která se chci zaměřit, jsou ${studyOptionalQuestion2}.\n`
    }
    if (studyOptionalQuestion3 && studyOptionalQuestion3.trim() !== '') {
      prompt += `Zkouška, na kterou se připravuji, je ${studyOptionalQuestion3}.\n`
    }
  }

  if (modeStr === 'interview' && effectiveLanguage === 'Dutch') {
    prompt += `Ik bereid me voor op een ${interviewType} sollicitatiegesprek voor de rol van ${interviewMandatoryQuestion1}.\n`
    if (interviewOptionalQuestion1 && interviewOptionalQuestion1.trim() !== '') {
      prompt += `Het bedrijf waarvoor ik mijn sollicitatiegesprek voorbereid is ${interviewOptionalQuestion1}.\n`
    }
    if (interviewOptionalQuestion2 && interviewOptionalQuestion2.trim() !== '') {
      prompt += `Het ervaringsniveau voor deze positie is ${interviewOptionalQuestion2}.\n`
    }
    if (interviewOptionalQuestion3 && interviewOptionalQuestion3.trim() !== '') {
      prompt += `De onderwerpen waarop ik me wil focussen zijn ${interviewOptionalQuestion3}.\n`
    }
  }

  if (modeStr === 'study' && effectiveLanguage === 'Dutch') {
    prompt += `Ik studeer voor ${studyMandatoryQuestion2} en mijn opleidingsniveau is ${studyMandatoryQuestion1}.\n`
    if (studyOptionalQuestion1 && studyOptionalQuestion1.trim() !== '') {
      prompt += `De onderwerpen die ik wil studeren zijn ${studyOptionalQuestion1}.\n`
    }
    if (studyOptionalQuestion2 && studyOptionalQuestion2.trim() !== '') {
      prompt += `De subonderwerpen waarop ik me wil focussen zijn ${studyOptionalQuestion2}.\n`
    }
    if (studyOptionalQuestion3 && studyOptionalQuestion3.trim() !== '') {
      prompt += `Het examen waarvoor ik me voorbereid is ${studyOptionalQuestion3}.\n`
    }
  }

  if (modeStr === 'interview' && effectiveLanguage === 'German') {
    prompt += `Ich bereite mich auf ein ${interviewType} Interview für die Rolle ${interviewMandatoryQuestion1} vor.\n`
    if (interviewOptionalQuestion1 && interviewOptionalQuestion1.trim() !== '') {
      prompt += `Das Unternehmen, für das ich mein Interview vorbereite, ist ${interviewOptionalQuestion1}.\n`
    }
    if (interviewOptionalQuestion2 && interviewOptionalQuestion2.trim() !== '') {
      prompt += `Das Erfahrungsniveau für diese Position ist ${interviewOptionalQuestion2}.\n`
    }
    if (interviewOptionalQuestion3 && interviewOptionalQuestion3.trim() !== '') {
      prompt += `Die Themen, auf die ich mich konzentrieren möchte, sind ${interviewOptionalQuestion3}.\n`
    }
  }

  if (modeStr === 'study' && effectiveLanguage === 'German') {
    prompt += `Ich studiere für ${studyMandatoryQuestion2} und mein Bildungsniveau ist ${studyMandatoryQuestion1}.\n`
    if (studyOptionalQuestion1 && studyOptionalQuestion1.trim() !== '') {
      prompt += `Die Themen, die ich studieren möchte, sind ${studyOptionalQuestion1}.\n`
    }
    if (studyOptionalQuestion2 && studyOptionalQuestion2.trim() !== '') {
      prompt += `Die Unterthemen, auf die ich mich konzentrieren möchte, sind ${studyOptionalQuestion2}.\n`
    }
    if (studyOptionalQuestion3 && studyOptionalQuestion3.trim() !== '') {
      prompt += `Die Prüfung, auf die ich mich vorbereite, ist ${studyOptionalQuestion3}.\n`
    }
  }

  if (modeStr === 'interview' && effectiveLanguage === 'Spanish') {
    prompt += `Me estoy preparando para una entrevista ${interviewType} para el rol de ${interviewMandatoryQuestion1}.\n`
    if (interviewOptionalQuestion1 && interviewOptionalQuestion1.trim() !== '') {
      prompt += `La empresa para la que me estoy preparando para la entrevista es ${interviewOptionalQuestion1}.\n`
    }
    if (interviewOptionalQuestion2 && interviewOptionalQuestion2.trim() !== '') {
      prompt += `El nivel de experiencia para esta posición es ${interviewOptionalQuestion2}.\n`
    }
    if (interviewOptionalQuestion3 && interviewOptionalQuestion3.trim() !== '') {
      prompt += `Los temas en los que me gustaría enfocarme son ${interviewOptionalQuestion3}.\n`
    }
  }

  if (modeStr === 'study' && effectiveLanguage === 'Spanish') {
    prompt += `Estoy estudiando para ${studyMandatoryQuestion2} y mi nivel educativo es ${studyMandatoryQuestion1}.\n`
    if (studyOptionalQuestion1 && studyOptionalQuestion1.trim() !== '') {
      prompt += `Los temas que me gustaría estudiar son ${studyOptionalQuestion1}.\n`
    }
    if (studyOptionalQuestion2 && studyOptionalQuestion2.trim() !== '') {
      prompt += `Los subtemas en los que me gustaría enfocarme son ${studyOptionalQuestion2}.\n`
    }
    if (studyOptionalQuestion3 && studyOptionalQuestion3.trim() !== '') {
      prompt += `El examen para el que me estoy preparando es ${studyOptionalQuestion3}.\n`
    }
  }

  if (modeStr === 'interview' && effectiveLanguage === 'French') {
    prompt += `Je me prépare pour un entretien ${interviewType} pour le rôle de ${interviewMandatoryQuestion1}.\n`
    if (interviewOptionalQuestion1 && interviewOptionalQuestion1.trim() !== '') {
      prompt += `L'entreprise pour laquelle je me prépare pour l'entretien est ${interviewOptionalQuestion1}.\n`
    }
    if (interviewOptionalQuestion2 && interviewOptionalQuestion2.trim() !== '') {
      prompt += `Le niveau d'expérience pour ce poste est ${interviewOptionalQuestion2}.\n`
    }
    if (interviewOptionalQuestion3 && interviewOptionalQuestion3.trim() !== '') {
      prompt += `Les sujets sur lesquels je souhaite me concentrer sont ${interviewOptionalQuestion3}.\n`
    }
  }

  if (modeStr === 'study' && effectiveLanguage === 'French') {
    prompt += `J'étudie pour ${studyMandatoryQuestion2} et mon niveau d'éducation est ${studyMandatoryQuestion1}.\n`
    if (studyOptionalQuestion1 && studyOptionalQuestion1.trim() !== '') {
      prompt += `Les sujets que je souhaite étudier sont ${studyOptionalQuestion1}.\n`
    }
    if (studyOptionalQuestion2 && studyOptionalQuestion2.trim() !== '') {
      prompt += `Les sous-sujets sur lesquels je souhaite me concentrer sont ${studyOptionalQuestion2}.\n`
    }
    if (studyOptionalQuestion3 && studyOptionalQuestion3.trim() !== '') {
      prompt += `L'examen pour lequel je me prépare est ${studyOptionalQuestion3}.\n`
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
        prompt += `${promptAndDataAfrikaans[flashcardType as keyof typeof promptAndDataAfrikaans].prompt}\n`
      }
    }
    if (effectiveLanguage === 'Indonesian') {
      for (const [flashcardType, numQuestions] of Object.entries(distributionOfFlashcards)) {
        prompt += `Buat ${numQuestions} kartu flash bertipe '${flashcardType}'.\n`
        prompt += `${promptAndDataIndonesian[flashcardType as keyof typeof promptAndDataIndonesian].prompt}\n`
      }
    }
    if (effectiveLanguage === 'Malay') {
      for (const [flashcardType, numQuestions] of Object.entries(distributionOfFlashcards)) {
        prompt += `Jana ${numQuestions} kad imbas jenis '${flashcardType}'.\n`
        prompt += `${promptAndDataMalay[flashcardType as keyof typeof promptAndDataMalay].prompt}\n`
      }
    }
    if (effectiveLanguage === 'Czech') {
      for (const [flashcardType, numQuestions] of Object.entries(distributionOfFlashcards)) {
        prompt += `Vygenerujte ${numQuestions} kartiček typu '${flashcardType}'.\n`
        prompt += `${promptAndDataCzech[flashcardType as keyof typeof promptAndDataCzech].prompt}\n`
      }
    }
    if (effectiveLanguage === 'Dutch') {
      for (const [flashcardType, numQuestions] of Object.entries(distributionOfFlashcards)) {
        prompt += `Genereer ${numQuestions} flashcards van type '${flashcardType}'.\n`
        prompt += `${promptAndDataDutch[flashcardType as keyof typeof promptAndDataDutch].prompt}\n`
      }
    }
    if (effectiveLanguage === 'German') {
      for (const [flashcardType, numQuestions] of Object.entries(distributionOfFlashcards)) {
        prompt += `Generieren Sie ${numQuestions} Karteikarten vom Typ '${flashcardType}'.\n`
        prompt += `${promptAndDataGerman[flashcardType as keyof typeof promptAndDataGerman].prompt}\n`
      }
    }
    if (effectiveLanguage === 'Spanish') {
      for (const [flashcardType, numQuestions] of Object.entries(distributionOfFlashcards)) {
        prompt += `Genera ${numQuestions} tarjetas de tipo '${flashcardType}'.\n`
        prompt += `${promptAndDataSpanish[flashcardType as keyof typeof promptAndDataSpanish].prompt}\n`
      }
    }
    if (effectiveLanguage === 'French') {
      for (const [flashcardType, numQuestions] of Object.entries(distributionOfFlashcards)) {
        prompt += `Générez ${numQuestions} cartes de type '${flashcardType}'.\n`
        prompt += `${promptAndDataFrench[flashcardType as keyof typeof promptAndDataFrench].prompt}\n`
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

  if (effectiveLanguage === 'Indonesian' && modeStr === 'interview') {
    prompt += "Pastikan untuk menghasilkan pertanyaan dan jawaban yang bermakna, bijaksana, dan mungkin yang spesifik untuk wawancara saya dan peran pekerjaan saya.\n"
    prompt += "Hasilkan array JSON kartu flash dalam format ini: [{\"flashcardType\": <>, \"question\": <>, \"answer\": <>}], di mana setiap {\"flashcardType\": <>, \"question\": <>, \"answer\": <>} mewakili sebuah kartu flash."
  }

  if (effectiveLanguage === 'Indonesian' && modeStr === 'study') {
    prompt += "Pastikan untuk menghasilkan pertanyaan dan jawaban yang bermakna, bijaksana, dan mungkin yang spesifik untuk mata pelajaran yang saya pelajari dan tingkat pendidikan saya.\n"
    prompt += "Contoh yang telah saya berikan untuk pertanyaan dan jawaban HANYALAH CONTOH untuk mendemonstrasikan gaya pertanyaan untuk jenis pertanyaan, ANDA HARUS HANYA MENGHASILKAN pertanyaan dan jawaban yang LANGSUNG TERKAIT dengan mata pelajaran yang saya pelajari dan tingkat pendidikan saya.\n"
    prompt += "Sangat penting bahwa Anda tidak menyimpang dari mata pelajaran yang saya pelajari.\n"
    prompt += "Hasilkan array JSON kartu flash dalam format ini: [{\"flashcardType\": <>, \"question\": <>, \"answer\": <>}], di mana setiap {\"flashcardType\": <>, \"question\": <>, \"answer\": <>} mewakili sebuah kartu flash."
  }

  if (effectiveLanguage === 'Malay' && modeStr === 'interview') {
    prompt += "Pastikan untuk menjana soalan dan jawapan yang bermakna, bijaksana, dan mungkin yang spesifik untuk temuduga saya dan peranan pekerjaan saya.\n"
    prompt += "Jana array JSON kad imbas dalam format ini: [{\"flashcardType\": <>, \"question\": <>, \"answer\": <>}], di mana setiap {\"flashcardType\": <>, \"question\": <>, \"answer\": <>} mewakili sebuah kad imbas."
  }

  if (effectiveLanguage === 'Malay' && modeStr === 'study') {
    prompt += "Pastikan untuk menjana soalan dan jawapan yang bermakna, bijaksana, dan mungkin yang spesifik untuk subjek yang saya pelajari dan tahap pendidikan saya.\n"
    prompt += "Contoh yang telah saya berikan untuk soalan dan jawapan HANYALAH CONTOH untuk menunjukkan gaya soalan untuk jenis soalan, ANDA HARUS HANYA MENJANA soalan dan jawapan yang LANGSUNG BERKAITAN dengan subjek yang saya pelajari dan tahap pendidikan saya.\n"
    prompt += "Sangat penting bahawa anda tidak menyimpang dari subjek yang saya pelajari.\n"
    prompt += "Jana array JSON kad imbas dalam format ini: [{\"flashcardType\": <>, \"question\": <>, \"answer\": <>}], di mana setiap {\"flashcardType\": <>, \"question\": <>, \"answer\": <>} mewakili sebuah kad imbas."
  }

  if (effectiveLanguage === 'Czech' && modeStr === 'interview') {
    prompt += "Ujistěte se, že generujete smysluplné, promyšlené a pravděpodobné otázky a odpovědi specifické pro můj pohovor a mou pracovní roli.\n"
    prompt += "Vygenerujte pole JSON kartiček v tomto formátu: [{\"flashcardType\": <>, \"question\": <>, \"answer\": <>}], kde každá {\"flashcardType\": <>, \"question\": <>, \"answer\": <>} představuje kartičku."
  }

  if (effectiveLanguage === 'Czech' && modeStr === 'study') {
    prompt += "Ujistěte se, že generujete smysluplné, promyšlené a pravděpodobné otázky a odpovědi specifické pro předměty, které studuji, a moji úroveň vzdělání.\n"
    prompt += "Příklady, které jsem poskytl pro otázky a odpovědi, JSOU POUZE PŘÍKLADY pro demonstraci stylů otázek pro typy otázek, MUSÍTE GENEROVAT POUZE otázky a odpovědi, které JSOU PŘÍMO SOUVISEJÍCÍ s předměty, které studuji, a moji úrovní vzdělání.\n"
    prompt += "Je nesmírně důležité, abyste neodchýlili od předmětů, které studuji.\n"
    prompt += "Vygenerujte pole JSON kartiček v tomto formátu: [{\"flashcardType\": <>, \"question\": <>, \"answer\": <>}], kde každá {\"flashcardType\": <>, \"question\": <>, \"answer\": <>} představuje kartičku."
  }

  if (effectiveLanguage === 'Dutch' && modeStr === 'interview') {
    prompt += "Zorg ervoor dat u betekenisvolle, doordachte en waarschijnlijke vragen en antwoorden genereert die specifiek zijn voor mijn sollicitatiegesprek en mijn functie.\n"
    prompt += "Genereer een JSON-array van flashcards in dit formaat: [{\"flashcardType\": <>, \"question\": <>, \"answer\": <>}], waarbij elke {\"flashcardType\": <>, \"question\": <>, \"answer\": <>} een flashcard vertegenwoordigt."
  }

  if (effectiveLanguage === 'Dutch' && modeStr === 'study') {
    prompt += "Zorg ervoor dat u betekenisvolle, doordachte en waarschijnlijke vragen en antwoorden genereert die specifiek zijn voor de vakken die ik studeer en mijn opleidingsniveau.\n"
    prompt += "De voorbeelden die ik heb gegeven voor de vragen en antwoorden zijn ALLEEN VOORBEELDEN om de vraagstijlen voor de vraagtypen te demonstreren, U MOET ALLEEN vragen en antwoorden genereren die DIRECT VERBAND HOUDEN met de vakken die ik studeer en mijn opleidingsniveau.\n"
    prompt += "Het is uiterst belangrijk dat u niet afwijkt van de vakken die ik studeer.\n"
    prompt += "Genereer een JSON-array van flashcards in dit formaat: [{\"flashcardType\": <>, \"question\": <>, \"answer\": <>}], waarbij elke {\"flashcardType\": <>, \"question\": <>, \"answer\": <>} een flashcard vertegenwoordigt."
  }

  if (effectiveLanguage === 'German' && modeStr === 'interview') {
    prompt += "Stellen Sie sicher, dass Sie sinnvolle, durchdachte und wahrscheinliche Fragen und Antworten generieren, die spezifisch für mein Interview und meine Arbeitsrolle sind.\n"
    prompt += "Generieren Sie ein JSON-Array von Karteikarten in diesem Format: [{\"flashcardType\": <>, \"question\": <>, \"answer\": <>}], wobei jede {\"flashcardType\": <>, \"question\": <>, \"answer\": <>} eine Karteikarte darstellt."
  }

  if (effectiveLanguage === 'German' && modeStr === 'study') {
    prompt += "Stellen Sie sicher, dass Sie sinnvolle, durchdachte und wahrscheinliche Fragen und Antworten generieren, die spezifisch für die Fächer sind, die ich studiere, und mein Bildungsniveau.\n"
    prompt += "Die Beispiele, die ich für die Fragen und Antworten gegeben habe, sind NUR BEISPIELE, um die Fragestile für die Fragetypen zu demonstrieren, SIE MÜSSEN NUR Fragen und Antworten generieren, die DIREKT MIT den Fächern, die ich studiere, und meinem Bildungsniveau VERBUNDEN sind.\n"
    prompt += "Es ist äußerst wichtig, dass Sie nicht von den Fächern abweichen, die ich studiere.\n"
    prompt += "Generieren Sie ein JSON-Array von Karteikarten in diesem Format: [{\"flashcardType\": <>, \"question\": <>, \"answer\": <>}], wobei jede {\"flashcardType\": <>, \"question\": <>, \"answer\": <>} eine Karteikarte darstellt."
  }

  if (effectiveLanguage === 'Spanish' && modeStr === 'interview') {
    prompt += "Asegúrate de generar preguntas y respuestas significativas, reflexivas y probables específicas para mi entrevista y para mi rol de trabajo.\n"
    prompt += "Genera un array JSON de tarjetas en este formato: [{\"flashcardType\": <>, \"question\": <>, \"answer\": <>}], donde cada {\"flashcardType\": <>, \"question\": <>, \"answer\": <>} representa una tarjeta."
  }

  if (effectiveLanguage === 'Spanish' && modeStr === 'study') {
    prompt += "Asegúrate de generar preguntas y respuestas significativas, reflexivas y probables específicas para las materias que estoy estudiando y mi nivel educativo.\n"
    prompt += "Los ejemplos que he dado para las preguntas y respuestas son SOLO EJEMPLOS para demostrar los estilos de preguntas para los tipos de preguntas, DEBES SOLO GENERAR preguntas y respuestas que estén DIRECTAMENTE RELACIONADAS con las materias que estoy estudiando y mi nivel educativo.\n"
    prompt += "Es extremadamente crucial que no te desvíes de las materias que estoy estudiando.\n"
    prompt += "Genera un array JSON de tarjetas en este formato: [{\"flashcardType\": <>, \"question\": <>, \"answer\": <>}], donde cada {\"flashcardType\": <>, \"question\": <>, \"answer\": <>} representa una tarjeta."
  }

  if (effectiveLanguage === 'French' && modeStr === 'interview') {
    prompt += "Assurez-vous de générer des questions et réponses significatives, réfléchies et probables spécifiques à mon entretien et à mon rôle professionnel.\n"
    prompt += "Générez un tableau JSON de cartes dans ce format : [{\"flashcardType\": <>, \"question\": <>, \"answer\": <>}], où chaque {\"flashcardType\": <>, \"question\": <>, \"answer\": <>} représente une carte."
  }

  if (effectiveLanguage === 'French' && modeStr === 'study') {
    prompt += "Assurez-vous de générer des questions et réponses significatives, réfléchies et probables spécifiques aux matières que j'étudie et à mon niveau d'éducation.\n"
    prompt += "Les exemples que j'ai donnés pour les questions et réponses sont UNIQUEMENT DES EXEMPLES pour démontrer les styles de questions pour les types de questions, VOUS DEVEZ UNIQUEMENT GÉNÉRER des questions et réponses qui sont DIRECTEMENT LIÉES aux matières que j'étudie et à mon niveau d'éducation.\n"
    prompt += "Il est extrêmement crucial que vous ne vous écartiez pas des matières que j'étudie.\n"
    prompt += "Générez un tableau JSON de cartes dans ce format : [{\"flashcardType\": <>, \"question\": <>, \"answer\": <>}], où chaque {\"flashcardType\": <>, \"question\": <>, \"answer\": <>} représente une carte."
  }

  return prompt;
};
