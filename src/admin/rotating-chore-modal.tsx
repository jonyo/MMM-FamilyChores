import type { Component } from 'solid-js';
import { createSignal, For, Show } from 'solid-js';
import { createChore, updateChore } from '../api';
import type { RotatingChore, SkipDayVisibility } from '../types/chore-types';
import {
  ChoreType,
  DayOfWeek,
  SkipDayVisibility as SkipDayVisibilityEnum,
} from '../types/chore-types';
import type { CreateChoreRequest, UpdateChoreRequest } from '../types/request-types';
import { useAdminContext } from './admin-context';
import { Button } from './button';
import { PinField } from './pin-field';

interface RotatingChoreModalProps {
  initialChore?: RotatingChore;
  closeModal: () => void;
}

export const RotatingChoreModal: Component<RotatingChoreModalProps> = (props) => {
  const { choreData, pinRequired, setCachedPin, cachedPin } = useAdminContext();
  const [name, setName] = createSignal(props.initialChore?.name ?? '');
  const [deadline, setDeadline] = createSignal(props.initialChore?.deadline ?? '');
  const [skipDayVisibility, setSkipDayVisibility] = createSignal<SkipDayVisibility>(
    props.initialChore?.skipDayVisibility ?? SkipDayVisibilityEnum.HIDE
  );
  const [skipDays, setSkipDays] = createSignal<DayOfWeek[]>(props.initialChore?.skipDays ?? []);
  const [rotation, setRotation] = createSignal<string[]>(props.initialChore?.rotation ?? []);
  const [pin, setPin] = createSignal('');
  const [rememberPin, setRememberPin] = createSignal(false);

  const handleSkipDayChange = (day: DayOfWeek, checked: boolean) => {
    if (checked) {
      setSkipDays([...skipDays(), day]);
    } else {
      setSkipDays(skipDays().filter((d) => d !== day));
    }
  };

  const handleRotationChange = (personId: string, checked: boolean) => {
    if (checked) {
      setRotation([...rotation(), personId]);
    } else {
      setRotation(rotation().filter((id) => id !== personId));
    }
  };

  const handleSubmit = async (event: Event) => {
    event.preventDefault();
    try {
      const pinToUse = cachedPin() || pin();
      if (props.initialChore?.id) {
        const body: UpdateChoreRequest = {
          name: name(),
          type: ChoreType.ROTATING,
          rotation: rotation(),
          deadline: deadline() || undefined,
          skipDays: skipDays(),
          skipDayVisibility: skipDayVisibility(),
          pin: pinRequired() ? pinToUse || undefined : undefined,
        };
        await updateChore(props.initialChore.id, body);
      } else {
        const body: CreateChoreRequest = {
          name: name(),
          type: ChoreType.ROTATING,
          rotation: rotation(),
          deadline: deadline() || undefined,
          skipDays: skipDays(),
          skipDayVisibility: skipDayVisibility(),
          pin: pinRequired() ? pinToUse || undefined : undefined,
        };
        await createChore(body);
      }

      if (!cachedPin() && rememberPin() && pin()) {
        setCachedPin(pin());
      }

      props.closeModal();
    } catch (error) {
      console.error('Error saving chore:', error);
      alert(`Failed to save chore: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div class="fixed inset-0 z-1000 flex  items-center justify-center bg-black/50">
      <div class="max-h-[90vh] w-[90%] max-w-[500px] scale-95 overflow-y-auto rounded-xl bg-white p-8 shadow-2xl transition-transform duration-200">
        <h3 class="mb-5 text-2xl text-indigo-600">
          {props.initialChore ? 'Edit Rotating Chore' : 'Add Rotating Chore'}
        </h3>
        <form onSubmit={handleSubmit}>
          <div class="mb-5">
            <label for="choreName" class="mb-3 block font-medium text-slate-900">
              Chore Name
            </label>
            <input
              type="text"
              id="choreName"
              value={name()}
              onInput={(e) => setName(e.currentTarget.value)}
              required
              class="mb-2 w-full rounded-lg border border-slate-300 p-2.5 text-base transition-colors focus:border-indigo-600 focus:outline-none"
            />
          </div>
          <div class="mb-5">
            <div class="mb-3 block font-medium text-slate-900">Rotation (select people)</div>
            <div
              class="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3"
              data-testid="checkbox-list"
            >
              <For each={choreData().people}>
                {(person) => (
                  <label class="flex cursor-pointer items-center gap-2 font-normal">
                    <input
                      type="checkbox"
                      checked={rotation().includes(person.id)}
                      onInput={(e) => handleRotationChange(person.id, e.currentTarget.checked)}
                      class="size-4.5  cursor-pointer"
                    />
                    {person.name}
                  </label>
                )}
              </For>
            </div>
          </div>
          <div class="mb-5">
            <label for="rotatingIndex" class="mb-3 block font-medium text-slate-900">
              Starting Index (current person)
            </label>
            <select
              id="rotatingIndex"
              value={props.initialChore?.rotatingIndex ?? 0}
              onInput={(_e) => {
                // Store the value but don't track it in state since it's not sent to API
                // The backend calculates this based on the rotation order
              }}
              class="mb-2 w-full rounded-lg border border-slate-300 p-2.5 text-base transition-colors focus:border-indigo-600 focus:outline-none"
            >
              <For each={rotation()}>
                {(personId, index) => {
                  const person = choreData().people.find((p) => p.id === personId);
                  return <option value={index()}>{person ? person.name : 'Unknown'}</option>;
                }}
              </For>
            </select>
          </div>
          <div class="mb-5">
            <label for="deadline" class="mb-3 block font-medium text-slate-900">
              Deadline (optional)
            </label>
            <input
              type="time"
              id="deadline"
              value={deadline()}
              onInput={(e) => setDeadline(e.currentTarget.value)}
              class="mb-2 w-full rounded-lg border border-slate-300 p-2.5 text-base transition-colors focus:border-indigo-600 focus:outline-none"
            />
          </div>
          <div class="mb-5">
            <div class="mb-3 block font-medium text-slate-900">Skip Days</div>
            <div
              class="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3"
              data-testid="skip-days-checkbox-list"
            >
              <For each={Object.values(DayOfWeek)}>
                {(day) => (
                  <label class="flex cursor-pointer items-center gap-2 font-normal">
                    <input
                      type="checkbox"
                      value={day}
                      checked={skipDays().includes(day)}
                      onInput={(e) => handleSkipDayChange(day, e.currentTarget.checked)}
                      class="size-4.5  cursor-pointer"
                    />
                    {day.charAt(0).toUpperCase() + day.slice(1)}
                  </label>
                )}
              </For>
            </div>
          </div>
          <div class="mb-5">
            <label for="skipDayVisibility" class="mb-3 block font-medium text-slate-900">
              Skip Day Visibility
            </label>
            <select
              id="skipDayVisibility"
              value={skipDayVisibility()}
              onInput={(e) => setSkipDayVisibility(e.currentTarget.value as SkipDayVisibility)}
              class="mb-2 w-full rounded-lg border border-slate-300 p-2.5 text-base transition-colors focus:border-indigo-600 focus:outline-none"
            >
              <option value={SkipDayVisibilityEnum.HIDE}>Hide</option>
              <option value={SkipDayVisibilityEnum.SHOW_ALWAYS}>Show Always</option>
              <option value={SkipDayVisibilityEnum.SHOW_IF_OVERDUE}>Show If Overdue</option>
            </select>
          </div>
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
            <Button type="submit" variant="primary">
              {props.initialChore ? 'Save' : 'Add'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
