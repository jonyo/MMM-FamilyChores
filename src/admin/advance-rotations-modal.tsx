import type { Component } from 'solid-js';
import { createSignal, For, Show } from 'solid-js';
import { advanceRotations } from '../api';
import type { RotatingChore } from '../types/chore-types';
import { escapeHtml } from '../utils/browser';
import { useAdminContext } from './admin-context';
import { Button } from './button';
import { PinField } from './pin-field';

interface AdvanceRotationsModalProps {
  rotatingChores: RotatingChore[];
  closeModal: () => void;
}

export const AdvanceRotationsModal: Component<AdvanceRotationsModalProps> = (props) => {
  const { choreData, pinRequired, cachedPin, setCachedPin } = useAdminContext();
  const [pin, setPin] = createSignal('');
  const [rememberPin, setRememberPin] = createSignal(false);

  const getPersonName = (id: string) =>
    escapeHtml(choreData().people.find((p) => p.id === id)?.name ?? 'Unknown');

  const advanceable = () => props.rotatingChores.filter((c) => (c.rotation ?? []).length >= 2);

  const getNextPersonId = (chore: RotatingChore): string => {
    const rotation = chore.rotation ?? [];
    const nextIndex = ((chore.rotatingIndex ?? 0) + 1) % rotation.length;
    return rotation[nextIndex] ?? '';
  };

  const handleConfirm = async () => {
    try {
      const pinToUse = cachedPin() || pin();
      await advanceRotations({ pin: pinRequired() ? pinToUse || undefined : undefined });
      if (!cachedPin() && rememberPin() && pin()) {
        setCachedPin(pin());
      }
      props.closeModal();
    } catch (error) {
      console.error('Error advancing rotations:', error);
      alert(
        `Failed to advance rotations: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  return (
    <div class="fixed inset-0 z-1000 flex items-center justify-center bg-black/50">
      <div
        class="max-h-[90vh] w-[90%] max-w-[560px] scale-95 overflow-y-auto rounded-xl bg-white p-8 shadow-2xl transition-transform duration-200"
        data-testid="advance-rotations-modal"
      >
        <div class="mb-2 flex items-center justify-between">
          <h3 class="text-2xl text-indigo-600">Advance All Rotations</h3>
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
          Each rotating chore will move to the next person in its rotation. Completion state will be
          cleared.
        </p>

        <Show
          when={advanceable().length > 0}
          fallback={
            <p class="my-4 text-slate-500 italic" data-testid="no-chores-message">
              No rotating chores with 2+ people to advance.
            </p>
          }
        >
          <div
            class="mb-5 overflow-hidden rounded-lg border border-slate-200"
            data-testid="rotation-preview-list"
          >
            <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-x-3 border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              <span>Chore</span>
              <span />
              <span>Next Up</span>
            </div>
            <For each={advanceable()}>
              {(chore, index) => (
                <div
                  class="grid grid-cols-[1fr_auto_1fr] items-center gap-x-3 px-4 py-3"
                  classList={{ 'bg-slate-50/50': index() % 2 === 1 }}
                  data-testid={`rotation-row-${chore.id}`}
                >
                  <div>
                    <span class="font-medium text-slate-800">{escapeHtml(chore.name)}</span>
                    <div class="mt-0.5 text-sm text-slate-500">
                      {getPersonName((chore.rotation ?? [])[chore.rotatingIndex ?? 0] ?? '')}
                    </div>
                  </div>
                  <span class="text-lg text-slate-400">→</span>
                  <div class="text-sm font-semibold text-indigo-600">
                    {getPersonName(getNextPersonId(chore))}
                  </div>
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
          <Show when={advanceable().length > 0}>
            <Button type="button" variant="warning" onClick={handleConfirm}>
              Advance Rotations
            </Button>
          </Show>
        </div>
      </div>
    </div>
  );
};
