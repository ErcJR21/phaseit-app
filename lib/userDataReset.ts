import { clearPersistedUserData } from './userDataStorage';

type UserDataResetHandler = () => void | Promise<void>;

const resetHandlers = new Set<UserDataResetHandler>();

export function registerUserDataReset(handler: UserDataResetHandler): () => void {
  resetHandlers.add(handler);
  return () => resetHandlers.delete(handler);
}

/** Clears persisted storage and resets in-memory context state via registered handlers. */
export async function resetAllUserData(): Promise<void> {
  await clearPersistedUserData();

  await Promise.all(
    [...resetHandlers].map(async (handler) => {
      await handler();
    }),
  );
}
