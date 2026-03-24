import { registerRootComponent } from 'expo';

import App from './App';

// Log fatal JS errors clearly (often reported as "app closed" on emulator).
// Does not fix native crashes, but catches many permission/API shape bugs.
const g = globalThis as typeof globalThis & {
  ErrorUtils?: {
    getGlobalHandler: () => ((error: Error, isFatal?: boolean) => void) | undefined;
    setGlobalHandler: (handler: (error: Error, isFatal?: boolean) => void) => void;
  };
};
if (g.ErrorUtils) {
  const prev = g.ErrorUtils.getGlobalHandler();
  g.ErrorUtils.setGlobalHandler((error, isFatal) => {
    console.error('[Global JS]', isFatal ? 'FATAL' : 'error', error?.message, error);
    prev?.(error, isFatal);
  });
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
