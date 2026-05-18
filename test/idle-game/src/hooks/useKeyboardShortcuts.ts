/**
 * Keyboard Shortcuts Hook
 * Provides global keyboard shortcuts for common actions
 *
 * Navigation:
 * - P: Planets
 * - G: Gacha
 * - R: Research
 * - Q: Quests
 * - E: Events
 * - A: Achievements
 *
 * Actions:
 * - Ctrl+S: Save game
 * - M: Toggle menu/sidebar
 * - 1-9: Quick select planet
 * - Escape: Close modals/dialogs
 */

import { useEffect, useCallback } from 'react';

interface UseKeyboardShortcutsOptions {
  onSave?: () => void;
  onToggleSidebar?: () => void;
  onSelectPlanet?: (index: number) => void;
  onNavigate?: (path: string) => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  onSave,
  onToggleSidebar,
  onSelectPlanet,
  onNavigate,
  enabled = true,
}: UseKeyboardShortcutsOptions = {}) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore if typing in an input
      const target = e.target as HTMLElement;
      const tagName = target.tagName?.toLowerCase();
      if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
        return;
      }

      // Ignore if modifier keys are pressed (except for specific combos)
      if (e.altKey) return;

      // Handle Ctrl/Cmd shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 's':
            e.preventDefault();
            onSave?.();
            break;
        }
        return;
      }

      // Handle single key shortcuts
      switch (e.key.toLowerCase()) {
        case 'g':
          // Go to Gacha
          onNavigate?.('/play/farming/gacha');
          break;

        case 'p':
          // Go to Planets
          onNavigate?.('/play/farming/planets');
          break;

        case 'r':
          // Go to Research
          onNavigate?.('/play/research');
          break;

        case 'q':
          // Go to Quests
          onNavigate?.('/play/quests');
          break;

        case 'e':
          // Go to Events
          onNavigate?.('/play/events');
          break;

        case 'a':
          // Go to Achievements
          onNavigate?.('/play/achievements');
          break;

        case 'm':
          // Toggle sidebar/menu
          onToggleSidebar?.();
          break;

        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9': {
          // Quick select planet
          const planetIndex = parseInt(e.key) - 1;
          onSelectPlanet?.(planetIndex);
          break;
        }
      }
    },
    [onSave, onToggleSidebar, onSelectPlanet, onNavigate]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleKeyDown]);
}

/**
 * Display keyboard shortcut hints
 */
export const KEYBOARD_SHORTCUTS = [
  { key: 'P', description: 'Planets' },
  { key: 'G', description: 'Gacha' },
  { key: 'R', description: 'Research' },
  { key: 'Q', description: 'Quests' },
  { key: 'E', description: 'Events' },
  { key: 'A', description: 'Achievements' },
  { key: 'M', description: 'Toggle Menu' },
  { key: 'Ctrl+S', description: 'Save Game' },
  { key: '1-9', description: 'Quick Select Planet' },
  { key: 'Esc', description: 'Close Dialog' },
] as const;
