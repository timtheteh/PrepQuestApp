import React, { useContext } from 'react';
import { StyleSheet, Animated, Dimensions, View, Text } from 'react-native';
import { InterviewStudyToggle } from './InterviewStudyToggle';
import { AddDeckModalButton } from './AddDeckModalButton';
import { useRouter } from 'expo-router';
import Svg, { SvgProps, Path, Defs, Rect, ClipPath, G } from 'react-native-svg';
import { MenuContext } from '@/app/(tabs)/_layout';

const GenAIFormIcon: React.FC<SvgProps> = (props) => (
    <Svg 
      width={props.width || 37} 
      height={props.height || 41} 
      viewBox="0 0 37 41" 
      fill="none" 
      {...props}
    >
      <Path 
        fillRule="evenodd" 
        clipRule="evenodd" 
        d="M10.1496 1.14723C10.7139 -0.382412 12.8706 -0.382411 13.4348 1.14724L14.2159 3.26467C14.3933 3.74558 14.7712 4.12475 15.2506 4.30271L17.3614 5.08623C18.8862 5.65225 18.8862 7.81575 17.3614 8.38177L15.2506 9.16529C14.7712 9.34325 14.3933 9.72242 14.2159 10.2033L13.4348 12.3208C12.8706 13.8504 10.7139 13.8504 10.1496 12.3208L9.36858 10.2033C9.19118 9.72242 8.81321 9.34325 8.3338 9.16529L6.22303 8.38177C4.6982 7.81575 4.6982 5.65225 6.22303 5.08623L8.33381 4.30271C8.81321 4.12475 9.19118 3.74558 9.36858 3.26467L10.1496 1.14723ZM10.8173 6.734C11.1848 6.45371 11.5128 6.12464 11.7922 5.75598C12.0716 6.12464 12.3997 6.45371 12.7672 6.734C12.3997 7.0143 12.0716 7.34336 11.7922 7.71203C11.5128 7.34336 11.1848 7.0143 10.8173 6.734Z" 
        fill="#363538"
      />
      <Path 
        fillRule="evenodd" 
        clipRule="evenodd" 
        d="M0.65538 29.1192L23.4949 6.20766C26.5843 3.10842 31.5934 3.10842 34.6829 6.20766C37.7724 9.3069 37.7724 14.3318 34.6829 17.431L11.8434 40.3426C11.4238 40.7635 10.8546 41 10.2612 41H2.23761C1.00181 41 0 39.995 0 38.7553V30.7064C0 30.1111 0.235747 29.5402 0.65538 29.1192ZM3.35641 37.633V31.1713L25.8682 8.58849C27.6469 6.80414 30.5308 6.80414 32.3095 8.58849C34.0883 10.3728 34.0883 13.2658 32.3095 15.0502L9.79776 37.633H3.35641Z" 
        fill="#363538"
      />
      <Path 
        d="M26.1709 33.4192C24.9002 33.8909 24.9002 35.6938 26.1709 36.1655L27.9299 36.8184C28.3294 36.9667 28.6443 37.2827 28.7922 37.6835L29.443 39.448C29.9132 40.7227 31.7105 40.7227 32.1807 39.448L32.8316 37.6835C32.9794 37.2827 33.2944 36.9667 33.6939 36.8184L35.4529 36.1655C36.7236 35.6938 36.7236 33.8909 35.4529 33.4192L33.6939 32.7663C33.2944 32.618 32.9794 32.302 32.8316 31.9012L32.1807 30.1367C31.7105 28.862 29.9132 28.862 29.443 30.1367L28.7922 31.9012C28.6443 32.302 28.3294 32.618 27.9299 32.7663L26.1709 33.4192Z" 
        fill="#363538"
      />
    </Svg>
  );

const FileUploadIcon: React.FC<SvgProps> = (props) => (
<Svg 
    width={props.width || 96} 
    height={props.height || 56} 
    viewBox="0 0 96 56" 
    fill="none" 
    {...props}
>
    <G clipPath="url(#clip0_28_2125)">
    <Path 
        fillRule="evenodd" 
        clipRule="evenodd" 
        d="M65.8443 37.4652C70.0752 38.3686 74.2373 35.6712 75.1407 31.4403C76.0442 27.2095 73.3467 23.0473 69.1159 22.1439C64.885 21.2405 60.7229 23.9379 59.8195 28.1687C58.916 32.3996 61.6135 36.5617 65.8443 37.4652ZM66.4577 34.5924C69.102 35.1571 71.7034 33.4712 72.268 30.8269C72.8326 28.1826 71.1467 25.5813 68.5025 25.0166C65.8582 24.452 63.2568 26.1379 62.6922 28.7822C62.1276 31.4264 63.8135 34.0278 66.4577 34.5924Z" 
        fill="#363538"
    />
    <Path 
        d="M76.7765 23.7797C77.8342 24.0055 78.8748 23.3312 79.1006 22.2735C79.3265 21.2157 78.6521 20.1752 77.5944 19.9493C76.5367 19.7235 75.4962 20.3979 75.2703 21.4556C75.0444 22.5133 75.7188 23.5538 76.7765 23.7797Z" 
        fill="#363538"
    />
    <Path 
        fillRule="evenodd" 
        clipRule="evenodd" 
        d="M82.1445 17.7596C82.6694 19.1054 83.6511 20.2237 84.9176 20.9186C87.3003 22.2259 88.5433 24.9414 87.9758 27.5992L84.9959 41.5546C84.0925 45.7855 79.9303 48.4829 75.6995 47.5795L52.7176 42.6721C48.4867 41.7687 45.7893 37.6065 46.6927 33.3757L49.6726 19.4203C50.2402 16.7625 52.4839 14.7915 55.1928 14.5714C56.6326 14.4544 57.9854 13.8346 59.0143 12.8206L60.0514 11.7985C61.928 9.94881 64.6089 9.16662 67.1858 9.71687L75.9533 11.589C78.5302 12.1392 80.6578 13.9482 81.6153 16.403L82.1445 17.7596ZM76.3129 44.7067C78.9572 45.2714 81.5585 43.5855 82.1232 40.9412L85.1031 26.9858C85.3997 25.5966 84.75 24.1772 83.5046 23.4939C81.6336 22.4673 80.1833 20.8153 79.4078 18.827L78.8786 17.4705C78.2802 15.9362 76.9504 14.8056 75.3399 14.4617L66.5724 12.5896C64.9618 12.2457 63.2863 12.7346 62.1134 13.8906L61.0763 14.9127C59.5563 16.4108 57.5578 17.3264 55.4307 17.4993C54.0148 17.6143 52.842 18.6445 52.5454 20.0337L49.5655 33.9891C49.0008 36.6334 50.6867 39.2347 53.331 39.7994L76.3129 44.7067Z" 
        fill="#363538"
    />
    </G>
    <Path 
    d="M27.3755 23.1485C26.7114 22.6827 25.7954 22.8435 25.3296 23.5076L22.1491 28.0424C21.6833 28.7065 21.844 29.6225 22.5081 30.0882C23.1722 30.554 24.0882 30.3933 24.554 29.7292L25.6985 28.0974L27.1168 36.178C27.257 36.9769 28.0184 37.5109 28.8173 37.3707C29.6163 37.2305 30.1503 36.4691 30.0101 35.6701L28.5918 27.5896L30.2235 28.734C30.8876 29.1998 31.8036 29.0391 32.2694 28.375C32.7352 27.7108 32.5744 26.7949 31.9103 26.3291L27.3755 23.1485Z" 
    fill="#363538"
    />
    <Path 
    fillRule="evenodd" 
    clipRule="evenodd" 
    d="M15.0999 12.9367C9.81504 13.8643 6.40869 19.0586 7.66414 24.2753L11.337 39.5368C12.4863 44.3125 17.1508 47.3715 21.989 46.5223L38.4576 43.6317C43.2451 42.7914 46.5785 38.4068 46.1079 33.569L45.1255 23.4712C44.6178 18.2525 39.7748 14.5706 34.6104 15.4771L30.0846 16.2714C29.2857 16.4117 28.5243 15.8777 28.3841 15.0787C27.9634 12.6818 25.6793 11.0798 23.2824 11.5005L15.0999 12.9367ZM10.5201 23.5879C9.6611 20.0186 11.9918 16.4647 15.6077 15.83L23.7903 14.3938C24.5892 14.2536 25.3506 14.7876 25.4908 15.5865C25.9115 17.9834 28.1956 19.5854 30.5925 19.1647L35.1183 18.3703C38.5973 17.7597 41.8598 20.24 42.2018 23.7556L43.1842 33.8534C43.5062 37.1635 41.2254 40.1635 37.9498 40.7384L21.4811 43.629C18.1708 44.21 14.9793 42.1171 14.1929 38.8495L10.5201 23.5879Z" 
    fill="#363538"
    />
    <Defs>
    <ClipPath id="clip0_28_2125">
        <Rect 
        width={47} 
        height={47} 
        fill="white" 
        transform="translate(49.8145) rotate(12.0534)"
        />
    </ClipPath>
    </Defs>
</Svg>
);

const YoutubeIcon = (props: SvgProps) => (
<Svg 
    width={props.width || 45} 
    height={props.height || 45} 
    viewBox="0 0 41 33" 
    fill="none" 
    {...props}
>
    <Path
    fill="#363538"
    fillRule="evenodd"
    d="M13.594 19.492c0 .482-.002 1.117.078 1.651.088.596.39 1.905 1.729 2.664 1.34.758 2.617.343 3.174.112.499-.207 1.043-.534 1.455-.782l5.145-3.087c.392-.235.918-.55 1.325-.884.466-.383 1.386-1.28 1.386-2.76 0-1.48-.92-2.376-1.386-2.76-.407-.334-.933-.649-1.325-.883L20.03 9.676c-.413-.249-.956-.576-1.455-.783-.557-.23-1.835-.646-3.174.113-1.34.758-1.64 2.067-1.73 2.663-.079.535-.078 1.17-.077 1.651v6.172Zm5.084-7.348 4.96 2.976c.957.574 1.435.862 1.435 1.286 0 .425-.478.712-1.436 1.287l-4.959 2.975c-1.007.605-1.51.907-1.891.691-.38-.215-.38-.803-.38-1.977V13.43c0-1.174 0-1.761.38-1.977.38-.215.884.087 1.891.691Z"
    clipRule="evenodd"
    />
    <Path
    fill="#363538"
    fillRule="evenodd"
    d="M16.3 0c-3.445 0-6.175 0-8.31.287-2.199.296-3.978.918-5.381 2.322C1.205 4.012.583 5.79.287 7.989 0 10.125 0 12.855 0 16.3v.212c0 3.446 0 6.175.287 8.311.296 2.198.918 3.978 2.322 5.38 1.403 1.404 3.182 2.027 5.38 2.322 2.136.288 4.866.288 8.311.288h7.712c3.446 0 6.175 0 8.311-.288 2.199-.295 3.978-.918 5.38-2.321 1.404-1.403 2.027-3.183 2.322-5.38.288-2.137.288-4.866.288-8.312V16.3c0-3.445 0-6.175-.288-8.31-.295-2.199-.918-3.978-2.321-5.381C36.3 1.205 34.522.583 32.324.287 30.186 0 27.457 0 24.011 0H16.3ZM4.598 4.597c.794-.793 1.88-1.269 3.767-1.522 1.927-.26 4.467-.263 8.042-.263h7.5c3.576 0 6.116.003 8.042.263 1.887.253 2.974.729 3.767 1.522.794.794 1.27 1.88 1.523 3.767.259 1.927.262 4.467.262 8.042 0 3.576-.003 6.116-.262 8.042-.254 1.887-.73 2.974-1.523 3.767-.793.794-1.88 1.27-3.767 1.523-1.927.259-4.466.262-8.042.262h-7.5c-3.575 0-6.115-.003-8.042-.262-1.886-.254-2.973-.73-3.767-1.523-.793-.793-1.269-1.88-1.522-3.767-.26-1.927-.263-4.466-.263-8.042 0-3.575.003-6.115.263-8.042.253-1.886.729-2.973 1.522-3.767Z"
    clipRule="evenodd"
    />
</Svg>
)

const ManualFormIcon = (props: SvgProps) => (
<Svg 
    width={props.width || 49} 
    height={props.height || 49} 
    viewBox="0 0 38 39" 
    fill="none" 
    {...props}
>
    <Path
    fill="#363538"
    fillRule="evenodd"
    d="M35.608 2.134a5.615 5.615 0 0 0-7.94 0L17.235 12.567l-.934 4.67c-.5 2.5 1.704 4.705 4.204 4.205l4.67-.934 10.433-10.434a5.615 5.615 0 0 0 0-7.94Zm-5.774 2.165a2.552 2.552 0 0 1 3.609 3.61l-9.778 9.777-3.76.753a.51.51 0 0 1-.602-.601l.753-3.76 9.778-9.779Z"
    clipRule="evenodd"
/>
<Path
    fill="#363538"
    d="M13.56 23.275a1.531 1.531 0 1 0-.533-3.016c-.678.12-1.388.23-2.125.346l-.09.015c-.763.12-1.552.244-2.328.383-1.537.275-3.113.621-4.456 1.151-1.315.52-2.646 1.308-3.389 2.62-.793 1.4-.718 3.026.018 4.742.895 2.089 2.83 3.064 4.885 3.428 2.043.361 4.469.181 6.898-.253 4.88-.872 10.263-2.863 13.732-4.424 2.744-1.235 4.923-.9 5.995-.116.515.377.82.875.903 1.478.086.622-.047 1.496-.685 2.6-.513.886-1.729 1.637-3.839 2.21-2.052.556-4.576.849-7.24 1.117a1.531 1.531 0 1 0 .307 3.047c2.634-.265 5.403-.576 7.735-1.209 2.274-.616 4.535-1.64 5.687-3.631.893-1.542 1.27-3.1 1.069-4.554-.204-1.472-.984-2.692-2.128-3.529-2.245-1.644-5.68-1.727-9.061-.206-3.338 1.502-8.469 3.39-13.014 4.203-2.284.408-4.3.521-5.825.251-1.513-.268-2.275-.85-2.605-1.619-.49-1.142-.346-1.71-.167-2.027.23-.405.774-.855 1.85-1.28 1.047-.413 2.376-.717 3.87-.985.739-.132 1.497-.252 2.263-.372l.1-.016c.728-.114 1.465-.23 2.172-.354Z"
/>
</Svg>
)

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AddDeckModalProps {
  visible: boolean;
  opacity?: Animated.Value;
  currentMode: 'study' | 'interview';
  isInFavoritesPage?: boolean;
}

export function AddDeckModal({ 
  visible,
  opacity = new Animated.Value(0),
  currentMode,
  isInFavoritesPage = false,
}: AddDeckModalProps) {
  const { setCurrentMode, handleDismissMenu } = useContext(MenuContext);
  const router = useRouter();

  if (!visible) return null;

  const handleToggle = (mode: 'study' | 'interview') => {
    setCurrentMode(mode);
  };

  const handleGenAIFormPress = () => {
    handleDismissMenu();
    router.push({
      pathname: '/genAIForm',
      params: { mode: currentMode }
    });
  };

  const handleFormUploadPagePress = () => {
    handleDismissMenu();
    router.push({
      pathname: '/fileUploadPage',
      params: { mode: currentMode }
    });
  };

  const handleYoutubeLinkPress = () => {
    handleDismissMenu();
    router.push({
      pathname: '/youtubeLink',
      params: { mode: currentMode }
    });
  };

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: opacity
        }
      ]}
    >
      <View style={styles.content}>
        <View style={styles.column}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{isInFavoritesPage ? "Add Deck to Favorites" : "Add Deck"}</Text>
          </View>
          <View style={styles.toggleRow}>
            <InterviewStudyToggle 
              initialState={currentMode}
              onToggle={handleToggle}
            />
          </View>
          <View style={styles.firstButtonRow}>
            <AddDeckModalButton
              title="Gen AI Form"
              Icon={GenAIFormIcon}
              onPress={handleGenAIFormPress}
            />
            <AddDeckModalButton
              title="File Upload"
              Icon={FileUploadIcon}
              marginBottom={3}
              onPress={handleFormUploadPagePress}
            />
          </View>
          <View style={styles.buttonRow}>
            <AddDeckModalButton
              title="YouTube Link"
              Icon={YoutubeIcon}
              onPress={handleYoutubeLinkPress}
            />
            <AddDeckModalButton
              title="Manual"
              Icon={ManualFormIcon}
              marginBottom={6}
              onPress={() => {
                router.push({
                  pathname: '/manualAddDeck',
                  params: { mode: currentMode }
                });
                handleDismissMenu();
              }}
            />
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 180,
    left: '50%',
    width: 355,
    height: 388,
    marginLeft: -177.5, // Half of width
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    borderWidth: 10,
    borderColor: '#4F41D8',
    zIndex: 1001, // Higher than GreyOverlayBackground
  },
  content: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  column: {
    flex: 1,
    flexDirection: 'column',

  },
  titleRow: {
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Neuton-Regular',
    fontSize: 32,
    textAlign: 'center',
  },
  toggleRow: {
    alignItems: 'center',
    marginVertical: 8,
    paddingLeft: 8,
  },
  firstButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingHorizontal: 6
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    paddingHorizontal: 6
  },
}); 