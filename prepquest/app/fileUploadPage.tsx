import { View, StyleSheet, TouchableOpacity, Platform, ScrollView, KeyboardAvoidingView, Keyboard, Animated, Text, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';
import { FormHeaderIcons } from '../components/FormHeaderIcons';
import { RoundedContainer } from '@/components/RoundedContainer';
import { ActionButton } from '@/components/ActionButton';
import { TitleTextBar } from '@/components/TitleTextBar';
import { QuestionTextBar } from '@/components/QuestionTextBar';
import { NumberOfQuestions } from '@/components/NumberOfQuestions';
import { TypeOfInterviewQn } from '@/components/TypeOfInterviewQn';
import { KindsOfQuestions } from '@/components/KindsOfQuestions';
import { GreyOverlayBackground } from '@/components/GreyOverlayBackground';
import { GenericModal } from '@/components/GenericModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useState, useEffect, useRef } from 'react';
import Svg, { SvgProps, Path } from 'react-native-svg';
import { SmallCircleSelectButton } from '@/components/SmallCircleSelectButton';
import HelpIconOutline from '@/assets/icons/helpIconOutline.svg';
import { PrimaryButton } from '@/components/PrimaryButton';
import CloudUploadIcon from '@/assets/icons/cloudUploadIcon.svg';
import ImageIconFilled from '@/assets/icons/imageIconFilled.svg';
import CameraIconFilled from '@/assets/icons/cameraIconFilled.svg';
import DeleteModalIcon from '@/assets/icons/deleteModalIcon.svg';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import LottieView from 'lottie-react-native';
import { checkDeckNameExists, saveUserFileUploadFormEntry, getMostRecentFileUploadFormEntry } from '../db/decks';
import { Toast } from '../components/Toast';
import { useLanguage } from '@/contexts/LanguageContext';
import * as mammoth from 'mammoth';
import * as FileSystem from 'expo-file-system';
import JSZip from 'jszip';
// @ts-ignore
import * as XLSX from 'xlsx'; // Use CommonJS import for React Native compatibility

const HelpIconFilled: React.FC<SvgProps> = (props) => (
  <Svg 
    width={props.width || 31} 
    height={props.height || 31} 
    viewBox="0 0 31 31" 
    fill="none" 
    {...props}
  >
    <Path 
      fillRule="evenodd" 
      clipRule="evenodd" 
      d="M15.5 31C24.0604 31 31 24.0604 31 15.5C31 6.93959 24.0604 0 15.5 0C6.93959 0 0 6.93959 0 15.5C0 24.0604 6.93959 31 15.5 31ZM13.9019 18.4478C13.9019 18.5539 13.9879 18.6399 14.094 18.6399H16.1124C16.2185 18.6399 16.3045 18.5539 16.3045 18.4478C16.3093 17.9257 16.3694 17.4874 16.4848 17.1327C16.6051 16.7732 16.7879 16.4604 17.0332 16.1945C17.2833 15.9285 17.6031 15.6724 17.9927 15.4261C18.4353 15.1552 18.8176 14.8474 19.1399 14.5026C19.4622 14.1578 19.7099 13.7638 19.883 13.3205C20.061 12.8773 20.15 12.3749 20.15 11.8134C20.15 10.981 19.9528 10.2619 19.5584 9.6561C19.1688 9.04536 18.6228 8.57499 17.9206 8.245C17.2232 7.915 16.4151 7.75 15.4964 7.75C14.6547 7.75 13.8851 7.90761 13.1876 8.22283C12.495 8.53805 11.937 9.01088 11.5138 9.64132C11.3094 9.94918 11.1521 10.2934 11.0418 10.6741C10.8383 11.3764 11.4529 11.9907 12.1841 11.9907H12.2122C12.8883 11.9907 13.3794 11.4108 13.7504 10.8456C13.9524 10.5402 14.2049 10.3136 14.508 10.1659C14.8158 10.0132 15.1405 9.93684 15.482 9.93684C15.8523 9.93684 16.1866 10.0156 16.4848 10.1733C16.7879 10.3309 17.0284 10.5525 17.2063 10.8382C17.3843 11.1238 17.4733 11.4612 17.4733 11.8503C17.4733 12.1951 17.4059 12.5079 17.2713 12.7886C17.1366 13.0644 16.9514 13.3156 16.7157 13.5422C16.4848 13.7638 16.2227 13.9682 15.9293 14.1554C15.5012 14.4263 15.1381 14.7243 14.8398 15.0493C14.5416 15.3695 14.3107 15.7931 14.1472 16.3201C13.9885 16.8471 13.9067 17.5563 13.9019 18.4478ZM14.039 22.7772C14.3516 23.0924 14.7244 23.25 15.1573 23.25C15.4459 23.25 15.708 23.1786 15.9437 23.0357C16.1842 22.888 16.3766 22.691 16.5209 22.4447C16.67 22.1984 16.7446 21.9251 16.7446 21.6246C16.7446 21.1814 16.5858 20.8021 16.2684 20.4869C15.9557 20.1717 15.5854 20.0141 15.1573 20.0141C14.7244 20.0141 14.3516 20.1717 14.039 20.4869C13.7263 20.8021 13.57 21.1814 13.57 21.6246C13.57 22.0778 13.7263 22.4619 14.039 22.7772Z" 
      fill="#363538"
    />
  </Svg>
);

const FileUploadMainSection = ({ 
  pickImage, 
  takePhoto, 
  browseFiles, 
  isUploadSuccess, 
  uploadType,
  uploadedFileName,
}: { 
  pickImage: () => void; 
  takePhoto: () => void; 
  browseFiles: () => void;
  isUploadSuccess: boolean;
  uploadType: 'image' | 'file' | null;
  uploadedFileName: string;
  language: 'English' | 'Chinese';
}) => {
  const { language } = useLanguage();
  return (
    <View style={styles.fileUploadMainSection}>
      <View style={styles.uploadContent}>
        {isUploadSuccess ? (
          <LottieView
            source={require('../assets/animations/SuccessAnimation1_Tick.json')}
            autoPlay
            loop={true}
            style={styles.successAnimation}
          />
        ) : (
          <CloudUploadIcon width={110} height={110} />
        )}
        <Text style={[styles.supportedFilesText, { fontSize: 20 }]}>
          {isUploadSuccess 
            ? `${uploadType === 'image' ? (language === 'Chinese' ? '图片' : 'Image') : (language === 'Chinese' ? '文件' : 'File')} ${language === 'Chinese' ? '上传成功！' : 'uploaded successfully!'}\n${uploadType === 'file' ? (language === 'Chinese' ? `文件：${uploadedFileName}` : `File: ${uploadedFileName}`) : ''}`
            : language === 'Chinese' ? '支持的文件格式：Word文档，文本文件，PPT，Excel表格，PDF文件，Anki卡组' : '.docx, .txt, .pptx, .xlsx, .pdf, Anki Decks (.apkg), images'
          }
        </Text>
        <PrimaryButton 
          text={STRINGS.browseFiles[language]}
          onPress={browseFiles}
        />
      </View>
      <View style={styles.cornerIconsContainer}>
        <TouchableOpacity onPress={pickImage}>
          <ImageIconFilled width={30} height={30} />
        </TouchableOpacity>
        <TouchableOpacity onPress={takePhoto}>
          <CameraIconFilled width={40} height={40} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const getFormContentGap = (isInViewFlashcardsPage?: boolean) => {
  const { width, height } = Dimensions.get('window');

  // If we're in view flashcards page, use smaller gaps since we don't have the deck name field
  if (isInViewFlashcardsPage) {
    // iphone 16 pro max
    if (Platform.OS === 'ios' && height >= 940) {
      return 35;
    }
    
    // iphone 16 plus
    if (Platform.OS === 'ios' && height >= 920) {
      return 32;
    }

    // Pixel 9 Pro, Pixel 9 Pro XL 
    if (Platform.OS === 'android' && height >= 935) {
      return 50;
    }
    
    // Pixel 7, Pixel 8, Pixel 9
    if (Platform.OS === 'android' && height >= 900) {
      return 32;
    }
    
    // Default smaller gap for view flashcards page
    return Platform.OS === 'ios' ? 28 : 30;
  }

  // Original gap values for other pages (index, favorites, view decks in folder)
  // iphone 16 pro max
  if (Platform.OS === 'ios' && height >= 940) {
    return 25;
  }
  
  // iphone 16 plus
  if (Platform.OS === 'ios' && height >= 920) {
    return 20;
  }

   // Pixel 9 Pro, Pixel 9 Pro XL 
  if (Platform.OS === 'android' && height >= 935) {
    return 35;
  }
  
  // Pixel 7, Pixel 8, Pixel 9
  if (Platform.OS === 'android' && height >= 900) {
    return 20;
  }
  
  // iphone 16, iphone 16 plus, iphone SE, Pixel 7 Pro, 
  return Platform.OS === 'ios' ? 0 : 16;
};

const getFileUploadContentPaddingTop = () => {
  const { width, height } = Dimensions.get('window');

  // iphone se
  if (Platform.OS === 'ios' && height <= 670) {
    return 8;
  }

   /// iphone 16 pro max
  if (Platform.OS === 'ios' && height >= 940) {
    return 68;
  }
  
  // iphone 16 plus
  if (Platform.OS === 'ios' && height >= 920) {
    return 62;
  }
   // Pixel 9 Pro, Pixel 9 Pro XL 
   if (Platform.OS === 'android' && height >= 935) {
    return 45;
  }
  
  // Pixel 7, Pixel 8, Pixel 9
  if (Platform.OS === 'android' && height >= 900) {
    return 20;
  }
  
  // iphone 16, iphone 16 pro, Pixel 7 Pro, 
  return Platform.OS === 'ios' ? 34 : 16;
};

// Add language mappings for all user-facing strings
const STRINGS = {
  mandatory: { English: 'Mandatory', Chinese: '必填' },
  fileUpload: { English: 'File Upload', Chinese: '文件上传' },
  deckName: { English: ' Deck Name', Chinese: '卡组名称' },
  study: { English: 'Study', Chinese: '学习' },
  interview: { English: 'Interview', Chinese: '面试' },
  typeHere: { English: 'Type here!', Chinese: '请在此输入！' },
  educationLevel: { English: '1. Education Level?', Chinese: '1. 教育程度？' },
  educationLevelPH: { English: 'e.g. Freshman, Sophomore, etc', Chinese: '例如：大一，大二等' },
  educationLevelHelper: { English: 'What education level is your preparation for?', Chinese: '你正在为哪个教育阶段做准备？' },
  subjects: { English: '2. Subject(s)?', Chinese: '2. 科目？' },
  subjectsPH: { English: 'e.g. Computer Science, Math, Physics, etc.', Chinese: '例如：计算机，数学，物理等' },
  subjectsHelper: { English: 'What subject(s) would this deck be for?', Chinese: '这个卡组适用于哪些科目？' },
  jobRole: { English: '1. Job/Role?', Chinese: '1. 职位/角色？' },
  jobRolePH: { English: 'e.g. Frontend Developer, Private Equity Analyst, etc', Chinese: '例如：前端开发，私募分析师等' },
  jobRoleHelper: { English: 'What job or role are you preparing for?', Chinese: '你正在准备什么职位或角色？' },
  numQuestions: { English: '3. Number of questions:', Chinese: '3. 题目数量：' },
  uploadTitle: { English: 'Upload any file document to generate a new deck!', Chinese: '上传任意文件以生成新卡组！' },
  browseFiles: { English: 'Browse\nFiles', Chinese: '浏览\n文件' },
  supportedFiles: { English: 'Word documents, Text documents, Powerpoint files, Excel sheets, Pdf files, Anki Decks', Chinese: 'Word文档，文本文件，PPT，Excel表格，PDF文件，Anki卡组' },
  imageUploaded: { English: 'Image uploaded successfully!', Chinese: '图片上传成功！' },
  fileUploaded: { English: 'File uploaded successfully!', Chinese: '文件上传成功！' },
  fileLabel: { English: 'File:', Chinese: '文件：' },
  aiGenerate: { English: 'AI Generate new card content?', Chinese: 'AI生成新卡片内容？' },
  submit: { English: 'Submit', Chinese: '提交' },
  deckNameInUse: { English: 'Deckname already in use', Chinese: '卡组名称已被使用' },
  invalidSubjects: { English: "Invalid form input for 'Subject(s)'", Chinese: '“科目”输入无效' },
  fillAllAndUpload: { English: 'Fill up all mandatory fields\nand upload your file!', Chinese: '请填写所有必填项并上传文件！' },
  uploadBeforeSubmit: { English: 'Upload your file\nbefore submitting!', Chinese: '请先上传文件再提交！' },
  fillAll: { English: 'Fill up all\nmandatory fields!', Chinese: '请填写所有必填项！' },
  helpModal: { English: "Our team has identified 7 main types of cognitive questions based on Bloom's taxonomy to help with your learning. Visit our website to learn more.", Chinese: '我们的团队基于布鲁姆认知分类法，归纳了7种主要认知题型，帮助你的学习。访问我们的网站了解更多。' },
  aiHelpModal: { English: 'Ticking this option will let AI generate new, suggested cards outside the content of your upload.', Chinese: '勾选此项将让AI生成与上传内容无关的新建议卡片。' },
  useRecent: { English: ['Use most recent', 'form entry?'], Chinese: ['使用最近的', '表单记录？'] },
  greatSubmit: { English: 'Great! 😊 Do you want to go ahead and submit?', Chinese: '太棒了！😊 是否确认提交？' },
  leaveConfirm: { English: ['Are you sure you want', 'to leave? All your', 'progress will be lost'], Chinese: ['确定要离开吗？', '所有进度将丢失'] },
};

// Utility: Save base64 image to file
async function saveBase64ImageToFile(base64Data: string, fileName: string) {
  const fileUri = FileSystem.documentDirectory + `docxExtracted/${fileName}`;
  // Ensure directory exists
  const dirUri = FileSystem.documentDirectory + 'docxExtracted';
  const dirInfo = await FileSystem.getInfoAsync(dirUri);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dirUri, { intermediates: true });
  }
  await FileSystem.writeAsStringAsync(fileUri, base64Data, { encoding: FileSystem.EncodingType.Base64 });
  return fileUri;
}

// Extract text and images from docx
async function extractDocxTextAndImages(docxUri: string) {
  // Read file as base64
  const base64 = await FileSystem.readAsStringAsync(docxUri, { encoding: FileSystem.EncodingType.Base64 });
  // Convert base64 to ArrayBuffer
  const binary = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  // Use JSZip to unzip
  const zip = await JSZip.loadAsync(binary);
  // Extract images
  const imageFiles = Object.keys(zip.files).filter(name => name.startsWith('word/media/'));
  const savedImages: string[] = [];
  for (const imgName of imageFiles) {
    const ext = imgName.split('.').pop() || 'img';
    const imgData = await zip.files[imgName].async('base64');
    const savedUri = await saveBase64ImageToFile(imgData, `${Date.now()}_${imgName.replace('word/media/', '')}`);
    savedImages.push(savedUri);
  }
  // Extract text with mammoth
  const arrayBuffer = binary.buffer;
  const { value: text } = await mammoth.extractRawText({ arrayBuffer });
  return { text, images: savedImages };
}

// Extract text and images from pptx
async function extractPptxTextAndImages(pptxUri: string) {
  // Read file as base64
  const base64 = await FileSystem.readAsStringAsync(pptxUri, { encoding: FileSystem.EncodingType.Base64 });
  // Convert base64 to ArrayBuffer
  const binary = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  // Use JSZip to unzip
  const zip = await JSZip.loadAsync(binary);
  // Extract images
  const imageFiles = Object.keys(zip.files).filter(name => name.startsWith('ppt/media/'));
  const savedImages: string[] = [];
  for (const imgName of imageFiles) {
    const ext = imgName.split('.').pop() || 'img';
    const imgData = await zip.files[imgName].async('base64');
    const savedUri = await saveBase64ImageToFile(imgData, `${Date.now()}_${imgName.replace('ppt/media/', '')}`);
    savedImages.push(savedUri);
  }
  // Extract text from slide XMLs
  const slideFiles = Object.keys(zip.files).filter(name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'));
  let allText = '';
  for (const slideName of slideFiles) {
    const xml = await zip.files[slideName].async('string');
    // Extract text between <a:t>...</a:t> tags
    const matches = Array.from(xml.matchAll(/<a:t>(.*?)<\/a:t>/g));
    for (const m of matches) {
      allText += m[1] + '\n';
    }
  }
  return { text: allText, images: savedImages };
}

// Extract text and images from xlsx using only JSZip
async function extractXlsxTextAndImages(xlsxUri: string) {
  // Read file as base64
  const base64 = await FileSystem.readAsStringAsync(xlsxUri, { encoding: FileSystem.EncodingType.Base64 });
  // Convert base64 to ArrayBuffer
  const binary = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  // Use JSZip to unzip
  const zip = await JSZip.loadAsync(binary);
  // Extract images
  const imageFiles = Object.keys(zip.files).filter(name => name.startsWith('xl/media/'));
  const savedImages: string[] = [];
  for (const imgName of imageFiles) {
    const ext = imgName.split('.').pop() || 'img';
    const imgData = await zip.files[imgName].async('base64');
    const savedUri = await saveBase64ImageToFile(imgData, `${Date.now()}_${imgName.replace('xl/media/', '')}`);
    savedImages.push(savedUri);
  }
  // Extract shared strings (for cell value lookup)
  let sharedStrings: string[] = [];
  if (zip.files['xl/sharedStrings.xml']) {
    const sharedStringsXml = await zip.files['xl/sharedStrings.xml'].async('string');
    sharedStrings = Array.from(sharedStringsXml.matchAll(/<t[^>]*>(.*?)<\/t>/g)).map(m => m[1]);
  }
  // Extract text from all sheets
  const sheetFiles = Object.keys(zip.files).filter(name => name.startsWith('xl/worksheets/sheet') && name.endsWith('.xml'));
  let allText = '';
  for (const sheetName of sheetFiles) {
    const xml = await zip.files[sheetName].async('string');
    // Extract all rows
    const rows = xml.split(/<row[^>]*>/g).slice(1); // skip before first <row>
    for (const rowXml of rows) {
      // Extract all cells in the row
      const cells = Array.from(rowXml.matchAll(/<c[^>]*?t="([^"]*)"[^>]*?r="([^"]*)"[^>]*>([\s\S]*?)<\/c>/g));
      let rowValues: string[] = [];
      if (cells.length === 0) {
        // fallback: try to match all <v>...</v> in row
        const vMatches = Array.from(rowXml.matchAll(/<v>(.*?)<\/v>/g));
        rowValues = vMatches.map(m => m[1]);
      } else {
        for (const cell of cells) {
          const type = cell[1];
          const ref = cell[2];
          const cellContent = cell[3];
          // Get value
          const vMatch = cellContent.match(/<v>(.*?)<\/v>/);
          let value = vMatch ? vMatch[1] : '';
          if (type === 's' && sharedStrings.length > 0) {
            // Shared string lookup
            const idx = parseInt(value, 10);
            value = sharedStrings[idx] || '';
          }
          rowValues.push(value);
        }
      }
      if (rowValues.length > 0) {
        allText += rowValues.join('\t') + '\n';
      }
    }
  }
  return { text: allText, images: savedImages };
}

export default function FileUploadPage() {
  const { 
    mode, 
    deckId, 
    folderId, 
    isInFavoritesPage, 
    isInIndexPage,
    isInViewFlashcardsPage,
    isInViewDecksInFolderPage
  } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isMandatory, setIsMandatory] = useState(true);
  const [deckName, setDeckName] = useState('');
  const [studyMandatoryQuestion1, setStudyMandatoryQuestion1] = useState('');
  const [studyMandatoryQuestion2, setStudyMandatoryQuestion2] = useState('');
  const [interviewMandatoryQuestion1, setInterviewMandatoryQuestion1] = useState('');
  const [numberOfQuestions, setNumberOfQuestions] = useState(1);
  const [interviewType, setInterviewType] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isAIGenerate, setIsAIGenerate] = useState(false);
  const [isAIHelpModalOpen, setIsAIHelpModalOpen] = useState(false);
  const aiHelpOverlayOpacity = useRef(new Animated.Value(0)).current;
  const aiHelpModalOpacity = useRef(new Animated.Value(0)).current;
  const [isRecentFormModalOpen, setIsRecentFormModalOpen] = useState(false);
  const recentFormModalOpacity = useRef(new Animated.Value(0)).current;
  const [isUploadSuccess, setIsUploadSuccess] = useState(false);
  const [uploadType, setUploadType] = useState<'image' | 'file' | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const errorModalOpacity = useRef(new Animated.Value(0)).current;
  const successModalOpacity = useRef(new Animated.Value(0)).current;
  const [isBackConfirmationModalOpen, setIsBackConfirmationModalOpen] = useState(false);
  const backConfirmationModalOpacity = useRef(new Animated.Value(0)).current;
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const { language } = useLanguage();
  // Type language as 'English' | 'Chinese' for STRINGS indexing
  const lang: 'English' | 'Chinese' = language === 'Chinese' ? 'Chinese' : 'English';
  const [selectedFile, setSelectedFile] = useState<any>(null);

  const screenHeight = Dimensions.get('window').height;
  const bottomOffset = Platform.OS === 'ios' ? 
    (screenHeight < 670 ? 10 : (isReady ? insets.bottom : 34)) : 
    30;

  useEffect(() => {
    // Ensure the layout is ready after the first render
    const timer = setTimeout(() => setIsReady(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  useEffect(() => {
    if (isHelpModalOpen) {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0.5,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isHelpModalOpen]);

  useEffect(() => {
    if (isAIHelpModalOpen) {
      Animated.parallel([
        Animated.timing(aiHelpOverlayOpacity, {
          toValue: 0.5,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(aiHelpModalOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isAIHelpModalOpen]);

  useEffect(() => {
    // Set initial mode animation when component mounts
    fadeAnim.setValue(isMandatory ? 0 : 1);
  }, []);

  useEffect(() => {
    if (isRecentFormModalOpen) {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0.5,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(recentFormModalOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isRecentFormModalOpen]);

  useEffect(() => {
    if (isErrorModalOpen) {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0.5,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(errorModalOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isErrorModalOpen]);

  useEffect(() => {
    if (isSuccessModalOpen) {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0.5,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(successModalOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isSuccessModalOpen]);

  useEffect(() => {
    if (isBackConfirmationModalOpen) {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0.5,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backConfirmationModalOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isBackConfirmationModalOpen]);

  const handleBackPress = () => {
    setIsBackConfirmationModalOpen(true);
  };

  const handleClearAllPress = () => {
    // Reset mandatory fields only
    setDeckName('');
    setStudyMandatoryQuestion1('');
    setStudyMandatoryQuestion2('');
    setInterviewMandatoryQuestion1('');
    setInterviewType('');
    setNumberOfQuestions(1);
  };

  const handleToggle = (isRightSide: boolean) => {
    setIsMandatory(!isRightSide);
    
    Animated.timing(fadeAnim, {
      toValue: isRightSide ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const isStudyMandatoryFieldsFilled = () => {
    if (isInViewFlashcardsPage === 'true') {
      // When adding flashcards to existing deck, only need the study questions
      return studyMandatoryQuestion1.trim() !== '' && 
             studyMandatoryQuestion2.trim() !== '';
    }
    // When creating new deck, need deck name and study questions
    return deckName.trim() !== '' && 
           studyMandatoryQuestion1.trim() !== '' && 
           studyMandatoryQuestion2.trim() !== '';
  };

  const isInterviewMandatoryFieldsFilled = () => {
    if (isInViewFlashcardsPage === 'true') {
      // When adding flashcards to existing deck, only need the interview questions
      return interviewMandatoryQuestion1.trim() !== '' && 
             interviewType !== ''; 
    }
    // When creating new deck, need deck name and interview questions
    return deckName.trim() !== '' && 
           interviewMandatoryQuestion1.trim() !== '' && 
           interviewType !== '';
  };

  const isSubmitDisabled = () => {
    return false; // Always enabled now
  };

  const validateFormSubmission = async () => {
    const mandatoryFieldsFilled = mode === 'study' ? isStudyMandatoryFieldsFilled() : isInterviewMandatoryFieldsFilled();
    const hasFileUploaded = isUploadSuccess;

    // Check if deck name already exists (only for new deck creation, not when adding to existing deck)
    if (!isInViewFlashcardsPage && deckName.trim() !== '') {
      const deckNameExists = await checkDeckNameExists(deckName.trim());
      if (deckNameExists) {
        setShowToast(true);
        setToastMessage(STRINGS.deckNameInUse[lang]);
        return false;
      }
    }

    // Validate studyMandatoryQuestion2 format for study mode
    if (mode === 'study' && studyMandatoryQuestion2.trim() !== '') {
      const subjects = studyMandatoryQuestion2.split(/[\u002C\uFF0C\u060C\u201A\u201E\u2E41\u3001\uFE10\uFE11\uFE50\uFE51\uFF64]/).map(s => s.trim());
      
      // Check if there are any empty subjects after splitting and trimming
      const hasEmptySubjects = subjects.some(subject => subject === '');
      
      // Check if there are any subjects that are just whitespace or special characters
      const hasInvalidSubjects = subjects.some(subject => 
        subject === '' ||
        !/^[\p{L}\p{N} '\u2019]+$/u.test(subject) // Only letters, numbers, spaces, and apostrophes
      );
      
      if (hasEmptySubjects || hasInvalidSubjects) {
        setShowToast(true);
        setToastMessage(STRINGS.invalidSubjects[lang]);
        return false;
      }
    }

    // Error 1: mandatory fields not filled up and no file/image uploaded
    if (!mandatoryFieldsFilled && !hasFileUploaded) {
      setErrorMessage(STRINGS.fillAllAndUpload[lang]);
      setIsErrorModalOpen(true);
      return false;
    }

    // Error 2: mandatory fields filled up but file/image not uploaded
    if (mandatoryFieldsFilled && !hasFileUploaded) {
      setErrorMessage(STRINGS.uploadBeforeSubmit[lang]);
      setIsErrorModalOpen(true);
      return false;
    }

    // Error 3: mandatory fields not filled up but got file/image uploaded
    if (!mandatoryFieldsFilled && hasFileUploaded) {
      setErrorMessage(STRINGS.fillAll[lang]);
      setIsErrorModalOpen(true);
      return false;
    }

    // Success: all validations passed
    setIsSuccessModalOpen(true);
    return true;
  };

  const handleSubmit = async () => {
    await validateFormSubmission();
  };

  const handleDismissHelp = () => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsHelpModalOpen(false);
    });
  };

  const handleDismissAIHelp = () => {
    Animated.parallel([
      Animated.timing(aiHelpOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(aiHelpModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsAIHelpModalOpen(false);
    });
  };

  const handleDismissRecentForm = () => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(recentFormModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsRecentFormModalOpen(false);
    });
  };

  const handleDismissErrorModal = () => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(errorModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsErrorModalOpen(false);
    });
  };

  const handleDismissSuccessModal = () => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(successModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsSuccessModalOpen(false);
    });
  };

  const handleSuccessConfirm = async () => {
    // Save form submission to userFormEntries
    await saveUserFileUploadFormEntry({
      deckName,
      studyEducationLevel: studyMandatoryQuestion1,
      studySubjects: studyMandatoryQuestion2,
      numberOfQuestions,
      interviewJobRole: interviewMandatoryQuestion1,
      interviewType
    });

    // If PDF file was uploaded, send to Claude PDF Caption endpoint
    if (selectedFile && selectedFile.name && selectedFile.name.toLowerCase().endsWith('.pdf')) {
      try {
        const fileUri = selectedFile.uri;
        const fileName = selectedFile.name;
        const mimeType = selectedFile.mimeType || 'application/pdf';

        const formData = new FormData();
        // @ts-ignore: React Native FormData file object
        formData.append('file', {
          uri: fileUri,
          name: fileName,
          type: mimeType,
        });

        const SUPABASE_FUNCTION_URL = 'https://esbkgdyjvysatwdlkegc.functions.supabase.co/pdfCaptionClaude';
        const response = await fetch(SUPABASE_FUNCTION_URL, {
          method: 'POST',
          body: formData,
          headers: {
            // Let fetch set Content-Type
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzYmtnZHlqdnlzYXR3ZGxrZWdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MTUyNjEsImV4cCI6MjA2NzE5MTI2MX0.nBYgPc1DnmUSmLVGtAlfS84bxgp5k_ETLS0c4vl2mWc',
          },
        });
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Claude PDF Caption API error:', errorText);
        } else {
          const result = await response.json();
          const caption = result.caption;
          console.log('Claude PDF Caption:', caption);
        }
      } catch (err) {
        console.error('Error sending PDF to Claude PDF Caption function:', err);
      }
    }

    // Animate out first, then navigate
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(successModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsSuccessModalOpen(false);
      // Navigate after animation completes
      setTimeout(() => {
        router.back();
      }, 50);
    });
  };

  const handleDismissBackConfirmation = () => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(backConfirmationModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsBackConfirmationModalOpen(false);
    });
  };

  const handleUseMostRecentFormPress = () => {
    setIsRecentFormModalOpen(true);
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(recentFormModalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
  };
  

  const handleLoadMostRecentForm = async () => {
    const recent = await getMostRecentFileUploadFormEntry((mode as 'study' | 'interview'));
    if (recent) {
      setDeckName(recent.deckName || '');
      setStudyMandatoryQuestion1(recent.studyEducationLevel || '');
      setStudyMandatoryQuestion2(recent.studySubjects || '');
      setNumberOfQuestions(recent.numberOfQuestions || 1);
      setInterviewMandatoryQuestion1(recent.interviewJobRole || '');
      setInterviewType(recent.interviewType || '');
    }
    setIsRecentFormModalOpen(false);
  };

  const pickImage = async () => {
    try {
      // Request permission to access the photo library
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
        return;
      }

      // Launch the image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        console.log('Image selected:', selectedImage.uri);
        // Show success animation and update text permanently
        setUploadType('image');
        setIsUploadSuccess(true);
        setUploadedFileName(selectedImage.uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      alert('Error selecting image. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      // Request permission to access the camera
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        alert('Sorry, we need camera permissions to make this work!');
        return;
      }

      // Launch the camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const capturedImage = result.assets[0];
        console.log('Photo taken:', capturedImage.uri);
        // Show success animation and update text permanently
        setUploadType('image');
        setIsUploadSuccess(true);
        setUploadedFileName(capturedImage.uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      alert('Error taking photo. Please try again.');
    }
  };

  const browseFiles = async () => {
    try {
      // Launch the document picker
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*', // Allow all file types
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selected = result.assets[0];
        setSelectedFile(selected); // <-- Store the file object
        console.log('File selected:', {
          name: selected.name,
          size: selected.size,
          uri: selected.uri,
          mimeType: selected.mimeType,
        });
        // If docx, extract text and images
        if (selected.name.endsWith('.docx')) {
          try {
            const { text, images } = await extractDocxTextAndImages(selected.uri);
            console.log('Extracted text:', text);
            console.log('Extracted images:', images);
          } catch (err) {
            console.error('Docx extraction failed:', err);
          }
        }
        // If pptx, extract text and images
        else if (selected.name.endsWith('.pptx')) {
          try {
            const { text, images } = await extractPptxTextAndImages(selected.uri);
            console.log('Extracted PPTX text:', text);
            console.log('Extracted PPTX images:', images);
          } catch (err) {
            console.error('PPTX extraction failed:', err);
          }
        }
        // If xlsx, extract text and images
        else if (selected.name.endsWith('.xlsx')) {
          try {
            const { text, images } = await extractXlsxTextAndImages(selected.uri);
            console.log('Extracted XLSX text:', text);
            console.log('Extracted XLSX images:', images);
          } catch (err) {
            console.error('XLSX extraction failed:', err);
          }
        }
        // Show success animation and update text permanently
        setUploadType('file');
        setIsUploadSuccess(true);
        setUploadedFileName(selected.name);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      alert('Error selecting file. Please try again.');
    }
  };

  const mandatoryOpacity = fadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const fileUploadOpacity = fadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const getScrollContentPaddingTop = () => {
    if (isMandatory) return 16; // default padding for Mandatory state

    const height = Dimensions.get('window').height;
    if (Platform.OS === 'ios') {
      if (height > 900) return 55;
      if (height >= 800) return 23;
      return 16;
    } else {
      if (height > 930) return 35;
      if (height > 900) return 20;
      return 10;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <AntDesign name="arrowleft" size={32} color="black" />
        </TouchableOpacity>
      </View>
      
      <Animated.View
        style={[
          styles.headerIconsContainer,
          { opacity: mandatoryOpacity, display: isMandatory ? 'flex' : 'none' }
        ]}
      >
        <FormHeaderIcons 
          onClearAllPress={handleClearAllPress}
          onUseMostRecentFormPress={handleUseMostRecentFormPress}
        />
      </Animated.View>

      <View style={styles.mainContainer}>
        <View style={styles.toggleContainer}>
          <RoundedContainer 
            leftLabel={STRINGS.mandatory[lang]}
            rightLabel={STRINGS.fileUpload[lang]}
            onToggle={handleToggle}
          />
        </View>
        {isMandatory && (
        <ScrollView 
          style={[
            styles.scrollView,
            { marginBottom: keyboardHeight > 0 ? keyboardHeight : 50 + bottomOffset }
          ]}
           contentContainerStyle={[
             styles.scrollContent,
             { paddingTop: getScrollContentPaddingTop() }
           ]}
          showsVerticalScrollIndicator={false}
          bounces={true}
          overScrollMode="always"
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[
            { opacity: mandatoryOpacity, display: !isMandatory ? 'none' : 'flex' }
          ]}>
              <View style={[{gap: getFormContentGap(isInViewFlashcardsPage === 'true')}]}>
                {!isInViewFlashcardsPage && (<TitleTextBar
                  title={STRINGS.deckName[lang]}
                  highlightedWord={mode === 'study' ? STRINGS.study[lang] : STRINGS.interview[lang]}
                  placeholder={STRINGS.typeHere[lang]}
                  value={deckName}
                  onChangeText={setDeckName}
                />)
                }
                
                {mode === 'study' && (
                  <>
                    <QuestionTextBar
                      label={STRINGS.educationLevel[lang]}
                      placeholder={STRINGS.educationLevelPH[lang]}
                      value={studyMandatoryQuestion1}
                      onChangeText={setStudyMandatoryQuestion1}
                      helperText={STRINGS.educationLevelHelper[lang]}
                    />
                    <QuestionTextBar
                      label={STRINGS.subjects[lang]}
                      placeholder={STRINGS.subjectsPH[lang]}
                      value={studyMandatoryQuestion2}
                      onChangeText={setStudyMandatoryQuestion2}
                      helperText={STRINGS.subjectsHelper[lang]}
                    />
                  </>
                )}
                {mode !== 'study' && (
                  <>
                  <QuestionTextBar
                    label={STRINGS.jobRole[lang]}
                    placeholder={STRINGS.jobRolePH[lang]}
                    value={interviewMandatoryQuestion1}
                    onChangeText={setInterviewMandatoryQuestion1}
                    helperText={STRINGS.jobRoleHelper[lang]}
                    />
                  <TypeOfInterviewQn
                    value={interviewType}
                    onValueChange={setInterviewType}
                  />
                  </>
                )}
                <NumberOfQuestions
                  title={STRINGS.numQuestions[lang]}
                  value={numberOfQuestions}
                  onValueChange={setNumberOfQuestions}
                />
                <View style={styles.bottomSpacing} />
              </View>
           </Animated.View>
          </ScrollView>
            )}

          <Animated.View style={[
          styles.fileUploadContent,
          { opacity: fileUploadOpacity, display: !isMandatory ? 'flex' : 'none' }
          ]}>
          {Dimensions.get('window').height <= 670 && (
            <ScrollView 
              style={[
                { marginBottom: 50 + bottomOffset }
              ]}
              showsVerticalScrollIndicator={false}
              bounces={true}
              overScrollMode="always"
              keyboardShouldPersistTaps="handled"
            >
            <Text style={styles.fileUploadTitle}>
            {STRINGS.uploadTitle[lang]}
          </Text>
          <FileUploadMainSection pickImage={pickImage} takePhoto={takePhoto} browseFiles={browseFiles} isUploadSuccess={isUploadSuccess} uploadType={uploadType} uploadedFileName={uploadedFileName} language={lang} />
          <View style={styles.aiGenerateRow}>
            <SmallCircleSelectButton
              selected={isAIGenerate}
              onPress={() => setIsAIGenerate(!isAIGenerate)}
                />
            <Text style={styles.aiGenerateText}>{STRINGS.aiGenerate[lang]}</Text>
            <TouchableOpacity onPress={() => setIsAIHelpModalOpen(true)}>
              <HelpIconOutline width={24} height={24} />
            </TouchableOpacity>
              </View>
          <View style={styles.bottomSpacingFilUpload} />
            </ScrollView>
          )}
          
          <Text style={styles.fileUploadTitle}>
            {STRINGS.uploadTitle[lang]}
          </Text>
          <FileUploadMainSection pickImage={pickImage} takePhoto={takePhoto} browseFiles={browseFiles} isUploadSuccess={isUploadSuccess} uploadType={uploadType} uploadedFileName={uploadedFileName} language={lang} />
          <View style={styles.aiGenerateRow}>
            <SmallCircleSelectButton
              selected={isAIGenerate}
              onPress={() => setIsAIGenerate(!isAIGenerate)}
                />
            <Text style={styles.aiGenerateText}>{STRINGS.aiGenerate[lang]}</Text>
            <TouchableOpacity onPress={() => setIsAIHelpModalOpen(true)}>
              <HelpIconOutline width={24} height={24} />
            </TouchableOpacity>
              </View>
          </Animated.View>
      </View>

        <View style={[
          styles.buttonContainer,
          { bottom: bottomOffset }
        ]}>
          <ActionButton
            text={STRINGS.submit[lang]}
            backgroundColor={isSubmitDisabled() ? '#D5D4DD' : '#44B88A'}
            onPress={handleSubmit}
            disabled={isSubmitDisabled()}
            fullWidth
          />
      </View>

      <GreyOverlayBackground 
        visible={isHelpModalOpen || isAIHelpModalOpen || isRecentFormModalOpen || isErrorModalOpen || isSuccessModalOpen || isBackConfirmationModalOpen}
        opacity={isRecentFormModalOpen ? overlayOpacity : (isHelpModalOpen ? overlayOpacity : (isErrorModalOpen ? overlayOpacity : (isSuccessModalOpen ? overlayOpacity : (isBackConfirmationModalOpen ? overlayOpacity : aiHelpOverlayOpacity))))}
        onPress={isRecentFormModalOpen ? handleDismissRecentForm : (isHelpModalOpen ? handleDismissHelp : (isErrorModalOpen ? handleDismissErrorModal : (isSuccessModalOpen ? handleDismissSuccessModal : (isBackConfirmationModalOpen ? handleDismissBackConfirmation : handleDismissAIHelp))))}
      />
      <GenericModal
        visible={isHelpModalOpen}
        opacity={modalOpacity}
        text={STRINGS.helpModal[lang]}
        buttons='none'
        textStyle={{
          highlightWord: "our website",
          highlightColor: "#44B88A"
        }}
        Icon={HelpIconFilled}
      />
      <GenericModal
        visible={isAIHelpModalOpen}
        opacity={aiHelpModalOpacity}
        text={STRINGS.aiHelpModal[lang]}
        buttons='none'
        Icon={HelpIconFilled}
      />
      <GenericModal
        visible={isRecentFormModalOpen}
        opacity={recentFormModalOpacity}
        text={STRINGS.useRecent[lang]}
        buttons='double'
        onConfirm={handleLoadMostRecentForm}
        onCancel={handleDismissRecentForm}
      />
      <GenericModal
        visible={isErrorModalOpen}
        opacity={errorModalOpacity}
        text={errorMessage}
        buttons="none"
        Icon={DeleteModalIcon}
      />
      <GenericModal
        visible={isSuccessModalOpen}
        opacity={successModalOpacity}
        text={STRINGS.greatSubmit[lang]}
        buttons="double"
        onCancel={handleDismissSuccessModal}
        onConfirm={handleSuccessConfirm}
      />
      <GenericModal
        visible={isBackConfirmationModalOpen}
        opacity={backConfirmationModalOpacity}
        text={STRINGS.leaveConfirm[lang]}
        buttons="double"
        onCancel={handleDismissBackConfirmation}
        onConfirm={() => {
          // Animate out first, then navigate
          Animated.parallel([
            Animated.timing(overlayOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(backConfirmationModalOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            })
          ]).start(() => {
            setIsBackConfirmationModalOpen(false);
            // Navigate after animation completes
            setTimeout(() => {
              router.back();
            }, 50);
          });
        }}
        textMarginBottom={40}
        contentMarginTop={-10}
        Icon={DeleteModalIcon}
      />
      
      <Toast
        visible={showToast}
        message={toastMessage}
        onHide={() => setShowToast(false)}
        duration={3000}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mainContainer: {
    flex: 1,
    position: 'relative',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 0 : 20,
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: Dimensions.get('window').height < 670 ? 30 : 60,
    paddingBottom: 8,
  },
  backButton: {
    padding: 8,
  },
  headerIconsContainer: {
    position: 'absolute',
    top: Dimensions.get('window').height < 670 ? 30 : 60,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  toggleContainer: {
    marginTop: 4,
    paddingHorizontal: 16,
  },
  fileUploadContent: {
    paddingHorizontal: 16,
    gap: Platform.OS === 'ios' ? 0 : 16,
    marginTop: getFileUploadContentPaddingTop(),
  },
  buttonContainer: {
    position: 'absolute',
    paddingTop: Dimensions.get('window').height < 670 ? 10 : 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  bottomSpacing: {
    height: 20,
  },
  bottomSpacingFilUpload: {
    height: 100,
  },
  fileUploadTitle: {
    fontFamily: 'Satoshi-Bold',
    fontWeight: '700',
    fontSize: 24,
    textAlign: 'center',
    paddingHorizontal: 10,
    marginTop: Platform.OS === 'ios' ? 10 : 40,
  },
  fileUploadMainSection: {
    height: 370,
    width: '95%',
    alignSelf: 'center',
    borderWidth: 3,
    borderStyle: 'dashed',
    borderColor: '#4F41D8',
    marginTop: Platform.OS === 'ios' ? 20 : 10,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadContent: {
    height: '90%',
    alignItems: 'center',
    gap: 30,
    paddingTop: 10,
  },
  supportedFilesText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 16,
    color: '#000000',
    textAlign: 'center',
    maxWidth: '80%',
    paddingBottom: 10,
  },
  aiGenerateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginTop: Platform.OS === 'ios' ? 20 : 5,
    gap: 5,
  },
  aiGenerateText: {
    flex: 1,
    fontFamily: 'Satoshi-Medium',
    fontSize: 20,
    color: '#000000',
  },
  cornerIconsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 10,
    right: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  successAnimation: {
    width: 100,
    height: 100,
  },
}); 