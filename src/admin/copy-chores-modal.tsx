import type { Component } from 'solid-js';
import { createMemo, createSignal, For, onMount, Show } from 'solid-js';
import './copy-chores-modal.css';
import './buttons.css';
import './forms.css';
import './modals.css';
import { copyChores } from '../api';
import type { FamilyChoresData, Person, PersonalChore } from '../types/chore-types';
import { ChoreType } from '../types/chore-types';
import { escapeHtml } from '../utils/browser';

interface CopyChoresModalProps {
  fromPerson: Person;
  choreData: FamilyChoresData;
  closeModal: () => void;
}

export const CopyChoresModal: Component<CopyChoresModalProps> = (props) => {
  // Get personal chores for the from person
  const personalChores = createMemo<PersonalChore[]>(() => {
    return props.choreData.chores.filter(
      (chore) => chore.type === ChoreType.PERSONAL && chore.assignedTo === props.fromPerson.id
    ) as PersonalChore[];
  });

  // Get available people to copy to (exclude from person)
  const availablePeople = createMemo<Person[]>(() => {
    return props.choreData.people.filter((person) => person.id !== props.fromPerson.id);
  });

  const [selectedChoreIds, setSelectedChoreIds] = createSignal<string[]>([]);
  const [toPersonId, setToPersonId] = createSignal<string>('');
  const [loading, setLoading] = createSignal(false);

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
      await copyChores({
        fromPersonId: props.fromPerson.id,
        toPersonId: toPersonId(),
        choreIds: selectedChoreIds(),
      });
      props.closeModal();
    } catch (error) {
      console.error('Error copying chores:', error);
      alert(`Failed to copy chores: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="modal active">
      <div class="modal-content">
        <h3>Copy Chores</h3>
        <div class="copy-from-display">
          <span class="color-badge" style={`background-color: ${props.fromPerson.color}`}></span>
          <strong>From:</strong> {escapeHtml(props.fromPerson.name)}
        </div>
        <Show
          when={personalChores().length > 0}
          fallback={
            <div class="empty-message">
              <p>No personal chores to copy for {escapeHtml(props.fromPerson.name)}.</p>
              <button type="button" class="btn btn-secondary" onClick={() => props.closeModal()}>
                Close
              </button>
            </div>
          }
        >
          <Show when={availablePeople().length === 0}>
            <div class="empty-message">
              <p>No other people available to copy chores to.</p>
              <button type="button" class="btn btn-secondary" onClick={() => props.closeModal()}>
                Close
              </button>
            </div>
          </Show>
          <Show when={availablePeople().length > 0}>
            <form onSubmit={handleSubmit}>
              <div class="form-group">
                <div class="form-label">Select Person to Copy To</div>
                <select
                  id="toPerson"
                  value={toPersonId()}
                  onInput={(e) => setToPersonId(e.currentTarget.value)}
                  required
                >
                  <option value="">-- Select a person --</option>
                  <For each={availablePeople()}>
                    {(person) => <option value={person.id}>{escapeHtml(person.name)}</option>}
                  </For>
                </select>
              </div>
              <div class="form-group">
                <div class="form-label">Select Chores to Copy</div>
                <div class="checkbox-list">
                  <For each={personalChores()}>
                    {(chore) => (
                      <label>
                        <input
                          type="checkbox"
                          value={chore.id}
                          checked={selectedChoreIds().includes(chore.id)}
                          onInput={(e) => handleChoreToggle(chore.id, e.currentTarget.checked)}
                        />
                        {escapeHtml(chore.name)}
                      </label>
                    )}
                  </For>
                </div>
              </div>
              <div class="form-actions">
                <button type="button" class="btn btn-secondary" onClick={() => props.closeModal()}>
                  Cancel
                </button>
                <button type="submit" class="btn btn-primary" disabled={loading()}>
                  {loading() ? 'Copying...' : 'Copy'}
                </button>
              </div>
            </form>
          </Show>
        </Show>
      </div>
    </div>
  );
};
