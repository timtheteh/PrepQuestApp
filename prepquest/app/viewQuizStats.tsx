import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AntDesign from '@expo/vector-icons/AntDesign';
import { AverageGradeThermometer } from '@/components/AverageGradeThermometer';
import BreakdownByDifficultyPie from '@/components/BreakdownByDifficulty';
import AverageSpeedTotal from '@/components/AverageSpeedTotal';
import DoubleChevron from '@/assets/icons/DoubleChevron.svg';

const ConfettiIcon = require('@/assets/icons/ConfettiIcon.png');
const FlagIcon = require('@/assets/icons/FlagIcon.png');

export default function ViewQuizStatsModal() {
  const router = useRouter();
  const { halfwayCheckpoint } = useLocalSearchParams();
  const isHalfwayCheckpoint = halfwayCheckpoint === 'true';
  // Dummy values for now
  const avgSeconds = 35;
  const totalTime = '3min 10s';

  return (
    <View style={styles.container}>
      {/* Close button absolutely positioned at top right */}
      <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
        <AntDesign name="close" size={28} color="#222" />
      </TouchableOpacity>
      <ScrollView
        style={[styles.scrollContainer, { marginBottom: isHalfwayCheckpoint ? 120 : 0 }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title row with confetti */}
        <View style={styles.titleRow}>
          {isHalfwayCheckpoint ? (
            <Image source={FlagIcon} style={[styles.confettiIcon, { transform: [{ scaleX: -1 }] }]} resizeMode="contain" />
          ) : (
            <Image source={ConfettiIcon} style={[styles.confettiIcon, { transform: [{ scaleX: -1 }] }]} resizeMode="contain" />
          )}
          {isHalfwayCheckpoint ? (
            <Text style={styles.wellDoneTitle}>{"Halfway\nCheckpoint"}</Text>
          ) : (
            <Text style={styles.wellDoneTitle}>Well Done!</Text>
          )}
          {isHalfwayCheckpoint ? (
            <Image source={FlagIcon} style={styles.confettiIcon} resizeMode="contain" />
          ) : (
            <Image source={ConfettiIcon} style={styles.confettiIcon} resizeMode="contain" />
          )}
        </View>
        {/* AverageGradeThermometer */}
        <View style={{ marginTop: 10 }}>
          <AverageGradeThermometer score={15} />
        </View>
        {/* BreakdownByDifficultyPie */}
        <View style={{ marginTop: 10 }}>
          <BreakdownByDifficultyPie />
        </View>
        {/* AverageSpeedTotal */}
        <View style={{ marginTop: 10 }}>
          <AverageSpeedTotal />
        </View>
        {/* Total time spent */}
        <View style={styles.totalTimeWrap}>
          <Text style={styles.totalTimeLabel}>Total time spent:</Text>
          <Text style={styles.totalTimeValue}>{totalTime}</Text>
        </View>
      </ScrollView>
      {/* Halfway checkpoint button fixed at bottom */}
      {isHalfwayCheckpoint && (
        <View style={styles.fixedBottomButtonWrap} pointerEvents="box-none">
          <TouchableOpacity style={styles.fixedBottomButton} activeOpacity={0.85} onPress={() => router.back()}>
            <View style={styles.buttonContentRow}>
              <Text style={styles.buttonText}>Continue with quiz</Text>
              <DoubleChevron width={36} height={36} />
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: 40,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 30 : 60,
    paddingHorizontal: 0,
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 15 : 40,
    right: 12,
    zIndex: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    marginTop: 0,
  },
  confettiIcon: {
    width: 44,
    height: 44,
    marginHorizontal: 2,
  },
  wellDoneTitle: {
    fontFamily: 'Neuton-Regular',
    fontSize: 44,
    color: '#222',
    textAlign: 'center',
    marginHorizontal: 10,
    marginTop: 2,
  },
  avgTimeTitleWrap: {
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avgTimeTitle: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 40,
    color: '#111',
    textAlign: 'center',
    lineHeight: 44,
  },
  avgTimeSubtitle: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 40,
    color: '#111',
    textAlign: 'center',
    lineHeight: 44,
    marginTop: -8,
  },
  totalTimeWrap: {
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalTimeLabel: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 32,
    color: '#111',
    textAlign: 'center',
    marginTop: 0,
  },
  totalTimeValue: {
    fontFamily: 'Satoshi-Variable',
    fontSize: 40,
    color: '#111',
    textAlign: 'center',
    marginTop: 0,
  },
  fixedBottomButtonWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Platform.OS === 'ios' ? 30 : 24,
    alignItems: 'center',
    zIndex: 20,
    pointerEvents: 'box-none',
  },
  fixedBottomButton: {
    width: 350,
    height: 72,
    backgroundColor: '#4F41D8',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  buttonText: {
    color: '#fff',
    fontFamily: 'Satoshi-Bold',
    fontSize: 22,
    letterSpacing: 0.2,
  },
}); 