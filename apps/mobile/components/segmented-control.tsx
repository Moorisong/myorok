import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { COLORS } from '../constants';

interface SegmentedControlProps {
    options: string[];
    selectedIndex: number;
    onChange: (index: number) => void;
    style?: ViewStyle;
}

export function SegmentedControl({ options, selectedIndex, onChange, style }: SegmentedControlProps) {
    return (
        <View style={[styles.container, style]}>
            {options.map((option, index) => {
                const isSelected = index === selectedIndex;
                return (
                    <TouchableOpacity
                        key={index}
                        style={[
                            styles.segment,
                            isSelected && styles.selectedSegment
                        ]}
                        onPress={() => onChange(index)}
                        activeOpacity={0.7}
                    >
                        <Text
                            style={[
                                styles.text,
                                isSelected && styles.selectedText
                            ]}
                        >
                            {option}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: '#F2F2F7',
        borderRadius: 8,
        padding: 2,
        height: 36,
    },
    segment: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 6,
    },
    selectedSegment: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.15,
        shadowRadius: 2,
        elevation: 2,
    },
    text: {
        fontSize: 13,
        fontWeight: '500',
        color: '#8E8E93',
    },
    selectedText: {
        color: '#000000',
        fontWeight: '600',
    },
});
