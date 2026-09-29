/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { getOfflineSyncSummary, type OfflineSyncSummary } from '../services/offlineOutbox';
import { onSyncEvent, retrySyncAll, isSyncInProgress, type SyncEvent } from '../services/syncManager';

interface NetworkStatusIndicatorProps {
  userId?: string;
  compact?: boolean;
}

export default function NetworkStatusIndicator({ userId, compact = false }: NetworkStatusIndicatorProps) {
  const [isOnline, setIsOnline] = useState<boolean>(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isSyncing, setIsSyncing] = useState<boolean>(() => isSyncInProgress());
  const [summary, setSummary] = useState<OfflineSyncSummary>({
    pendingCount: 0,
    failedCount: 0,
    uploadsPendingCount: 0,
    uploadsFailedCount: 0,
    totalPending: 0,
    totalFailed: 0,
  });
  const [showPopover, setShowPopover] = useState(false);

  // Refresh summary metrics from IndexedDB
  const refreshSummary = async () => {
    try {
      const s = await getOfflineSyncSummary(userId);
      setSummary(s);
    } catch {
      // IndexedDB may not be available or initialized
    }
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    refreshSummary();

    // Listen to sync manager events
    const unsubscribe = onSyncEvent((event: SyncEvent) => {
      if (event.type === 'sync_start') {
        setIsSyncing(true);
      } else if (event.type === 'sync_complete') {
        setIsSyncing(false);
        if (event.summary) {
          setSummary(event.summary);
        } else {
          refreshSummary();
        }
      } else {
        refreshSummary();
      }
    });

    // Periodic check every 10 seconds for unsynced changes
    const interval = setInterval(refreshSummary, 10_000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
      clearInterval(interval);
    };
  }, [userId]);

  const handleRetry = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOnline) return;
    setIsSyncing(true);
    await retrySyncAll(userId);
    setIsSyncing(false);
    await refreshSummary();
  };

  const hasPending = summary.totalPending > 0;
  const hasFailed = summary.totalFailed > 0;

  if (compact) {
    return (
      <div className="relative inline-block">
        <button
          onClick={() => setShowPopover(!showPopover)}
          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors ${
            !isOnline
              ? 'border-brand-rose/30 bg-brand-rose/10 text-brand-rose'
              : isSyncing
              ? 'border-brand-amber/30 bg-brand-amber/10 text-brand-amber'
              : hasFailed
              ? 'border-brand-rose/30 bg-brand-rose/10 text-brand-rose'
              : hasPending
              ? 'border-brand-amber/30 bg-brand-amber/10 text-brand-amber'
              : 'border-brand-emerald/30 bg-brand-emerald/10 text-brand-emerald'
          }`}
          title={
            !isOnline
              ? 'Offline mode — changes stored locally'
              : isSyncing
              ? 'Syncing changes to cloud...'
              : hasPending
              ? `${summary.totalPending} change(s) waiting to sync`
              : 'Online & Synced'
          }
        >
          {isSyncing ? (
            <RefreshCw className="h-3 w-3 animate-spin text-brand-amber" />
          ) : !isOnline ? (
            <WifiOff className="h-3 w-3 text-brand-rose" />
          ) : (
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                hasFailed ? 'bg-brand-rose animate-pulse' : hasPending ? 'bg-brand-amber animate-pulse' : 'bg-brand-emerald'
              }`}
            />
          )}
          <span>
            {!isOnline
              ? 'Offline'
              : isSyncing
              ? 'Syncing...'
              : hasPending
              ? `${summary.totalPending} Pending`
              : 'Online'}
          </span>
        </button>

        {/* Popover detailed info */}
        {showPopover && (
          <div className="glass-panel absolute right-0 top-full z-50 mt-2 w-64 space-y-3 p-3.5 shadow-xl text-ink">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <Wifi className="h-4 w-4 text-brand-emerald" />
                ) : (
                  <WifiOff className="h-4 w-4 text-brand-rose" />
                )}
                <span className="font-display text-xs font-semibold">
                  Network Status: {isOnline ? 'Connected' : 'Offline'}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between text-muted">
                <span>Pending Operations:</span>
                <span className="font-bold text-ink">{summary.pendingCount}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Pending File Uploads:</span>
                <span className="font-bold text-ink">{summary.uploadsPendingCount}</span>
              </div>
              {summary.totalFailed > 0 && (
                <div className="flex justify-between text-brand-rose">
                  <span>Failed Retries:</span>
                  <span className="font-bold">{summary.totalFailed}</span>
                </div>
              )}
            </div>

            {isOnline && (hasPending || hasFailed) && (
              <button
                onClick={handleRetry}
                disabled={isSyncing}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-brand-cyan/20 border border-brand-cyan/40 px-3 py-1.5 font-display text-xs font-semibold text-brand-cyan hover:bg-brand-cyan/30 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing Now...' : 'Sync Now'}</span>
              </button>
            )}

            {!isOnline && (
              <p className="text-[10px] text-faint leading-relaxed">
                Changes saved locally to IndexedDB outbox. Automatic sync will resume when connection is restored.
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  // Full banner / inline card display
  return (
    <div
      className={`rounded-xl border p-3 font-sans transition-colors ${
        !isOnline
          ? 'border-brand-rose/30 bg-brand-rose/5 text-ink'
          : isSyncing
          ? 'border-brand-amber/30 bg-brand-amber/5 text-ink'
          : hasFailed
          ? 'border-brand-rose/30 bg-brand-rose/5 text-ink'
          : hasPending
          ? 'border-brand-amber/30 bg-brand-amber/5 text-ink'
          : 'border-brand-emerald/30 bg-brand-emerald/5 text-ink'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {!isOnline ? (
            <WifiOff className="h-4 w-4 text-brand-rose shrink-0" />
          ) : isSyncing ? (
            <RefreshCw className="h-4 w-4 text-brand-amber animate-spin shrink-0" />
          ) : hasFailed ? (
            <AlertTriangle className="h-4 w-4 text-brand-rose shrink-0" />
          ) : hasPending ? (
            <RefreshCw className="h-4 w-4 text-brand-amber shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-brand-emerald shrink-0" />
          )}

          <div>
            <div className="font-display text-xs font-semibold">
              {!isOnline
                ? 'Working Offline'
                : isSyncing
                ? 'Syncing offline changes...'
                : hasFailed
                ? 'Sync items require attention'
                : hasPending
                ? `${summary.totalPending} pending change(s) to sync`
                : 'All changes synced'}
            </div>
            <p className="font-mono text-[10px] text-muted">
              {!isOnline
                ? `${summary.totalPending} change(s) stored locally in IndexedDB outbox`
                : isSyncing
                ? 'Sending queued operations to Firestore & Azure'
                : hasPending
                ? 'Will sync automatically in background'
                : 'Connected to Firebase & Azure Blob Cloud'}
            </p>
          </div>
        </div>

        {isOnline && (hasPending || hasFailed) && (
          <button
            onClick={handleRetry}
            disabled={isSyncing}
            className="flex items-center gap-1 rounded-lg border border-brand-cyan/40 bg-brand-cyan/10 px-2.5 py-1 font-mono text-[11px] font-semibold text-brand-cyan hover:bg-brand-cyan/20 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        )}
      </div>
    </div>
  );
}
