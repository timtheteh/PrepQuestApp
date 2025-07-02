import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, ViewStyle, Pressable, Animated, Text, Dimensions, ScrollView, Image } from 'react-native';
import FlippableCardFrontFlipArrow from '@/assets/icons/flippableCardFrontFlipArrow.svg';
import FlippableCardBackFlipArrow from '@/assets/icons/flippableCardBackFlipArrow.svg';
import MicIcon from '@/assets/icons/micIcon.svg';
import Svg, { Path, Rect } from 'react-native-svg';
import { DrawableOptionsRow } from './DrawableOptionsRow';
import { useRouter, useFocusEffect } from 'expo-router';
import { getLastTypedText } from '../app/textInputModal';
import ImageIconFilled from '@/assets/icons/imageIconFilled.svg';
import CameraIconFilled from '@/assets/icons/cameraIconFilled.svg';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { Audio } from 'expo-av';

interface CardContent {
  content: React.ReactNode;
  type: 'camera' | 'marker' | 'mic' | 'text' | 'none';
  audioUri?: string; // Optional audio URI for mic content
}

interface FlippableCardProps {
  style?: ViewStyle;
  children?: React.ReactNode;
  frontContentTitle?: string;
  backContentTitle?: string;
  fadeOpacity?: Animated.Value;
  slideOpacity?: Animated.Value;
  cardType?: 'camera' | 'marker' | 'mic' | 'text' | 'none';
  onCardFlip?: () => void;
  onContentChange?: (hasContent: boolean) => void;
  onDrawingChange?: () => void;
}

export interface FlippableCardRef {
  resetToFront: () => void;
  resetContent: () => void;
  hasContent: () => boolean;
  getCurrentContent: () => CardContent | null;
  getFrontContent: () => CardContent | null;
  getBackContent: () => CardContent | null;
  clearFrontContent: () => void;
  clearBackContent: () => void;
  loadCachedContent: (frontContent: CardContent | null, backContent: CardContent | null) => void;
  setEraserMode: (isEraser: boolean) => void;
  hasDrawingContent: () => boolean;
  clearDrawingContent: () => void;
  saveDrawingAsContent: () => Promise<void>;
  loadDrawingContent: (content: CardContent | null) => void;
  getIsFlipped: () => boolean;
}

const FlippableCardFlipArrowSize = 30;

// Drawing Renderer Component for displaying saved drawings
const DrawingRenderer = ({ drawingData, style }: { drawingData: { path: string; strokeWidth: number }[]; style?: ViewStyle }) => {
  return (
    <View style={[styles.drawingCanvas, style]}>
      <Svg style={StyleSheet.absoluteFill}>
        {drawingData.map((pathData, index) => (
          <Path
            key={index}
            d={pathData.path}
            stroke="black"
            strokeWidth={pathData.strokeWidth}
            fill="none"
          />
        ))}
      </Svg>
    </View>
  );
};

// Simple Drawing Canvas Component
const DrawingCanvas = forwardRef<{ undo: () => void; redo: () => void; hasContent: () => boolean; clearContent: () => void; getDrawingData: () => { path: string; strokeWidth: number }[]; loadDrawingData: (data: { path: string; strokeWidth: number }[]) => void }, { 
  style?: ViewStyle; 
  isEraserMode: boolean;
  onEraserModeChange: (isEraser: boolean) => void;
  strokeWidth: number;
  onDrawingChange?: (paths: { path: string; strokeWidth: number }[]) => void;
  initialData?: { path: string; strokeWidth: number }[];
}>(({ style, isEraserMode, onEraserModeChange, strokeWidth, onDrawingChange, initialData }, ref) => {
  const [paths, setPaths] = useState<{ path: string; strokeWidth: number }[]>(initialData || []);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  
  // History management for undo/redo
  const [history, setHistory] = useState<{ path: string; strokeWidth: number }[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Helper function to save current state to history
  const saveToHistory = (newPaths: { path: string; strokeWidth: number }[]) => {
    setHistory(prev => {
      // Remove any future history if we're not at the end
      const trimmedHistory = prev.slice(0, historyIndex + 1);
      return [...trimmedHistory, newPaths];
    });
    setHistoryIndex(prev => prev + 1);
  };

  // Undo function
  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const newPaths = history[newIndex];
      setPaths(newPaths);
      setHasDrawn(newPaths.length > 0);
      
      // Notify parent of drawing change after undo
      onDrawingChange?.(newPaths);
    }
  };

  // Redo function
  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const newPaths = history[newIndex];
      setPaths(newPaths);
      setHasDrawn(newPaths.length > 0);
      
      // Notify parent of drawing change after redo
      onDrawingChange?.(newPaths);
    }
  };

  // Expose undo/redo functions via ref
  useImperativeHandle(ref, () => ({
    undo,
    redo,
    hasContent: () => {
      return paths.length > 0 && hasDrawn;
    },
    clearContent: () => {
      setPaths([]);
      setHasDrawn(false);
      setHistory([[]]);
      setHistoryIndex(0);
      
      // Notify parent of drawing change when clearing
      onDrawingChange?.([]);
    },
    getDrawingData: () => paths,
    loadDrawingData: (data: { path: string; strokeWidth: number }[]) => {
      setPaths(data);
      setHasDrawn(data.length > 0);
      
      // Initialize history with the loaded data
      setHistory([data]);
      setHistoryIndex(0);
      
      // Notify parent of drawing change when loading data
      onDrawingChange?.(data);
    }
  }));

  // Initialize history with empty state
  useEffect(() => {
    if (history.length === 0) {
      const initialPaths = initialData || [];
      setHistory([initialPaths]);
      setHistoryIndex(0);
      setHasDrawn(initialPaths.length > 0);
    }
  }, [initialData]);

  // Helper function to split a path at intersection points
  const splitPathAtIntersection = (pathData: { path: string; strokeWidth: number }, eraserX: number, eraserY: number, eraserRadius: number = 20) => {
    const path = pathData.path;
    const pathPoints = path.split(' ').filter(point => point !== 'M' && point !== 'L');
    const segments: string[] = [];
    let currentSegment = '';
    let hasIntersection = false;

    for (let i = 0; i < pathPoints.length; i += 2) {
      const x = parseFloat(pathPoints[i]);
      const y = parseFloat(pathPoints[i + 1]);
      const distance = Math.sqrt((x - eraserX) ** 2 + (y - eraserY) ** 2);

      if (distance < eraserRadius) {
        // This point is within eraser radius - mark intersection
        hasIntersection = true;
        if (currentSegment) {
          segments.push(currentSegment);
          currentSegment = '';
        }
      } else {
        // This point is outside eraser radius
        if (currentSegment === '') {
          currentSegment = `M ${x} ${y}`;
        } else {
          currentSegment += ` L ${x} ${y}`;
        }
      }
    }

    // Add the last segment if it exists
    if (currentSegment) {
      segments.push(currentSegment);
    }

    return { segments, hasIntersection };
  };

  const handleTouchStart = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    setIsDrawing(true);
    setHasDrawn(true);
    
    if (isEraserMode) {
      // Eraser mode - split paths at intersection points
      setPaths(prev => {
        const newPaths: { path: string; strokeWidth: number }[] = [];
        prev.forEach(pathData => {
          const { segments, hasIntersection } = splitPathAtIntersection(pathData, locationX, locationY);
          if (hasIntersection) {
            // Only keep segments that don't intersect
            segments.filter(segment => segment.length > 0).forEach(segment => {
              newPaths.push({ path: segment, strokeWidth: pathData.strokeWidth });
            });
          } else {
            // Keep the entire path if no intersection
            newPaths.push(pathData);
          }
        });
        return newPaths;
      });
    } else {
      // Drawing mode - start new path
      setCurrentPath(`M ${locationX} ${locationY}`);
    }
  };

  const handleTouchMove = (event: any) => {
    if (!isDrawing) return;
    const { locationX, locationY } = event.nativeEvent;
    
    if (isEraserMode) {
      // Eraser mode - continue erasing along the touch path
      setPaths(prev => {
        const newPaths: { path: string; strokeWidth: number }[] = [];
        prev.forEach(pathData => {
          const { segments, hasIntersection } = splitPathAtIntersection(pathData, locationX, locationY);
          if (hasIntersection) {
            // Only keep segments that don't intersect
            segments.filter(segment => segment.length > 0).forEach(segment => {
              newPaths.push({ path: segment, strokeWidth: pathData.strokeWidth });
            });
          } else {
            // Keep the entire path if no intersection
            newPaths.push(pathData);
          }
        });
        return newPaths;
      });
    } else {
      // Drawing mode - continue current path
      setCurrentPath(prev => `${prev} L ${locationX} ${locationY}`);
    }
  };

  const handleTouchEnd = () => {
    if (isDrawing) {
      if (!isEraserMode) {
        // Only add to paths if in drawing mode
        const newPaths = [...paths, { path: currentPath, strokeWidth }];
        setPaths(newPaths);
        saveToHistory(newPaths);
        setCurrentPath('');
        
        // Notify parent of drawing change with the updated paths
        onDrawingChange?.(newPaths);
      } else {
        // Save eraser action to history
        saveToHistory(paths);
        
        // Notify parent of drawing change with the updated paths after erasing
        onDrawingChange?.(paths);
      }
      setIsDrawing(false);
    }
  };

  // Function to toggle eraser mode (will be called from parent)
  const toggleEraserMode = () => {
    onEraserModeChange(!isEraserMode);
  };

  // Show overlay text when all paths are erased
  useEffect(() => {
    if (paths.length === 0 && hasDrawn && isEraserMode) {
      setHasDrawn(false);
    }
  }, [paths.length, hasDrawn, isEraserMode]);

  return (
    <View style={[styles.drawingCanvas, style]}>
      {!hasDrawn && (
        <View style={styles.overlayTextContainer}>
          <Text style={styles.overlayText}>Draw here!</Text>
        </View>
      )}
      <Svg style={StyleSheet.absoluteFill}>
        {paths.map((pathData, index) => (
          <Path
            key={index}
            d={pathData.path}
            stroke="black"
            strokeWidth={pathData.strokeWidth}
            fill="none"
          />
        ))}
        {currentPath && !isEraserMode && (
          <Path
            d={currentPath}
            stroke="black"
            strokeWidth={strokeWidth}
            fill="none"
          />
        )}
      </Svg>
      <Pressable
        style={StyleSheet.absoluteFill}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
    </View>
  );
});

// Add display name for DrawingCanvas
DrawingCanvas.displayName = 'DrawingCanvas';

export const FlippableCard = forwardRef<FlippableCardRef, FlippableCardProps>(({ 
  style, 
  children, 
  frontContentTitle,
  backContentTitle,
  fadeOpacity,
  slideOpacity,
  cardType = 'text',
  onCardFlip,
  onContentChange,
  onDrawingChange,
}, ref) => {
  const router = useRouter();
  const [isFlipped, setIsFlipped] = useState(false);
  const [frontContent, setFrontContent] = useState<CardContent | null>(null);
  const [backContent, setBackContent] = useState<CardContent | null>(null);
  const flipAnim = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  const [displayedCardType, setDisplayedCardType] = useState(cardType);
  const [isInitialRender, setIsInitialRender] = useState(true);
  const [isEraserMode, setIsEraserMode] = useState(false);
  const [markerSize, setMarkerSize] = useState(3); // Default stroke width
  const [paths, setPaths] = useState<{ path: string; strokeWidth: number }[]>([]);
  const [selectedTool, setSelectedTool] = useState<'marker' | 'eraser'>('marker');
  const [isFlipping, setIsFlipping] = useState(false);
  const [drawingCanvasKey, setDrawingCanvasKey] = useState(0);
  const [initialDrawingData, setInitialDrawingData] = useState<{ path: string; strokeWidth: number }[]>([]);
  const [isDrawingCanvasReady, setIsDrawingCanvasReady] = useState(false);
  const drawingCanvasRef = useRef<{ undo: () => void; redo: () => void; hasContent: () => boolean; clearContent: () => void; getDrawingData: () => { path: string; strokeWidth: number }[]; loadDrawingData: (data: { path: string; strokeWidth: number }[]) => void }>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioPosition, setAudioPosition] = useState(0);
  const audioSoundRef = useRef<Audio.Sound | null>(null);

  // Listen for focus events to check if text was typed in modal
  useFocusEffect(
    React.useCallback(() => {
      const typedText = getLastTypedText();
      if (typedText) {
        if (typedText === '__CLEAR_CONTENT__') {
          // Clear content based on current flip state
          if (isFlipped) {
            setBackContent(null);
          } else {
            setFrontContent(null);
          }
        } else {
          // Determine which side to update based on current flip state
          if (isFlipped) {
            setBackContent({
              content: <Text style={styles.contentText}>{typedText}</Text>,
              type: cardType
            });
          } else {
            setFrontContent({
              content: <Text style={styles.contentText}>{typedText}</Text>,
              type: cardType
            });
          }
        }
      }
    }, [isFlipped, cardType])
  );

  // Watch for cardType changes and animate overlay
  useEffect(() => {
    if (isInitialRender) {
      setIsInitialRender(false);
      setDisplayedCardType(cardType);
      return;
    }

    if (displayedCardType !== cardType) {
      // Fade out current content
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        // Update displayed card type to show new content
        setDisplayedCardType(cardType);
        
        // If switching to marker type, automatically select marker tool
        if (cardType === 'marker') {
          setSelectedTool('marker');
          setIsEraserMode(false);
        }
        
        // If switching to mic type, request microphone permissions
        if (cardType === 'mic') {
          (async () => {
            const { status } = await Audio.requestPermissionsAsync();
            if (status !== 'granted') {
              console.log('Microphone permission not granted');
            }
          })();
        }
        
        // If switching to marker type, check if there's existing marker content to load
        if (cardType === 'marker') {
          // Hide the drawing canvas during transition
          setIsDrawingCanvasReady(false);
          
          // Force re-render of drawing canvas by incrementing key to ensure clean state
          setDrawingCanvasKey(prev => prev + 1);
          
          // Get the current content to pass as initial data
          const currentContent = isFlipped ? backContent : frontContent;
          if (currentContent && currentContent.type === 'marker' && React.isValidElement(currentContent.content)) {
            // Extract drawing data from the DrawingRenderer component
            const drawingRenderer = currentContent.content as React.ReactElement<{ drawingData: { path: string; strokeWidth: number }[] }>;
            if (drawingRenderer.props.drawingData) {
              // Store the drawing data to pass as initial data to the new canvas
              setInitialDrawingData(drawingRenderer.props.drawingData);
            } else {
              setInitialDrawingData([]);
            }
          } else {
            setInitialDrawingData([]);
          }
          
          // Show the drawing canvas after a brief delay to ensure it's ready
          setTimeout(() => {
            setIsDrawingCanvasReady(true);
          }, 50);
        } else {
          // Hide canvas when not in marker mode
          setIsDrawingCanvasReady(false);
        }
        
        // Fade in new content
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [cardType, displayedCardType, isInitialRender]);

  // Expose reset function to parent component
  useImperativeHandle(ref, () => ({
    resetToFront: () => {
      setIsFlipped(false);
      setIsFlipping(false);
      // Instantly set the animation value without triggering the animation
      flipAnim.setValue(0);
      // Fade in overlay content
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    },
    resetContent: () => {
      setFrontContent(null);
      setBackContent(null);
    },
    hasContent: () => {
      return frontContent !== null && backContent !== null;
    },
    getCurrentContent: () => {
      return isFlipped ? backContent : frontContent;
    },
    getFrontContent: () => {
      console.log('getFrontContent called, frontContent:', frontContent);
      return frontContent;
    },
    getBackContent: () => {
      console.log('getBackContent called, backContent:', backContent);
      return backContent;
    },
    clearFrontContent: () => {
      setFrontContent(null);
    },
    clearBackContent: () => {
      setBackContent(null);
    },
    loadCachedContent: (frontContent: CardContent | null, backContent: CardContent | null) => {
      setFrontContent(frontContent);
      setBackContent(backContent);
    },
    setEraserMode: (isEraser: boolean) => {
      setIsEraserMode(isEraser);
    },
    hasDrawingContent: () => {
      return drawingCanvasRef.current?.hasContent() || false;
    },
    clearDrawingContent: () => {
      drawingCanvasRef.current?.clearContent();
      
      // Clear the front/back content based on current flip state
      if (isFlipped) {
        setBackContent(null);
      } else {
        setFrontContent(null);
      }
      
      // Notify parent of drawing change with empty paths
      const drawingContent = {
        content: <DrawingRenderer drawingData={[]} style={styles.drawingCanvasOverlay} />,
        type: 'marker' as const
      };
      
      if (isFlipped) {
        setBackContent(null);
      } else {
        setFrontContent(null);
      }
    },
    saveDrawingAsContent: () => {
      return new Promise<void>((resolve) => {
        if (drawingCanvasRef.current?.hasContent()) {
          console.log('saving drawing as content');
          // Get the drawing data from the canvas
          const drawingData = drawingCanvasRef.current.getDrawingData();
          const drawingContent = {
            content: <DrawingRenderer drawingData={drawingData} style={styles.drawingCanvasOverlay} />,
            type: 'marker' as const
          };
          
          console.log('Setting content for side:', isFlipped ? 'back' : 'front');
          
          if (isFlipped) {
            setBackContent(drawingContent);
          } else {
            setFrontContent(drawingContent);
          }
          // Resolve after state update
          setTimeout(resolve, 200);
        } else {
          resolve();
        }
      });
    },
    loadDrawingContent: (content: CardContent | null) => {
      if (content && content.type === 'marker' && React.isValidElement(content.content)) {
        // Extract drawing data from the DrawingRenderer component
        const drawingRenderer = content.content as React.ReactElement<{ drawingData: { path: string; strokeWidth: number }[] }>;
        if (drawingRenderer.props.drawingData) {
          drawingCanvasRef.current?.loadDrawingData(drawingRenderer.props.drawingData);
        }
      }
    },
    getIsFlipped: () => {
      return isFlipped;
    }
  }));

  const handlePress = () => {
    const toValue = isFlipped ? 0 : 1;
    
    // Set flipping state to true
    setIsFlipping(true);
    
    // Fade out overlay area before flip
    Animated.timing(overlayOpacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      // Start flip animation
      Animated.timing(flipAnim, {
        toValue,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // Set flip state first
      setIsFlipped(!isFlipped);
        
        // Call the callback to notify parent component
        onCardFlip?.();
        
        // Fade in overlay area after flip is complete
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          // Set flipping state to false after all animations complete
          setIsFlipping(false);
        });
      });
    });
  };

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const frontAnimatedStyle = {
    transform: [{ rotateY: frontInterpolate }],
  };

  const backAnimatedStyle = {
    transform: [{ rotateY: backInterpolate }],
  };

  const getOverlayText = () => {
    const currentContent = isFlipped ? backContent : frontContent;
    const hasAudioRecording = currentContent?.type === 'mic' && currentContent?.audioUri;
    
    // If there's content, use the content type instead of displayedCardType
    const effectiveCardType = currentContent ? currentContent.type : displayedCardType;
    
    switch (effectiveCardType) {
      case 'text':
        return "Type here!";
      case 'mic':
        return hasAudioRecording ? "Great! Click the replay\nbutton below to play\nthe recorded audio!" : "Press & hold mic \nbutton to record";
      case 'marker':
        return "Draw here!";
      case 'camera':
        return "Click here to take\nyour picture or\nupload from library!";
      case 'none':
        return "Choose your manual \noption above";
      default:
        return "Choose your manual \noption above";
    }
  };

  const handleOverlayPress = () => {
    if (cardType === 'text') {
        // Extract existing text from the current side
        let existingText = '';
        if (isFlipped && backContent) {
            // If we're on the back side and there's content, extract the text
            if (React.isValidElement(backContent.content) && backContent.content.type === Text) {
                const textElement = backContent.content as React.ReactElement<{ children?: string }>;
                existingText = textElement.props.children || '';
            }
        } else if (!isFlipped && frontContent) {
            // If we're on the front side and there's content, extract the text
            if (React.isValidElement(frontContent.content) && frontContent.content.type === Text) {
                const textElement = frontContent.content as React.ReactElement<{ children?: string }>;
                existingText = textElement.props.children || '';
            }
        }
        
        // Navigate to modal with existing text as parameter
        router.push({
            pathname: '/textInputModal',
            params: { existingText }
        });
    }
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
        
        // Create the image content
        const imageContent = (
          <Image 
            source={{ uri: selectedImage.uri }} 
            style={styles.selectedImage}
            resizeMode="contain"
          />
        );

        // Update the appropriate side based on current flip state
        if (isFlipped) {
          setBackContent({
            content: imageContent,
            type: 'camera'
          });
        } else {
          setFrontContent({
            content: imageContent,
            type: 'camera'
          });
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      alert('Error selecting image. Please try again.');
    }
  };

  const clearImage = () => {
    // Clear the content based on current flip state
    if (isFlipped) {
      setBackContent(null);
    } else {
      setFrontContent(null);
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
        
        // Create the image content
        const imageContent = (
          <Image 
            source={{ uri: capturedImage.uri }} 
            style={styles.selectedImage}
            resizeMode="contain"
          />
        );

        // Update the appropriate side based on current flip state
        if (isFlipped) {
          setBackContent({
            content: imageContent,
            type: 'camera'
          });
        } else {
          setFrontContent({
            content: imageContent,
            type: 'camera'
          });
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      alert('Error taking photo. Please try again.');
    }
  };

  // Handler for marker size changes
  const handleMarkerSizeChange = (value: number) => {
    // Convert slider value (0-1) to stroke width (1-10)
    const newSize = Math.max(1, Math.round(value * 10));
    setMarkerSize(newSize);
  };

  // Handler for undo action
  const handleUndo = () => {
    drawingCanvasRef.current?.undo();
  };

  // Handler for redo action
  const handleRedo = () => {
    drawingCanvasRef.current?.redo();
  };

  // Handler for clear action
  const handleClear = () => {
    // Clear the drawing canvas
    drawingCanvasRef.current?.clearContent();
    
    // Clear the front/back content based on current flip state
    if (isFlipped) {
      setBackContent(null);
    } else {
      setFrontContent(null);
    }
    
    // Notify parent of drawing change with empty paths
    const drawingContent = {
      content: <DrawingRenderer drawingData={[]} style={styles.drawingCanvasOverlay} />,
      type: 'marker' as const
    };
    
    if (isFlipped) {
      setBackContent(null);
    } else {
      setFrontContent(null);
    }
  };

  // Start recording function
  const startRecording = async () => {
    try {
      console.log('Requesting permissions..');
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('Starting recording..');
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  // Stop recording function
  const stopRecording = async () => {
    if (!recording) return;

    console.log('Stopping recording..');
    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecordingUri(uri);
    setRecording(null);
    console.log('Recording stopped and stored at', uri);

    // Store the audio recording as content
    if (uri) {
      console.log('uri', uri);
      const audioContent = {
        content: null, // We'll use the transparent overlay area for mic content
        type: 'mic' as const,
        audioUri: uri // Store the audio URI in the content
      };

      if (isFlipped) {
        setBackContent(audioContent);
      } else {
        setFrontContent(audioContent);
      }
    }
  };

  // Play or pause audio logic
  async function handleAudioButtonPress(audioUri: string | null) {
    try {
      if (!audioUri) return;
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: true,
      });
      if (!isAudioPlaying) {
        // Play or resume
        if (audioSoundRef.current) {
          await audioSoundRef.current.playAsync();
        } else {
          const { sound } = await Audio.Sound.createAsync({ uri: audioUri }, { positionMillis: audioPosition });
          audioSoundRef.current = sound;
          sound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
              setIsAudioPlaying(false);
              setAudioPosition(0);
              audioSoundRef.current = null;
            }
          });
          await sound.playAsync();
        }
        setIsAudioPlaying(true);
      } else {
        // Pause
        if (audioSoundRef.current) {
          const status = await audioSoundRef.current.getStatusAsync();
          if (status.isLoaded) {
            setAudioPosition(status.positionMillis || 0);
            await audioSoundRef.current.pauseAsync();
          }
        }
        setIsAudioPlaying(false);
      }
    } catch (e) {
      setIsAudioPlaying(false);
      console.log('Audio playback error:', e);
    }
  }

  // Clean up audio on unmount or card flip
  useEffect(() => {
    return () => {
      if (audioSoundRef.current) {
        audioSoundRef.current.unloadAsync();
        audioSoundRef.current = null;
      }
    };
  }, [isFlipped]);

  useEffect(() => {
    if (onContentChange) {
      onContentChange(frontContent !== null && backContent !== null);
    }
  }, [frontContent, backContent, onContentChange]);

  return (
    <Animated.View style={[
      styles.container, 
      style, 
      { 
        opacity: fadeOpacity,
        transform: slideOpacity ? [
          {
            translateX: slideOpacity.interpolate({
              inputRange: [-1, 0, 1],
              outputRange: [-Dimensions.get('window').width, 0, Dimensions.get('window').width],
            })
          }
        ] : []
      }
    ]}>
        <Animated.View style={[styles.transparentOverlayArea, { opacity: overlayOpacity }]} >
            {((!isFlipped && !frontContent) || (isFlipped && !backContent) || (cardType === 'marker' && ((!isFlipped && frontContent?.type === 'marker') || (isFlipped && backContent?.type === 'marker'))) || ((!isFlipped && frontContent?.type === 'mic') || (isFlipped && backContent?.type === 'mic'))) && !isFlipping && (
            <>
                <View style={styles.topBar2}>
                {cardType === 'marker' && <DrawableOptionsRow 
                  onMarkerPress={() => {
                    setIsEraserMode(false);
                    setSelectedTool('marker');
                  }}
                  onEraserPress={() => {
                    setIsEraserMode(true);
                    setSelectedTool('eraser');
                  }}
                  onResizeValueChange={handleMarkerSizeChange}
                  onUndoPress={handleUndo}
                  onForwarddoPress={handleRedo}
                  onClearPress={handleClear}
                  currentMarkerSize={markerSize / 10}
                  selectedTool={selectedTool}
                />}
                </View>
                
                {cardType === 'marker' && isDrawingCanvasReady && (
                  <DrawingCanvas 
                    key={drawingCanvasKey}
                    style={styles.drawingCanvasOverlay} 
                    isEraserMode={isEraserMode} 
                    onEraserModeChange={setIsEraserMode} 
                    strokeWidth={markerSize} 
                    ref={drawingCanvasRef}
                    onDrawingChange={(newPaths) => {
                      // Save drawing as content whenever drawing changes
                      console.log('drawing changed')
                      
                      if (newPaths.length === 0) {
                        // If no paths, clear the content
                        if (isFlipped) {
                          setBackContent(null);
                        } else {
                          setFrontContent(null);
                        }
                      } else {
                        // If there are paths, create drawing content
                        const drawingContent = {
                          content: <DrawingRenderer drawingData={newPaths} style={styles.drawingCanvasOverlay} />,
                          type: 'marker' as const
                        };
                        
                        if (isFlipped) {
                          setBackContent(drawingContent);
                        } else {
                          setFrontContent(drawingContent);
                        }
                      }
                      
                      // Notify parent of drawing change for cache saving
                      onDrawingChange?.();
                    }}
                    initialData={initialDrawingData}
                  />
                )}
                
                {cardType !== 'marker' && (
                <Pressable onPress={handleOverlayPress} style={styles.overlayPressable}>
                    <View style={styles.container}>
                    {(() => {
                      const currentContent = isFlipped ? backContent : frontContent;
                      const effectiveCardType = currentContent ? currentContent.type : displayedCardType;
                      return effectiveCardType === 'none' && (
                        <View style={styles.animationContainerTop}>
                          <LottieView
                            source={require('../assets/animations/DownArrowAnimation.json')}
                            autoPlay
                            loop
                            style={[styles.downArrowAnimation, { transform: [{ rotate: '180deg' }] }]}
                          />
                        </View>
                      );
                    })()}
                    <View style={[styles.overlayTextContainer, { transform: (() => {
                      const currentContent = isFlipped ? backContent : frontContent;
                      const effectiveCardType = currentContent ? currentContent.type : displayedCardType;
                      return effectiveCardType === 'mic' || effectiveCardType === 'camera' ? [{ translateY: -30 }] : [{ translateY: 0 }];
                    })() }]}>
                    {isRecording && (() => {
                      const currentContent = isFlipped ? backContent : frontContent;
                      const effectiveCardType = currentContent ? currentContent.type : displayedCardType;
                      return effectiveCardType === 'mic';
                    })() ? (
                      <LottieView
                        source={require('../assets/animations/SoundWaveLoadingAnimation.json')}
                        autoPlay
                        loop
                        style={styles.soundWaveAnimation}
                      />
                    ) : (
                      <Text style={styles.overlayText}>{getOverlayText()}</Text>
                    )}
                    </View>
                    {(() => {
                      const currentContent = isFlipped ? backContent : frontContent;
                      const hasAudioRecording = currentContent?.type === 'mic' && currentContent?.audioUri;
                      const effectiveCardType = currentContent ? currentContent.type : displayedCardType;
                      return (effectiveCardType === 'camera' || (effectiveCardType === 'mic' && (hasAudioRecording || !isRecording))) && !isRecording && (
                        <View style={styles.animationContainer}>
                          <LottieView
                            source={require('../assets/animations/DownArrowAnimation.json')}
                            autoPlay
                            loop
                            style={styles.downArrowAnimation}
                          />
                        </View>
                      );
                    })()}
                    {(() => {
                      const currentContent = isFlipped ? backContent : frontContent;
                      const effectiveCardType = currentContent ? currentContent.type : displayedCardType;
                      return effectiveCardType === 'mic' && (
                        <View style={styles.micButtonsContainer}>
                            <Pressable 
                            style={({ pressed }) => [
                                styles.micButton,
                                pressed && styles.buttonPressed,
                                isRecording && styles.recordingButton
                            ]}
                            onPressIn={startRecording}
                            onPressOut={stopRecording}
                            >
                            <MicIcon width={36} height={36} />
                            </Pressable>
                            <Pressable 
                            style={({ pressed }) => [
                                styles.replayButton,
                                pressed && styles.buttonPressed
                            ]}
                            onPress={() => {
                                const currentContent = isFlipped ? backContent : frontContent;
                                const audioUri = currentContent?.type === 'mic' ? currentContent.audioUri ?? null : null;
                                handleAudioButtonPress(audioUri);
                            }}
                            >
                            {!isAudioPlaying ? (
                              <Svg width={36} height={36} viewBox="0 0 24 24" fill="none">
                                <Path 
                                  d="M8 5v14l11-7z" 
                                  fill="black"
                                  transform="rotate(0 12 12)"
                                />
                              </Svg>
                            ) : (
                              <Svg width={36} height={36} viewBox="0 0 24 24" fill="none">
                                <Rect x={7} y={5} width={4} height={14} rx={1.5} fill="black" />
                                <Rect x={13} y={5} width={4} height={14} rx={1.5} fill="black" />
                              </Svg>
                            )}
                            </Pressable>
                        </View>
                      );
                    })()}
                    {(() => {
                      const currentContent = isFlipped ? backContent : frontContent;
                      const effectiveCardType = currentContent ? currentContent.type : displayedCardType;
                      return effectiveCardType === 'camera' && (
                        <View style={styles.micButtonsContainer}>
                            <Pressable 
                            style={({ pressed }) => [
                                styles.micButton,
                                pressed && styles.buttonPressed
                            ]}
                            onPress={pickImage}
                            >
                            <ImageIconFilled width={30} height={30} />
                            </Pressable>
                            <Pressable 
                            style={({ pressed }) => [
                                styles.replayButton,
                                pressed && styles.buttonPressed
                            ]}
                            onPress={takePhoto}
                            >
                            <CameraIconFilled width={38} height={38} />
                            </Pressable>
                        </View>
                      );
                    })()}
                    </View>
                </Pressable>)}
            </>
            )}
            {(!isFlipped && frontContent && !(cardType === 'marker' && frontContent.type === 'marker') && !(frontContent.type === 'mic') && !isFlipping) && (
                <View style={styles.mainContent}>
                    <ScrollView 
                        style={[
                            styles.scrollContainer,
                            frontContent.type === 'camera' && styles.cameraScrollContainer
                        ]}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        bounces={true}
                    >
                        <Pressable onPress={handleOverlayPress} style={styles.overlayPressable}>
                        {frontContent.content || children}
                        </Pressable>
                    </ScrollView>
                    {frontContent.type === 'camera' && (
                        <View style={[styles.cameraButtonsContainer, { paddingHorizontal: frontContent.content ? '15%' : '25%' }]}>
                            <Pressable 
                            style={({ pressed }) => [
                                styles.micButton,
                                pressed && styles.buttonPressed
                            ]}
                            onPress={pickImage}
                            >
                            <ImageIconFilled width={30} height={30} />
                            </Pressable>
                            <Pressable 
                            style={({ pressed }) => [
                                styles.replayButton,
                                pressed && styles.buttonPressed
                            ]}
                            onPress={takePhoto}
                            >
                            <CameraIconFilled width={38} height={38} />
                            </Pressable>
                                {frontContent.content && (
                                    <Pressable 
                                    style={({ pressed }) => [
                                        styles.micButton,
                                        pressed && styles.buttonPressed
                                    ]}
                                    onPress={clearImage}
                                    >
                                    <Ionicons name={'trash'} size={30} color={'#FF3B30'} />
                                    </Pressable>
                            )}
                        </View>
                    )}
                </View>
            )}
            {(isFlipped && backContent && !(cardType === 'marker' && backContent.type === 'marker') && !(backContent.type === 'mic') && !isFlipping) && (
            <View style={styles.mainContent}>
                <ScrollView 
                    style={[
                        styles.scrollContainer,
                        backContent.type === 'camera' && styles.cameraScrollContainer
                    ]}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    bounces={true}
                >
                    <Pressable onPress={handleOverlayPress} style={styles.overlayPressable}>
                    {backContent.content || children}
                    </Pressable>
                </ScrollView>
                {backContent.type === 'camera' && (
                    <View style={styles.cameraButtonsContainer}>
                        <Pressable 
                        style={({ pressed }) => [
                            styles.micButton,
                            pressed && styles.buttonPressed
                        ]}
                        onPress={pickImage}
                        >
                        <ImageIconFilled width={30} height={30} />
                        </Pressable>
                        <Pressable 
                        style={({ pressed }) => [
                            styles.replayButton,
                            pressed && styles.buttonPressed
                        ]}
                        onPress={takePhoto}
                        >
                        <CameraIconFilled width={38} height={38} />
                        </Pressable>
                        {backContent.content && (
                            <Pressable 
                            style={({ pressed }) => [
                                styles.micButton,
                                pressed && styles.buttonPressed
                            ]}
                            onPress={clearImage}
                            >
                            <Ionicons name={'trash'} size={30} color={'#FF3B30'} />
                            </Pressable>
                        )}
                    </View>
                )}
            </View>
            )}             
        </Animated.View>
      <View style={styles.transparentOverlayArea2} ></View>
      
      <Pressable onPress={handlePress} style={styles.pressableContainer}>
      <View style={styles.cardContainer}>
        <Animated.View style={[styles.card, styles.frontCard, frontAnimatedStyle]}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            {frontContentTitle && (
              <Text style={styles.titleText}>{frontContentTitle}</Text>
            )}
          </View>
            {/* Empty Area Do not touch this*/}
            <View style={styles.mainContent} />
          
          {/* Bottom Bar */}
          <View style={styles.bottomBar}>
              <FlippableCardFrontFlipArrow width={FlippableCardFlipArrowSize} height={FlippableCardFlipArrowSize} style={styles.frontFlipArrow}/>
          </View>
        </Animated.View>
        
        <Animated.View style={[styles.card, styles.backCard, backAnimatedStyle]}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            {backContentTitle && (
              <Text style={styles.titleText}>{backContentTitle}</Text>
            )}
          </View>
          
          {/* Main Content */}
            <View style={styles.mainContent} />
          
          {/* Bottom Bar */}
          <View style={styles.bottomBar}>
              <FlippableCardBackFlipArrow width={FlippableCardFlipArrowSize} height={FlippableCardFlipArrowSize} style={styles.backFlipArrow}/>
          </View>
        </Animated.View>
      </View>
    </Pressable>
    </Animated.View>
  );
});

// Add display name for FlippableCard
FlippableCard.displayName = 'FlippableCard';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlayPressable: {
    flex: 1,
    justifyContent: 'center',
  },
  cardContainer: {
    flex: 1,
    position: 'relative',
  },
  card: {
    flex: 1,
    borderRadius: 30,
    overflow: 'hidden',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backfaceVisibility: 'hidden',
  },
  frontCard: {
    backgroundColor: '#F8F8F8',
  },
  backCard: {
    backgroundColor: '#F8F8F8',
  },
  topBar: {
    height: 45,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    backgroundColor: '#F8F8F8',
  },
  topBar2: {
    height: 70,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    paddingHorizontal: 10,
    paddingTop: 5,
    backgroundColor: 'transparent',
  },
  titleText: {
    fontFamily: 'Satoshi-Variable',
    fontWeight: '600',
    fontSize: 24,
    color: '#000',
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  contentText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 24,
    color: '#000',
    lineHeight: 24,
    textAlign: 'center',
  },
  bottomBar: {
    height: 45,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 10,
    backgroundColor: '#F8F8F8',
  },
  frontFlipArrow: {
    marginRight: '1%',
    marginBottom: Dimensions.get('window').height < 670 ? -8 : Dimensions.get('window').height > 920 ? '3%' : Dimensions.get('window').height > 900 ? '2%' : '0.5%',
    marginLeft: '85%',
  },
  backFlipArrow: {
    marginRight: '1%',
    marginBottom: Dimensions.get('window').height < 670 ? -8 : Dimensions.get('window').height > 920 ? '3%' : Dimensions.get('window').height > 900 ? '2%' : '0.5%',
    marginLeft: '85%',
  },
  transparentOverlayArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    height: '90%',
    backgroundColor: 'transparent',
  },
  transparentOverlayArea2: {
    position: 'absolute',
    top: '90%',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1001,
    height: '10%',
    width: '85%',
    backgroundColor: 'transparent',
  },
  pressableContainer: {
    flex: 1,
  },
  overlayTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  overlayText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 28,
    color: '#D5D4DD',
    textAlign: 'center',
  },
  micButtonsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: '25%',
  },
  micButton: {
    width: 60,
    height: 60,
    backgroundColor: 'white',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  replayButton: {
    width: 60,
    height: 60,
    backgroundColor: 'white',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonPressed: {
    backgroundColor: '#E8E8E8',
    transform: [{ scale: 0.95 }],
  },
  scrollContainer: {
    flex: 1,
    marginTop: 45,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignContent: 'center',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
  },
  cameraScrollContainer: {
    marginTop: 45,
    marginBottom: 60,
  },
  cameraButtonsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    backgroundColor: 'transparent',
  },
  drawingCanvas: {
    flex: 1,
  },
  drawingCanvasOverlay: {
    flex: 1,
    borderTopWidth: 3,
    borderTopColor: '#D5D4DD',
    borderBottomWidth: 3,
    borderBottomColor: '#D5D4DD',
  },
  animationContainer: {
    position: 'absolute',
    bottom: '25%',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  animationContainerTop: {
    position: 'absolute',
    top: Dimensions.get('window').height < 670 ? '15%' : '25%',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  downArrowAnimation: {
    width: 50,
    height: 50,
  },
  audioContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 24,
    color: '#000',
    marginRight: 10,
  },
  playButton: {
    width: 40,
    height: 40,
    backgroundColor: '#000',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingButton: {
    backgroundColor: '#FF3B30',
  },
  soundWaveAnimation: {
    width: 250,
    height: 250,
    alignSelf: 'center',
  },
}); 