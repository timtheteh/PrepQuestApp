import { promptAndData, promptAndDataChinese, promptAndDataAfrikaans, promptAndDataIndonesian, promptAndDataMalay, promptAndDataCzech, promptAndDataDutch, promptAndDataGerman, promptAndDataSpanish, promptAndDataFrench, promptAndDataItalian } from '@/constants/promptEngineering';
import { Language } from '@/contexts/LanguageContext';

export interface FileUploadPromptParams {
  mode: string | string[];
  language: Language;
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
  if (modeStr === 'interview' && language === 'Afrikaans') {
    prompt += `Ek berei voor vir 'n ${interviewType} onderhoud vir die rol van ${interviewMandatoryQuestion1}.\n`;
  }
  if (modeStr === 'study' && language === 'Afrikaans') {
    prompt += `Ek studeer vir ${studyMandatoryQuestion2} en my opvoedingsvlak is ${studyMandatoryQuestion1}.\n`;
  }
  if (modeStr === 'interview' && language === 'Indonesian') {
    prompt += `Saya sedang mempersiapkan wawancara ${interviewType} untuk peran ${interviewMandatoryQuestion1}.\n`;
  }
  if (modeStr === 'study' && language === 'Indonesian') {
    prompt += `Saya sedang belajar untuk ${studyMandatoryQuestion2} dan tingkat pendidikan saya adalah ${studyMandatoryQuestion1}.\n`;
  }
  if (modeStr === 'interview' && language === 'Malay') {
    prompt += `Saya sedang mempersiapkan temuduga ${interviewType} untuk peranan ${interviewMandatoryQuestion1}.\n`;
  }
  if (modeStr === 'study' && language === 'Malay') {
    prompt += `Saya sedang belajar untuk ${studyMandatoryQuestion2} dan tahap pendidikan saya adalah ${studyMandatoryQuestion1}.\n`;
  }
  if (modeStr === 'interview' && language === 'Czech') {
    prompt += `Připravuji se na ${interviewType} pohovor pro roli ${interviewMandatoryQuestion1}.\n`;
  }
  if (modeStr === 'study' && language === 'Czech') {
    prompt += `Studuji pro ${studyMandatoryQuestion2} a moje úroveň vzdělání je ${studyMandatoryQuestion1}.\n`;
  }
  if (modeStr === 'interview' && language === 'Dutch') {
    prompt += `Ik bereid me voor op een ${interviewType} sollicitatiegesprek voor de rol van ${interviewMandatoryQuestion1}.\n`;
  }
  if (modeStr === 'study' && language === 'Dutch') {
    prompt += `Ik studeer voor ${studyMandatoryQuestion2} en mijn opleidingsniveau is ${studyMandatoryQuestion1}.\n`;
  }
  if (modeStr === 'interview' && language === 'German') {
    prompt += `Ich bereite mich auf ein ${interviewType} Interview für die Rolle ${interviewMandatoryQuestion1} vor.\n`;
  }
  if (modeStr === 'study' && language === 'German') {
    prompt += `Ich studiere für ${studyMandatoryQuestion2} und mein Bildungsniveau ist ${studyMandatoryQuestion1}.\n`;
  }
  if (modeStr === 'interview' && language === 'Spanish') {
    prompt += `Me estoy preparando para una entrevista ${interviewType} para el rol de ${interviewMandatoryQuestion1}.\n`;
  }
  if (modeStr === 'study' && language === 'Spanish') {
    prompt += `Estoy estudiando para ${studyMandatoryQuestion2} y mi nivel educativo es ${studyMandatoryQuestion1}.\n`;
  }
  if (modeStr === 'interview' && language === 'French') {
    prompt += `Je me prépare pour un entretien ${interviewType} pour le rôle de ${interviewMandatoryQuestion1}.\n`;
  }
  if (modeStr === 'study' && language === 'French') {
    prompt += `J'étudie pour ${studyMandatoryQuestion2} et mon niveau d'éducation est ${studyMandatoryQuestion1}.\n`;
  }
  if (modeStr === 'interview' && language === 'Italian') {
    prompt += `Mi sto preparando per un colloquio ${interviewType} per il ruolo di ${interviewMandatoryQuestion1}.\n`;
  }
  if (modeStr === 'study' && language === 'Italian') {
    prompt += `Sto studiando per ${studyMandatoryQuestion2} e il mio livello di istruzione è ${studyMandatoryQuestion1}.\n`;
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
  if (pdfCaptionClaudeCaption && language === 'Afrikaans') {
    prompt += `Hier is addisionele inligting en konteks van 'n PDF-lêer vir my voorbereiding: ${pdfCaptionClaudeCaption}\n`;
  }
  if (extractedText && extractedText.trim() !== '' && language === 'Afrikaans') {
    prompt += `Hier is addisionele inligting en konteks van 'n tekslêer vir my voorbereiding: ${extractedText}\n`;
  }
  if (imageCaptionClaudeCaption && language === 'Afrikaans') {
    prompt += `Hier is addisionele inligting en konteks van sommige beelde vir my voorbereiding: ${imageCaptionClaudeCaption}\n`;
  }
  if (pdfCaptionClaudeCaption && language === 'Indonesian') {
    prompt += `Berikut adalah informasi dan konteks tambahan dari file PDF untuk persiapan saya: ${pdfCaptionClaudeCaption}\n`;
  }
  if (extractedText && extractedText.trim() !== '' && language === 'Indonesian') {
    prompt += `Berikut adalah informasi dan konteks tambahan dari file teks untuk persiapan saya: ${extractedText}\n`;
  }
  if (imageCaptionClaudeCaption && language === 'Indonesian') {
    prompt += `Berikut adalah informasi dan konteks tambahan dari beberapa gambar untuk persiapan saya: ${imageCaptionClaudeCaption}\n`;
  }
  if (pdfCaptionClaudeCaption && language === 'Malay') {
    prompt += `Berikut adalah maklumat dan konteks tambahan dari fail PDF untuk persiapan saya: ${pdfCaptionClaudeCaption}\n`;
  }
  if (extractedText && extractedText.trim() !== '' && language === 'Malay') {
    prompt += `Berikut adalah maklumat dan konteks tambahan dari fail teks untuk persiapan saya: ${extractedText}\n`;
  }
  if (imageCaptionClaudeCaption && language === 'Malay') {
    prompt += `Berikut adalah maklumat dan konteks tambahan dari beberapa imej untuk persiapan saya: ${imageCaptionClaudeCaption}\n`;
  }
  if (pdfCaptionClaudeCaption && language === 'Czech') {
    prompt += `Zde jsou další informace a kontext z PDF souboru pro mou přípravu: ${pdfCaptionClaudeCaption}\n`;
  }
  if (extractedText && extractedText.trim() !== '' && language === 'Czech') {
    prompt += `Zde jsou další informace a kontext z textového souboru pro mou přípravu: ${extractedText}\n`;
  }
  if (imageCaptionClaudeCaption && language === 'Czech') {
    prompt += `Zde jsou další informace a kontext z některých obrázků pro mou přípravu: ${imageCaptionClaudeCaption}\n`;
  }
  if (pdfCaptionClaudeCaption && language === 'Dutch') {
    prompt += `Hier is aanvullende informatie en context van een PDF-bestand voor mijn voorbereiding: ${pdfCaptionClaudeCaption}\n`;
  }
  if (extractedText && extractedText.trim() !== '' && language === 'Dutch') {
    prompt += `Hier is aanvullende informatie en context van een tekstbestand voor mijn voorbereiding: ${extractedText}\n`;
  }
  if (imageCaptionClaudeCaption && language === 'Dutch') {
    prompt += `Hier is aanvullende informatie en context van enkele afbeeldingen voor mijn voorbereiding: ${imageCaptionClaudeCaption}\n`;
  }
  if (pdfCaptionClaudeCaption && language === 'German') {
    prompt += `Hier sind zusätzliche Informationen und Kontext aus einer PDF-Datei für meine Vorbereitung: ${pdfCaptionClaudeCaption}\n`;
  }
  if (extractedText && extractedText.trim() !== '' && language === 'German') {
    prompt += `Hier sind zusätzliche Informationen und Kontext aus einer Textdatei für meine Vorbereitung: ${extractedText}\n`;
  }
  if (imageCaptionClaudeCaption && language === 'German') {
    prompt += `Hier sind zusätzliche Informationen und Kontext aus einigen Bildern für meine Vorbereitung: ${imageCaptionClaudeCaption}\n`;
  }
  if (pdfCaptionClaudeCaption && language === 'Spanish') {
    prompt += `Aquí hay información adicional y contexto de un archivo PDF para mi preparación: ${pdfCaptionClaudeCaption}\n`;
  }
  if (extractedText && extractedText.trim() !== '' && language === 'Spanish') {
    prompt += `Aquí hay información adicional y contexto de un archivo de texto para mi preparación: ${extractedText}\n`;
  }
  if (imageCaptionClaudeCaption && language === 'Spanish') {
    prompt += `Aquí hay información adicional y contexto de algunas imágenes para mi preparación: ${imageCaptionClaudeCaption}\n`;
  }
  if (pdfCaptionClaudeCaption && language === 'French') {
    prompt += `Voici des informations et un contexte supplémentaires provenant d'un fichier PDF pour ma préparation : ${pdfCaptionClaudeCaption}\n`;
  }
  if (extractedText && extractedText.trim() !== '' && language === 'French') {
    prompt += `Voici des informations et un contexte supplémentaires provenant d'un fichier texte pour ma préparation : ${extractedText}\n`;
  }
  if (imageCaptionClaudeCaption && language === 'French') {
    prompt += `Voici des informations et un contexte supplémentaires provenant de certaines images pour ma préparation : ${imageCaptionClaudeCaption}\n`;
  }
  if (pdfCaptionClaudeCaption && language === 'Italian') {
    prompt += `Ecco informazioni e contesto aggiuntivi da un file PDF per la mia preparazione: ${pdfCaptionClaudeCaption}\n`;
  }
  if (extractedText && extractedText.trim() !== '' && language === 'Italian') {
    prompt += `Ecco informazioni e contesto aggiuntivi da un file di testo per la mia preparazione: ${extractedText}\n`;
  }
  if (imageCaptionClaudeCaption && language === 'Italian') {
    prompt += `Ecco informazioni e contesto aggiuntivi da alcune immagini per la mia preparazione: ${imageCaptionClaudeCaption}\n`;
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
        prompt += `${promptAndDataAfrikaans[flashcardType].prompt}\n`;
      }
    } else if (language === 'Indonesian') {
      for (const [flashcardType, numQuestions] of Object.entries(distribution)) {
        prompt += `Buat ${numQuestions} kartu flash bertipe '${flashcardType}'.\n`;
        // @ts-ignore
        prompt += `${promptAndDataIndonesian[flashcardType].prompt}\n`;
      }
    } else if (language === 'Malay') {
      for (const [flashcardType, numQuestions] of Object.entries(distribution)) {
        prompt += `Jana ${numQuestions} kad imbas jenis '${flashcardType}'.\n`;
        // @ts-ignore
        prompt += `${promptAndDataMalay[flashcardType].prompt}\n`;
      }
    } else if (language === 'Czech') {
      for (const [flashcardType, numQuestions] of Object.entries(distribution)) {
        prompt += `Vygenerujte ${numQuestions} kartiček typu '${flashcardType}'.\n`;
        // @ts-ignore
        prompt += `${promptAndDataCzech[flashcardType].prompt}\n`;
      }
    } else if (language === 'Dutch') {
      for (const [flashcardType, numQuestions] of Object.entries(distribution)) {
        prompt += `Genereer ${numQuestions} flashcards van type '${flashcardType}'.\n`;
        // @ts-ignore
        prompt += `${promptAndDataDutch[flashcardType].prompt}\n`;
      }
    } else if (language === 'German') {
      for (const [flashcardType, numQuestions] of Object.entries(distribution)) {
        prompt += `Generieren Sie ${numQuestions} Karteikarten vom Typ '${flashcardType}'.\n`;
        // @ts-ignore
        prompt += `${promptAndDataGerman[flashcardType].prompt}\n`;
      }
    } else if (language === 'Spanish') {
      for (const [flashcardType, numQuestions] of Object.entries(distribution)) {
        prompt += `Genera ${numQuestions} tarjetas de tipo '${flashcardType}'.\n`;
        // @ts-ignore
        prompt += `${promptAndDataSpanish[flashcardType].prompt}\n`;
      }
    } else if (language === 'French') {
      for (const [flashcardType, numQuestions] of Object.entries(distribution)) {
        prompt += `Générez ${numQuestions} cartes de type '${flashcardType}'.\n`;
        // @ts-ignore
        prompt += `${promptAndDataFrench[flashcardType].prompt}\n`;
      }
    } else if (language === 'Italian') {
      for (const [flashcardType, numQuestions] of Object.entries(distribution)) {
        prompt += `Genera ${numQuestions} carte di tipo '${flashcardType}'.\n`;
        // @ts-ignore
        prompt += `${promptAndDataItalian[flashcardType].prompt}\n`;
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
  if (language === 'Afrikaans' && modeStr === 'interview' && isAIGenerate) {
    prompt += 'Maak seker om betekenisvolle, deurdagte en waarskynlike vrae en antwoorde te genereer wat spesifiek is vir my onderhoud en my werkrol.\n';
    prompt += 'Genereer \'n JSON-array in hierdie formaat: [{"flashcardType": <>, "question": <>, "answer": <>}], waar elke {"flashcardType": <>, "question": <>, "answer": <>} \'n flitskaart verteenwoordig.';
  }
  if (language === 'Afrikaans' && modeStr === 'interview' && !isAIGenerate) {
    prompt += 'Maak seker om betekenisvolle, deurdagte en waarskynlike vrae en antwoorde te genereer wat spesifiek is vir my onderhoud en my werkrol.\n';
    prompt += 'Dit is EKSTREEM BELANGRIK DAT JY NIE AFWYK van die inligting en konteks wat ek verskaf het van die PDF-lêer, tekslêer of beelde nie. BLY NET BY INHOUD VAN DIE PDF-LÊER, TEKSLÊER OF BEELDE. ';
    prompt += 'Genereer \'n JSON-array in hierdie formaat: [{"flashcardType": <>, "question": <>, "answer": <>}], waar elke {"flashcardType": <>, "question": <>, "answer": <>} \'n flitskaart verteenwoordig.';
  }
  if (language === 'Afrikaans' && modeStr === 'study' && isAIGenerate) {
    prompt += 'Maak seker om betekenisvolle, deurdagte en waarskynlike vrae en antwoorde te genereer wat spesifiek is vir die vakke wat ek studeer en my opvoedingsvlak.\n';
    prompt += 'Die voorbeelde wat ek gegee het vir die vrae en antwoorde is NET VOORBEELDE om die vraagstyle vir die vraagtipes te demonstreer, JY MOET NET vrae en antwoorde genereer wat DIREK VERWANT is aan die vakke wat ek studeer en my opvoedingsvlak.\n';
    prompt += 'Dit is uiters belangrik dat jy nie wegbeweeg van die vakke wat ek studeer nie.\n';
    prompt += 'Genereer \'n JSON-array in hierdie formaat: [{"flashcardType": <>, "question": <>, "answer": <>}], waar elke {"flashcardType": <>, "question": <>, "answer": <>} \'n flitskaart verteenwoordig.';
  }
  if (language === 'Indonesian' && modeStr === 'interview' && isAIGenerate) {
    prompt += 'Pastikan untuk menghasilkan pertanyaan dan jawaban yang bermakna, bijaksana, dan mungkin yang spesifik untuk wawancara saya dan peran pekerjaan saya.\n';
    prompt += 'Hasilkan array JSON kartu flash dalam format ini: [{"flashcardType": <>, "question": <>, "answer": <>}], di mana setiap {"flashcardType": <>, "question": <>, "answer": <>} mewakili sebuah kartu flash.';
  }
  if (language === 'Indonesian' && modeStr === 'interview' && !isAIGenerate) {
    prompt += 'Pastikan untuk menghasilkan pertanyaan dan jawaban yang bermakna, bijaksana, dan mungkin yang spesifik untuk wawancara saya dan peran pekerjaan saya.\n';
    prompt += 'Namun, SANGAT PENTING BAHWA ANDA TIDAK MENYIMPANG dari informasi dan konteks yang telah saya berikan dari file PDF, file teks, atau gambar. TETAP HANYA PADA KONTEN DARI FILE PDF, FILE TEKS, ATAU GAMBAR. ';
    prompt += 'Hasilkan array JSON kartu flash dalam format ini: [{"flashcardType": <>, "question": <>, "answer": <>}], di mana setiap {"flashcardType": <>, "question": <>, "answer": <>} mewakili sebuah kartu flash.';
  }
  if (language === 'Indonesian' && modeStr === 'study' && isAIGenerate) {
    prompt += 'Pastikan untuk menghasilkan pertanyaan dan jawaban yang bermakna, bijaksana, dan mungkin yang spesifik untuk mata pelajaran yang saya pelajari dan tingkat pendidikan saya.\n';
    prompt += 'Contoh yang telah saya berikan untuk pertanyaan dan jawaban HANYALAH CONTOH untuk mendemonstrasikan gaya pertanyaan untuk jenis pertanyaan, ANDA HARUS HANYA MENGHASILKAN pertanyaan dan jawaban yang LANGSUNG TERKAIT dengan mata pelajaran yang saya pelajari dan tingkat pendidikan saya.\n';
    prompt += 'Sangat penting bahwa Anda tidak menyimpang dari mata pelajaran yang saya pelajari.\n';
    prompt += 'Hasilkan array JSON kartu flash dalam format ini: [{"flashcardType": <>, "question": <>, "answer": <>}], di mana setiap {"flashcardType": <>, "question": <>, "answer": <>} mewakili sebuah kartu flash.';
  }
  if (language === 'Malay' && modeStr === 'interview' && isAIGenerate) {
    prompt += 'Pastikan untuk menjana soalan dan jawapan yang bermakna, bijaksana, dan mungkin yang spesifik untuk temuduga saya dan peranan pekerjaan saya.\n';
    prompt += 'Jana array JSON kad imbas dalam format ini: [{"flashcardType": <>, "question": <>, "answer": <>}], di mana setiap {"flashcardType": <>, "question": <>, "answer": <>} mewakili sebuah kad imbas.';
  }
  if (language === 'Malay' && modeStr === 'interview' && !isAIGenerate) {
    prompt += 'Pastikan untuk menjana soalan dan jawapan yang bermakna, bijaksana, dan mungkin yang spesifik untuk temuduga saya dan peranan pekerjaan saya.\n';
    prompt += 'Walau bagaimanapun, SANGAT PENTING BAHWA ANDA TIDAK MENYIMPANG dari maklumat dan konteks yang telah saya berikan dari fail PDF, fail teks, atau imej. TETAP HANYA PADA KANDUNGAN DARI FAIL PDF, FAIL TEKS, ATAU IMEJ. ';
    prompt += 'Jana array JSON kad imbas dalam format ini: [{"flashcardType": <>, "question": <>, "answer": <>}], di mana setiap {"flashcardType": <>, "question": <>, "answer": <>} mewakili sebuah kad imbas.';
  }
  if (language === 'Malay' && modeStr === 'study' && isAIGenerate) {
    prompt += 'Pastikan untuk menjana soalan dan jawapan yang bermakna, bijaksana, dan mungkin yang spesifik untuk subjek yang saya pelajari dan tahap pendidikan saya.\n';
    prompt += 'Contoh yang telah saya berikan untuk soalan dan jawapan HANYALAH CONTOH untuk menunjukkan gaya soalan untuk jenis soalan, ANDA HARUS HANYA MENJANA soalan dan jawapan yang LANGSUNG BERKAITAN dengan subjek yang saya pelajari dan tahap pendidikan saya.\n';
    prompt += 'Sangat penting bahawa anda tidak menyimpang dari subjek yang saya pelajari.\n';
    prompt += 'Jana array JSON kad imbas dalam format ini: [{"flashcardType": <>, "question": <>, "answer": <>}], di mana setiap {"flashcardType": <>, "question": <>, "answer": <>} mewakili sebuah kad imbas.';
  }
  if (language === 'Czech' && modeStr === 'interview' && isAIGenerate) {
    prompt += 'Ujistěte se, že generujete smysluplné, promyšlené a pravděpodobné otázky a odpovědi specifické pro můj pohovor a mou pracovní roli.\n';
    prompt += 'Vygenerujte pole JSON kartiček v tomto formátu: [{"flashcardType": <>, "question": <>, "answer": <>}], kde každá {"flashcardType": <>, "question": <>, "answer": <>} představuje kartičku.';
  }
  if (language === 'Czech' && modeStr === 'interview' && !isAIGenerate) {
    prompt += 'Ujistěte se, že generujete smysluplné, promyšlené a pravděpodobné otázky a odpovědi specifické pro můj pohovor a mou pracovní roli.\n';
    prompt += 'Je však NESMÍRNĚ DŮLEŽITÉ, ABYSTE NEODCHÝLILI od informací a kontextu, které jsem poskytl z PDF souboru, textového souboru nebo obrázků. DRŽTE SE POUZE OBSAHU Z PDF SOUBORU, TEXTOVÉHO SOUBORU NEBO OBRÁZKŮ. ';
    prompt += 'Vygenerujte pole JSON kartiček v tomto formátu: [{"flashcardType": <>, "question": <>, "answer": <>}], kde každá {"flashcardType": <>, "question": <>, "answer": <>} představuje kartičku.';
  }
  if (language === 'Czech' && modeStr === 'study' && isAIGenerate) {
    prompt += 'Ujistěte se, že generujete smysluplné, promyšlené a pravděpodobné otázky a odpovědi specifické pro předměty, které studuji, a moji úroveň vzdělání.\n';
    prompt += 'Příklady, které jsem poskytl pro otázky a odpovědi, JSOU POUZE PŘÍKLADY pro demonstraci stylů otázek pro typy otázek, MUSÍTE GENEROVAT POUZE otázky a odpovědi, které JSOU PŘÍMO SOUVISEJÍCÍ s předměty, které studuji, a moji úrovní vzdělání.\n';
    prompt += 'Je nesmírně důležité, abyste neodchýlili od předmětů, které studuji.\n';
    prompt += 'Vygenerujte pole JSON kartiček v tomto formátu: [{"flashcardType": <>, "question": <>, "answer": <>}], kde každá {"flashcardType": <>, "question": <>, "answer": <>} představuje kartičku.';
  }
  if (language === 'Dutch' && modeStr === 'interview' && isAIGenerate) {
    prompt += 'Zorg ervoor dat u betekenisvolle, doordachte en waarschijnlijke vragen en antwoorden genereert die specifiek zijn voor mijn sollicitatiegesprek en mijn functie.\n';
    prompt += 'Genereer een JSON-array van flashcards in dit formaat: [{"flashcardType": <>, "question": <>, "answer": <>}], waarbij elke {"flashcardType": <>, "question": <>, "answer": <>} een flashcard vertegenwoordigt.';
  }
  if (language === 'Dutch' && modeStr === 'interview' && !isAIGenerate) {
    prompt += 'Zorg ervoor dat u betekenisvolle, doordachte en waarschijnlijke vragen en antwoorden genereert die specifiek zijn voor mijn sollicitatiegesprek en mijn functie.\n';
    prompt += 'Het is EKSTREEM BELANGRIJK DAT U NIET AFWIJKT van de informatie en context die ik heb verstrekt van het PDF-bestand, tekstbestand of afbeeldingen. BLIJF ALLEEN BIJ INHOUD VAN HET PDF-BESTAND, TEKSTBESTAND OF AFBEELDINGEN. ';
    prompt += 'Genereer een JSON-array van flashcards in dit formaat: [{"flashcardType": <>, "question": <>, "answer": <>}], waarbij elke {"flashcardType": <>, "question": <>, "answer": <>} een flashcard vertegenwoordigt.';
  }
  if (language === 'Dutch' && modeStr === 'study' && isAIGenerate) {
    prompt += 'Zorg ervoor dat u betekenisvolle, doordachte en waarschijnlijke vragen en antwoorden genereert die specifiek zijn voor de vakken die ik studeer en mijn opleidingsniveau.\n';
    prompt += 'De voorbeelden die ik heb gegeven voor de vragen en antwoorden zijn ALLEEN VOORBEELDEN om de vraagstijlen voor de vraagtypen te demonstreren, U MOET ALLEEN vragen en antwoorden genereren die DIRECT VERBAND HOUDEN met de vakken die ik studeer en mijn opleidingsniveau.\n';
    prompt += 'Het is uiterst belangrijk dat u niet afwijkt van de vakken die ik studeer.\n';
    prompt += 'Genereer een JSON-array van flashcards in dit formaat: [{"flashcardType": <>, "question": <>, "answer": <>}], waarbij elke {"flashcardType": <>, "question": <>, "answer": <>} een flashcard vertegenwoordigt.';
  }
  if (language === 'German' && modeStr === 'interview' && isAIGenerate) {
    prompt += 'Stellen Sie sicher, dass Sie sinnvolle, durchdachte und wahrscheinliche Fragen und Antworten generieren, die spezifisch für mein Interview und meine Arbeitsrolle sind.\n';
    prompt += 'Generieren Sie ein JSON-Array von Karteikarten in diesem Format: [{"flashcardType": <>, "question": <>, "answer": <>}], wobei jede {"flashcardType": <>, "question": <>, "answer": <>} eine Karteikarte darstellt.';
  }
  if (language === 'German' && modeStr === 'interview' && !isAIGenerate) {
    prompt += 'Stellen Sie sicher, dass Sie sinnvolle, durchdachte und wahrscheinliche Fragen und Antworten generieren, die spezifisch für mein Interview und meine Arbeitsrolle sind.\n';
    prompt += 'Es ist ÄUSSERST WICHTIG, DASS SIE NICHT ABWEICHEN von den Informationen und dem Kontext, die ich aus der PDF-Datei, Textdatei oder Bildern bereitgestellt habe. BLEIBEN SIE NUR BEI INHALTEN AUS DER PDF-DATEI, TEXTDATEI ODER BILDERN. ';
    prompt += 'Generieren Sie ein JSON-Array von Karteikarten in diesem Format: [{"flashcardType": <>, "question": <>, "answer": <>}], wobei jede {"flashcardType": <>, "question": <>, "answer": <>} eine Karteikarte darstellt.';
  }
  if (language === 'German' && modeStr === 'study' && isAIGenerate) {
    prompt += 'Stellen Sie sicher, dass Sie sinnvolle, durchdachte und wahrscheinliche Fragen und Antworten generieren, die spezifisch für die Fächer sind, die ich studiere, und mein Bildungsniveau.\n';
    prompt += 'Die Beispiele, die ich für die Fragen und Antworten gegeben habe, sind NUR BEISPIELE, um die Fragestile für die Fragetypen zu demonstrieren, SIE MÜSSEN NUR Fragen und Antworten generieren, die DIREKT MIT den Fächern, die ich studiere, und meinem Bildungsniveau VERBUNDEN sind.\n';
    prompt += 'Es ist äußerst wichtig, dass Sie nicht von den Fächern abweichen, die ich studiere.\n';
    prompt += 'Generieren Sie ein JSON-Array von Karteikarten in diesem Format: [{"flashcardType": <>, "question": <>, "answer": <>}], wobei jede {"flashcardType": <>, "question": <>, "answer": <>} eine Karteikarte darstellt.';
  }
  if (language === 'Spanish' && modeStr === 'interview' && isAIGenerate) {
    prompt += 'Asegúrate de generar preguntas y respuestas significativas, reflexivas y probables específicas para mi entrevista y para mi rol de trabajo.\n';
    prompt += 'Genera un array JSON de tarjetas en este formato: [{"flashcardType": <>, "question": <>, "answer": <>}], donde cada {"flashcardType": <>, "question": <>, "answer": <>} representa una tarjeta.';
  }
  if (language === 'Spanish' && modeStr === 'interview' && !isAIGenerate) {
    prompt += 'Asegúrate de generar preguntas y respuestas significativas, reflexivas y probables específicas para mi entrevista y para mi rol de trabajo.\n';
    prompt += 'Sin embargo, es EXTREMADAMENTE CRUCIAL QUE NO TE DESVÍES de la información y el contexto que he proporcionado del archivo PDF, archivo de texto o imágenes. MANTENTE SOLO EN EL CONTENIDO DEL ARCHIVO PDF, ARCHIVO DE TEXTO O IMÁGENES. ';
    prompt += 'Genera un array JSON de tarjetas en este formato: [{"flashcardType": <>, "question": <>, "answer": <>}], donde cada {"flashcardType": <>, "question": <>, "answer": <>} representa una tarjeta.';
  }
  if (language === 'Spanish' && modeStr === 'study' && isAIGenerate) {
    prompt += 'Asegúrate de generar preguntas y respuestas significativas, reflexivas y probables específicas para las materias que estoy estudiando y mi nivel educativo.\n';
    prompt += 'Los ejemplos que he dado para las preguntas y respuestas son SOLO EJEMPLOS para demostrar los estilos de preguntas para los tipos de preguntas, DEBES SOLO GENERAR preguntas y respuestas que estén DIRECTAMENTE RELACIONADAS con las materias que estoy estudiando y mi nivel educativo.\n';
    prompt += 'Es extremadamente crucial que no te desvíes de las materias que estoy estudiando.\n';
    prompt += 'Genera un array JSON de tarjetas en este formato: [{"flashcardType": <>, "question": <>, "answer": <>}], donde cada {"flashcardType": <>, "question": <>, "answer": <>} representa una tarjeta.';
  }
  if (language === 'French' && modeStr === 'interview' && isAIGenerate) {
    prompt += 'Assurez-vous de générer des questions et réponses significatives, réfléchies et probables spécifiques à mon entretien et à mon rôle professionnel.\n';
    prompt += 'Générez un tableau JSON de cartes dans ce format : [{"flashcardType": <>, "question": <>, "answer": <>}], où chaque {"flashcardType": <>, "question": <>, "answer": <>} représente une carte.';
  }
  if (language === 'French' && modeStr === 'interview' && !isAIGenerate) {
    prompt += 'Assurez-vous de générer des questions et réponses significatives, réfléchies et probables spécifiques à mon entretien et à mon rôle professionnel.\n';
    prompt += 'Cependant, il est EXTRÊMEMENT CRUCIAL QUE VOUS NE VOUS ÉCARTIEZ PAS des informations et du contexte que j\'ai fournis du fichier PDF, du fichier texte ou des images. RESTEZ UNIQUEMENT SUR LE CONTENU DU FICHIER PDF, DU FICHIER TEXTE OU DES IMAGES. ';
    prompt += 'Générez un tableau JSON de cartes dans ce format : [{"flashcardType": <>, "question": <>, "answer": <>}], où chaque {"flashcardType": <>, "question": <>, "answer": <>} représente une carte.';
  }
  if (language === 'French' && modeStr === 'study' && isAIGenerate) {
    prompt += 'Assurez-vous de générer des questions et réponses significatives, réfléchies et probables spécifiques aux matières que j\'étudie et à mon niveau d\'éducation.\n';
    prompt += 'Les exemples que j\'ai donnés pour les questions et réponses sont UNIQUEMENT DES EXEMPLES pour démontrer les styles de questions pour les types de questions, VOUS DEVEZ UNIQUEMENT GÉNÉRER des questions et réponses qui sont DIRECTEMENT LIÉES aux matières que j\'étudie et à mon niveau d\'éducation.\n';
    prompt += 'Il est extrêmement crucial que vous ne vous écartiez pas des matières que j\'étudie.\n';
    prompt += 'Générez un tableau JSON de cartes dans ce format : [{"flashcardType": <>, "question": <>, "answer": <>}], où chaque {"flashcardType": <>, "question": <>, "answer": <>} représente une carte.';
  }
  if (language === 'Italian' && modeStr === 'interview' && isAIGenerate) {
    prompt += 'Assicurati di generare domande e risposte significative, riflessive e probabili specifiche per il mio colloquio e per il mio ruolo lavorativo.\n';
    prompt += 'Genera un array JSON di carte in questo formato: [{"flashcardType": <>, "question": <>, "answer": <>}], dove ogni {"flashcardType": <>, "question": <>, "answer": <>} rappresenta una carta.';
  }
  if (language === 'Italian' && modeStr === 'interview' && !isAIGenerate) {
    prompt += 'Assicurati di generare domande e risposte significative, riflessive e probabili specifiche per il mio colloquio e per il mio ruolo lavorativo.\n';
    prompt += 'Tuttavia, è ESTREMAMENTE CRUCIALE CHE NON TI DISCOSTI dalle informazioni e dal contesto che ho fornito dal file PDF, dal file di testo o dalle immagini. RESTA SOLO SUL CONTENUTO DEL FILE PDF, DEL FILE DI TESTO O DELLE IMMAGINI. ';
    prompt += 'Genera un array JSON di carte in questo formato: [{"flashcardType": <>, "question": <>, "answer": <>}], dove ogni {"flashcardType": <>, "question": <>, "answer": <>} rappresenta una carta.';
  }
  if (language === 'Italian' && modeStr === 'study' && isAIGenerate) {
    prompt += 'Assicurati di generare domande e risposte significative, riflessive e probabili specifiche per le materie che sto studiando e il mio livello di istruzione.\n';
    prompt += 'Gli esempi che ho fornito per le domande e le risposte sono SOLO ESEMPI per dimostrare gli stili di domande per i tipi di domande, DEVI SOLO GENERARE domande e risposte che sono DIRETTAMENTE CORRELATE alle materie che sto studiando e al mio livello di istruzione.\n';
    prompt += 'È estremamente cruciale che non ti discosti dalle materie che sto studiando.\n';
    prompt += 'Genera un array JSON di carte in questo formato: [{"flashcardType": <>, "question": <>, "answer": <>}], dove ogni {"flashcardType": <>, "question": <>, "answer": <>} rappresenta una carta.';
  }

  return prompt;
};
