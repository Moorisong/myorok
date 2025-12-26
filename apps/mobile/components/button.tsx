import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

import { COLORS } from '../constants';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary';
    disabled?: boolean;
    style?: ViewStyle;
}

export default function Button({
    title,
    onPress,
    variant = 'primary',
    disabled = false,
    style,
}: ButtonProps) {
    return (
        <Pressable
            style={({ pressed }) => [
                styles.button,
                variant === 'primary' ? styles.primary : styles.secondary,
                disabled && styles.disabled,
                pressed && !disabled && styles.pressed,
                style,
            ]}
            onPress={onPress}
            disabled={disabled}
        >
            <Text
                style={[
                    styles.text,
                    variant === 'primary' ? styles.primaryText : styles.secondaryText,
                    disabled && styles.disabledText,
                ]}
            >
                {title}
            </Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primary: {
        backgroundColor: COLORS.primary,
    },
    secondary: {
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    disabled: {
        backgroundColor: COLORS.background,
    },
    pressed: {
        opacity: 0.8,
    },
    text: {
        fontSize: 16,
        fontWeight: '600',
    },
    primaryText: {
        color: COLORS.surface,
    },
    secondaryText: {
        color: COLORS.textPrimary,
    },
    disabledText: {
        color: COLORS.textSecondary,
    },
});
