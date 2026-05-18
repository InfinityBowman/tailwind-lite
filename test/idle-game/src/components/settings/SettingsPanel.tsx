/**
 * Settings Panel
 * Account management, game settings, and keyboard shortcuts
 */

import React, { useState } from 'react';
import { useGame } from '../../contexts/GameEngineContext';
import { useAuth } from '../../hooks/useAuth';
import { KEYBOARD_SHORTCUTS } from '../../hooks/useKeyboardShortcuts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Settings,
  Keyboard,
  Save,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  Check,
  Copy,
  ScrollText,
  User,
  Gem,
  Cloud,
  Edit2,
  X,
} from 'lucide-react';
import Changelog from './Changelog';

const SettingsPanel: React.FC = () => {
  const { save, reset, exportSave, importSave } = useGame();
  const { user, isAuthenticated, updateDisplayName } = useAuth();
  const [importValue, setImportValue] = useState('');
  const [exportValue, setExportValue] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [copyStatus, setCopyStatus] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Account editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const [nameUpdateStatus, setNameUpdateStatus] = useState<'idle' | 'saving' | 'error'>('idle');

  const handleNameEdit = () => {
    setEditNameValue(user?.displayName || '');
    setIsEditingName(true);
  };

  const handleNameSave = async () => {
    if (!editNameValue.trim()) return;

    setNameUpdateStatus('saving');
    try {
      await updateDisplayName(editNameValue.trim());
      setIsEditingName(false);
      setNameUpdateStatus('idle');
    } catch {
      setNameUpdateStatus('error');
      setTimeout(() => setNameUpdateStatus('idle'), 2000);
    }
  };

  const handleNameCancel = () => {
    setIsEditingName(false);
    setEditNameValue('');
  };

  const handleSave = () => {
    setSaveStatus('saving');
    const success = save();
    if (success) {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } else {
      setSaveStatus('idle');
    }
  };

  const handleExport = () => {
    const data = exportSave();
    setExportValue(data);
  };

  const handleCopy = async () => {
    if (exportValue) {
      await navigator.clipboard.writeText(exportValue);
      setCopyStatus(true);
      setTimeout(() => setCopyStatus(false), 2000);
    }
  };

  const handleImport = () => {
    if (importValue.trim()) {
      const success = importSave(importValue.trim());
      if (success) {
        setImportValue('');
        alert('Save imported successfully!');
      } else {
        alert('Failed to import save. Please check the data.');
      }
    }
  };

  const handleReset = () => {
    reset();
    setShowResetConfirm(false);
  };

  return (
    <div className="flex flex-col gap-4 p-4 max-w-2xl mx-auto">
      {/* Header - compact */}
      <div className="flex items-center gap-2 mb-2">
        <Settings className="w-5 h-5 text-cyan-400" />
        <h1 className="text-lg font-bold font-mono text-cyan-400">SETTINGS</h1>
        <span className="text-[10px] text-slate-600 font-mono">// System configuration</span>
      </div>

      {/* Account Section */}
      <Card className="bg-slate-900/80 border-slate-700/50">
        <CardHeader className="p-3 pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-mono">
            <User className="w-4 h-4 text-slate-400" />
            ACCOUNT
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 space-y-3">
          {isAuthenticated && user ? (
            <>
              {/* Display Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-500 uppercase">
                  Display Name
                </label>
                {isEditingName ? (
                  <div className="flex gap-1.5">
                    <Input
                      value={editNameValue}
                      onChange={e => setEditNameValue(e.target.value)}
                      placeholder="Enter display name"
                      maxLength={30}
                      className="flex-1 h-7 text-xs bg-slate-800 border-slate-700"
                    />
                    <Button
                      onClick={handleNameSave}
                      size="sm"
                      className="h-7 text-xs"
                      disabled={nameUpdateStatus === 'saving'}
                    >
                      {nameUpdateStatus === 'saving' ? '...' : 'Save'}
                    </Button>
                    <Button
                      onClick={handleNameCancel}
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-slate-300">{user.displayName || 'Player'}</span>
                    <Button
                      onClick={handleNameEdit}
                      size="sm"
                      variant="ghost"
                      className="h-5 w-5 p-0"
                    >
                      <Edit2 className="w-2.5 h-2.5" />
                    </Button>
                  </div>
                )}
                {nameUpdateStatus === 'error' && (
                  <p className="text-[10px] text-red-400 font-mono">// ERROR: Failed to update</p>
                )}
              </div>

              <Separator className="bg-slate-700/50" />

              {/* Account Type + Crystals in single row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {user.email ? (
                    <Badge
                      variant="outline"
                      className="gap-1 text-[10px] h-5 font-mono border-slate-700"
                    >
                      <Cloud className="w-2.5 h-2.5" />
                      {user.email}
                    </Badge>
                  ) : user.isAnonymous ? (
                    <Badge
                      variant="secondary"
                      className="text-[10px] h-5 font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30"
                    >
                      GUEST
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] h-5 font-mono">
                      CONNECTED
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <Gem className="w-3 h-3 text-purple-400" />
                  <span className="text-slate-300 font-mono tabular-nums">
                    {user.crystals.toLocaleString()}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-2">
              <p className="text-xs text-slate-500 font-mono mb-2">
                // Sign in for cloud sync & leaderboards
              </p>
              <Badge
                variant="secondary"
                className="gap-1 text-[10px] font-mono bg-slate-800 border-slate-700"
              >
                <Cloud className="w-2.5 h-2.5" />
                LOCAL_SAVE_ONLY
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Management */}
      <Card className="bg-slate-900/80 border-slate-700/50">
        <CardHeader className="p-3 pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-mono">
            <Save className="w-4 h-4 text-slate-400" />
            SAVE_MANAGEMENT
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 space-y-3">
          {/* Save button + status */}
          <div className="flex items-center gap-2">
            <Button onClick={handleSave} size="sm" className="gap-1.5 h-7 text-xs font-mono">
              {saveStatus === 'saving' ? (
                'SAVING...'
              ) : saveStatus === 'saved' ? (
                <>
                  <Check className="w-3 h-3" />
                  SAVED
                </>
              ) : (
                <>
                  <Save className="w-3 h-3" />
                  SAVE_NOW
                </>
              )}
            </Button>
            <span className="text-[10px] text-slate-600 font-mono">// Auto-saves every 30s</span>
          </div>

          <Separator className="bg-slate-700/50" />

          {/* Export/Import row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 uppercase">
                <Download className="w-3 h-3" />
                Export
              </label>
              <div className="flex gap-1">
                <Button
                  onClick={handleExport}
                  variant="outline"
                  size="sm"
                  className="h-6 text-[10px] font-mono border-slate-700"
                >
                  GENERATE
                </Button>
                {exportValue && (
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    size="sm"
                    className="h-6 text-[10px] font-mono gap-1 border-slate-700"
                  >
                    {copyStatus ? (
                      <Check className="w-2.5 h-2.5" />
                    ) : (
                      <Copy className="w-2.5 h-2.5" />
                    )}
                    {copyStatus ? 'OK' : 'COPY'}
                  </Button>
                )}
              </div>
              {exportValue && (
                <Textarea
                  value={exportValue}
                  readOnly
                  className="h-16 text-[10px] bg-slate-800 border-slate-700 font-mono"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 uppercase">
                <Upload className="w-3 h-3" />
                Import
              </label>
              <Textarea
                value={importValue}
                onChange={e => setImportValue(e.target.value)}
                placeholder="Paste save data..."
                className="h-16 text-[10px] bg-slate-800 border-slate-700 font-mono"
              />
              <Button
                onClick={handleImport}
                variant="outline"
                size="sm"
                className="h-6 text-[10px] font-mono border-slate-700"
                disabled={!importValue.trim()}
              >
                IMPORT
              </Button>
            </div>
          </div>

          <Separator className="bg-slate-700/50" />

          {/* Reset - compact danger zone */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Trash2 className="w-3 h-3 text-red-400" />
              <span className="text-[10px] font-mono text-red-400 uppercase">Reset Game</span>
            </div>
            {!showResetConfirm ? (
              <Button
                variant="destructive"
                size="sm"
                className="h-6 text-[10px] font-mono gap-1"
                onClick={() => setShowResetConfirm(true)}
              >
                <AlertTriangle className="w-2.5 h-2.5" />
                DELETE_ALL
              </Button>
            ) : (
              <div className="flex gap-1.5 items-center">
                <span className="text-[10px] text-red-400 font-mono">CONFIRM?</span>
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-6 text-[10px] font-mono"
                  onClick={handleReset}
                >
                  YES
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-[10px] font-mono border-slate-700"
                  onClick={() => setShowResetConfirm(false)}
                >
                  NO
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Keyboard Shortcuts */}
      <Card className="bg-slate-900/80 border-slate-700/50">
        <CardHeader className="p-3 pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-mono">
            <Keyboard className="w-4 h-4 text-slate-400" />
            KEYBINDS
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {KEYBOARD_SHORTCUTS.map(shortcut => (
              <div
                key={shortcut.key}
                className="flex items-center justify-between p-1.5 rounded bg-slate-800/50 border border-slate-700/30"
              >
                <span className="text-[10px] text-slate-400">{shortcut.description}</span>
                <Badge variant="outline" className="font-mono text-[9px] h-4 px-1 border-slate-600">
                  {shortcut.key}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Changelog */}
      <Card className="bg-slate-900/80 border-slate-700/50">
        <CardHeader className="p-3 pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-mono">
            <ScrollText className="w-4 h-4 text-slate-400" />
            CHANGELOG
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <Changelog />
        </CardContent>
      </Card>

      {/* Version Info - compact footer */}
      <div className="flex items-center justify-between text-[10px] text-slate-600 font-mono px-1">
        <span>SPACE_FARMING_SIM</span>
        <Badge
          variant="secondary"
          className="h-4 text-[9px] font-mono bg-slate-800 border-slate-700"
        >
          v0.3.0
        </Badge>
      </div>
    </div>
  );
};

export default SettingsPanel;
