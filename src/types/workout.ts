export type Workout = {
  alias: string;
  exercises: string[];
  name: string;
};

export type WorkoutCatalog = {
  workouts: Workout[];
};

export type ExerciseSet = {
  count: number;
  weight: number;
};

export type ActiveWorkout = {
  alias: string;
  completedExercises?: string[];
  exerciseLogs?: Record<string, ExerciseSet[]>;
};
