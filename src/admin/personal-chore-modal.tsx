import { createSignal, For, type JSX } from 'solid-js';
import type { Person, PersonalChore, SkipDayVisibility } from '../types/chore-types';
import {
  ChoreType,
  DayOfWeek,
  SkipDayVisibility as SkipDayVisibilityEnum,
} from '../types/chore-types';

interface PersonalChoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  chore: PersonalChore | null;
  people: Person[];
  onSave: (chore: Omit<PersonalChore, 'id'>) => void;
}

export function PersonalChoreModal(props: PersonalChoreModalProps): JSX.Element {
  const [name, setName] = createSignal(props.chore?.name ?? '');
  const [assignedTo, setAssignedTo] = createSignal(props.chore?.assignedTo ?? '');
  const [deadline, setDeadline] = createSignal(props.chore?.deadline ?? '');
  const [skipDayVisibility, setSkipDayVisibility] = createSignal<SkipDayVisibility>(
    props.chore?.skipDayVisibility ?? SkipDayVisibilityEnum.HIDE
  );
  const [skipDays, setSkipDays] = createSignal<DayOfWeek[]>(props.chore?.skipDays ?? []);

  function handleSkipDayChange(day: DayOfWeek, checked: boolean) {
    if (checked) {
      setSkipDays([...skipDays(), day]);
    } else {
      setSkipDays(skipDays().filter((d) => d !== day));
    }
  }

  function handleSubmit(event: Event) {
    event.preventDefault();
    props.onSave({
      name: name(),
      type: ChoreType.PERSONAL,
      assignedTo: assignedTo(),
      deadline: deadline() || undefined,
      skipDays: skipDays(),
      skipDayVisibility: skipDayVisibility(),
      caughtUp: props.chore?.caughtUp ?? true,
      completedToday: props.chore?.completedToday ?? false,
    });
    props.onClose();
  }

  if (!props.isOpen) return null;

  return (
    <div class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h2>{props.chore ? 'Edit Personal Chore' : 'Add Personal Chore'}</h2>
          <button type="button" class="modal-close" onClick={props.onClose}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div class="modal-body">
            <div class="form-group">
              <label for="choreName">Chore Name</label>
              <input
                type="text"
                id="choreName"
                value={name()}
                onInput={(e) => setName(e.currentTarget.value)}
                required
              />
            </div>
            <div class="form-group">
              <label for="assignedTo">Assigned To</label>
              <select
                id="assignedTo"
                value={assignedTo()}
                onInput={(e) => setAssignedTo(e.currentTarget.value)}
                required
              >
                <option value="">Select a person</option>
                <For each={props.people}>
                  {(person) => <option value={person.id}>{person.name}</option>}
                </For>
              </select>
            </div>
            <div class="form-group">
              <label for="deadline">Deadline (optional)</label>
              <input
                type="time"
                id="deadline"
                value={deadline()}
                onInput={(e) => setDeadline(e.currentTarget.value)}
              />
            </div>
            <div class="form-group">
              <div class="form-label">Skip Days</div>
              <div class="checkbox-group">
                <For
                  each={[
                    DayOfWeek.MONDAY,
                    DayOfWeek.TUESDAY,
                    DayOfWeek.WEDNESDAY,
                    DayOfWeek.THURSDAY,
                    DayOfWeek.FRIDAY,
                    DayOfWeek.SATURDAY,
                    DayOfWeek.SUNDAY,
                  ]}
                >
                  {(day) => (
                    <label>
                      <input
                        type="checkbox"
                        checked={skipDays().includes(day)}
                        onInput={(e) => handleSkipDayChange(day, e.currentTarget.checked)}
                      />
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </label>
                  )}
                </For>
              </div>
            </div>
            <div class="form-group">
              <label for="skipDayVisibility">Skip Day Visibility</label>
              <select
                id="skipDayVisibility"
                value={skipDayVisibility()}
                onInput={(e) => setSkipDayVisibility(e.currentTarget.value as SkipDayVisibility)}
              >
                <option value={SkipDayVisibilityEnum.HIDE}>Hide</option>
                <option value={SkipDayVisibilityEnum.SHOW_ALWAYS}>Show Always</option>
                <option value={SkipDayVisibilityEnum.SHOW_IF_OVERDUE}>Show If Overdue</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onClick={props.onClose}>
              Cancel
            </button>
            <button type="submit" class="btn btn-primary">
              {props.chore ? 'Save' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
