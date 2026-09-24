import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { downloadBackup } from '../api';
import { triggerBackupDownload } from './backup-actions';

vi.mock('../api', () => ({
  downloadBackup: vi.fn(),
}));

/**
 * Minimal mock of an HTMLAnchorElement for verifying the download helper
 * without needing a real DOM.
 */
class MockAnchorElement {
  public href = '';
  public download = '';
  public click = vi.fn<() => void>();
}

describe('triggerBackupDownload', () => {
  const createObjectURL = vi.fn<(blob: Blob) => string>();
  const revokeObjectURL = vi.fn<(url: string) => void>();
  const appendChild = vi.fn<(node: HTMLAnchorElement) => HTMLAnchorElement>();
  const removeChild = vi.fn<(node: HTMLAnchorElement) => HTMLAnchorElement>();
  const createElement = vi.fn<(tagName: string) => HTMLAnchorElement>();
  const anchor = new MockAnchorElement();

  beforeEach(() => {
    createObjectURL.mockReturnValue('blob:mock-url');
    createElement.mockImplementation((tagName: string) => {
      if (tagName !== 'a') {
        throw new Error(`Expected createElement to be called with 'a', got ${tagName}`);
      }
      anchor.href = '';
      anchor.download = '';
      return anchor as unknown as HTMLAnchorElement;
    });

    vi.stubGlobal('window', {
      URL: {
        createObjectURL,
        revokeObjectURL,
      },
    });

    vi.stubGlobal('document', {
      createElement,
      body: {
        appendChild,
        removeChild,
      },
    });
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it('should download the backup and trigger a browser download', async () => {
    const mockBlob = new Blob(['{}'], { type: 'application/json' });
    vi.mocked(downloadBackup).mockResolvedValueOnce(mockBlob);

    await triggerBackupDownload('1234');

    expect(downloadBackup).toHaveBeenCalledWith('1234');
    expect(createObjectURL).toHaveBeenCalledWith(mockBlob);
    expect(createElement).toHaveBeenCalledWith('a');
    expect(anchor.href).toBe('blob:mock-url');
    expect(anchor.download).toBe('family-chores-backup.json');
    expect(appendChild).toHaveBeenCalledWith(anchor as unknown as HTMLAnchorElement);
    expect(anchor.click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    expect(removeChild).toHaveBeenCalledWith(anchor as unknown as HTMLAnchorElement);
  });

  it('should call downloadBackup with undefined when no pin is provided', async () => {
    const mockBlob = new Blob(['{}'], { type: 'application/json' });
    vi.mocked(downloadBackup).mockResolvedValueOnce(mockBlob);

    await triggerBackupDownload(undefined);

    expect(downloadBackup).toHaveBeenCalledWith(undefined);
  });

  it('should propagate errors from downloadBackup', async () => {
    vi.mocked(downloadBackup).mockRejectedValueOnce(new Error('API error'));

    await expect(triggerBackupDownload(undefined)).rejects.toThrow('API error');
  });
});
