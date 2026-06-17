import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';

import {
    COLORS,
    VOMIT_COLORS,
    UI_LABELS,
    PLACEHOLDERS,
    CONFIG,
} from '../../constants';
import {
    Toast,
    NumberEditModal,
    VomitColorModal,
    CounterButton,
    SupplementChecklist,
    FluidInputSection,
    CustomMetricInputSection,
} from '../../components';
import PetSelector from '../../components/pet-selector';
import { useTodayScreen } from '../../hooks/use-today-screen';


export default function TodayScreen() {
    const router = useRouter();
    const {
        // States
        peeCount,
        poopCount,
        diarrheaCount,
        vomitCount,
        vomitColors,
        memo,
        showVomitColors,
        supplements,
        takenStatus,
        todayFluids,
        loading,
        toastVisible,
        toastMessage,
        editModalVisible,

        // Handlers
        handlePeeAdd,
        handlePeeSubtract,
        handlePoopAdd,
        handlePoopSubtract,
        handleDiarrheaAdd,
        handleDiarrheaSubtract,
        handleVomitAdd,
        handleVomitSubtract,
        handleVomitColorSelect,
        handleFluidDelete,
        handleSupplementToggle,
        handleSupplementAdd,
        handleSupplementDelete,
        handleFluidAdd,
        handleMemoSave,
        handleUndo,
        handleEditSave,
        openEditModal,

        // Helpers
        getEditInitialValue,
        getEditTitle,

        // Setters
        setMemo,
        setEditModalVisible,

        editTarget,
    } = useTodayScreen();

    const [isVomitModalOpen, setIsVomitModalOpen] = useState(false);

    const onPressVomitAdd = () => {
        setIsVomitModalOpen(true);
    };

    const onSelectVomitColor = async (color: any) => {
        setIsVomitModalOpen(false);
        await handleVomitColorSelect(color);
    };

    // Date formatting (UI helper)
    const today = new Date();
    const dateString = `${today.getMonth() + 1}월 ${today.getDate()}일`;
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];


    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>{UI_LABELS.LOADING}</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior="height"
                keyboardVerticalOffset={0}
            >
                {/* Pet Selector - Fixed at top */}
                <View style={styles.petSelectorFixed}>
                    <PetSelector />
                </View>

                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >


                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.dateText}>{dateString}</Text>
                        <Text style={styles.dayText}>{dayNames[today.getDay()]}요일</Text>
                    </View>

                    {/* 배변/배뇨 섹션 */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>배변 / 배뇨</Text>

                        <View style={styles.counterGrid}>
                            <CounterButton
                                emoji="💧"
                                label="소변"
                                count={peeCount}
                                onPressAdd={handlePeeAdd}
                                onPressSubtract={handlePeeSubtract}
                                onPressCount={() => openEditModal('pee')}
                            />
                            <CounterButton
                                emoji="💩"
                                label="배변"
                                count={poopCount}
                                onPressAdd={handlePoopAdd}
                                onPressSubtract={handlePoopSubtract}
                                onPressCount={() => openEditModal('poop')}
                            />
                            <CounterButton
                                emoji="🚨"
                                label="묽은 변"
                                count={diarrheaCount}
                                onPressAdd={handleDiarrheaAdd}
                                onPressSubtract={handleDiarrheaSubtract}
                                onPressCount={() => openEditModal('diarrhea')}
                                warning
                            />
                            <CounterButton
                                emoji="🤮"
                                label="구토"
                                count={vomitCount}
                                onPressAdd={onPressVomitAdd}
                                onPressSubtract={handleVomitSubtract}
                                onPressCount={() => openEditModal('vomit')}
                                warning
                            />
                        </View>



                        {vomitColors.length > 0 && (
                            <Text style={styles.vomitHistory}>기록된 구토 색상: {vomitColors.join(', ')}</Text>
                        )}
                    </View>

                    {/* 약/영양제 섹션 */}
                    <SupplementChecklist
                        supplements={supplements}
                        takenStatus={takenStatus}
                        onToggle={handleSupplementToggle}
                        onAdd={handleSupplementAdd}
                        onDelete={handleSupplementDelete}
                    />

                    {/* 강수량 섹션 */}
                    <FluidInputSection
                        title="강수 (강제 급수)"
                        todayFluids={todayFluids.filter(f => f.fluidType === 'force')}
                        onAddFluid={handleFluidAdd}
                        onDeleteFluid={handleFluidDelete}
                        isForceMode={true}
                    />

                    {/* 수액 섹션 */}
                    <FluidInputSection
                        todayFluids={todayFluids.filter(f => f.fluidType !== 'force')}
                        onAddFluid={handleFluidAdd}
                        onDeleteFluid={handleFluidDelete}
                    />

                    {/* 메모 섹션 */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>특이사항</Text>
                        <TextInput
                            style={styles.memoInput}
                            placeholder={PLACEHOLDERS.MEMO}
                            placeholderTextColor={COLORS.textSecondary}
                            value={memo}
                            onChangeText={setMemo}
                            multiline
                            numberOfLines={3}
                        />
                        <Pressable style={styles.memoSaveBtn} onPress={handleMemoSave}>
                            <Text style={styles.memoSaveBtnText}>{UI_LABELS.SAVE_BUTTON}</Text>
                        </Pressable>
                    </View>

                    {/* 커스텀 수치 섹션 */}
                    <View style={styles.sectionWrapper}>
                        <CustomMetricInputSection />
                    </View>

                    <View style={styles.bottomPadding} />
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Toast Alert */}
            <Toast
                visible={toastVisible}
                message={toastMessage}
                onUndo={handleUndo}
            />

            {/* Number Edit Modal */}
            <NumberEditModal
                visible={editModalVisible}
                title={getEditTitle()}
                initialValue={getEditInitialValue()}
                onSave={handleEditSave}
                onCancel={() => setEditModalVisible(false)}
                vomitColors={vomitColors}
                isVomitMode={editTarget === 'vomit'}
            />

            <VomitColorModal
                visible={isVomitModalOpen}
                onClose={() => setIsVomitModalOpen(false)}
                onSelect={onSelectVomitColor}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollView: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: COLORS.textSecondary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'baseline',
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 14,
    },
    dateText: {
        fontSize: 26,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginRight: 8,
    },
    dayText: {
        fontSize: 16,
        color: COLORS.textSecondary,
    },
    petSelectorFixed: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
        backgroundColor: COLORS.background,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    trialBannerContainer: {
        marginTop: 12,
    },
    section: {
        backgroundColor: COLORS.surface,
        marginHorizontal: 16,
        marginTop: 12,
        borderRadius: 16,
        padding: 16,
    },
    sectionWrapper: {
        marginHorizontal: 16,
        marginTop: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 12,
    },
    counterGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },

    vomitHistory: {
        marginTop: 10,
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    memoInput: {
        backgroundColor: COLORS.background,
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        color: COLORS.textPrimary,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    memoSaveBtn: {
        marginTop: 10,
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    memoSaveBtnText: {
        color: COLORS.surface,
        fontSize: 15,
        fontWeight: '600',
    },
    bottomPadding: {
        height: CONFIG.BOTTOM_PADDING,
    },
});
