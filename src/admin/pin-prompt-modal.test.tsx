import { render } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { PinPromptModal } from './pin-prompt-modal';

describe('PinPromptModal', () => {
  it('should render title and message', async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(() => (
      <PinPromptModal
        title="Test Title"
        message="Enter your PIN"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    ));

    await expect.element(page.getByTestId('modal-title')).toBeVisible();
    expect(page.getByTestId('modal-title').element().textContent).toBe('Test Title');
    await expect.element(page.getByTestId('modal-message')).toBeVisible();
    expect(page.getByTestId('modal-message').element().textContent).toBe('Enter your PIN');
  });

  it('should render password input by default', async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(() => (
      <PinPromptModal
        title="PIN Required"
        message="Enter PIN"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    ));

    const input = page.getByPlaceholder('Enter PIN');
    await expect.element(input).toBeVisible();
    expect(input.element().getAttribute('type')).toBe('password');
  });

  it('should toggle password visibility', async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(() => (
      <PinPromptModal
        title="PIN Required"
        message="Enter PIN"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    ));

    const input = page.getByPlaceholder('Enter PIN');
    await expect.element(input).toBeVisible();
    expect(input.element().getAttribute('type')).toBe('password');

    const toggleButton = page.getByRole('button', { name: '👁' });
    await toggleButton.click();

    expect(input.element().getAttribute('type')).toBe('text');
  });

  it('should show remember PIN checkbox', async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(() => (
      <PinPromptModal
        title="PIN Required"
        message="Enter PIN"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    ));

    await expect.element(page.getByTestId('remember-pin-checkbox')).toBeVisible();
    expect((page.getByTestId('remember-pin-checkbox').element() as HTMLInputElement)?.checked).toBe(
      false
    );
  });

  it('should call onConfirm with pin and remember state', async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(() => (
      <PinPromptModal
        title="PIN Required"
        message="Enter PIN"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    ));

    await page.getByPlaceholder('Enter PIN').fill('1234');

    const confirmButton = page.getByRole('button', { name: 'Confirm' });
    await confirmButton.click();

    expect(onConfirm).toHaveBeenCalledWith('1234', false);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('should call onConfirm with remember true when checked', async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(() => (
      <PinPromptModal
        title="PIN Required"
        message="Enter PIN"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    ));

    await page.getByPlaceholder('Enter PIN').fill('5678');

    await page.getByTestId('remember-pin-checkbox').click();

    const confirmButton = page.getByRole('button', { name: 'Confirm' });
    await confirmButton.click();

    expect(onConfirm).toHaveBeenCalledWith('5678', true);
  });

  it('should call onCancel when cancel clicked', async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(() => (
      <PinPromptModal
        title="PIN Required"
        message="Enter PIN"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    ));

    const cancelButton = page.getByRole('button', { name: 'Cancel' });
    await cancelButton.click();

    expect(onCancel).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('should not submit when PIN is empty', async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(() => (
      <PinPromptModal
        title="PIN Required"
        message="Enter PIN"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    ));

    const confirmButton = page.getByRole('button', { name: 'Confirm' });
    await confirmButton.click();

    expect(onConfirm).not.toHaveBeenCalled();
  });
});
