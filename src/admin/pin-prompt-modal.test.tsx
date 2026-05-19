import { render } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { PinPromptModal } from './pin-prompt-modal';

describe('PinPromptModal', () => {
  it('should render title and message', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    const { container } = render(() => (
      <PinPromptModal
        title="Test Title"
        message="Enter your PIN"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    ));

    expect(container.querySelector('h3')?.textContent).toBe('Test Title');
    expect(container.querySelector('p')?.textContent).toBe('Enter your PIN');
  });

  it('should render password input by default', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    const { container } = render(() => (
      <PinPromptModal
        title="PIN Required"
        message="Enter PIN"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    ));

    const input = container.querySelector('#pinPromptInput') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.type).toBe('password');
  });

  it('should toggle password visibility', async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    const { container } = render(() => (
      <PinPromptModal
        title="PIN Required"
        message="Enter PIN"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    ));

    const input = container.querySelector('#pinPromptInput') as HTMLInputElement;
    expect(input.type).toBe('password');

    const toggleButton = page.getByRole('button', { name: '👁' });
    await toggleButton.click();

    expect(input.type).toBe('text');
  });

  it('should show remember PIN checkbox', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    const { container } = render(() => (
      <PinPromptModal
        title="PIN Required"
        message="Enter PIN"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    ));

    const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(checkbox).toBeTruthy();
    expect(checkbox.checked).toBe(false);
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

    const { container } = render(() => (
      <PinPromptModal
        title="PIN Required"
        message="Enter PIN"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    ));

    await page.getByPlaceholder('Enter PIN').fill('5678');

    const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
    checkbox.click();

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
