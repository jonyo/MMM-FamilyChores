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

interface PersonalChoreModalProps {
  person: Person | null;
  initialChore?: PersonalChore;
  closeModal: () => void;
}

export const PersonalChoreModal: Component<PersonalChoreModalProps> = (props) => {
  const [name, setName] = createSignal(props.initialChore?.name ?? '');
  const [deadline, setDeadline] = createSignal(props.initialChore?.deadline ?? '');
  const [skipDayVisibility, setSkipDayVisibility] = createSignal<SkipDayVisibility>(
    props.initialChore?.skipDayVisibility ?? SkipDayVisibilityEnum.HIDE
  );
  const [skipDays, setSkipDays] = createSignal<DayOfWeek[]>(props.initialChore?.skipDays ?? []);

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
      if (props.initialChore?.id) {
        const body: UpdateChoreRequest = {
          name: name(),
          type: ChoreType.PERSONAL,
          assignedTo: person.id,
          deadline: deadline() || undefined,
          skipDays: skipDays(),
          skipDayVisibility: skipDayVisibility(),
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
        };
        await createChore(body);
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
        <div class="modal active">
          <div class="modal-content">
            <h3>Error</h3>
            <p>Person not found. Please refresh the page.</p>
            <button type="button" class="btn btn-secondary" onClick={() => props.closeModal()}>
              Close
            </button>
          </div>
        </div>
      }
    >
      {(person: Person) => (
        <div class="modal active">
          <div class="modal-content">
            <h3>{props.initialChore ? 'Edit Personal Chore' : 'Add Personal Chore'}</h3>
            <div class="assigned-person-display">
              <span class="color-badge" style={`background-color: ${person.color}`}></span>
              <strong>Assigned to:</strong> {person.name}
            </div>
            <form onSubmit={handleSubmit}>
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
                <div class="checkbox-list">
                  <For each={Object.values(DayOfWeek)}>
                    {(day) => (
                      <label>
                        <input
                          type="checkbox"
                          value={day}
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
              <div class="form-actions">
                <button type="button" class="btn btn-secondary" onClick={() => props.closeModal()}>
                  Cancel
                </button>
                <button type="submit" class="btn btn-primary">
                  {props.initialChore ? 'Save' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Show>
  );
};
