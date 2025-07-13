import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated, ScrollView, Platform, Image, Share } from 'react-native';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import LightSwitchBody from '@/assets/icons/lightSwitchBody.svg';
import DarkSwitchBody from '@/assets/icons/darkSwitchBody.svg';
import LightSwitch from '@/assets/icons/lightSwitch.svg';
import DarkSwitch from '@/assets/icons/darkSwitch.svg';
import GrapeStem from '@/assets/icons/grapeStem.svg';
import { useLanguage } from '@/contexts/LanguageContext';
import DeckCreationLoadingPage, { DeckCreationStatusPage } from '../DeckCreationLoadingPage';
// import DeckCreationLoadingPage from '../DeckCreationLoadingPage';

export default function AccountScreen() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [upgradePressed, setUpgradePressed] = useState(false);
  const [deckSettingsPressed, setDeckSettingsPressed] = useState(false);
  const [appSettingsPressed, setAppSettingsPressed] = useState(false);
  const [tcPressed, setTCPressed] = useState(false);
  const [sharePressed, setSharePressed] = useState(false);
  const [ratePressed, setRatePressed] = useState(false);
  const [websitePressed, setWebsitePressed] = useState(false);
  const [showLoadingPage, setShowLoadingPage] = useState(false);
  // const [loadingProgress, setLoadingProgress] = useState(0.4);
  // const [loadingCurrent, setLoadingCurrent] = useState(12);
  // const [loadingTotal, setLoadingTotal] = useState(48);
  const screenHeight = Dimensions.get('window').height;
  const topPadding = screenHeight < 670 ? 40 : 60;
  const router = useRouter();
  const { language, reloadLanguage } = useLanguage();

  // For button animation
  const buttonAnim = useRef(new Animated.Value(1)).current; // 1 = right (light), 0 = left (dark)
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();
    }
  }, [isFocused]);

  useFocusEffect(
    React.useCallback(() => {
      reloadLanguage();
    }, [])
  );

  const handleToggle = () => {
    setIsDarkMode((prev) => !prev);
    Animated.timing(buttonAnim, {
      toValue: isDarkMode ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleDeckSettingsPress = () => {
    router.push('/deckSettings');
  };

  const handleAppSettingsPress = () => {
    router.push('/appSettings');
  };

  const handleSignOut = () => {
    setShowLoadingPage(true);
    // // Optionally, you can update loading values here for testing
    // setLoadingProgress(0.4);
    // setLoadingCurrent(12);
    // setLoadingTotal(48);
  };

  // Button position: 0 (left) for dark, 1 (right) for light
  const translateX = buttonAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 26], // adjust for your SVG size
  });

  // Cross-fade opacities
  const lightBodyOpacity = buttonAnim;
  const darkBodyOpacity = buttonAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const lightButtonOpacity = buttonAnim;
  const darkButtonOpacity = buttonAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  const getDeckSettingsTopPosition = () => {
    const { width, height } = Dimensions.get('window');

    // iphone 16 pro max
    if (Platform.OS === 'ios' && height >= 940) {
      return height * 0.16;
    }
    
    // iphone 16 plus
    if (Platform.OS === 'ios' && height >= 920) {
      return height * 0.15;
    }

    // iphone se
    if (Platform.OS === 'ios' && height < 670) {
      return -5;
    }

    // Pixel 9 Pro, Pixel 9 Pro XL 
    if (Platform.OS === 'android' && height >= 935) {
      return height * 0.17;
    }
    
    // Pixel 7, Pixel 8, Pixel 9
    if (Platform.OS === 'android' && height >= 900) {
      return height * 0.15;
    }
    
    // iphone 16, iphone 16 plus, Pixel 7 Pro, 
    return height * 0.13;
  }

  const getDeckSettingsLeftPosition = () => {
    const { width, height } = Dimensions.get('window');
  
    // iphone 16 plus, iphone 16 pro max
    if (Platform.OS === 'ios' && height >= 920) {
      return width * 0.33;
    }

    // iphone se
    if (Platform.OS === 'ios' && height < 670) {
      return width * 0.31;
    }

    // Pixel 9 Pro, Pixel 9 Pro XL 
    if (Platform.OS === 'android' && height >= 935) {
      return width * 0.33;
    }
    
    // Pixel 7, Pixel 8, Pixel 9
    if (Platform.OS === 'android' && height >= 900) {
      return width * 0.33;
    }
    
    // iphone 16, iphone 16 plus, Pixel 7 Pro, 
    return width * 0.33;
  }

  const getAppSettingsTopPosition = () => {
    const { width, height } = Dimensions.get('window');

    // iphone 16 pro max
    if (Platform.OS === 'ios' && height >= 940) {
      return height * 0.34;
    }
    
    // iphone 16 plus
    if (Platform.OS === 'ios' && height >= 920) {
      return height * 0.34;
    }

    // iphone se
    if (Platform.OS === 'ios' && height < 670) {
      return height * 0.27;
    }

    // Pixel 9 Pro, Pixel 9 Pro XL 
    if (Platform.OS === 'android' && height >= 935) {
      return height * 0.35;
    }
    
    // Pixel 7, Pixel 8, Pixel 9
    if (Platform.OS === 'android' && height >= 900) {
      return height * 0.33;
    }
    
    // iphone 16, iphone 16 plus, Pixel 7 Pro, 
    return height * 0.32;
  }

  const getAppSettingsLeftPosition = () => {
    const { width, height } = Dimensions.get('window');
  
    // iphone 16 plus, iphone 16 pro max
    if (Platform.OS === 'ios' && height >= 920) {
      return width * 0.335;
    }

    // iphone se
    if (Platform.OS === 'ios' && height < 670) {
      return width * 0.31;
    }

    // Pixel 9 Pro, Pixel 9 Pro XL 
    if (Platform.OS === 'android' && height >= 935) {
      return width * 0.335;
    }
    
    // Pixel 7, Pixel 8, Pixel 9
    if (Platform.OS === 'android' && height >= 900) {
      return width * 0.33;
    }
    
    // iphone 16, iphone 16 plus, Pixel 7 Pro, 
    return width * 0.325;
  }

  const getTCTopPosition = () => {
    const { width, height } = Dimensions.get('window');

    // iphone 16 pro max
    if (Platform.OS === 'ios' && height >= 940) {
      return height * 0.29;
    }
    
    // iphone 16 plus
    if (Platform.OS === 'ios' && height >= 920) {
      return height * 0.29;
    }

    // iphone se
    if (Platform.OS === 'ios' && height < 670) {
      return height * 0.21;
    }

    // Pixel 9 Pro, Pixel 9 Pro XL 
    if (Platform.OS === 'android' && height >= 935) {
      return height * 0.3;
    }
    
    // Pixel 7, Pixel 8, Pixel 9
    if (Platform.OS === 'android' && height >= 900) {
      return height * 0.28;
    }
    
    // iphone 16, iphone 16 plus, Pixel 7 Pro, 
    return height * 0.265;
  }

  const getTCLeftPosition = () => {
    const { width, height } = Dimensions.get('window');
  
    // iphone 16 plus, iphone 16 pro max
    if (Platform.OS === 'ios' && height >= 920) {
      return width * 0.13;
    }

    // iphone se
    if (Platform.OS === 'ios' && height < 670) {
      return width * 0.08;
    }

    // Pixel 9 Pro, Pixel 9 Pro XL 
    if (Platform.OS === 'android' && height >= 935) {
      return width * 0.15;
    }
    
    // Pixel 7, Pixel 8, Pixel 9
    if (Platform.OS === 'android' && height >= 900) {
      return width * 0.1;
    }
    
    // iphone 16, iphone 16 plus, Pixel 7 Pro, 
    return width * 0.09;
  }

  const getShareTopPosition = () => {
    const { width, height } = Dimensions.get('window');

    // iphone 16 pro max
    if (Platform.OS === 'ios' && height >= 940) {
      return height * 0.32;
    }
    
    // iphone 16 plus
    if (Platform.OS === 'ios' && height >= 920) {
      return height * 0.32;
    }

    // iphone se
    if (Platform.OS === 'ios' && height < 670) {
      return height * 0.23;
    }

    // Pixel 9 Pro, Pixel 9 Pro XL 
    if (Platform.OS === 'android' && height >= 935) {
      return height * 0.32;
    }
    
    // Pixel 7, Pixel 8, Pixel 9
    if (Platform.OS === 'android' && height >= 900) {
      return height * 0.30;
    }
    
    // iphone 16, iphone 16 plus, Pixel 7 Pro, 
    return height * 0.3;
  }

  const getShareLeftPosition = () => {
    const { width, height } = Dimensions.get('window');
  
    // iphone 16 plus, iphone 16 pro max
    if (Platform.OS === 'ios' && height >= 920) {
      return width * 0.57;
    }

    // iphone se
    if (Platform.OS === 'ios' && height < 670) {
      return width * 0.57;
    }

    // Pixel 9 Pro, Pixel 9 Pro XL 
    if (Platform.OS === 'android' && height >= 935) {
      return width * 0.57;
    }
    
    // Pixel 7, Pixel 8, Pixel 9
    if (Platform.OS === 'android' && height >= 900) {
      return width * 0.58;
    }
    
    // iphone 16, iphone 16 plus, Pixel 7 Pro, 
    return width * 0.6;
  }

  const getRateTopPosition = () => {
    const { width, height } = Dimensions.get('window');

    // iphone 16 pro max
    if (Platform.OS === 'ios' && height >= 940) {
      return height * 0.21;
    }
    
    // iphone 16 plus
    if (Platform.OS === 'ios' && height >= 920) {
      return height * 0.21;
    }

    // iphone se
    if (Platform.OS === 'ios' && height < 670) {
      return height * 0.08;
    }

    // Pixel 9 Pro, Pixel 9 Pro XL 
    if (Platform.OS === 'android' && height >= 935) {
      return height * 0.21;
    }
    
    // Pixel 7, Pixel 8, Pixel 9
    if (Platform.OS === 'android' && height >= 900) {
      return height * 0.19;
    }
    
    // iphone 16, iphone 16 plus, Pixel 7 Pro, 
    return height * 0.18;
  }

  const getRateLeftPosition = () => {
    const { width, height } = Dimensions.get('window');
  
    // iphone 16 plus, iphone 16 pro max
    if (Platform.OS === 'ios' && height >= 920) {
      return width * 0.55;
    }

    // iphone se
    if (Platform.OS === 'ios' && height < 670) {
      return width * 0.56;
    }

    // Pixel 9 Pro, Pixel 9 Pro XL 
    if (Platform.OS === 'android' && height >= 935) {
      return width * 0.56;
    }
    
    // Pixel 7, Pixel 8, Pixel 9
    if (Platform.OS === 'android' && height >= 900) {
      return width * 0.565;
    }
    
    // iphone 16, iphone 16 plus, Pixel 7 Pro, 
    return width * 0.56;
  }

  const getWebsiteTopPosition = () => {
    const { width, height } = Dimensions.get('window');

    // iphone 16 pro max
    if (Platform.OS === 'ios' && height >= 940) {
      return height * 0.18;
    }
    
    // iphone 16 plus
    if (Platform.OS === 'ios' && height >= 920) {
      return height * 0.18;
    }

    // iphone se
    if (Platform.OS === 'ios' && height < 670) {
      return height * 0.06;
    }

    // Pixel 9 Pro, Pixel 9 Pro XL 
    if (Platform.OS === 'android' && height >= 935) {
      return height * 0.19;
    }
    
    // Pixel 7, Pixel 8, Pixel 9
    if (Platform.OS === 'android' && height >= 900) {
      return height * 0.16;
    }
    
    // iphone 16, iphone 16 plus, Pixel 7 Pro, 
    return height * 0.15;
  }

  const getWebsiteLeftPosition = () => {
    const { width, height } = Dimensions.get('window');
  
    // iphone 16 plus, iphone 16 pro max
    if (Platform.OS === 'ios' && height >= 920) {
      return width * 0.13;
    }

    // iphone se
    if (Platform.OS === 'ios' && height < 670) {
      return width * 0.1;
    }

    // Pixel 9 Pro, Pixel 9 Pro XL 
    if (Platform.OS === 'android' && height >= 935) {
      return width * 0.15;
    }
    
    // Pixel 7, Pixel 8, Pixel 9
    if (Platform.OS === 'android' && height >= 900) {
      return width * 0.13;
    }
    
    // iphone 16, iphone 16 plus, Pixel 7 Pro, 
    return width * 0.12;
  }

  const getStemTopPosition = () => {
    const { width, height } = Dimensions.get('window');

    // iphone 16 pro max
    if (Platform.OS === 'ios' && height >= 940) {
      return height * 0.11;
    }
    
    // iphone 16 plus
    if (Platform.OS === 'ios' && height >= 920) {
      return height * 0.11;
    }

    // iphone se
    if (Platform.OS === 'ios' && height < 670) {
      return -23;
    }

    // Pixel 9 Pro, Pixel 9 Pro XL 
    if (Platform.OS === 'android' && height >= 935) {
      return height * 0.14;
    }
    
    // Pixel 7, Pixel 8, Pixel 9
    if (Platform.OS === 'android' && height >= 900) {
      return height * 0.1;
    }
    
    // iphone 16, iphone 16 plus, Pixel 7 Pro, 
    return height * 0.09;
  }

  const getStemLeftPosition = () => {
    const { width, height } = Dimensions.get('window');
  
    // iphone 16 plus, iphone 16 pro max
    if (Platform.OS === 'ios' && height >= 920) {
      return width * 0.13;
    }

    // iphone se
    if (Platform.OS === 'ios' && height < 670) {
      return width * 0.08;
    }

    // Pixel 9 Pro, Pixel 9 Pro XL 
    if (Platform.OS === 'android' && height >= 935) {
      return width * 0.1;
    }
    
    // Pixel 7, Pixel 8, Pixel 9
    if (Platform.OS === 'android' && height >= 900) {
      return width * 0.09;
    }
    
    // iphone 16, iphone 16 plus, Pixel 7 Pro, 
    return width * 0.09;
  }

  const handleShare = async () => {
    try {
      await Share.share({
        message: 'Check out PrepQuest! https://prepquest.app',
      });
    } catch (error) {
      // Optionally handle error
    }
  };

  const MainContent = (
    <>
      <View style={[styles.topBar, { paddingTop: topPadding }]}> 
        <TouchableOpacity onPress={handleSignOut}>
          <Text style={styles.signOutText}>{language === 'Chinese' ? '退出登录' : 'Sign Out'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleToggle} activeOpacity={0.8} style={styles.switchContainer}>
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: lightBodyOpacity }]}> 
            <LightSwitchBody width={55} height={30} />
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: darkBodyOpacity }]}> 
            <DarkSwitchBody width={55} height={30} />
          </Animated.View>
          <Animated.View style={[styles.switchButton, { transform: [{ translateX }] }]}> 
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: lightButtonOpacity }]}> 
              <LightSwitch width={28} height={28} />
            </Animated.View>
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: darkButtonOpacity }]}> 
              <DarkSwitch width={28} height={28} />
            </Animated.View>
          </Animated.View>
        </TouchableOpacity>
      </View>
      <View style={styles.circleContainer}>
        <View style={styles.profileCircle}>
          <Text style={styles.profileInitials}>JA</Text>
        </View>
      </View>
      <View style={styles.infoColumn}>
        <View style={styles.infoRow}>
          <Text style={styles.infoHeading}>{language === 'Chinese' ? '用户名' : 'Username'}</Text>
          <Text style={[styles.infoValue, {
            // fontFamily: language === 'Chinese' ? 'NotoSansSC-Medium' : 'Satoshi-Medium'
            }]}>johnappleseed@gmail.com</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoHeading}>{language === 'Chinese' ? '当前订阅计划' : 'Current Plan'}</Text>
          <Text style={styles.infoValue}>{language === 'Chinese' ? '基础版' : 'Basic Plan'}</Text>
        </View>
      </View>
      <View style={styles.grapeContainer}>
        {/* Stem (behind) */}
        <GrapeStem
          style={[
            styles.grapeCircle,
            {position: "absolute", 
              top: getStemTopPosition(), left: getStemLeftPosition(), 
              zIndex: 6}
          ]}
        />
        {/* Website button (behind) */}
        <TouchableOpacity
          activeOpacity={1}
          onPressIn={() => setWebsitePressed(true)}
          onPressOut={() => setWebsitePressed(false)}
          style={[
            styles.grapeCircle,
            {backgroundColor: websitePressed ? '#8684FF' : '#685CDD', position: "absolute", 
              top: getWebsiteTopPosition(), left: getWebsiteLeftPosition(), 
              zIndex: 7}
          ]}
        >
          <Text style={[styles.grapeMenuText, {marginLeft: -48, marginBottom: 15, textAlign: 'center'}]}>{language === 'Chinese' ? '官网' : 'Website'}</Text>
        </TouchableOpacity>
        {/* Rate & Review button (behind) */}
        <TouchableOpacity
          activeOpacity={1}
          onPressIn={() => setRatePressed(true)}
          onPressOut={() => setRatePressed(false)}
          style={[
            styles.grapeCircle,
            {backgroundColor: ratePressed ? '#8684FF' : '#4F41D8', position: "absolute", 
              top: getRateTopPosition(), left: getRateLeftPosition(), 
              zIndex: 8}
          ]}
        >
          <Text style={[styles.grapeMenuText, {marginLeft: 25, marginBottom: 15, textAlign: 'center'}]}>{language === 'Chinese' ? '评分' + '\n' + '与评价' : 'Rate &\nReview'}</Text>
        </TouchableOpacity>
        {/* Share button (behind) */}
        <TouchableOpacity
          activeOpacity={1}
          onPressIn={() => setSharePressed(true)}
          onPressOut={() => setSharePressed(false)}
          onPress={handleShare}
          style={[
            styles.grapeCircle,
            {backgroundColor: sharePressed ? '#8684FF' : '#685CDD', position: "absolute", 
              top: getShareTopPosition(), left: getShareLeftPosition(), 
              zIndex: 9}
          ]}
        >
          <Text style={[styles.grapeMenuText, {marginLeft: 15, marginTop: 5, textAlign: 'center'}]}>{language === 'Chinese' ? '分享' : 'Share'}</Text>
        </TouchableOpacity>
        {/* T&C button (behind) */}
        <TouchableOpacity
          activeOpacity={1}
          onPressIn={() => setTCPressed(true)}
          onPressOut={() => setTCPressed(false)}
          style={[
            styles.grapeCircle,
            {backgroundColor: tcPressed ? '#8684FF' : '#4F41D8', position: "absolute", 
              top: getTCTopPosition(), left: getTCLeftPosition(), 
              zIndex: 9}
          ]}
        >
          <Text style={[styles.grapeMenuText, {marginRight: 22, textAlign: 'center'}]}>{language === 'Chinese' ? '条款' + '\n' + '与协议' : 'Terms &\nConditions'}</Text>
        </TouchableOpacity>
         {/* App Settings button (behind) */}
         <TouchableOpacity
          activeOpacity={1}
          onPressIn={() => setAppSettingsPressed(true)}
          onPressOut={() => setAppSettingsPressed(false)}
          onPress={handleAppSettingsPress}
          style={[
            styles.grapeCircle,
            {backgroundColor: appSettingsPressed ? '#8684FF' : '#3B30A7', position: "absolute", 
              top: getAppSettingsTopPosition(), left: getAppSettingsLeftPosition(), 
              zIndex: 8}
          ]}
        >
          <Text style={[styles.grapeMenuText, {marginTop: 50, textAlign: 'center'}]}>{language === 'Chinese' ? '应用' + '\n' + '设置' : 'App\nSettings'}</Text>
        </TouchableOpacity>
        {/* Deck Settings button (behind) */}
        <TouchableOpacity
          activeOpacity={1}
          onPressIn={() => setDeckSettingsPressed(true)}
          onPressOut={() => setDeckSettingsPressed(false)}
          onPress={handleDeckSettingsPress}
          style={[
            styles.grapeCircle,
            {backgroundColor: deckSettingsPressed ? '#8684FF' : '#3B30A7', position: "absolute", 
              top: getDeckSettingsTopPosition(), left: getDeckSettingsLeftPosition(), 
              zIndex: 8}
          ]}
        >
          <Text style={[styles.grapeMenuText, {marginBottom: 48, textAlign: 'center'}]}>{language === 'Chinese' ? '卡片组' + '\n' + '设置' : 'Deck\nSettings'}</Text>
        </TouchableOpacity>
        {/* Upgrade button (on top) */}
        <TouchableOpacity
          activeOpacity={1}
          onPressIn={() => setUpgradePressed(true)}
          onPressOut={() => setUpgradePressed(false)}
          style={[styles.grapeCircle, { backgroundColor: upgradePressed ? '#8684FF' : '#685CDD', zIndex: 10, marginTop: Dimensions.get('window').height < 670 ? 80 : 0}]}
        >
          <Text style={styles.grapeMenuText}>{language === 'Chinese' ? '升级' : 'Upgrade'}</Text>
          <Image 
            source={require('@/assets/images/Diamond.png')} 
            style={styles.diamondImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
    </>
  );

  // if (showLoadingPage) {
  //   return (
  //     <DeckCreationStatusPage
  //       statusRows={[
  //         { done: true, label: 'Request received' },
  //         { done: true, label: 'Successfully generated flashcards' },
  //         { done: true, label: 'Successfully added\nflashcards and deck' }
  //       ]}
  //     />
  //   );
  // }

  // if (showLoadingPage) {
  //   return (
  //     <DeckCreationLoadingPage 
  //       progress={50} 
  //       current={50} 
  //       total={50} 
  //       isInViewFlashcardsPage={false}
  //       onCancel={() => {
  //         // cancelCreationRef.current = true;
  //         setShowLoadingPage(false);
  //       }}
  //     />
  //   );
  // }

  return (
    <Animated.View style={{ flex: 1, backgroundColor: '#FFFFFF', opacity: fadeAnim }}>
      {screenHeight < 670 ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 135}}>{MainContent}</ScrollView>
      ) : (
        MainContent
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  signOutText: {
    fontFamily: 'Satoshi-Variable',
    fontWeight: '700',
    fontSize: 20,
    color: '#000',
  },
  switchContainer: {
    width: 55,
    height: 30,
    justifyContent: 'center',
    position: 'relative',
  },
  switchButton: {
    position: 'absolute',
    top: 1,
    left: 0,
    width: 28,
    height: 28,
    zIndex: 2,
  },
  circleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
  },
  profileCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#44B88A',
    backgroundColor: 'white',
  },
  profileInitials: {
    fontFamily: 'Satoshi-Variable',
    fontWeight: '700',
    fontSize: 36,
    color: '#000',
    textAlign: 'center',
    lineHeight: 95,
    paddingRight: 2
  },
  infoColumn: {
    paddingTop: 20,
    gap: 10,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  infoHeading: {
    fontFamily: 'Satoshi-Variable',
    fontWeight: '700',
    fontSize: 16,
    color: '#000',
  },
  infoValue: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 16,
    color: '#000',
  },
  grapeContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Dimensions.get('window').height < 670 ? 50 : 0,
    paddingTop: Dimensions.get('window').height > 670 ? 20 : 0,
  },
  grapeCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grapeMenuText: {
    color: 'white',
    fontFamily: 'Satoshi-Variable',
    fontWeight: '700',
    fontSize: 16,
  },
  diamondImage: {
    width: 24,
    height: 24,
    marginTop: 8,
  },
}); 