import type {
  Chore,
  FamilyChoresData,
  Person,
  PersonalChore,
  RotatingChore,
} from '../types/chore-types';
import { type Component, createSignal, For, onMount, Show } from 'solid-js';
import { deleteChore, deletePerson } from '../api';
import { ChoreType, type DayOfWeek } from '../types/chore-types';
import { escapeHtml } from '../utils/browser';
import { getLocalDateString } from '../utils/date';
import { PersonModal } from './person-modal';
import { PersonalChoreModal } from './personal-chore-modal';
import { RotatingChoreCard } from './rotating-chore';
import { RotatingChoreModal } from './rotating-chore-modal';

// API base URL
const API_BASE = '/MMM-FamilyChores';

// Format skip days for display
const formatSkipDays = (skipDays: DayOfWeek[]): string => {
  if (!skipDays || skipDays.length === 0) return 'None';
  return skipDays.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(', ');
};

export const Admin: Component<Record<string, never>> = () => {
  const [choreData, setChoreData] = createSignal<FamilyChoresData | null>(null);
  const [personModalOpen, setPersonModalOpen] = createSignal(false);
  const [personalChoreModalOpen, setPersonalChoreModalOpen] = createSignal(false);
  const [rotatingChoreModalOpen, setRotatingChoreModalOpen] = createSignal(false);
  const [editingPerson, setEditingPerson] = createSignal<Person | null>(null);
  const [editingChore, setEditingChore] = createSignal<Chore | null>(null);
  const [editingChorePerson, setEditingChorePerson] = createSignal<Person | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [retryCount, setRetryCount] = createSignal(0);

  // Load data from API
  const loadData = async () => {
    try {
      const response = await fetch(`${API_BASE}/data`);
      if (!response.ok) throw new Error('Failed to load data');
      const data = (await response.json()) as FamilyChoresData;
      setChoreData(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      // Retry after 10 seconds if data not loaded
      setTimeout(() => {
        setRetryCount((prev) => prev + 1);
        loadData();
      }, 10000);
    }
  };

  onMount(() => {
    loadData();
  });

  // Person modal handlers
  const openPersonModal = (person: Person | null = null) => {
    setEditingPerson(person);
    setPersonModalOpen(true);
  };

  const closePersonModal = async () => {
    setPersonModalOpen(false);
    setEditingPerson(null);
    await loadData();
  };

  // Chore modal handlers
  const openPersonalChoreModal = (person: Person, chore: PersonalChore | null = null) => {
    setEditingChore(chore);
    setEditingChorePerson(person);
    setPersonalChoreModalOpen(true);
  };

  const closePersonalChoreModal = async () => {
    setPersonalChoreModalOpen(false);
    setEditingChore(null);
    setEditingChorePerson(null);
    await loadData();
  };

  const openRotatingChoreModal = (chore: RotatingChore | null = null) => {
    setEditingChore(chore);
    setRotatingChoreModalOpen(true);
  };

  const closeRotatingChoreModal = async () => {
    setRotatingChoreModalOpen(false);
    setEditingChore(null);
    await loadData();
  };

  // Delete handlers
  const handleDeletePerson = async (personId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this person? This will also remove all their assigned chores.'
      )
    ) {
      return;
    }

    try {
      await deletePerson(personId);
      await loadData();
    } catch (error) {
      console.error('Error deleting person:', error);
      alert(`Failed to delete person: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeleteChore = async (choreId: string) => {
    if (!confirm('Are you sure you want to delete this chore?')) {
      return;
    }

    try {
      await deleteChore(choreId);
      await loadData();
    } catch (error) {
      console.error('Error deleting chore:', error);
      alert(`Failed to delete chore: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Backup/restore handlers
  const handleDownloadBackup = async () => {
    try {
      const response = await fetch(`${API_BASE}/backup`);
      if (!response.ok) throw new Error('Failed to create backup');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download =
        response.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] ||
        'family-chores-backup.json';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading backup:', error);
      alert('Failed to download backup. Please try again.');
    }
  };

  const handleRestore = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      const response = await fetch(`${API_BASE}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to restore data');

      alert('Data restored successfully!');
      await loadData();
    } catch (error) {
      console.error('Error restoring data:', error);
      alert('Failed to restore data. Please check the file format and try again.');
    }

    // Reset file input
    (e.target as HTMLInputElement).value = '';
  };

  const handleForceReset = async () => {
    if (
      !confirm(
        'Are you sure you want to force a daily reset? This will reset all chore states for the new day.'
      )
    ) {
      return;
    }

    try {
      const data = choreData();
      if (!data) return;

      // Update lastResetDate to yesterday to trigger reset
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = getLocalDateString(yesterday);

      data.lastResetDate = yesterdayStr;

      const response = await fetch(`${API_BASE}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to force reset');

      alert('Daily reset triggered successfully! The data will be updated on the next sync.');
      await loadData();
    } catch (error) {
      console.error('Error forcing reset:', error);
      alert('Failed to force reset. Please try again.');
    }
  };

  // Get personal chores for a person
  const getPersonalChores = (personId: string): PersonalChore[] => {
    const data = choreData();
    if (!data) return [];
    return data.chores.filter(
      (chore) => chore.type === ChoreType.PERSONAL && chore.assignedTo === personId
    ) as PersonalChore[];
  };

  // Get rotating chores
  const getRotatingChores = (): RotatingChore[] => {
    const data = choreData();
    if (!data) return [];
    return data.chores.filter((chore) => chore.type === ChoreType.ROTATING) as RotatingChore[];
  };

  return (
    <div class="container">
      <header>
        <h1>Family Chores Admin</h1>
        <div class="backup-section">
          <button
            type="button"
            class="btn btn-secondary"
            id="backupBtn"
            onClick={handleDownloadBackup}
          >
            Download Backup
          </button>
          <label for="restoreFile" class="btn btn-secondary">
            Restore Backup
          </label>
          <input type="file" id="restoreFile" accept=".json" hidden onInput={handleRestore} />
        </div>
      </header>

      <Show when={loading()}>
        <div class="loading-message">
          <div class="loading-message-content">
            <p>Magic Mirror is starting up, please wait...</p>
            <Show when={retryCount() > 0}>
              <p class="retry-info">Retrying... (attempt {retryCount()})</p>
            </Show>
          </div>
        </div>
      </Show>

      <Show when={choreData()}>
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
                <Show when={choreData()?.people.length === 0}>
                  <span
                    id="addPersonInfo"
                    class="info-icon"
                    data-tooltip="Add at least one person before you can create chores"
                  >
                    ℹ️
                  </span>
                </Show>
              </div>
            </div>
            <div id="peopleList" class="item-list">
              <For each={choreData()?.people ?? []}>
                {(person) => (
                  <div class="item-card">
                    <div class="person-header">
                      <div class="item-info">
                        <h3>
                          {escapeHtml(person.name)}{' '}
                          <span
                            class="color-badge"
                            style={`background-color: ${person.color}`}
                          ></span>
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
                          onClick={() => handleDeletePerson(person.id)}
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
                          onClick={() => {
                            openPersonalChoreModal(person, null);
                          }}
                        >
                          Add Chore
                        </button>
                      </div>
                    </div>
                    <Show
                      when={getPersonalChores(person.id).length > 0}
                      fallback={
                        <div class="person-chores">
                          <p class="empty-message">No personal chores yet.</p>
                        </div>
                      }
                    >
                      <div class="person-chores">
                        <For each={getPersonalChores(person.id)}>
                          {(chore) => (
                            <>
                              <div class="chore-item">
                                <div class="chore-info">
                                  <h4>{escapeHtml(chore.name)}</h4>
                                  {chore.deadline && (
                                    <p class="deadline">Deadline: {chore.deadline}</p>
                                  )}
                                  <p class="skip-days">
                                    Skip days: {formatSkipDays(chore.skipDays)}
                                  </p>
                                </div>
                                <div class="chore-actions">
                                  <button
                                    type="button"
                                    class="btn btn-secondary btn-sm"
                                    onClick={() => {
                                      openPersonalChoreModal(person, chore);
                                    }}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    class="btn btn-danger btn-sm"
                                    onClick={() => handleDeleteChore(chore.id)}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </For>
                      </div>
                    </Show>
                  </div>
                )}
              </For>
            </div>
          </section>

          {/* Rotating Chores Section */}
          <Show when={(choreData()?.people?.length ?? 0) > 0}>
            <section class="section" id="rotatingChoresSection">
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
                <For each={getRotatingChores()}>
                  {(chore) => (
                    <RotatingChoreCard
                      chore={chore}
                      people={choreData()?.people ?? []}
                      onEdit={openRotatingChoreModal}
                      onDelete={handleDeleteChore}
                    />
                  )}
                </For>
              </div>
            </section>
          </Show>

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
                  onClick={handleForceReset}
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
      </Show>

      {/* Modals */}
      <Show when={personModalOpen()}>
        <PersonModal initialPerson={editingPerson() ?? undefined} closeModal={closePersonModal} />
      </Show>
      <Show when={personalChoreModalOpen()}>
        <PersonalChoreModal
          person={editingChorePerson()}
          initialChore={editingChore() as PersonalChore | undefined}
          closeModal={closePersonalChoreModal}
        />
      </Show>
      <Show when={rotatingChoreModalOpen() && choreData()}>
        <RotatingChoreModal
          initialChore={editingChore() as RotatingChore | undefined}
          choreData={choreData() ?? { people: [], chores: [] }}
          closeModal={closeRotatingChoreModal}
        />
      </Show>
    </div>
  );
};
