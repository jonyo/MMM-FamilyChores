import type { Component } from 'solid-js';
import { createSignal, onMount, Show } from 'solid-js';
import type { FamilyChoresData } from '../types/chore-types';
import AdminContext, { type AdminContextValue } from './admin-context';
import { MainPage } from './main-page';
import { PinPromptModal } from './pin-prompt-modal';

// API base URL
const API_BASE = '/MMM-FamilyChores';

export const Admin: Component<Record<string, never>> = () => {
  const [choreData, setChoreData] = createSignal<FamilyChoresData | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [retryCount, setRetryCount] = createSignal(0);
  const [adminPin, setAdminPin] = createSignal('');
  const [pinPromptOpen, setPinPromptOpen] = createSignal(false);
  const [pinPromptTitle, setPinPromptTitle] = createSignal('');
  const [pinPromptMessage, setPinPromptMessage] = createSignal('');

  let pinPromiseResolve: ((value: { pin: string | null; remember: boolean }) => void) | null = null;
  let pinTimeout: ReturnType<typeof setTimeout> | null = null;

  const pinRequired = () => !!choreData()?.settings?.adminPin;

  const requestPin = (
    title: string,
    message: string
  ): Promise<{ pin: string | null; remember: boolean }> => {
    return new Promise((resolve) => {
      pinPromiseResolve = resolve;
      setPinPromptTitle(title);
      setPinPromptMessage(message);
      setPinPromptOpen(true);
    });
  };

  const cachePin = (pin: string) => {
    setAdminPin(pin);
    if (pinTimeout) clearTimeout(pinTimeout);
    pinTimeout = setTimeout(
      () => {
        setAdminPin('');
        pinTimeout = null;
      },
      10 * 60 * 1000
    );
  };

  const handlePinConfirm = (pin: string, remember: boolean) => {
    setPinPromptOpen(false);
    pinPromiseResolve?.({ pin, remember });
    pinPromiseResolve = null;
  };

  const handlePinCancel = () => {
    setPinPromptOpen(false);
    pinPromiseResolve?.({ pin: null, remember: false });
    pinPromiseResolve = null;
  };

  // Load data from API
  const loadData = async () => {
    try {
      const response = await fetch(`${API_BASE}/data`);
      if (!response.ok) throw new Error('Failed to load data');
      const data = (await response.json()) as FamilyChoresData;
      setChoreData(data);
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
      const data = choreData();
      if (!data) {
        throw new Error('choreData is null when creating context');
      }
      return data;
    },
    loadData,
    pinRequired,
    requestPin,
    cachePin,
    adminPin,
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
              Magic Mirror is starting up, please wait...
            </p>
            <Show when={retryCount() > 0}>
              <p class="text-sm font-medium text-slate-600 italic">
                Retrying... (attempt {retryCount()})
              </p>
            </Show>
          </div>
        </div>
      </Show>

      <Show when={choreData()}>
        <AdminContext.Provider value={contextValue}>
          <MainPage />
        </AdminContext.Provider>
      </Show>

      <Show when={pinPromptOpen()}>
        <PinPromptModal
          title={pinPromptTitle()}
          message={pinPromptMessage()}
          onConfirm={handlePinConfirm}
          onCancel={handlePinCancel}
        />
      </Show>
    </div>
  );
};
