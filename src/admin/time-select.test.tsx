import { render } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { MockAdminProvider } from './test-utils';
import { TimeSelect } from './time-select';

describe('TimeSelect', () => {
  it('renders "Not set" option and standard 30-minute options in 24h format', async () => {
    render(() => (
      <MockAdminProvider>
        <TimeSelect value="" onChange={vi.fn()} />
      </MockAdminProvider>
    ));

    const select = page.getByRole('combobox').element() as HTMLSelectElement;
    const optionTexts = Array.from(select.querySelectorAll('option')).map((o) => o.textContent);

    expect(optionTexts).toContain('— Not set —');
    expect(optionTexts).toContain('00:30');
    expect(optionTexts).toContain('12:00');
    expect(optionTexts).toContain('23:30');
    expect(optionTexts).not.toContain('00:00');
  });

  it('injects off-grid value into standard options', async () => {
    render(() => (
      <MockAdminProvider>
        <TimeSelect value="08:15" onChange={vi.fn()} />
      </MockAdminProvider>
    ));

    const select = page.getByRole('combobox').element() as HTMLSelectElement;
    const optionValues = Array.from(select.querySelectorAll('option')).map((o) => o.value);

    expect(optionValues).toContain('08:15');
    expect(optionValues).toContain('08:00');
    expect(optionValues).toContain('08:30');
    // Off-grid value should appear between the surrounding standard options
    expect(optionValues.indexOf('08:15')).toBeGreaterThan(optionValues.indexOf('08:00'));
    expect(optionValues.indexOf('08:15')).toBeLessThan(optionValues.indexOf('08:30'));
  });

  it('marks the current value as selected', async () => {
    render(() => (
      <MockAdminProvider>
        <TimeSelect value="14:30" onChange={vi.fn()} />
      </MockAdminProvider>
    ));

    const select = page.getByRole('combobox').element() as HTMLSelectElement;
    expect(select.value).toBe('14:30');
  });

  it('calls onChange when a new time is selected', async () => {
    const onChange = vi.fn();
    render(() => (
      <MockAdminProvider>
        <TimeSelect value="" onChange={onChange} />
      </MockAdminProvider>
    ));

    const select = page.getByRole('combobox');
    await select.selectOptions('09:00');
    expect(onChange).toHaveBeenCalledWith('09:00');
  });
});
