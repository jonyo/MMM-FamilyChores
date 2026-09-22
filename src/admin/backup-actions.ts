import { downloadBackup } from '../api';

/**
 * Triggers a browser download of the family chores backup JSON.
 *
 * The caller is responsible for resolving and providing the admin PIN (if required) before
 * invoking this helper. If the API rejects, the error is propagated to the caller.
 *
 * @param pin - The admin PIN, or `undefined` if the server does not require one.
 */
export async function triggerBackupDownload(pin: string | undefined): Promise<void> {
  const blob = await downloadBackup(pin);

  // Create a temporary object URL and click a hidden anchor to trigger the download
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'family-chores-backup.json';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
