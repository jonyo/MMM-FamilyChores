import { render } from '@solidjs/testing-library';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { InfoBox } from './info-box';

describe('InfoBox', () => {
  it('renders children', async () => {
    render(() => <InfoBox>Test content</InfoBox>);
    await expect.element(page.getByText('Test content')).toBeVisible();
  });
});
