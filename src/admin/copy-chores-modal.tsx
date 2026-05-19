import type { Component } from 'solid-js';
import { createMemo, createSignal, For, onMount, Show } from 'solid-js';
import { copyChores } from '../api';
import type { Person, PersonalChore } from '../types/chore-types';
import { ChoreType } from '../types/chore-types';
import { escapeHtml } from '../utils/browser';
import { useAdminContext } from './admin-context';
import { Button } from './button';
import { PinField } from './pin-field';

interface CopyChoresModalProps {
  fromPerson: Person;
  closeModal: () => void;
}

export const CopyChoresModal: Component<CopyChoresModalProps> = (props) => {
  const { choreData, pinRequired, cachePin, adminPin } = useAdminContext();

  // Get personal chores for the from person
  const personalChores = createMemo<PersonalChore[]>(() => {
    return choreData().chores.filter(
      (chore) => chore.type === ChoreType.PERSONAL && chore.assignedTo === props.fromPerson.id
    ) as PersonalChore[];
  });

  // Get available people to copy to (exclude from person)
  const availablePeople = createMemo<Person[]>(() => {
    return choreData().people.filter((person) => person.id !== props.fromPerson.id);
  });

  const [selectedChoreIds, setSelectedChoreIds] = createSignal<string[]>([]);
  const [toPersonId, setToPersonId] = createSignal<string>('');
  const [loading, setLoading] = createSignal(false);
  const [pin, setPin] = createSignal('');
  const [rememberPin, setRememberPin] = createSignal(false);

  // Initialize selected chore IDs with all personal chores (default checked)
  onMount(() => {
    const chores = personalChores();
    setSelectedChoreIds(chores.map((chore) => chore.id));
  });

  const handleChoreToggle = (choreId: string, checked: boolean): void => {
    if (checked) {
      setSelectedChoreIds([...selectedChoreIds(), choreId]);
    } else {
      setSelectedChoreIds(selectedChoreIds().filter((id) => id !== choreId));
    }
  };

  const handleSubmit = async (event: Event): Promise<void> => {
    event.preventDefault();

    if (!toPersonId()) {
      alert('Please select a person to copy chores to.');
      return;
    }

    if (selectedChoreIds().length === 0) {
      alert('Please select at least one chore to copy.');
      return;
    }

    setLoading(true);

    try {
      const pinToUse = adminPin() || pin();
      await copyChores({
        fromPersonId: props.fromPerson.id,
        toPersonId: toPersonId(),
        choreIds: selectedChoreIds(),
        pin: pinRequired() ? pinToUse || undefined : undefined,
      });

      if (!adminPin() && rememberPin() && pin()) {
        cachePin(pin());
      }

      props.closeModal();
    } catch (error) {
      console.error('Error copying chores:', error);
      alert(`Failed to copy chores: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="fixed inset-0 z-1000 flex  items-center justify-center bg-black/50">
      <div class="max-h-[90vh] w-[90%] max-w-[500px] scale-95 overflow-y-auto rounded-xl bg-white p-8 shadow-2xl transition-transform duration-200">
        <h3 class="mb-5 text-2xl text-indigo-600">Copy Chores</h3>
        <div
          class="mb-5 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-base"
          data-testid="copy-from-display"
        >
          <span
            class="inline-block size-6  rounded-full border-2 border-black/10 align-middle"
            style={`background-color: ${props.fromPerson.color}`}
            data-testid="person-color-badge"
          ></span>
          <strong>From:</strong> {escapeHtml(props.fromPerson.name)}
        </div>
        <Show
          when={personalChores().length > 0}
          fallback={
            <div class="my-2.5 text-slate-500 italic" data-testid="empty-message">
              <p>No personal chores to copy for {escapeHtml(props.fromPerson.name)}.</p>
              <Button type="button" variant="secondary" onClick={() => props.closeModal()}>
                Close
              </Button>
            </div>
          }
        >
          <Show when={availablePeople().length === 0}>
            <div class="my-2.5 text-slate-500 italic" data-testid="empty-message">
              <p>No other people available to copy chores to.</p>
              <Button type="button" variant="secondary" onClick={() => props.closeModal()}>
                Close
              </Button>
            </div>
          </Show>
          <Show when={availablePeople().length > 0}>
            <form onSubmit={handleSubmit}>
              <div class="mb-5">
                <div class="mb-3 block font-medium text-slate-900">Select Person to Copy To</div>
                <select
                  id="toPerson"
                  value={toPersonId()}
                  onInput={(e) => setToPersonId(e.currentTarget.value)}
                  required
                  class="mb-2 w-full rounded-lg border border-slate-300 p-2.5 text-base transition-colors focus:border-indigo-600 focus:outline-none"
                >
                  <option value="">-- Select a person --</option>
                  <For each={availablePeople()}>
                    {(person) => <option value={person.id}>{escapeHtml(person.name)}</option>}
                  </For>
                </select>
              </div>
              <div class="mb-5">
                <div class="mb-3 block font-medium text-slate-900">Select Chores to Copy</div>
                <div
                  class="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3"
                  data-testid="checkbox-list"
                >
                  <For each={personalChores()}>
                    {(chore) => (
                      <label class="flex cursor-pointer items-center gap-2 font-normal">
                        <input
                          type="checkbox"
                          value={chore.id}
                          checked={selectedChoreIds().includes(chore.id)}
                          onInput={(e) => handleChoreToggle(chore.id, e.currentTarget.checked)}
                          class="size-4.5  cursor-pointer"
                        />
                        {escapeHtml(chore.name)}
                      </label>
                    )}
                  </For>
                </div>
              </div>
              <Show when={pinRequired() && !adminPin()}>
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
                <Button type="submit" variant="primary" disabled={loading()}>
                  {loading() ? 'Copying...' : 'Copy'}
                </Button>
              </div>
            </form>
          </Show>
        </Show>
      </div>
    </div>
  );
};
