import { createSignal, onMount } from 'solid-js';
import type {
  Chore,
  FamilyChoresData,
  Person,
  PersonalChore,
  RotatingChore,
} from '../types/chore-types';
import { ChoreType, type DayOfWeek } from '../types/chore-types';
import { PersonModal } from './person-modal';
import { PersonalChoreModal } from './personal-chore-modal';
import { RotatingChoreModal } from './rotating-chore-modal';

// API base URL
const API_BASE = '/MMM-FamilyChores';

// Helper function to escape HTML
function escapeHtml(raw: string): string {
  const div = document.createElement('div');
  div.textContent = raw;
  return div.innerHTML;
}

// Format skip days for display
function formatSkipDays(skipDays: DayOfWeek[]): string {
  if (!skipDays || skipDays.length === 0) return 'None';
  return skipDays.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(', ');
}

export function Admin() {
  const [choreData, setChoreData] = createSignal<FamilyChoresData | null>(null);
  const [_personModalOpen, setPersonModalOpen] = createSignal(false);
  const [_personalChoreModalOpen, setPersonalChoreModalOpen] = createSignal(false);
  const [_rotatingChoreModalOpen, setRotatingChoreModalOpen] = createSignal(false);
  const [_copyModalOpen, setCopyModalOpen] = createSignal(false);
  const [_editingPerson, setEditingPerson] = createSignal<Person | null>(null);
  const [_editingChore, setEditingChore] = createSignal<Chore | null>(null);

  // Load data from API
  async function loadData() {
    try {
      const response = await fetch(`${API_BASE}/data`);
      if (!response.ok) throw new Error('Failed to load data');
      const data = (await response.json()) as FamilyChoresData;
      setChoreData(data);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load data. Please refresh the page.');
    }
  }

  onMount(() => {
    loadData();
  });

  // Person modal handlers
  function openPersonModal(person: Person | null = null) {
    setEditingPerson(person);
    setPersonModalOpen(true);
  }

  function _closePersonModal() {
    setPersonModalOpen(false);
    setEditingPerson(null);
  }

  function handleSavePerson(person: Omit<Person, 'id'>) {
    // TODO: Implement save person API call
    console.log('Saving person:', person);
    _closePersonModal();
  }

  // Chore modal handlers
  function openPersonalChoreModal(
    _personId: string | null = null,
    chore: PersonalChore | null = null
  ) {
    setEditingChore(chore);
    setPersonalChoreModalOpen(true);
  }

  function _closePersonalChoreModal() {
    setPersonalChoreModalOpen(false);
    setEditingChore(null);
  }

  function openRotatingChoreModal(chore: RotatingChore | null = null) {
    setEditingChore(chore);
    setRotatingChoreModalOpen(true);
  }

  function _closeRotatingChoreModal() {
    setRotatingChoreModalOpen(false);
    setEditingChore(null);
  }

  function handleSavePersonalChore(chore: Omit<PersonalChore, 'id'>) {
    // TODO: Implement save personal chore API call
    console.log('Saving personal chore:', chore);
    _closePersonalChoreModal();
  }

  function handleSaveRotatingChore(chore: Omit<RotatingChore, 'id'>) {
    // TODO: Implement save rotating chore API call
    console.log('Saving rotating chore:', chore);
    _closeRotatingChoreModal();
  }

  // Copy modal handlers
  function openCopyModal(fromPersonId: string) {
    // TODO: Implement copy chore functionality
    console.log('Copy chores from person:', fromPersonId);
  }

  function _closeCopyModal() {
    setCopyModalOpen(false);
  }

  // Get personal chores for a person
  function getPersonalChores(personId: string): PersonalChore[] {
    const data = choreData();
    if (!data) return [];
    return data.chores.filter(
      (chore) => chore.type === ChoreType.PERSONAL && chore.assignedTo === personId
    ) as PersonalChore[];
  }

  // Get rotating chores
  function getRotatingChores(): RotatingChore[] {
    const data = choreData();
    if (!data) return [];
    return data.chores.filter((chore) => chore.type === ChoreType.ROTATING) as RotatingChore[];
  }

  return (
    <div class="container">
      <header>
        <h1>Family Chores Admin</h1>
        <div class="backup-section">
          <button type="button" class="btn btn-secondary" id="backupBtn">
            Download Backup
          </button>
          <label for="restoreFile" class="btn btn-secondary">
            Restore Backup
          </label>
          <input type="file" id="restoreFile" accept=".json" hidden />
        </div>
      </header>

      <main>
        {/* People Section */}
        <section class="section">
          <div class="section-header">
            <h2>People</h2>
            <div class="button-with-tooltip">
              <button
                type="button"
                class="btn btn-primary"
                id="addPersonBtn"
                onClick={() => openPersonModal()}
              >
                Add Person
              </button>
              <span
                id="addPersonInfo"
                class="info-icon"
                data-tooltip="Add at least one person before you can create chores"
                style={choreData()?.people.length === 0 ? 'display: inline' : 'display: none'}
              >
                ℹ️
              </span>
            </div>
          </div>
          <div id="peopleList" class="item-list">
            {choreData()?.people.map((person) => (
              <div class="item-card">
                <div class="person-header">
                  <div class="item-info">
                    <h3>
                      {escapeHtml(person.name)}{' '}
                      <span class="color-badge" style={`background-color: ${person.color}`}></span>
                    </h3>
                    <p>ID: {person.id}</p>
                  </div>
                  <div class="item-actions">
                    <button
                      type="button"
                      class="btn btn-secondary btn-sm"
                      onClick={() => openPersonModal(person)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      class="btn btn-danger btn-sm"
                      onClick={() => {
                        if (
                          confirm(
                            'Are you sure you want to delete this person? This will also remove all their assigned chores.'
                          )
                        ) {
                          // TODO: implement delete
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div class="person-chores-header">
                  <h4>{escapeHtml(person.name)}'s Personal Chores</h4>
                  <div class="person-chores-actions">
                    <button
                      type="button"
                      class="btn btn-primary btn-sm"
                      onClick={() => openPersonalChoreModal(person.id)}
                    >
                      Add Chore
                    </button>
                    {getPersonalChores(person.id).length > 0 && (
                      <button
                        type="button"
                        class="btn btn-secondary btn-sm"
                        onClick={() => openCopyModal(person.id)}
                      >
                        Copy Chores
                      </button>
                    )}
                  </div>
                </div>
                {getPersonalChores(person.id).length > 0 ? (
                  <div class="person-chores">
                    {getPersonalChores(person.id).map((chore) => (
                      <div class="chore-item">
                        <div class="chore-info">
                          <h4>{escapeHtml(chore.name)}</h4>
                          {chore.deadline && <p class="deadline">Deadline: {chore.deadline}</p>}
                          <p class="skip-days">Skip days: {formatSkipDays(chore.skipDays)}</p>
                        </div>
                        <div class="chore-actions">
                          <button
                            type="button"
                            class="btn btn-secondary btn-sm"
                            onClick={() => openPersonalChoreModal(null, chore)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            class="btn btn-danger btn-sm"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this chore?')) {
                                // TODO: implement delete
                              }
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div class="person-chores">
                    <p class="empty-message">No personal chores yet.</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Rotating Chores Section */}
        <section
          class="section"
          id="rotatingChoresSection"
          style={(choreData()?.people?.length ?? 0) > 0 ? 'display: block' : 'display: none'}
        >
          <div class="section-header">
            <h2>Rotating Chores</h2>
            <button
              type="button"
              class="btn btn-primary"
              id="addRotatingChoreBtn"
              onClick={() => openRotatingChoreModal()}
            >
              Add Rotating Chore
            </button>
          </div>
          <div id="rotatingChoresList" class="item-list">
            {getRotatingChores().map((chore) => {
              // Get rotation list names
              const rotationNames = chore.rotation
                .map((personId) => {
                  const person = choreData()?.people.find((p) => p.id === personId);
                  return person ? escapeHtml(person.name) : 'Unknown';
                })
                .join(', ');

              // Check if rotation includes everyone
              const peopleLength = choreData()?.people.length ?? 0;
              const includesEveryone =
                chore.rotation.length === peopleLength &&
                chore.rotation.every((personId) =>
                  choreData()?.people.some((p) => p.id === personId)
                );

              const rotationText = includesEveryone ? 'Everyone' : rotationNames;

              // Get current assignee
              const currentPersonId = chore.rotation[chore.rotatingIndex ?? 0];
              const currentPerson = choreData()?.people.find((p) => p.id === currentPersonId);
              const currentAssignee = currentPerson ? escapeHtml(currentPerson.name) : 'Unassigned';

              return (
                <div class="item-card">
                  <div class="item-info">
                    <h3>
                      {escapeHtml(chore.name)}{' '}
                      <span class="chore-type-badge rotating">Rotating</span>
                    </h3>
                    <p>Current: {currentAssignee}</p>
                    <p>Rotation: {rotationText}</p>
                    {chore.deadline && <p class="deadline">Deadline: {chore.deadline}</p>}
                    <p class="skip-days">Skip days: {formatSkipDays(chore.skipDays)}</p>
                  </div>
                  <div class="item-actions">
                    <button
                      type="button"
                      class="btn btn-secondary"
                      onClick={() => openRotatingChoreModal(chore)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      class="btn btn-danger"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this chore?')) {
                          // TODO: implement delete
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* System State Section */}
        <section class="section">
          <h2>System State</h2>
          <div class="state-info">
            <p>
              <strong>Last Reset Date:</strong>{' '}
              <span id="lastResetDate">{choreData()?.lastResetDate || 'Never'}</span>
            </p>
            <div class="button-with-tooltip">
              <button
                type="button"
                class="btn btn-warning"
                id="resetDailyBtn"
                onClick={() => {
                  if (
                    confirm(
                      'Are you sure you want to force a daily reset? This will reset all chore states for the new day.'
                    )
                  ) {
                    // TODO: implement force reset
                  }
                }}
              >
                Force Daily Reset
              </button>
              <span
                class="info-icon"
                data-tooltip="WARNING: This will un-check all chores and rotate assignment on rotating chores to the next person. It does respect skip days if today is a skip day. Useful for testing or immediately advancing chore assignments."
              >
                ℹ️
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* Modals */}
      <PersonModal
        isOpen={_personModalOpen()}
        onClose={_closePersonModal}
        person={_editingPerson()}
        onSave={handleSavePerson}
      />
      <PersonalChoreModal
        isOpen={_personalChoreModalOpen()}
        onClose={_closePersonalChoreModal}
        chore={_editingChore() as PersonalChore | null}
        people={choreData()?.people ?? []}
        onSave={handleSavePersonalChore}
      />
      <RotatingChoreModal
        isOpen={_rotatingChoreModalOpen()}
        onClose={_closeRotatingChoreModal}
        chore={_editingChore() as RotatingChore | null}
        people={choreData()?.people ?? []}
        onSave={handleSaveRotatingChore}
      />
    </div>
  );
}
