import type { Component } from 'solid-js';
import { createSignal, Show } from 'solid-js';
import { createPerson, updatePerson } from '../api';
import type { Person } from '../types/chore-types';
import type { CreatePersonRequest, UpdatePersonRequest } from '../types/request-types';
import { generatePastelColor } from '../utils/browser';
import { useAdminContext } from './admin-context';
import { Button } from './button';
import { PinField } from './pin-field';

interface PersonModalProps {
  initialPerson?: Person;
  closeModal: () => void;
}

export const PersonModal: Component<PersonModalProps> = (props) => {
  const { loadData, pinRequired, adminPin, cachePin } = useAdminContext();
  const [name, setName] = createSignal(props.initialPerson?.name ?? '');
  const [color, setColor] = createSignal(props.initialPerson?.color ?? generatePastelColor());
  const [pin, setPin] = createSignal('');
  const [rememberPin, setRememberPin] = createSignal(false);

  const handleSubmit = async (event: Event) => {
    event.preventDefault();
    try {
      const pinToUse = adminPin() || pin();
      if (props.initialPerson?.id) {
        const body: UpdatePersonRequest = {
          name: name(),
          color: color(),
          pin: pinRequired() ? pinToUse || undefined : undefined,
        };
        await updatePerson(props.initialPerson.id, body);
      } else {
        const body: CreatePersonRequest = {
          name: name(),
          color: color(),
          pin: pinRequired() ? pinToUse || undefined : undefined,
        };
        await createPerson(body);
      }

      if (!adminPin() && rememberPin() && pin()) {
        cachePin(pin());
      }

      try {
        await loadData();
      } catch (loadError) {
        console.error('Error reloading data after save:', loadError);
        alert('Person saved, but failed to refresh the list. Please refresh the page.');
      }
      props.closeModal();
    } catch (error) {
      console.error('Error saving person:', error);
      alert(`Failed to save person: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div class="fixed inset-0 z-1000 flex  items-center justify-center bg-black/50">
      <div class="max-h-[90vh] w-[90%] max-w-[500px] scale-95 overflow-y-auto rounded-xl bg-white p-8 shadow-2xl transition-transform duration-200">
        <h3 class="mb-5 text-2xl text-indigo-600">
          {props.initialPerson ? 'Edit Person' : 'Add Person'}
        </h3>
        <form onSubmit={handleSubmit}>
          <div class="mb-5">
            <label for="personName" class="mb-3 block font-medium text-slate-900">
              Name
            </label>
            <input
              type="text"
              id="personName"
              value={name()}
              onInput={(e) => setName(e.currentTarget.value)}
              required
              class="mb-2 w-full rounded-lg border border-slate-300 p-2.5 text-base transition-colors focus:border-indigo-600 focus:outline-none"
            />
          </div>
          <div class="mb-5">
            <label for="personColor" class="mb-3 block font-medium text-slate-900">
              Text Color
            </label>
            <div class="flex items-center gap-2.5">
              <input
                type="color"
                id="personColor"
                value={color()}
                onInput={(e) => setColor(e.currentTarget.value)}
                required
                class="h-10 w-15 cursor-pointer rounded-lg border border-slate-300"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setColor(generatePastelColor())}
              >
                Randomize
              </Button>
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
            <Button type="submit" variant="primary">
              {props.initialPerson ? 'Save' : 'Add'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
