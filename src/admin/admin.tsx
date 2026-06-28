import type { Component } from 'solid-js';
import { createSignal, onMount, Show } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import type { FamilyChoresData } from '../types/chore-types';
import { TimeFormat } from '../types/chore-types';
import { formatTime } from '../utils/browser';
import AdminContext, { type AdminContextValue } from './admin-context';
import { MainPage } from './main-page';

// API base URL
const API_BASE = '/MMM-FamilyChores';

export const Admin: Component<Record<string, never>> = () => {
  const [choreData, setChoreData] = createStore<{ data: FamilyChoresData | null }>({ data: null });
  const [loading, setLoading] = createSignal(true);
  const [retryCount, setRetryCount] = createSignal(0);
  const [cachedPin, setCachedPin] = createSignal('');

  let pinTimeout: ReturnType<typeof setTimeout> | null = null;

  const pinRequired = () => !!choreData.data?.settings?.adminPin;

  const resolvedTimeFormat = (): TimeFormat.HOUR_12 | TimeFormat.HOUR_24 => {
    const setting = choreData.data?.settings?.timeFormat ?? TimeFormat.SYSTEM;
    if (setting === TimeFormat.SYSTEM) {
      // Use formatTime to detect system preference (passing '00:00' and checking the result)
      return formatTime('00:00', TimeFormat.SYSTEM) === '00:00'
        ? TimeFormat.HOUR_24
        : TimeFormat.HOUR_12;
    }
    return setting === TimeFormat.HOUR_12 ? TimeFormat.HOUR_12 : TimeFormat.HOUR_24;
  };

  const setCachedPinWithTimeout = (pin: string) => {
    setCachedPin(pin);
    if (pinTimeout) clearTimeout(pinTimeout);
    pinTimeout = setTimeout(
      () => {
        setCachedPin('');
        pinTimeout = null;
      },
      10 * 60 * 1000
    );
  };

  // Load data from API
  const loadData = async () => {
    try {
      const response = await fetch(`${API_BASE}/data`);
      if (!response.ok) throw new Error('Failed to load data');
      const data = (await response.json()) as FamilyChoresData;
      setChoreData('data', reconcile(data));
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      // Retry after 10 seconds if data not loaded
      setTimeout(() => {
        setRetryCount((prev) => prev + 1);
        loadData();
      }, 10000);
    }
  };

  onMount(() => {
    loadData();
  });

  const contextValue: AdminContextValue = {
    choreData: () => {
      if (!choreData.data) {
        throw new Error('choreData is null when creating context');
      }
      return choreData.data;
    },
    loadData,
    pinRequired,
    setCachedPin: setCachedPinWithTimeout,
    cachedPin,
    resolvedTimeFormat,
  };

  return (
    <div
      class="mx-auto max-w-5xl overflow-hidden rounded-xl bg-white shadow-2xl"
      data-testid="admin-container"
    >
      <Show when={loading()}>
        <header class="flex flex-wrap items-center justify-between gap-4 bg-slate-100 p-8 text-slate-900">
          <h1 class="text-3xl font-semibold">Family Chores Admin</h1>
        </header>
        <div class="animate-loading-pulse bg-[radial-gradient(circle,#2563eb,#ffffff)] bg-size-[200%_200%] bg-center px-8 py-16 text-center text-slate-500">
          <div class="inline-block rounded-xl bg-white/30 p-8 shadow-md">
            <p class="mb-2.5 text-xl font-semibold text-slate-900">
              MagicMirror² is starting up, please wait...
            </p>
            <Show when={retryCount() > 0}>
              <p class="text-sm font-medium text-slate-600 italic">
                Retrying... (attempt {retryCount()})
              </p>
            </Show>
          </div>
        </div>
      </Show>

      <Show when={choreData.data}>
        <AdminContext.Provider value={contextValue}>
          <MainPage />
        </AdminContext.Provider>
      </Show>
    </div>
  );
};
