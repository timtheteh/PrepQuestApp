import { StyleSheet, TouchableOpacity, View, SafeAreaView, Platform, Text, Animated, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Feather } from '@expo/vector-icons';
import { HeaderIconButtons } from '@/components/HeaderIconButtons';
import { RoundedContainer } from '@/components/RoundedContainer';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { Title } from '@/components/Title';
import { Card } from '@/components/Card';
import { ActionButtonsRow } from '@/components/ActionButtonsRow';
import { useState, useRef } from 'react';

const NAVBAR_HEIGHT = 80; // Height of the bottom navbar
const BOTTOM_SPACING = 40; // Required spacing from navbar
const SHIFT_DISTANCE = 40; // Distance to shift content down

const cardDesigns = [
  {
    background: require('@/assets/images/deckCover1.png'),
    pressed: require('@/assets/images/deckCover1Pressed.png'),
  },
  {
    background: require('@/assets/images/deckCover2.png'),
    pressed: require('@/assets/images/deckCover2Pressed.png'),
  },
  {
    background: require('@/assets/images/deckCover3.png'),
    pressed: require('@/assets/images/deckCover3Pressed.png'),
  },
  {
    background: require('@/assets/images/deckCover4.png'),
    pressed: require('@/assets/images/deckCover4Pressed.png'),
  },
];

export default function DecksScreen() {
  const [isInterviewMode, setIsInterviewMode] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const shiftAnim = useRef(new Animated.Value(0)).current;
  const marginAnim = useRef(new Animated.Value(BOTTOM_SPACING)).current;
  const actionRowOpacity = useRef(new Animated.Value(0)).current;
  const selectTextAnim = useRef(new Animated.Value(0)).current;

  const selectUnselectedDuration = 200;

  const handleToggle = (isRightSide: boolean) => {
    setIsInterviewMode(isRightSide);
    
    // If in select mode, reset it first
    if (isSelectMode) {
      setIsSelectMode(false);
    }
    
    Animated.parallel([
      // Mode toggle animation
      Animated.timing(fadeAnim, {
        toValue: isRightSide ? 1 : 0,
        duration: selectUnselectedDuration,
        useNativeDriver: true,
      }),
      // Cancel animations (only run if was in select mode)
      ...(isSelectMode ? [
        Animated.timing(shiftAnim, {
          toValue: 0,
          duration: selectUnselectedDuration,
          useNativeDriver: true,
        }),
        Animated.timing(marginAnim, {
          toValue: BOTTOM_SPACING,
          duration: selectUnselectedDuration,
          useNativeDriver: false,
        }),
        Animated.timing(actionRowOpacity, {
          toValue: 0,
          duration: selectUnselectedDuration,
          useNativeDriver: true,
        }),
        Animated.timing(selectTextAnim, {
          toValue: 0,
          duration: selectUnselectedDuration,
          useNativeDriver: true,
        })
      ] : [])
    ]).start();
  };

  const handleSelect = () => {
    setIsSelectMode(true);
    
    Animated.parallel([
      Animated.timing(shiftAnim, {
        toValue: SHIFT_DISTANCE,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(marginAnim, {
        toValue: BOTTOM_SPACING + SHIFT_DISTANCE,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(actionRowOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(selectTextAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  };

  const handleCancel = () => {
    Animated.parallel([
      Animated.timing(shiftAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(marginAnim, {
        toValue: BOTTOM_SPACING,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(actionRowOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(selectTextAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsSelectMode(false);
    });
  };

  const handleActionIconPress = (index: number) => {
    switch (index) {
      case 0: // Share
        console.log('Folder pressed');
        break;
      case 1: // Trash
        console.log('Trash pressed');
        break;
    }
  };

  const handleFabPress = () => {
    console.log('FAB pressed');
  };

  const studyOpacity = fadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const interviewOpacity = fadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const selectOpacity = selectTextAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const selectAllOpacity = selectTextAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const renderCards = () => {
    return Array(8).fill(null).map((_, index) => {
      const design = cardDesigns[index % 4];
      const style = index === 0 ? styles.firstCard : styles.card;
      
      return (
        <Card
          key={index}
          style={style}
          backgroundImage={design.background}
          pressedBackgroundImage={design.pressed}
        />
      );
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <View style={styles.navBar}>
          <TouchableOpacity 
            style={styles.menuButton}
            activeOpacity={0.5}
          >
            <Feather name="menu" size={30} color="black" />
          </TouchableOpacity>
          
          <HeaderIconButtons />
        </View>
        
        <Animated.View style={[
          styles.mainContentWrapper,
          { marginBottom: marginAnim }
        ]}>
          <View style={styles.content}>
            <RoundedContainer 
              leftLabel="Study"
              rightLabel="Interview"
              onToggle={handleToggle}
            />

            <Animated.View style={[
              styles.actionButtonsRow,
              {
                opacity: actionRowOpacity,
                transform: [{
                  translateY: actionRowOpacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0]
                  })
                }]
              }
            ]}>
              <ActionButtonsRow
                iconNames={['folder', 'trash']}
                onCancel={handleCancel}
                onIconPress={handleActionIconPress}
                iconColors={['black', '#FF3B30']}
              />
            </Animated.View>

            <Animated.View 
              style={[
                styles.shiftableContent,
                { transform: [{ translateY: shiftAnim }] }
              ]}
            >
              <View style={styles.titleRow}>
                <View style={styles.titleContainer}>
                  <Title style={[styles.titleAbsolute]} animatedOpacity={studyOpacity}>
                    My Study Decks
                  </Title>
                  <Title style={[styles.titleAbsolute]} animatedOpacity={interviewOpacity}>
                    My Interview Decks
                  </Title>
                </View>
                <TouchableOpacity 
                  onPress={isSelectMode ? undefined : handleSelect}
                  style={styles.selectButtonContainer}
                >
                  <Animated.Text style={[
                    styles.selectButton,
                    styles.selectButtonAbsolute,
                    { opacity: selectOpacity }
                  ]}>
                    Select
                  </Animated.Text>
                  <Animated.Text style={[
                    styles.selectButton,
                    styles.selectButtonAbsolute,
                    { opacity: selectAllOpacity }
                  ]}>
                    Select All
                  </Animated.Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.scrollWrapper}>
                <ScrollView 
                  style={styles.scrollContainer}
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  {renderCards()}
                </ScrollView>
              </View>
            </Animated.View>
          </View>
        </Animated.View>

        <FloatingActionButton
          style={styles.fab}
          onPress={handleFabPress}
        >
          <Feather name="plus" size={38} color="white" />
        </FloatingActionButton>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 70 : 16,
  },
  mainContentWrapper: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  menuButton: {
    padding: 0,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  titleContainer: {
    position: 'relative',
    height: Platform.OS === 'android' ? 32 : 24,
  },
  titleAbsolute: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  selectButtonContainer: {
    position: 'relative',
    width: 85, // Adjust based on your text width
    height: 24, // Adjust based on your text height
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  selectButton: {
    fontSize: 20,
    fontFamily: 'Satoshi-Medium',
    color: '#44B88A',
  },
  selectButtonAbsolute: {
    position: 'absolute',
  },
  scrollWrapper: {
    flex: 1,
    marginTop: 10
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 0,
    alignItems: 'center',
  },
  firstCard: {
    marginTop: 5,
  },
  card: {
    marginTop: 26,
  },
  shiftableContent: {
    flex: 1,
    marginTop: 16,
  },
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 20 : 15,
    right: 16,
  },
  actionButtonsRow: {
    position: 'absolute',
    top: 62,
    right: 0,
    left: 0,
    zIndex: 1,
  },
});
