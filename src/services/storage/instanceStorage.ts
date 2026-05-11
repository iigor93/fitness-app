import { storageKeys } from '../../constants/storageKeys';
import { loadItem, removeItem, saveItem } from './localStorage';

export type AppInstance = {
  name: string;
  uuid: string;
};

export async function loadAppInstance() {
  return loadItem<AppInstance>(storageKeys.instance);
}

export async function saveAppInstance(instance: AppInstance) {
  await saveItem(storageKeys.instance, instance);
}

export async function clearAppInstance() {
  await removeItem(storageKeys.instance);
}
