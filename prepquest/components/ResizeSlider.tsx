import React, { useRef, useState } from 'react';
import { View, StyleSheet, PanResponder, Animated } from 'react-native';

const TRACK_WIDTH = 100;
const THUMB_SIZE = 18;
const END_CIRCLE_SMALL_SIZE = 8;
const END_CIRCLE_LARGE_SIZE = 18;

interface ResizeSliderProps {
    onValueChange?: (value: number) => void;
}

export function ResizeSlider({ onValueChange }: ResizeSliderProps) {
    const [sliderValue, setSliderValue] = useState(TRACK_WIDTH / 2 - THUMB_SIZE / 2);
    const pan = useRef(new Animated.Value(sliderValue)).current;
    
    pan.addListener(({ value }) => {
        // This listener is for getting the value, but we can't set state here
        // as it would cause too many re-renders.
    });

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                pan.setOffset(sliderValue);
                pan.setValue(0);
            },
            onPanResponderMove: (e, gesture) => {
                const newX = gesture.dx;
                const totalX = sliderValue + newX;
                
                if (totalX >= 0 && totalX <= TRACK_WIDTH - THUMB_SIZE) {
                    pan.setValue(newX);
                }
            },
            onPanResponderRelease: (e, gesture) => {
                pan.flattenOffset();
                let newX = sliderValue + gesture.dx;

                if (newX < 0) {
                    newX = 0;
                } else if (newX > TRACK_WIDTH - THUMB_SIZE) {
                    newX = TRACK_WIDTH - THUMB_SIZE;
                }
                setSliderValue(newX);
                pan.setValue(newX);

                const value = newX / (TRACK_WIDTH - THUMB_SIZE);
                onValueChange?.(value);
            },
        })
    ).current;

    const clampedX = pan.interpolate({
        inputRange: [0, TRACK_WIDTH - THUMB_SIZE],
        outputRange: [0, TRACK_WIDTH - THUMB_SIZE],
        extrapolate: 'clamp'
    });

    return (
        <View style={styles.sliderContainer}>
            <View style={styles.endCircleSmall} />
            <View style={styles.track}>
                <Animated.View
                    style={[
                        styles.thumb,
                        { transform: [{ translateX: pan }] },
                    ]}
                    {...panResponder.panHandlers}
                />
            </View>
            <View style={styles.endCircleLarge} />
        </View>
    );
}

const styles = StyleSheet.create({
    sliderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
    track: {
        width: TRACK_WIDTH,
        height: 2.5,
        backgroundColor: 'black',
    },
    thumb: {
        width: THUMB_SIZE,
        height: THUMB_SIZE,
        backgroundColor: '#4F41D8',
        position: 'absolute',
        top: -(THUMB_SIZE / 2) + 1.25,
    },
    endCircleSmall: {
        width: END_CIRCLE_SMALL_SIZE,
        height: END_CIRCLE_SMALL_SIZE,
        borderRadius: END_CIRCLE_SMALL_SIZE / 2,
        backgroundColor: 'black',
    },
    endCircleLarge: {
        width: END_CIRCLE_LARGE_SIZE,
        height: END_CIRCLE_LARGE_SIZE,
        borderRadius: END_CIRCLE_LARGE_SIZE / 2,
        backgroundColor: 'black',
    },
}); 