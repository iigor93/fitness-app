import { useEffect, useMemo, useRef, useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import {
  Animated,
  BackHandler,
  type GestureResponderEvent,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';

import workoutsData from '../../temp/data.json';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { AppButton } from '../components/ui/AppButton';
import { AppCard } from '../components/ui/AppCard';
import {
  clearActiveWorkout,
  loadActiveWorkout,
  saveActiveWorkout,
} from '../services/storage/activeWorkoutStorage';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import type {
  ActiveWorkout,
  ExerciseSet,
  Workout,
  WorkoutCatalog,
} from '../types/workout';

type WorkoutSummary = {
  completedExercises: string[];
  details: Array<{
    exercise: string;
    sets: ExerciseSet[];
  }>;
  text: string;
  workoutName: string;
};

const workoutCatalog = workoutsData as WorkoutCatalog;

export function WorkoutsScreen() {
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkout | null>(null);
  const [selectedAlias, setSelectedAlias] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinishConfirmVisible, setIsFinishConfirmVisible] = useState(false);
  const [modalExercise, setModalExercise] = useState<string | null>(null);
  const [summaryWorkout, setSummaryWorkout] = useState<WorkoutSummary | null>(null);
  const [weightInput, setWeightInput] = useState('');
  const [countInput, setCountInput] = useState('');
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  const { height: windowHeight } = useWindowDimensions();
  const sheetHeight = Math.max(420, Math.round(windowHeight * 0.75));
  const sheetTranslateY = useRef(new Animated.Value(sheetHeight)).current;
  const confirmTranslateY = useRef(new Animated.Value(0)).current;
  const countInputRef = useRef<TextInput | null>(null);
  const sheetDragStartY = useRef<number | null>(null);
  const confirmDragStartY = useRef<number | null>(null);

  const workouts = workoutCatalog.workouts;

  const selectedWorkout = useMemo(
    () =>
      workouts.find((workout) => workout.alias === (activeWorkout?.alias ?? selectedAlias)) ??
      null,
    [activeWorkout?.alias, selectedAlias, workouts],
  );

  function closeBottomSheet() {
    Animated.timing(sheetTranslateY, {
      duration: 180,
      toValue: sheetHeight,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) {
        return;
      }

      setModalExercise(null);
      setSummaryWorkout(null);
      setWeightInput('');
      setCountInput('');
    });
  }

  function closeConfirmModal() {
    Animated.timing(confirmTranslateY, {
      duration: 180,
      toValue: 140,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) {
        return;
      }

      setIsFinishConfirmVisible(false);
      confirmTranslateY.setValue(0);
    });
  }

  function resetSheetPosition() {
    Animated.spring(sheetTranslateY, {
      damping: 20,
      mass: 0.9,
      stiffness: 180,
      toValue: 0,
      useNativeDriver: true,
    }).start();
  }

  function resetConfirmPosition() {
    Animated.spring(confirmTranslateY, {
      damping: 20,
      mass: 0.9,
      stiffness: 180,
      toValue: 0,
      useNativeDriver: true,
    }).start();
  }

  function handleSheetDragStart(event: GestureResponderEvent) {
    sheetDragStartY.current = event.nativeEvent.pageY;
  }

  function handleSheetDragMove(event: GestureResponderEvent) {
    if (sheetDragStartY.current === null) {
      return;
    }

    const dragDistance = event.nativeEvent.pageY - sheetDragStartY.current;
    sheetTranslateY.setValue(Math.max(0, dragDistance));
  }

  function handleSheetDragEnd(event: GestureResponderEvent) {
    if (sheetDragStartY.current === null) {
      return;
    }

    const dragDistance = event.nativeEvent.pageY - sheetDragStartY.current;
    sheetDragStartY.current = null;

    if (dragDistance > 120) {
      closeBottomSheet();
      return;
    }

    resetSheetPosition();
  }

  function handleConfirmDragStart(event: GestureResponderEvent) {
    confirmDragStartY.current = event.nativeEvent.pageY;
  }

  function handleConfirmDragMove(event: GestureResponderEvent) {
    if (confirmDragStartY.current === null) {
      return;
    }

    const dragDistance = event.nativeEvent.pageY - confirmDragStartY.current;
    confirmTranslateY.setValue(Math.max(0, dragDistance));
  }

  function handleConfirmDragEnd(event: GestureResponderEvent) {
    if (confirmDragStartY.current === null) {
      return;
    }

    const dragDistance = event.nativeEvent.pageY - confirmDragStartY.current;
    confirmDragStartY.current = null;

    if (dragDistance > 100) {
      closeConfirmModal();
      return;
    }

    resetConfirmPosition();
  }

  useEffect(() => {
    async function bootstrap() {
      const storedActiveWorkout = await loadActiveWorkout();

      if (storedActiveWorkout) {
        const storedWorkoutExists = workouts.some(
          (workout) => workout.alias === storedActiveWorkout.alias,
        );

        if (storedWorkoutExists) {
          setActiveWorkout({
            alias: storedActiveWorkout.alias,
            completedExercises: storedActiveWorkout.completedExercises ?? [],
            exerciseLogs: storedActiveWorkout.exerciseLogs ?? {},
          });
          setSelectedAlias(storedActiveWorkout.alias);
        } else {
          await clearActiveWorkout();
        }
      }

      setIsBootstrapping(false);
    }

    bootstrap();
  }, [workouts]);

  useEffect(() => {
    if (!activeWorkout) {
      return;
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);

    return () => subscription.remove();
  }, [activeWorkout]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      setKeyboardOffset(event.endCoordinates.height);
    });

    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardOffset(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  async function handleStartWorkout(workout: Workout) {
    try {
      setIsSubmitting(true);

      const nextActiveWorkout: ActiveWorkout = {
        alias: workout.alias,
        completedExercises: [],
        exerciseLogs: {},
      };

      await saveActiveWorkout(nextActiveWorkout);
      setActiveWorkout(nextActiveWorkout);
      setSelectedAlias(workout.alias);
    } finally {
      setIsSubmitting(false);
    }
  }

  function openSetModal(exercise: string) {
    const lastExerciseSet = activeWorkout?.exerciseLogs?.[exercise]?.at(-1) ?? null;

    setSummaryWorkout(null);
    setModalExercise(exercise);
    setWeightInput(lastExerciseSet ? String(lastExerciseSet.weight) : '');
    setCountInput('');
    sheetTranslateY.setValue(sheetHeight);
    Animated.timing(sheetTranslateY, {
      duration: 220,
      toValue: 0,
      useNativeDriver: true,
    }).start();
  }

  function openSummaryModal(summary: WorkoutSummary) {
    setIsFinishConfirmVisible(false);
    setModalExercise(null);
    setSummaryWorkout(summary);
    sheetTranslateY.setValue(sheetHeight);
    Animated.timing(sheetTranslateY, {
      duration: 220,
      toValue: 0,
      useNativeDriver: true,
    }).start();
  }

  function buildWorkoutSummary(): WorkoutSummary | null {
    if (!activeWorkout || !selectedWorkout) {
      return null;
    }

    const summaryDetails = selectedWorkout.exercises.map((exercise) => ({
      exercise,
      sets: activeWorkout.exerciseLogs?.[exercise] ?? [],
    }));

    const summaryText = [
      `Тренировка: ${selectedWorkout.name}`,
      '',
      ...summaryDetails.map(({ exercise, sets }) => {
        const isCompleted = activeWorkout.completedExercises?.includes(exercise);
        const formattedSets =
          sets.length > 0
            ? sets.map((set, index) => `${index + 1}. ${set.weight} кг / ${set.count}`).join('\n')
            : 'Нет добавленных подходов';

        return `${exercise}${isCompleted ? ' [выполнено]' : ''}\n${formattedSets}`;
      }),
    ].join('\n\n');

    return {
      completedExercises: activeWorkout.completedExercises ?? [],
      details: summaryDetails,
      text: summaryText,
      workoutName: selectedWorkout.name,
    };
  }

  function handleFinishWorkoutPress() {
    const summary = buildWorkoutSummary();

    if (!summary) {
      return;
    }

    openSummaryModal(summary);
  }

  async function confirmFinishWorkout() {
    if (!summaryWorkout) {
      return;
    }

    try {
      setIsSubmitting(true);

      await Clipboard.setStringAsync(summaryWorkout.text);
      await clearActiveWorkout();
      closeBottomSheet();
      setActiveWorkout(null);
      setSelectedAlias(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleFinishWorkout() {
    if (!activeWorkout || !selectedWorkout) {
      return;
    }

    try {
      setIsSubmitting(true);

      const summaryDetails = selectedWorkout.exercises.map((exercise) => ({
        exercise,
        sets: activeWorkout.exerciseLogs?.[exercise] ?? [],
      }));

      const summaryText = [
        `Тренировка: ${selectedWorkout.name}`,
        '',
        ...summaryDetails.map(({ exercise, sets }) => {
          const isCompleted = activeWorkout.completedExercises?.includes(exercise);
          const formattedSets =
            sets.length > 0
              ? sets.map((set, index) => `${index + 1}. ${set.weight} кг / ${set.count}`).join('\n')
              : 'Нет добавленных подходов';

          return `${exercise}${isCompleted ? ' [выполнено]' : ''}\n${formattedSets}`;
        }),
      ].join('\n\n');

      await Clipboard.setStringAsync(summaryText);
      await clearActiveWorkout();
      setActiveWorkout(null);
      setSelectedAlias(null);
      openSummaryModal({
        completedExercises: activeWorkout.completedExercises ?? [],
        details: summaryDetails,
        text: summaryText,
        workoutName: selectedWorkout.name,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAddSet() {
    if (!activeWorkout || !modalExercise) {
      return;
    }

    const weight = Number(weightInput);
    const count = Number(countInput);

    if (!Number.isFinite(weight) || weight <= 0 || !Number.isFinite(count) || count <= 0) {
      return;
    }

    try {
      setIsSubmitting(true);

      const nextSet: ExerciseSet = { count, weight };
      const nextActiveWorkout: ActiveWorkout = {
        alias: activeWorkout.alias,
        completedExercises: activeWorkout.completedExercises ?? [],
        exerciseLogs: {
          ...(activeWorkout.exerciseLogs ?? {}),
          [modalExercise]: [...(activeWorkout.exerciseLogs?.[modalExercise] ?? []), nextSet],
        },
      };

      await saveActiveWorkout(nextActiveWorkout);
      setActiveWorkout(nextActiveWorkout);
      closeBottomSheet();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function toggleExerciseCompleted(exercise: string) {
    if (!activeWorkout) {
      return;
    }

    const completedExercises = activeWorkout.completedExercises ?? [];
    const nextCompletedExercises = completedExercises.includes(exercise)
      ? completedExercises.filter((item) => item !== exercise)
      : [...completedExercises, exercise];

    const nextActiveWorkout: ActiveWorkout = {
      alias: activeWorkout.alias,
      completedExercises: nextCompletedExercises,
      exerciseLogs: activeWorkout.exerciseLogs ?? {},
    };

    await saveActiveWorkout(nextActiveWorkout);
    setActiveWorkout(nextActiveWorkout);
  }

  function renderBottomSheet() {
    return (
      <Modal
        animationType="none"
        onRequestClose={closeBottomSheet}
        statusBarTranslucent
        transparent
        visible={modalExercise !== null || summaryWorkout !== null}
      >
        <View style={styles.modalRoot}>
          <Pressable onPress={closeBottomSheet} style={styles.modalOverlay} />

          <Animated.View
            pointerEvents="box-none"
            style={styles.modalKeyboardAvoiding}
          >
            <Animated.View
              style={[
                styles.sheet,
                {
                  height: sheetHeight,
                  marginBottom: keyboardOffset,
                  transform: [{ translateY: sheetTranslateY }],
                },
              ]}
            >
              <View
                onMoveShouldSetResponder={() => true}
                onResponderGrant={handleSheetDragStart}
                onResponderMove={handleSheetDragMove}
                onResponderRelease={handleSheetDragEnd}
                onResponderTerminate={handleSheetDragEnd}
                onStartShouldSetResponder={() => true}
                style={styles.sheetHandleWrap}
              >
                <View style={styles.sheetHandle} />
              </View>

              {modalExercise ? (
                <>
                  <Text style={styles.sheetLabel}>Новый подход</Text>
                  <Text style={styles.sheetTitle}>{modalExercise}</Text>

                  <ScrollView
                    contentContainerStyle={styles.sheetFormContent}
                    keyboardShouldPersistTaps="always"
                    showsVerticalScrollIndicator={false}
                  >
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Вес</Text>
                      <TextInput
                        blurOnSubmit={false}
                        keyboardType="numeric"
                        onChangeText={setWeightInput}
                        onSubmitEditing={() => countInputRef.current?.focus()}
                        placeholder="Например, 60"
                        placeholderTextColor={colors.textMuted}
                        returnKeyType="next"
                        style={styles.input}
                        value={weightInput}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Кол-во повторений</Text>
                      <TextInput
                        keyboardType="numeric"
                        onChangeText={setCountInput}
                        onSubmitEditing={() => {
                          void handleAddSet();
                        }}
                        placeholder="Например, 10"
                        placeholderTextColor={colors.textMuted}
                        ref={countInputRef}
                        returnKeyType="done"
                        style={styles.input}
                        value={countInput}
                      />
                    </View>

                    <View style={styles.sheetButtonWrap}>
                      <AppButton
                        disabled={isSubmitting}
                        label={isSubmitting ? 'Добавляем...' : 'Добавить'}
                        onPress={handleAddSet}
                        variant="success"
                      />
                    </View>
                  </ScrollView>
                </>
              ) : null}

              {summaryWorkout ? (
                <>
                  <Text style={styles.sheetLabel}>Сводка тренировки</Text>
                  <Text style={styles.sheetTitle}>{summaryWorkout.workoutName}</Text>
                  <Text style={styles.summaryHint}>
                    Проверьте сводку. После подтверждения мы завершим тренировку,
                    скопируем ее в буфер обмена и вернемся к списку.
                  </Text>

                  <ScrollView
                    contentContainerStyle={styles.summaryContent}
                    keyboardShouldPersistTaps="always"
                    showsVerticalScrollIndicator={false}
                  >
                    {summaryWorkout.details.map(({ exercise, sets }) => (
                      <View key={exercise} style={styles.summaryBlock}>
                        <Text style={styles.summaryExercise}>
                          {exercise}
                          {summaryWorkout.completedExercises.includes(exercise)
                            ? ' • выполнено'
                            : ''}
                        </Text>
                        {sets.length > 0 ? (
                          sets.map((set, index) => (
                            <Text
                              key={`${exercise}-${set.weight}-${set.count}-${index}`}
                              style={styles.summarySet}
                            >
                              {index + 1}. {set.weight} кг / {set.count}
                            </Text>
                          ))
                        ) : (
                          <Text style={styles.summaryEmpty}>Нет добавленных подходов</Text>
                        )}
                      </View>
                    ))}
                  </ScrollView>

                  <View style={styles.confirmActions}>
                    <Pressable
                      onPress={closeBottomSheet}
                      style={({ pressed }) => [
                        styles.confirmSecondaryButton,
                        pressed ? styles.confirmSecondaryButtonPressed : null,
                      ]}
                    >
                      <Text style={styles.confirmSecondaryText}>
                        Отмена
                      </Text>
                    </Pressable>
                    <Pressable
                      disabled={isSubmitting}
                      onPress={() => {
                        void confirmFinishWorkout();
                      }}
                      style={({ pressed }) => [
                        styles.confirmPrimaryButton,
                        pressed && !isSubmitting ? styles.confirmPrimaryButtonPressed : null,
                        isSubmitting ? styles.startButtonDisabled : null,
                      ]}
                    >
                      <Text style={styles.confirmPrimaryText}>
                        {isSubmitting
                          ? 'Завершаем...'
                          : 'Да, завершить'}
                      </Text>
                    </Pressable>
                  </View>
                </>
              ) : null}
            </Animated.View>
          </Animated.View>
        </View>
      </Modal>
    );
  }

  if (isBootstrapping) {
    return (
      <ScreenContainer>
        <View style={styles.centeredState}>
          <Text style={styles.sectionLabel}>Загрузка тренировок</Text>
          <Text style={styles.helperText}>
            Проверяем, есть ли активная тренировка.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  if (selectedWorkout) {
    const isActive = activeWorkout?.alias === selectedWorkout.alias;
    const completedExercises = activeWorkout?.completedExercises ?? [];

    return (
      <ScreenContainer>
        <View style={styles.screen}>
          <ScrollView
            contentContainerStyle={styles.detailScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.hero}>
              <Text style={styles.sectionLabel}>
                {isActive ? 'Активная тренировка' : 'Просмотр тренировки'}
              </Text>
              <Text style={styles.title}>{selectedWorkout.name}</Text>
              <Text style={styles.helperText}>
                {isActive
                  ? 'Пока тренировка активна, возвращение к списку недоступно.'
                  : 'Откройте список упражнений и запустите тренировку, когда будете готовы.'}
              </Text>
            </View>

            {!isActive ? (
              <Pressable
                onPress={() => setSelectedAlias(null)}
                style={({ pressed }) => [
                  styles.backButton,
                  pressed ? styles.backButtonPressed : null,
                ]}
              >
                <Text style={styles.backButtonText}>Назад к списку</Text>
              </Pressable>
            ) : null}

            <AppCard style={styles.detailCard}>
              <Text style={styles.cardLabel}>Упражнения</Text>
              <View style={styles.exerciseList}>
                {selectedWorkout.exercises.map((exercise, index) => (
                  <View key={`${selectedWorkout.alias}-${exercise}`} style={styles.exerciseCard}>
                    <View style={styles.exerciseRow}>
                      <View style={styles.exerciseMain}>
                        <Text style={styles.exerciseIndex}>
                          {String(index + 1).padStart(2, '0')}
                        </Text>
                        <Text style={styles.exerciseName}>{exercise}</Text>
                      </View>

                      {isActive ? (
                        <Pressable
                          onPress={() => {
                            void toggleExerciseCompleted(exercise);
                          }}
                          style={({ pressed }) => [
                            styles.checkbox,
                            completedExercises.includes(exercise) ? styles.checkboxChecked : null,
                            pressed ? styles.checkboxPressed : null,
                          ]}
                        >
                          {completedExercises.includes(exercise) ? (
                            <Text style={styles.checkboxMark}>✓</Text>
                          ) : null}
                        </Pressable>
                      ) : null}
                    </View>

                    {isActive ? (
                      <Pressable
                        onPress={() => openSetModal(exercise)}
                        style={({ pressed }) => [
                          styles.addSetButton,
                          pressed ? styles.addSetButtonPressed : null,
                        ]}
                      >
                        <Text style={styles.addSetButtonText}>Добавить подход</Text>
                      </Pressable>
                    ) : null}

                    {(activeWorkout?.exerciseLogs?.[exercise] ?? []).length > 0 ? (
                      <View style={styles.setList}>
                        {(activeWorkout?.exerciseLogs?.[exercise] ?? []).map((set, setIndex) => (
                          <Text
                            key={`${exercise}-${set.weight}-${set.count}-${setIndex}`}
                            style={styles.setText}
                          >
                            {set.weight} кг / {set.count}
                          </Text>
                        ))}
                      </View>
                    ) : null}
                  </View>
                ))}
              </View>
            </AppCard>
          </ScrollView>

          <View style={styles.detailFooter}>
            <AppButton
              disabled={isSubmitting}
              label={
                isSubmitting
                  ? isActive
                    ? 'Завершаем...'
                    : 'Запускаем...'
                  : isActive
                    ? 'Завершить тренировку'
                    : 'Старт тренировки'
              }
              onPress={
                isActive
                  ? () => {
                    void handleFinishWorkoutPress();
                  }
                  : () => handleStartWorkout(selectedWorkout)
              }
              variant={isActive ? 'primary' : 'success'}
            />
          </View>
        </View>

        {renderBottomSheet()}
        <Modal
          animationType="fade"
          onRequestClose={closeConfirmModal}
          transparent
          visible={isFinishConfirmVisible}
        >
          <View style={styles.confirmOverlay}>
            <Pressable onPress={closeConfirmModal} style={styles.confirmBackdrop} />
            <Animated.View
              style={[
                styles.confirmCard,
                {
                  transform: [{ translateY: confirmTranslateY }],
                },
              ]}
            >
              <View
                onMoveShouldSetResponder={() => true}
                onResponderGrant={handleConfirmDragStart}
                onResponderMove={handleConfirmDragMove}
                onResponderRelease={handleConfirmDragEnd}
                onResponderTerminate={handleConfirmDragEnd}
                onStartShouldSetResponder={() => true}
                style={styles.confirmHandleWrap}
              >
                <View style={styles.confirmHandle} />
              </View>
              <Text style={styles.confirmTitle}>Завершить тренировку?</Text>
              <Text style={styles.confirmText}>
                Проверьте, что все подходы внесены. После завершения откроется
                сводка.
              </Text>
              <View style={styles.confirmActions}>
                <Pressable
                  onPress={closeConfirmModal}
                  style={({ pressed }) => [
                    styles.confirmSecondaryButton,
                    pressed ? styles.confirmSecondaryButtonPressed : null,
                  ]}
                >
                  <Text style={styles.confirmSecondaryText}>Отмена</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setIsFinishConfirmVisible(false);
                    void handleFinishWorkout();
                  }}
                  style={({ pressed }) => [
                    styles.confirmPrimaryButton,
                    pressed ? styles.confirmPrimaryButtonPressed : null,
                  ]}
                >
                  <Text style={styles.confirmPrimaryText}>Да, завершить</Text>
                </Pressable>
              </View>
            </Animated.View>
          </View>
        </Modal>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.screen}>
        <View style={styles.hero}>
          <Text style={styles.sectionLabel}>План тренировок</Text>
          <Text style={styles.title}>Выберите тренировку</Text>
          <Text style={styles.helperText}>
            Одновременно может быть активна только одна тренировка.
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {workouts.map((workout) => (
            <AppCard key={workout.alias} style={styles.workoutCard}>
              <Pressable
                onPress={() => setSelectedAlias(workout.alias)}
                style={({ pressed }) => [
                  styles.workoutInfo,
                  pressed ? styles.cardPressablePressed : null,
                ]}
              >
                <Text style={styles.workoutName}>{workout.name}</Text>
                <Text style={styles.cardHint}>Открыть список упражнений</Text>
              </Pressable>

              <Pressable
                disabled={isSubmitting}
                onPress={() => handleStartWorkout(workout)}
                style={({ pressed }) => [
                  styles.startButton,
                  pressed && !isSubmitting ? styles.startButtonPressed : null,
                  isSubmitting ? styles.startButtonDisabled : null,
                ]}
              >
                <Text style={styles.startButtonText}>Старт</Text>
              </Pressable>
            </AppCard>
          ))}
        </ScrollView>
      </View>

      {renderBottomSheet()}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  addSetButton: {
    alignSelf: 'flex-start',
    borderColor: colors.borderStrong,
    borderWidth: 1,
    marginLeft: 36,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  addSetButtonPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  addSetButtonText: {
    color: colors.textPrimary,
    ...typography.sectionLabel,
    fontSize: 11,
  },
  backButton: {
    alignSelf: 'flex-start',
    borderColor: colors.borderStrong,
    borderWidth: 1,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backButtonPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  backButtonText: {
    color: colors.textPrimary,
    ...typography.sectionLabel,
    fontSize: 12,
  },
  cardHint: {
    color: colors.textSecondary,
    ...typography.caption,
    textAlign: 'left',
  },
  cardLabel: {
    color: colors.textSecondary,
    ...typography.sectionLabel,
  },
  cardPressablePressed: {
    opacity: 0.75,
  },
  checkbox: {
    alignItems: 'center',
    borderColor: colors.borderStrong,
    borderWidth: 2,
    height: 24,
    justifyContent: 'center',
    marginTop: 2,
    width: 24,
  },
  checkboxChecked: {
    backgroundColor: '#1F9D55',
    borderColor: '#1F9D55',
  },
  checkboxMark: {
    color: colors.textOnPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  checkboxPressed: {
    opacity: 0.8,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  confirmBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  confirmCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    marginHorizontal: spacing.lg,
    maxHeight: '85%',
    padding: spacing.lg,
  },
  confirmHandle: {
    alignSelf: 'center',
    backgroundColor: colors.borderStrong,
    borderRadius: 999,
    height: 5,
    width: 64,
  },
  confirmHandleWrap: {
    marginBottom: spacing.md,
    marginTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  confirmOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    flex: 1,
    justifyContent: 'center',
  },
  confirmPrimaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    flex: 1,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  confirmPrimaryButtonPressed: {
    backgroundColor: colors.primaryPressed,
  },
  confirmPrimaryText: {
    color: colors.textOnPrimary,
    ...typography.sectionLabel,
    fontSize: 12,
  },
  confirmSecondaryButton: {
    alignItems: 'center',
    borderColor: colors.borderStrong,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  confirmSecondaryButtonPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  confirmSecondaryText: {
    color: colors.textPrimary,
    ...typography.sectionLabel,
    fontSize: 12,
  },
  confirmText: {
    color: colors.textSecondary,
    ...typography.body,
  },
  confirmTitle: {
    color: colors.textAccent,
    ...typography.title,
    fontSize: 24,
    marginBottom: spacing.sm,
  },
  centeredState: {
    flex: 1,
    gap: spacing.sm,
    justifyContent: 'center',
  },
  detailCard: {
    paddingVertical: spacing.lg,
  },
  detailFooter: {
    backgroundColor: colors.background,
    paddingTop: spacing.md,
  },
  detailScrollContent: {
    paddingBottom: spacing.md,
  },
  exerciseCard: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingBottom: spacing.md,
  },
  exerciseIndex: {
    color: colors.primary,
    ...typography.sectionLabel,
    fontSize: 12,
    width: 28,
  },
  exerciseList: {
    gap: spacing.sm,
  },
  exerciseMain: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  exerciseName: {
    color: colors.textPrimary,
    flex: 1,
    ...typography.body,
  },
  exerciseRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  helperText: {
    color: colors.textSecondary,
    ...typography.body,
  },
  input: {
    borderColor: colors.borderStrong,
    borderWidth: 1,
    color: colors.textPrimary,
    ...typography.input,
    fontSize: 24,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  inputGroup: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  inputLabel: {
    color: colors.textSecondary,
    ...typography.sectionLabel,
  },
  hero: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  listContent: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  modalKeyboardAvoiding: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  modalRoot: {
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  screen: {
    flex: 1,
  },
  sectionLabel: {
    color: colors.textSecondary,
    ...typography.sectionLabel,
  },
  setList: {
    gap: spacing.xs,
    marginLeft: 36,
    marginTop: spacing.sm,
  },
  setText: {
    color: colors.textSecondary,
    ...typography.body,
    fontSize: 14,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  sheetButtonWrap: {
    marginTop: 'auto',
  },
  sheetFormContent: {
    flexGrow: 1,
    paddingBottom: spacing.md,
  },
  sheetHandle: {
    alignSelf: 'center',
    backgroundColor: colors.borderStrong,
    borderRadius: 999,
    height: 5,
    marginBottom: spacing.md,
    width: 64,
  },
  sheetHandleWrap: {
    alignSelf: 'stretch',
    marginHorizontal: -spacing.lg,
    minHeight: 48,
    paddingBottom: spacing.md,
    paddingTop: spacing.md,
  },
  sheetLabel: {
    color: colors.textSecondary,
    ...typography.sectionLabel,
    marginBottom: spacing.sm,
  },
  sheetTitle: {
    color: colors.textAccent,
    ...typography.title,
    fontSize: 26,
    marginBottom: spacing.xl,
  },
  startButton: {
    alignItems: 'center',
    backgroundColor: '#1F9D55',
    justifyContent: 'center',
    minHeight: 64,
    paddingHorizontal: spacing.md,
    width: 112,
  },
  startButtonDisabled: {
    opacity: 0.7,
  },
  startButtonPressed: {
    backgroundColor: '#188448',
  },
  startButtonText: {
    color: colors.textOnPrimary,
    ...typography.sectionLabel,
    fontSize: 13,
  },
  summaryBlock: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    gap: spacing.xs,
    paddingBottom: spacing.md,
  },
  summaryContent: {
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  summaryEmpty: {
    color: colors.textMuted,
    ...typography.body,
    fontSize: 14,
  },
  summaryExercise: {
    color: colors.textPrimary,
    ...typography.sectionLabel,
    fontSize: 13,
  },
  summaryHint: {
    color: colors.textSecondary,
    ...typography.body,
    marginBottom: spacing.lg,
  },
  summarySet: {
    color: colors.textPrimary,
    ...typography.body,
    fontSize: 14,
  },
  title: {
    color: colors.textAccent,
    ...typography.title,
    fontSize: 30,
  },
  workoutCard: {
    flexDirection: 'row',
    overflow: 'hidden',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  workoutInfo: {
    borderLeftColor: colors.primary,
    borderLeftWidth: 3,
    flex: 1,
    gap: spacing.xs,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  workoutName: {
    color: colors.textPrimary,
    ...typography.body,
    fontSize: 20,
    fontWeight: '700',
  },
});

