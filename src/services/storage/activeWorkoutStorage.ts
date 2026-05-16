import { storageKeys } from '../../constants/storageKeys';
import type { ActiveWorkout } from '../../types/workout';
import { loadItem, removeItem, saveItem } from './localStorage';

export async function loadActiveWorkout() {
  return loadItem<ActiveWorkout>(storageKeys.activeWorkout);
}

export async function saveActiveWorkout(activeWorkout: ActiveWorkout) {
  await saveItem(storageKeys.activeWorkout, activeWorkout);
}

export async function clearActiveWorkout() {
  await removeItem(storageKeys.activeWorkout);
}
