import { RobloxElement, RootProperties, ViewportState, GridSettings, GuiRootType, ModifierType } from '../types/roblox';
import { sanitizeHierarchy } from './hierarchy';

export const AUTOSAVE_CACHE_KEY = 'roblox_gui_studio_autosave_v1';
export const AUTOSAVE_SETTINGS_KEY = 'roblox_gui_studio_autosave_settings_v1';

export interface AutosaveCachePayload {
  app: 'RobloxStudioGuiCreator';
  version: number;
  timestamp: number;
  savedAtISO: string;
  rootType: GuiRootType;
  rootProperties: RootProperties;
  viewport: ViewportState;
  elements: RobloxElement[];
  selectedId: string | null;
  selectedModifierKey: ModifierType | null;
  gridSettings: GridSettings;
  isAudioEnabled?: boolean;
}

export interface AutosaveSettings {
  enabled: boolean;
}

/**
 * Saves current GUI project state to local browser cache (localStorage).
 * Executes synchronously with error handling for quota limits.
 */
export function saveToLocalCache(
  data: Omit<AutosaveCachePayload, 'app' | 'version' | 'timestamp' | 'savedAtISO'>
): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }

    const payload: AutosaveCachePayload = {
      app: 'RobloxStudioGuiCreator',
      version: 1,
      timestamp: Date.now(),
      savedAtISO: new Date().toISOString(),
      rootType: data.rootType,
      rootProperties: data.rootProperties,
      viewport: data.viewport,
      elements: sanitizeHierarchy(data.elements || []),
      selectedId: data.selectedId,
      selectedModifierKey: data.selectedModifierKey,
      gridSettings: data.gridSettings,
      isAudioEnabled: data.isAudioEnabled
    };

    window.localStorage.setItem(AUTOSAVE_CACHE_KEY, JSON.stringify(payload));
    return true;
  } catch (err) {
    console.warn('Failed to autosave project to computer cache:', err);
    return false;
  }
}

/**
 * Loads cached GUI project state from local computer storage.
 * Automatically sanitizes elements against cycles or missing parents.
 */
export function loadFromLocalCache(): AutosaveCachePayload | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }

    const raw = window.localStorage.getItem(AUTOSAVE_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as AutosaveCachePayload;
    if (!parsed || !Array.isArray(parsed.elements)) {
      return null;
    }

    return {
      ...parsed,
      elements: sanitizeHierarchy(parsed.elements)
    };
  } catch (err) {
    console.warn('Failed to load autosaved project from computer cache:', err);
    return null;
  }
}

/**
 * Clears the local autosaved cache.
 */
export function clearLocalCache(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(AUTOSAVE_CACHE_KEY);
    }
  } catch (err) {
    console.warn('Failed to clear autosaved cache:', err);
  }
}

/**
 * Checks metadata of the cached session without parsing heavy payloads.
 */
export function getAutosaveMetadata(): {
  exists: boolean;
  timestamp?: number;
  elementCount?: number;
  rootType?: GuiRootType;
} {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return { exists: false };
    }

    const raw = window.localStorage.getItem(AUTOSAVE_CACHE_KEY);
    if (!raw) return { exists: false };

    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.elements)) {
      return { exists: false };
    }

    return {
      exists: true,
      timestamp: parsed.timestamp,
      elementCount: parsed.elements.length,
      rootType: parsed.rootType
    };
  } catch {
    return { exists: false };
  }
}

/**
 * Gets user preference for autosaving (enabled by default).
 */
export function getAutosaveSetting(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return true;
    }
    const val = window.localStorage.getItem(AUTOSAVE_SETTINGS_KEY);
    if (val === null) return true;
    return val === 'true';
  } catch {
    return true;
  }
}

/**
 * Sets user preference for autosaving.
 */
export function setAutosaveSetting(enabled: boolean): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(AUTOSAVE_SETTINGS_KEY, String(enabled));
    }
  } catch (err) {
    console.warn('Failed to save autosave setting:', err);
  }
}

/**
 * Formats a timestamp into a human-readable "time ago" string.
 */
export function formatTimeAgo(timestamp?: number): string {
  if (!timestamp) return 'Never';
  const diffMs = Date.now() - timestamp;
  if (diffMs < 3000) return 'Just now';
  const secs = Math.floor(diffMs / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(timestamp).toLocaleDateString();
}
