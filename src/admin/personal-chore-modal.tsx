import type { Component } from 'solid-js';
import { createSignal, For, Show } from 'solid-js';
import { createChore, updateChore } from '../api';
import type { Person, PersonalChore, SkipDayVisibility } from '../types/chore-types';
import {
  ChoreType,
  DayOfWeek,
  SkipDayVisibility as SkipDayVisibilityEnum,
} from '../types/chore-types';
import type { CreateChoreRequest, UpdateChoreRequest } from '../types/request-types';
import { useAdminContext } from './admin-context';
import { Button } from './button';
import { PinField } from './pin-field';

interface PersonalChoreModalProps {
  person: Person | null;
  initialChore?: PersonalChore;
  closeModal: () => void;
}

export const PersonalChoreModal: Component<PersonalChoreModalProps> = (props) => {
  const { pinRequired, cachedPin, setCachedPin } = useAdminContext();
  const [name, setName] = createSignal(props.initialChore?.name ?? '');
  const [deadline, setDeadline] = createSignal(props.initialChore?.deadline ?? '');
  const [skipDayVisibility, setSkipDayVisibility] = createSignal<SkipDayVisibility>(
    props.initialChore?.skipDayVisibility ?? SkipDayVisibilityEnum.HIDE
  );
  const [skipDays, setSkipDays] = createSignal<DayOfWeek[]>(props.initialChore?.skipDays ?? []);
  const [pin, setPin] = createSignal('');
  const [rememberPin, setRememberPin] = createSignal(false);

  const handleSkipDayChange = (day: DayOfWeek, checked: boolean) => {
    if (checked) {
      setSkipDays([...skipDays(), day]);
    } else {
      setSkipDays(skipDays().filter((d) => d !== day));
    }
  };

  const handleSubmit = async (event: Event) => {
    event.preventDefault();
    const person = props.person;
    if (!person) {
      console.error('No person selected');
      return;
    }
    try {
      const cachedPinValue = cachedPin();
      const pinToUse = cachedPinValue || pin();
      if (props.initialChore?.id) {
        const body: UpdateChoreRequest = {
          name: name(),
          type: ChoreType.PERSONAL,
          assignedTo: person.id,
          deadline: deadline() || undefined,
          skipDays: skipDays(),
          skipDayVisibility: skipDayVisibility(),
          pin: pinRequired() ? pinToUse || undefined : undefined,
        };
        await updateChore(props.initialChore.id, body);
      } else {
        const body: CreateChoreRequest = {
          name: name(),
          type: ChoreType.PERSONAL,
          assignedTo: person.id,
          deadline: deadline() || undefined,
          skipDays: skipDays(),
          skipDayVisibility: skipDayVisibility(),
          pin: pinRequired() ? pinToUse || undefined : undefined,
        };
        await createChore(body);
      }

      if (!cachedPinValue && rememberPin() && pin()) {
        setCachedPin(pin());
      }

      props.closeModal();
    } catch (error) {
      console.error('Error saving chore:', error);
      alert(`Failed to save chore: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <Show
      when={props.person}
      keyed={true}
      fallback={
        <div class="fixed inset-0 z-1000 flex  items-center justify-center bg-black/50">
          <div class="max-h-[90vh] w-[90%] max-w-[500px] scale-95 overflow-y-auto rounded-xl bg-white p-8 shadow-2xl transition-transform duration-200">
            <h3 class="mb-5 text-2xl text-indigo-600">Error</h3>
            <p>Person not found. Please refresh the page.</p>
            <Button type="button" variant="secondary" onClick={() => props.closeModal()}>
              Close
            </Button>
          </div>
        </div>
      }
    >
      {(person: Person) => (
        <div
          class="fixed inset-0 z-1000 flex  items-center justify-center bg-black/50"
          data-testid="modal"
        >
          <div
            class="max-h-[90vh] w-[90%] max-w-[500px] scale-95 overflow-y-auto rounded-xl bg-white p-8 shadow-2xl transition-transform duration-200"
            data-testid="modal-content"
          >
            <h3 class="mb-5 text-2xl text-indigo-600">
              {props.initialChore ? 'Edit Personal Chore' : 'Add Personal Chore'}
            </h3>
            <div
              class="mb-5 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-base"
              data-testid="assigned-person-display"
            >
              <span
                class="inline-block size-6  rounded-full border-2 border-black/10 align-middle"
                style={`background-color: ${person.color}`}
                data-testid="person-color-badge"
              ></span>
              <strong>Assigned to:</strong> {person.name}
            </div>
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
                <div class="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
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
      )}
    </Show>
  );
};
