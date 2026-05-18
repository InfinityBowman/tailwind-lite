/**
 * Save Manager - LocalStorage persistence
 */

import { GameState } from '../state/GameState';
import { SAVE_CONFIG } from '../config/balance';
import { eventBus } from './EventBus';

export interface SaveData {
  version: number;
  timestamp: number;
  state: GameState;
}

export class SaveManager {
  private storageKey: string;
  private currentVersion: number;

  constructor(
    storageKey: string = SAVE_CONFIG.STORAGE_KEY,
    version: number = SAVE_CONFIG.CURRENT_VERSION
  ) {
    this.storageKey = storageKey;
    this.currentVersion = version;
  }

  /**
   * Save game state to localStorage
   */
  save(state: GameState): boolean {
    try {
      const saveData: SaveData = {
        version: this.currentVersion,
        timestamp: Date.now(),
        state: {
          ...state,
          lastSaveTime: Date.now(),
        },
      };

      const json = JSON.stringify(saveData);
      localStorage.setItem(this.storageKey, json);

      eventBus.emit('gameSaved', { timestamp: saveData.timestamp });
      return true;
    } catch (error) {
      console.error('Failed to save game:', error);
      return false;
    }
  }

  /**
   * Load game state from localStorage
   * Returns null if no save exists or save is corrupted
   */
  load(): GameState | null {
    try {
      const json = localStorage.getItem(this.storageKey);
      if (!json) {
        return null;
      }

      const saveData: SaveData = JSON.parse(json);

      // Version migration (future-proofing)
      if (saveData.version < this.currentVersion) {
        return this.migrate(saveData);
      }

      // Validate structure
      if (!this.validateSaveData(saveData)) {
        console.warn('Save data validation failed, returning null');
        return null;
      }

      eventBus.emit('gameLoaded', { timestamp: saveData.timestamp });
      return saveData.state;
    } catch (error) {
      console.error('Failed to load game:', error);
      return null;
    }
  }

  /**
   * Check if a save exists
   */
  hasSave(): boolean {
    return localStorage.getItem(this.storageKey) !== null;
  }

  /**
   * Delete save data
   */
  deleteSave(): void {
    localStorage.removeItem(this.storageKey);
  }

  /**
   * Calculate offline progress time in seconds
   */
  getOfflineTime(state: GameState): number {
    const now = Date.now();
    const lastSave = state.lastSaveTime || now;
    const offlineMs = now - lastSave;
    return Math.max(0, offlineMs / 1000);
  }

  /**
   * Migrate old save versions to current
   * Note: Game is pre-production with no existing saves to migrate.
   * This infrastructure is kept for future use when save format changes.
   */
  private migrate(saveData: SaveData): GameState {
    console.warn(`Migrating save from v${saveData.version} to v${this.currentVersion}`);
    return saveData.state;
  }

  /**
   * Validate save data structure
   */
  private validateSaveData(saveData: SaveData): boolean {
    if (!saveData || typeof saveData !== 'object') return false;
    if (typeof saveData.version !== 'number') return false;
    if (typeof saveData.timestamp !== 'number') return false;
    if (!saveData.state || typeof saveData.state !== 'object') return false;

    const state = saveData.state;
    if (!Array.isArray(state.planets)) return false;
    if (!state.ship || typeof state.ship !== 'object') return false;
    if (!state.modifiers || typeof state.modifiers !== 'object') return false;

    // Note: achievements may not exist in older saves (will be migrated)

    return true;
  }

  /**
   * Export save as downloadable JSON
   */
  exportSave(state: GameState): string {
    const saveData: SaveData = {
      version: this.currentVersion,
      timestamp: Date.now(),
      state,
    };
    return JSON.stringify(saveData, null, 2);
  }

  /**
   * Import save from JSON string
   */
  importSave(json: string): GameState | null {
    try {
      const saveData: SaveData = JSON.parse(json);
      if (!this.validateSaveData(saveData)) {
        return null;
      }
      return saveData.state;
    } catch {
      return null;
    }
  }
}

// Singleton instance
export const saveManager = new SaveManager();
