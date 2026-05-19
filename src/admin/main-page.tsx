import type { Component } from 'solid-js';
import { createSignal, For, Show } from 'solid-js';
import { deleteChore, deletePerson, downloadBackup } from '../api';
import type { Chore, DayOfWeek, Person, PersonalChore, RotatingChore } from '../types/chore-types';
import { ChoreType } from '../types/chore-types';
import { escapeHtml } from '../utils/browser';
import { getLocalDateString } from '../utils/date';
import { useAdminContext } from './admin-context';
import { Button } from './button';
import { ChoreHistoryModal } from './chore-history-modal';
import { CopyChoresModal } from './copy-chores-modal';
import { PersonModal } from './person-modal';
import { PersonalChoreModal } from './personal-chore-modal';
import { RotatingChoreCard } from './rotating-chore';
import { RotatingChoreModal } from './rotating-chore-modal';
import { SettingsModal } from './settings-modal';
import { Tooltip } from './tooltip';

// API base URL
const API_BASE = '/MMM-FamilyChores';

// Format skip days for display
const formatSkipDays = (skipDays: DayOfWeek[]): string => {
  if (!skipDays || skipDays.length === 0) return 'None';
  return skipDays.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(', ');
};

export const MainPage: Component = () => {
  const { choreData, loadData, pinRequired, requestPin, cachePin, adminPin } = useAdminContext();

  const [personModalOpen, setPersonModalOpen] = createSignal(false);
  const [personalChoreModalOpen, setPersonalChoreModalOpen] = createSignal(false);
  const [rotatingChoreModalOpen, setRotatingChoreModalOpen] = createSignal(false);
  const [copyChoresModalOpen, setCopyChoresModalOpen] = createSignal(false);
  const [settingsModalOpen, setSettingsModalOpen] = createSignal(false);
  const [editingPerson, setEditingPerson] = createSignal<Person | null>(null);
  const [editingChore, setEditingChore] = createSignal<Chore | null>(null);
  const [editingChorePerson, setEditingChorePerson] = createSignal<Person | null>(null);
  const [copyChoresFromPerson, setCopyChoresFromPerson] = createSignal<Person | null>(null);
  const [historyPerson, setHistoryPerson] = createSignal<Person | null>(null);

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

  // Copy chores modal handlers
  const openCopyChoresModal = (person: Person) => {
    setCopyChoresFromPerson(person);
    setCopyChoresModalOpen(true);
  };

  const closeCopyChoresModal = async () => {
    setCopyChoresModalOpen(false);
    setCopyChoresFromPerson(null);
    await loadData();
  };

  // Settings modal handlers
  const closeSettingsModal = async () => {
    setSettingsModalOpen(false);
    await loadData();
  };

  // Backup/restore handlers
  const handleDownloadBackup = async () => {
    try {
      let pin = adminPin();
      let rememberPin = false;
      if (pinRequired() && !pin) {
        const result = await requestPin('Download Backup', 'Enter admin PIN to download backup');
        if (!result.pin) return;
        pin = result.pin;
        rememberPin = result.remember;
      }

      const blob = await downloadBackup(pin || undefined);
      if (rememberPin) cachePin(pin);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'family-chores-backup.json';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading backup:', error);
      alert(
        `Failed to download backup: ${error instanceof Error ? error.message : 'Please try again.'}`
      );
    }
  };

  const handleRestore = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    let pin = adminPin();
    let rememberPin = false;
    if (pinRequired() && !pin) {
      const result = await requestPin('Restore Backup', 'Enter admin PIN to restore data');
      if (!result.pin) {
        (e.target as HTMLInputElement).value = '';
        return;
      }
      pin = result.pin;
      rememberPin = result.remember;
    }

    try {
      const text = await file.text();
      const data = JSON.parse(text) as Record<string, unknown>;
      data.pin = pin || undefined;

      const response = await fetch(`${API_BASE}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to restore data');

      if (rememberPin) cachePin(pin);
      alert('Data restored successfully!');
      await loadData();
    } catch (error) {
      console.error('Error restoring data:', error);
      alert('Failed to restore data. Please check the file format and try again.');
    }

    // Reset file input
    (e.target as HTMLInputElement).value = '';
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

    let pin = adminPin();
    let rememberPin = false;
    if (pinRequired() && !pin) {
      const result = await requestPin(
        'Admin PIN Required',
        'Enter admin PIN to delete this person'
      );
      if (!result.pin) return;
      pin = result.pin;
      rememberPin = result.remember;
    }

    try {
      await deletePerson(personId, pin || undefined);
      if (rememberPin) cachePin(pin);
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

    let pin = adminPin();
    let rememberPin = false;
    if (pinRequired() && !pin) {
      const result = await requestPin('Admin PIN Required', 'Enter admin PIN to delete this chore');
      if (!result.pin) return;
      pin = result.pin;
      rememberPin = result.remember;
    }

    try {
      await deleteChore(choreId, pin || undefined);
      if (rememberPin) cachePin(pin);
      await loadData();
    } catch (error) {
      console.error('Error deleting chore:', error);
      alert(`Failed to delete chore: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleForceReset = async () => {
    if (
      !confirm(
        'Are you sure you want to force a daily reset? This will reset all chore states for the new day.'
      )
    ) {
      return;
    }

    let pin = adminPin();
    let rememberPin = false;
    if (pinRequired() && !pin) {
      const result = await requestPin('Admin PIN Required', 'Enter admin PIN to force daily reset');
      if (!result.pin) return;
      pin = result.pin;
      rememberPin = result.remember;
    }

    try {
      // Update lastResetDate to yesterday to trigger reset
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = getLocalDateString(yesterday);

      const data = { ...choreData(), lastResetDate: yesterdayStr };

      const response = await fetch(`${API_BASE}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, pin: pin || undefined }),
      });

      if (!response.ok) throw new Error('Failed to force reset');

      if (rememberPin) cachePin(pin);
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
    return data.chores.filter(
      (chore) => chore.type === ChoreType.PERSONAL && chore.assignedTo === personId
    ) as PersonalChore[];
  };

  // Get rotating chores
  const getRotatingChores = (): RotatingChore[] => {
    const data = choreData();
    return data.chores.filter((chore) => chore.type === ChoreType.ROTATING) as RotatingChore[];
  };

  return (
    <>
      <header class="flex flex-wrap items-center justify-between gap-4 bg-slate-100 p-8 text-slate-900">
        <h1 class="text-3xl font-semibold">Family Chores Admin</h1>
        <div class="flex gap-2.5">
          <Button type="button" variant="secondary" id="backupBtn" onClick={handleDownloadBackup}>
            Download Backup
          </Button>
          <label
            for="restoreFile"
            class="cursor-pointer rounded-lg border-none bg-gray-600 px-5 py-2.5 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-gray-700 hover:shadow-md"
          >
            Restore Backup
          </label>
          <input type="file" id="restoreFile" accept=".json" hidden onInput={handleRestore} />
          <Button
            type="button"
            variant="secondary"
            id="settingsBtn"
            onClick={() => setSettingsModalOpen(true)}
          >
            ⚙️ Settings
          </Button>
        </div>
      </header>
      <main class="p-8">
        {/* People Section */}
        <section class="mb-10" data-testid="people-section">
          <div class="mb-5 flex items-center justify-between">
            <h2 class="m-0 border-b-2 border-indigo-600 pb-2.5 text-2xl text-indigo-600">People</h2>
            <div class="flex items-center gap-2">
              <Button
                type="button"
                variant="primary"
                id="addPersonBtn"
                onClick={() => openPersonModal()}
              >
                Add Person
              </Button>
              <Show when={choreData().people.length === 0}>
                <Tooltip
                  text="Add at least one person before you can create chores"
                  class="ml-2 text-base"
                >
                  ℹ️
                </Tooltip>
              </Show>
            </div>
          </div>
          <div id="peopleList" class="mt-5 grid gap-4">
            <For each={choreData().people}>
              {(person) => (
                <div
                  class="rounded-lg border border-slate-200 bg-slate-50 p-5 transition-all hover:border-indigo-600 hover:shadow-md"
                  data-testid="person-card"
                >
                  <div class="mb-4 flex items-center justify-between">
                    <div class="flex-1">
                      <h3 class="mb-1.5 text-xl text-slate-900">
                        {escapeHtml(person.name)}{' '}
                        <span
                          class="inline-block size-6  rounded-full border-2 border-black/10 align-middle"
                          style={`background-color: ${person.color}`}
                        ></span>
                      </h3>
                      <p class="text-sm text-slate-500">ID: {person.id}</p>
                    </div>
                    <div class="flex gap-2.5">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => openPersonModal(person)}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setHistoryPerson(person)}
                      >
                        History
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeletePerson(person.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  <div class="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
                    <h4 class="m-0 text-lg text-indigo-600">
                      {escapeHtml(person.name)}'s Personal Chores
                    </h4>
                    <div class="flex gap-2">
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          openPersonalChoreModal(person, null);
                        }}
                      >
                        Add Chore
                      </Button>
                      <Show
                        when={
                          getPersonalChores(person.id).length > 0 && choreData().people.length > 1
                        }
                      >
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            openCopyChoresModal(person);
                          }}
                        >
                          Copy Chores
                        </Button>
                      </Show>
                    </div>
                  </div>
                  <Show
                    when={getPersonalChores(person.id).length > 0}
                    fallback={
                      <div class="mt-4 border-t border-slate-200 pt-4">
                        <p class="my-2.5 text-slate-500 italic">No personal chores yet.</p>
                      </div>
                    }
                  >
                    <div class="mt-4 border-t border-slate-200 pt-4">
                      <For each={getPersonalChores(person.id)}>
                        {(chore) => (
                          <>
                            <div class="mb-2.5 flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2.5 last:mb-0">
                              <div>
                                <h4 class="mb-1.5 text-base text-slate-900">
                                  {escapeHtml(chore.name)}
                                </h4>
                                <Show when={chore.deadline}>
                                  <p class="mt-1.25 text-sm text-indigo-600">
                                    Deadline: {chore.deadline}
                                  </p>
                                </Show>
                                <p class="mt-1.25 text-sm text-slate-500">
                                  Skip days: {formatSkipDays(chore.skipDays)}
                                </p>
                              </div>
                              <div class="flex gap-2">
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => {
                                    openPersonalChoreModal(person, chore);
                                  }}
                                >
                                  Edit
                                </Button>
                                <Button
                                  type="button"
                                  variant="danger"
                                  size="sm"
                                  onClick={() => handleDeleteChore(chore.id)}
                                >
                                  Delete
                                </Button>
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
        <Show when={choreData().people.length > 0}>
          <section class="mb-10" id="rotatingChoresSection">
            <div class="mb-5 flex items-center justify-between">
              <h2 class="m-0 border-b-2 border-indigo-600 pb-2.5 text-2xl text-indigo-600">
                Rotating Chores
              </h2>
              <Button
                type="button"
                variant="primary"
                id="addRotatingChoreBtn"
                onClick={() => openRotatingChoreModal()}
              >
                Add Rotating Chore
              </Button>
            </div>
            <div id="rotatingChoresList" class="mt-5 grid gap-4">
              <For each={getRotatingChores()}>
                {(chore) => (
                  <RotatingChoreCard
                    chore={chore}
                    people={choreData().people}
                    onEdit={openRotatingChoreModal}
                    onDelete={handleDeleteChore}
                  />
                )}
              </For>
            </div>
          </section>
        </Show>

        {/* System State Section */}
        <section class="mb-10">
          <h2 class="m-0 border-b-2 border-indigo-600 pb-2.5 text-2xl text-indigo-600">
            System State
          </h2>
          <div class="rounded-lg border border-slate-200 bg-slate-50 p-5">
            <p class="mb-4 text-base">
              <strong class="text-indigo-600">Last Reset Date:</strong>{' '}
              <span id="lastResetDate">{choreData().lastResetDate || 'Never'}</span>
            </p>
            <div class="mt-4 flex flex-row items-start gap-4">
              <div class="flex items-center gap-2">
                <Button
                  type="button"
                  variant="warning"
                  id="resetDailyBtn"
                  onClick={handleForceReset}
                >
                  Force Daily Reset
                </Button>
                <Tooltip
                  text="WARNING: This will un-check all chores and rotate assignment on rotating chores to the next person. It does respect skip days if today is a skip day. Useful for testing or immediately advancing chore assignments."
                  position="above"
                  align="center"
                  multiline
                  class="ml-2 text-base"
                >
                  ℹ️
                </Tooltip>
              </div>
            </div>
          </div>
        </section>
      </main>

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
      <Show when={rotatingChoreModalOpen()}>
        <RotatingChoreModal
          initialChore={editingChore() as RotatingChore | undefined}
          closeModal={closeRotatingChoreModal}
        />
      </Show>
      <Show when={copyChoresModalOpen() && copyChoresFromPerson()}>
        <CopyChoresModal
          fromPerson={copyChoresFromPerson() as Person}
          closeModal={closeCopyChoresModal}
        />
      </Show>
      <Show when={historyPerson()}>
        <ChoreHistoryModal
          person={historyPerson() as Person}
          closeModal={() => setHistoryPerson(null)}
        />
      </Show>
      <Show when={settingsModalOpen()}>
        <SettingsModal closeModal={closeSettingsModal} />
      </Show>
    </>
  );
};
