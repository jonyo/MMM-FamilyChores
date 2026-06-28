import type { Component } from 'solid-js';
import { createSignal, For, Show } from 'solid-js';
import { createChore, updateChore } from '../api';
import type {
  AfterDeadlineVisibility,
  BeforeStartTimeVisibility,
  NotCaughtUpDisplay,
  Person,
  PersonalChore,
  SkipDayVisibility,
} from '../types/chore-types';
import {
  AfterDeadlineVisibility as AfterDeadlineVisibilityEnum,
  BeforeStartTimeVisibility as BeforeStartTimeVisibilityEnum,
  ChoreType,
  DayOfWeek,
  NotCaughtUpDisplay as NotCaughtUpDisplayEnum,
  SkipDayVisibility as SkipDayVisibilityEnum,
} from '../types/chore-types';
import type { CreateChoreRequest, UpdateChoreRequest } from '../types/request-types';
import { escapeHtml } from '../utils/browser';
import { useAdminContext } from './admin-context';
import { Button } from './button';
import { DisplayOptionsSection } from './display-options-section';
import { HelpIcon } from './help-icon';
import { PinField } from './pin-field';
import { TimeSelect } from './time-select';

interface PersonalChoreModalProps {
  person: Person | null;
  initialChore?: PersonalChore;
  closeModal: () => void;
}

export const PersonalChoreModal: Component<PersonalChoreModalProps> = (props) => {
  const { pinRequired, cachedPin, setCachedPin } = useAdminContext();
  const [name, setName] = createSignal(props.initialChore?.name ?? '');
  const [deadline, setDeadline] = createSignal(props.initialChore?.deadline ?? '');
  const [startTime, setStartTime] = createSignal(props.initialChore?.startTime ?? '');
  const [skipDayVisibility, setSkipDayVisibility] = createSignal<SkipDayVisibility>(
    props.initialChore?.skipDayVisibility ?? SkipDayVisibilityEnum.HIDE
  );
  const [skipDays, setSkipDays] = createSignal<DayOfWeek[]>(props.initialChore?.skipDays ?? []);
  const [beforeStartTimeVisibility, setBeforeStartTimeVisibility] =
    createSignal<BeforeStartTimeVisibility>(
      props.initialChore?.beforeStartTimeVisibility ?? BeforeStartTimeVisibilityEnum.HIDE
    );
  const [afterDeadlineVisibility, setAfterDeadlineVisibility] =
    createSignal<AfterDeadlineVisibility>(
      props.initialChore?.afterDeadlineVisibility ?? AfterDeadlineVisibilityEnum.SHOW_OVERDUE
    );
  const [notCaughtUpDisplay, setNotCaughtUpDisplay] = createSignal<NotCaughtUpDisplay>(
    props.initialChore?.notCaughtUpDisplay ?? NotCaughtUpDisplayEnum.OVERDUE
  );
  const [formError, setFormError] = createSignal('');
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
    setFormError('');
    const person = props.person;
    if (!person) {
      console.error('No person selected');
      return;
    }

    const deadlineValue = deadline() || undefined;
    const startTimeValue = startTime() || undefined;
    if (deadlineValue && startTimeValue && startTimeValue >= deadlineValue) {
      setFormError('Start time must be before the deadline.');
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
          deadline: deadlineValue,
          startTime: startTimeValue,
          skipDays: skipDays(),
          skipDayVisibility: skipDayVisibility(),
          beforeStartTimeVisibility: beforeStartTimeVisibility(),
          afterDeadlineVisibility: afterDeadlineVisibility(),
          notCaughtUpDisplay: notCaughtUpDisplay(),
          pin: pinRequired() ? pinToUse || undefined : undefined,
        };
        await updateChore(props.initialChore.id, body);
      } else {
        const body: CreateChoreRequest = {
          name: name(),
          type: ChoreType.PERSONAL,
          assignedTo: person.id,
          deadline: deadlineValue,
          startTime: startTimeValue,
          skipDays: skipDays(),
          skipDayVisibility: skipDayVisibility(),
          beforeStartTimeVisibility: beforeStartTimeVisibility(),
          afterDeadlineVisibility: afterDeadlineVisibility(),
          notCaughtUpDisplay: notCaughtUpDisplay(),
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
            <div class="mb-5 flex items-center justify-between">
              <h3 class="text-2xl text-indigo-600">Error</h3>
              <button
                type="button"
                class="ml-4 cursor-pointer text-2xl leading-none text-slate-400 hover:text-slate-600"
                aria-label="Close"
                onClick={() => props.closeModal()}
              >
                ×
              </button>
            </div>
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
            <div class="mb-5 flex items-center justify-between">
              <h3 class="text-2xl text-indigo-600" data-testid="modal-title">
                {props.initialChore ? 'Edit Personal Chore' : 'Add Personal Chore'}
              </h3>
              <button
                type="button"
                class="ml-4 cursor-pointer text-2xl leading-none text-slate-400 hover:text-slate-600"
                aria-label="Close"
                onClick={() => props.closeModal()}
              >
                ×
              </button>
            </div>
            <div
              class="mb-5 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-base"
              data-testid="assigned-person-display"
            >
              <span
                class="inline-block size-6  rounded-full border-2 border-black/10 align-middle"
                style={`background-color: ${person.color}`}
                data-testid="person-color-badge"
              ></span>
              <strong>Assigned to:</strong> {escapeHtml(person.name)}
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
                <div class="mb-3 flex items-center">
                  <label for="startTime" class="block font-medium text-slate-900">
                    Start Time (optional)
                  </label>
                  <HelpIcon
                    text="The chore stays hidden until this time. If a chore that is not caught up is set to 'Show if overdue', it appears early so it can be caught up. The display format (12/24-hour) can be changed in Settings."
                    position="above"
                    align="center"
                    multiline
                    class="ml-1.5"
                  />
                </div>
                <TimeSelect id="startTime" value={startTime()} onChange={setStartTime} />
              </div>
              <div class="mb-5">
                <div class="mb-3 flex items-center">
                  <label for="deadline" class="block font-medium text-slate-900">
                    Deadline (optional)
                  </label>
                  <HelpIcon
                    text="After-deadline behavior is controlled by the 'After deadline' option in Advanced Display Options. Completed chores past this time move to the 'Earlier chores' section. The display format (12/24-hour) can be changed in Settings."
                    position="above"
                    align="center"
                    multiline
                    class="ml-1.5"
                  />
                </div>
                <TimeSelect id="deadline" value={deadline()} onChange={setDeadline} />
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
              <DisplayOptionsSection
                startTime={startTime}
                deadline={deadline}
                skipDays={skipDays}
                skipDayVisibility={skipDayVisibility}
                setSkipDayVisibility={setSkipDayVisibility}
                beforeStartTimeVisibility={beforeStartTimeVisibility}
                setBeforeStartTimeVisibility={setBeforeStartTimeVisibility}
                afterDeadlineVisibility={afterDeadlineVisibility}
                setAfterDeadlineVisibility={setAfterDeadlineVisibility}
                notCaughtUpDisplay={notCaughtUpDisplay}
                setNotCaughtUpDisplay={setNotCaughtUpDisplay}
              />
              <Show when={formError()}>
                <div class="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {formError()}
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
