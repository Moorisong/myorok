import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { COLORS } from '../../constants';

interface TabIconProps {
    name: any;
    focused: boolean;
}

function TabIcon({ name, focused }: TabIconProps) {
    return (
        <View style={[styles.iconContainer, focused && styles.iconFocused]}>
            <Feather name={name} size={24} color={focused ? COLORS.primary : COLORS.textSecondary} />
        </View>
    );
}

export default function TabLayout() {
    const insets = useSafeAreaInsets();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    ...styles.tabBar,
                    height: 60 + insets.bottom,
                    paddingBottom: insets.bottom,
                },
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.textSecondary,
                tabBarLabelStyle: styles.tabLabel,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: '오늘',
                    tabBarIcon: ({ focused }) => <TabIcon name="edit-3" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="calendar"
                options={{
                    title: '캘린더',
                    tabBarIcon: ({ focused }) => <TabIcon name="calendar" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="charts"
                options={{
                    title: '차트',
                    tabBarIcon: ({ focused }) => <TabIcon name="bar-chart-2" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="comfort"
                options={{
                    title: '쉼터',
                    tabBarIcon: ({ focused }) => <TabIcon name="heart" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: '설정',
                    tabBarIcon: ({ focused }) => <TabIcon name="settings" focused={focused} />,
                }}
            />
            {/* Hidden screens */}

            <Tabs.Screen
                name="records"
                options={{
                    href: null,
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: COLORS.surface,
        borderTopColor: COLORS.border,
        paddingTop: 8,
    },
    tabLabel: {
        fontSize: 12,
        fontWeight: '500',
    },
    iconContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconFocused: {
        transform: [{ scale: 1.1 }],
    },
});
