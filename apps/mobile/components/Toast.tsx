import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
} from 'react-native';
import { COLORS } from '../constants';

interface ToastProps {
    visible: boolean;
    message: string;
    onUndo: () => void;
}

export default function Toast({ visible, message, onUndo }: ToastProps) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(10)).current; // Reduced slide distance
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (visible) {
            setShow(true);
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200, // Faster fade
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    useNativeDriver: true,
                    speed: 20, // Faster spring
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 10,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ]).start(({ finished }) => {
                if (finished) {
                    setShow(false);
                }
            });
        }
    }, [visible]);

    if (!show) return null;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                },
            ]}
            pointerEvents={visible ? 'auto' : 'none'} // Control touch events visibility
        >
            <Text style={styles.message}>{message}</Text>
            <TouchableOpacity
                onPress={onUndo} // Keep onPress but add delayPressIn=0
                delayPressIn={0}
                style={styles.undoButton}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} // Larger hitSlop
                activeOpacity={0.6}
            >
                <Text style={styles.undoText}>실행 취소</Text>
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 80, // 탭바 위에 표시
        left: 20,
        right: 20,
        backgroundColor: 'rgba(46, 46, 46, 0.9)',
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        zIndex: 9999,
    },
    message: {
        color: COLORS.surface,
        fontSize: 14,
        fontWeight: '500',
        flex: 1,
    },
    undoButton: {
        marginLeft: 16,
        padding: 4,
    },
    undoText: {
        color: COLORS.warning,
        fontSize: 14,
        fontWeight: '700',
    },
});
