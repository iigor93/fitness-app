import AsyncStorage from '@react-native-async-storage/async-storage';

export async function saveItem<T>(key: string, value: T) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function loadItem<T>(key: string): Promise<T | null> {
  const rawValue = await AsyncStorage.getItem(key);

  if (!rawValue) {
    return null;
  }

  return JSON.parse(rawValue) as T;
}

export async function removeItem(key: string) {
  await AsyncStorage.removeItem(key);
}
