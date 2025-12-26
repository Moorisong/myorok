import { Tabs } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';

import { COLORS } from '../../constants';

interface TabIconProps {
    emoji: string;
    focused: boolean;
}

function TabIcon({ emoji, focused }: TabIconProps) {
    return (
        <View style={[styles.iconContainer, focused && styles.iconFocused]}>
            <Text style={styles.emoji}>{emoji}</Text>
        </View>
    );
}

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.textSecondary,
                tabBarLabelStyle: styles.tabLabel,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: '홈',
                    tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="records"
                options={{
                    title: '기록',
                    tabBarIcon: ({ focused }) => <TabIcon emoji="📝" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="charts"
                options={{
                    title: '차트',
                    tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: '설정',
                    tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="today"
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
        height: 60,
    },
    tabLabel: {
        fontSize: 12,
        fontWeight: '500',
    },
    iconContainer: {
        padding: 4,
    },
    iconFocused: {
        transform: [{ scale: 1.1 }],
    },
    emoji: {
        fontSize: 22,
    },
});
