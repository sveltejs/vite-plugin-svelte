// Shared by the plugin and the settings view's client script (no Node imports)

/** The file personal inspector settings are saved to (Vite loads it; `*.local` is not committed) */
export const SETTINGS_FILE = '.env.local';

/** RPC actions of the settings view */
export const SAVE_SETTINGS = 'svelte:inspector:save-settings';
export const RESET_SETTINGS = 'svelte:inspector:reset-settings';
