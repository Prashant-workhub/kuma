/**
 * Project Kuma — Network & Offline Sync Status Indicator
 * 
 * Renders persistent connection status:
 *   - "Online"
 *   - "Offline · X changes to sync"
 *   - "Syncing..."
 *   - "Sync failed · Retry"
 * 
 * Opens an interactive popover showing queued outbox operations and LRU storage usage.
 */

import React, { useState, useEffect } from 'react';
import { subscribeSyncStatus, getSyncEngineStatus, flushOutbox, SyncEngineStatus } from '../offline/syncEngine';
import { getOfflineResourceStorageUsage, MAX_RESOURCE_STORAGE_BYTES, clearOfflineStores } from '../offline/db';
import { Wifi, WifiOff, RefreshCw, AlertTriangle, HardDrive, CheckCircle2, ChevronDown, Trash2 } from 'lucide-react';

interface NetworkStatusIndicatorProps {
  userId?: string;
  compact?: boolean;
}

export default function NetworkStatusIndicator({ userId }: NetworkStatusIndicatorProps) {
  const [status, setStatus] = useState<SyncEngineStatus>(getSyncEngineStatus());
  const [storageBytes, setStorageBytes] = useState<number>(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  useEffect(() => {
    const unsub = subscribeSyncStatus((newStatus) => {
      setStatus(newStatus);
    });

    getOfflineResourceStorageUsage().then(setStorageBytes).catch(() => {});

    const interval = setInterval(() => {
      getOfflineResourceStorageUsage().then(setStorageBytes).catch(() => {});
    }, 10000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  const handleManualRetry = async () => {
    setIsManualSyncing(true);
    try {
      await flushOutbox(userId);
    } finally {
      setIsManualSyncing(false);
      getOfflineResourceStorageUsage().then(setStorageBytes).catch(() => {});
    }
  };

  const handleClearCache = async () => {
    if (window.confirm('Clear all offline course caches and stored resource blobs?')) {
      await clearOfflineStores();
      setStorageBytes(0);
      setStatus(getSyncEngineStatus());
    }
  };

  const formatMb = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(1);
  };

  // Compute status pill colors and labels
  let pillBg = 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300';
  let dotColor = 'bg-emerald-500';
  let label = 'Online';
  let Icon = Wifi;

  if (status.state === 'syncing' || isManualSyncing) {
    pillBg = 'bg-sky-500/15 border-sky-500/40 text-sky-700 dark:text-sky-300';
    dotColor = 'bg-sky-500 animate-ping';
    label = 'Syncing...';
    Icon = RefreshCw;
  } else if (status.state === 'offline') {
    pillBg = 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300';
    dotColor = 'bg-amber-500';
    label = status.pendingCount > 0 ? `Offline · ${status.pendingCount} changes to sync` : 'Offline';
    Icon = WifiOff;
  } else if (status.state === 'failed') {
    pillBg = 'bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-300';
    dotColor = 'bg-rose-500';
    label = 'Sync failed · Retry';
    Icon = AlertTriangle;
  }

  return (
    <div className="relative inline-block text-left select-none font-mono">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold transition-all cursor-pointer ${pillBg}`}
        title="Click to view offline storage and outbox status"
      >
        <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
        <Icon className={`w-3.5 h-3.5 shrink-0 ${status.state === 'syncing' || isManualSyncing ? 'animate-spin' : ''}`} />
        <span>{label}</span>
        <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
      </button>

      {/* Popover Details */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 p-3.5 rounded-[9px] border-2 border-[var(--border-main)] bg-[var(--card-bg)] text-[var(--text-primary)] shadow-paper-md z-50 space-y-3">
          <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-2">
            <span className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-[#FFC400]" /> Offline Sync Manager
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-secondary)]">Network Status:</span>
              <span className="font-bold uppercase flex items-center gap-1">
                {status.state === 'offline' ? (
                  <span className="text-amber-500">Offline</span>
                ) : (
                  <span className="text-emerald-500">Connected</span>
                )}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[var(--text-secondary)]">Queued Outbox Ops:</span>
              <span className="font-bold">{status.pendingCount} pending</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[var(--text-secondary)]">Resource Storage Used:</span>
              <span className="font-bold">
                {formatMb(storageBytes)} MB / {formatMb(MAX_RESOURCE_STORAGE_BYTES)} MB
              </span>
            </div>

            {status.lastError && (
              <div className="p-2 rounded bg-rose-500/10 border border-rose-500/30 text-rose-500 text-[10px] leading-tight">
                <strong>Sync Error:</strong> {status.lastError}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex flex-col gap-1.5 border-t border-[var(--border-main)]">
            <button
              type="button"
              onClick={handleManualRetry}
              disabled={isManualSyncing || status.state === 'offline'}
              className="w-full py-1.5 px-3 rounded bg-[#FFC400] text-[#111111] font-bold text-xs uppercase border border-[var(--border-main)] shadow-paper-sm hover:bg-[#ffe066] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isManualSyncing ? 'animate-spin' : ''}`} />
              <span>{isManualSyncing ? 'Syncing Outbox...' : 'Sync Outbox Now'}</span>
            </button>

            <button
              type="button"
              onClick={handleClearCache}
              className="w-full py-1 px-3 rounded bg-[var(--bg-main)] text-[var(--text-secondary)] hover:text-rose-500 font-bold text-[10px] uppercase border border-[var(--border-main)] cursor-pointer flex items-center justify-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear Offline Caches</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
