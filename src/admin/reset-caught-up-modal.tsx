import type { Component } from 'solid-js';
import { createSignal, For, Show } from 'solid-js';
import { resetCaughtUp } from '../api';
import type { Chore } from '../types/chore-types';
import { ChoreType } from '../types/chore-types';
import { escapeHtml } from '../utils/browser';
import { useAdminContext } from './admin-context';
import { Button } from './button';
import { PinField } from './pin-field';

interface ResetCaughtUpModalProps {
  overdue: Chore[];
  closeModal: () => void;
}

export const ResetCaughtUpModal: Component<ResetCaughtUpModalProps> = (props) => {
  const { choreData, pinRequired, cachedPin, setCachedPin } = useAdminContext();
  const [pin, setPin] = createSignal('');
  const [rememberPin, setRememberPin] = createSignal(false);

  const getPersonName = (id: string) =>
    escapeHtml(choreData().people.find((p) => p.id === id)?.name ?? 'Unknown');

  const getCurrentAssignee = (chore: Chore): string => {
    if (chore.type === ChoreType.PERSONAL) {
      return getPersonName(chore.assignedTo);
    }
    const id = (chore.rotation ?? [])[chore.rotatingIndex ?? 0] ?? '';
    return getPersonName(id);
  };

  const handleConfirm = async () => {
    try {
      const pinToUse = cachedPin() || pin();
      await resetCaughtUp({ pin: pinRequired() ? pinToUse || undefined : undefined });
      if (!cachedPin() && rememberPin() && pin()) {
        setCachedPin(pin());
      }
      props.closeModal();
    } catch (error) {
      console.error('Error resetting caught up status:', error);
      alert(
        `Failed to reset caught up status: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  return (
    <div class="fixed inset-0 z-1000 flex items-center justify-center bg-black/50">
      <div
        class="max-h-[90vh] w-[90%] max-w-[560px] scale-95 overflow-y-auto rounded-xl bg-white p-8 shadow-2xl transition-transform duration-200"
        data-testid="reset-caught-up-modal"
      >
        <div class="mb-2 flex items-center justify-between">
          <h3 class="text-2xl text-indigo-600">Reset All Caught Up</h3>
          <button
            type="button"
            class="ml-4 text-2xl leading-none text-slate-400 hover:text-slate-600"
            aria-label="Close"
            onClick={() => props.closeModal()}
          >
            ×
          </button>
        </div>
        <p class="mb-5 text-sm text-slate-500">
          All chores will be marked as caught up. This is useful after a vacation or extended
          downtime when overdue indicators no longer reflect reality.
        </p>

        <Show
          when={props.overdue.length > 0}
          fallback={
            <p class="my-4 text-slate-500 italic" data-testid="no-overdue-message">
              All chores are already caught up — nothing to reset.
            </p>
          }
        >
          <div
            class="mb-5 overflow-hidden rounded-lg border border-slate-200"
            data-testid="overdue-chores-list"
          >
            <div class="grid grid-cols-[1fr_1fr] items-center gap-x-3 border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              <span>Chore</span>
              <span>Assigned To</span>
            </div>
            <For each={props.overdue}>
              {(chore, index) => (
                <div
                  class="grid grid-cols-[1fr_1fr] items-center gap-x-3 px-4 py-3"
                  classList={{ 'bg-slate-50/50': index() % 2 === 1 }}
                  data-testid={`overdue-row-${chore.id}`}
                >
                  <span class="font-medium text-slate-800">{escapeHtml(chore.name)}</span>
                  <span class="text-sm text-slate-500">{getCurrentAssignee(chore)}</span>
                </div>
              )}
            </For>
          </div>
        </Show>

        <Show when={pinRequired() && !cachedPin()}>
          <PinField
            pin={pin()}
            onPinChange={setPin}
            remember={rememberPin()}
            onRememberChange={setRememberPin}
          />
        </Show>

        <div class="mt-6 flex justify-end gap-2.5">
          <Button type="button" variant="secondary" onClick={() => props.closeModal()}>
            Cancel
          </Button>
          <Show when={props.overdue.length > 0}>
            <Button type="button" variant="success" onClick={handleConfirm}>
              Reset All Caught Up
            </Button>
          </Show>
        </div>
      </div>
    </div>
  );
};
