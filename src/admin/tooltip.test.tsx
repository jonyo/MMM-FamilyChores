import { render } from '@solidjs/testing-library';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { Tooltip } from './tooltip';

describe('Tooltip', () => {
  it('renders children', () => {
    const { container } = render(() => (
      <Tooltip text="Test tooltip">
        <span>Content</span>
      </Tooltip>
    ));
    expect(container.textContent).toBe('Content');
  });

  it('adds data-tooltip attribute when text is provided', () => {
    render(() => (
      <Tooltip text="Test tooltip">
        <span>Content</span>
      </Tooltip>
    ));
    const tooltip = page.getByTestId('tooltip');
    expect(tooltip).toHaveAttribute('data-tooltip', 'Test tooltip');
  });

  it('does not add tooltip classes when text is empty', () => {
    render(() => (
      <Tooltip text="">
        <span>Content</span>
      </Tooltip>
    ));
    const tooltip = page.getByTestId('tooltip');
    expect(tooltip).toHaveAttribute('data-tooltip', '');
    expect(tooltip).not.toHaveClass('tooltip');
  });

  it('adds tooltip classes when text is provided', () => {
    render(() => (
      <Tooltip text="Test tooltip">
        <span>Content</span>
      </Tooltip>
    ));
    const tooltip = page.getByTestId('tooltip');
    expect(tooltip).toHaveClass('tooltip');
    expect(tooltip).toHaveClass('tooltip-above');
    expect(tooltip).toHaveClass('tooltip-align-left');
  });

  it('applies position class correctly', () => {
    render(() => (
      <Tooltip text="Test tooltip" position="below">
        <span>Content</span>
      </Tooltip>
    ));
    const tooltip = page.getByTestId('tooltip');
    expect(tooltip).toHaveClass('tooltip-below');
  });

  it('applies align class correctly', () => {
    render(() => (
      <Tooltip text="Test tooltip" align="center">
        <span>Content</span>
      </Tooltip>
    ));
    const tooltip = page.getByTestId('tooltip');
    expect(tooltip).toHaveClass('tooltip-align-center');
  });

  it('applies multiline class when multiline is true', () => {
    render(() => (
      <Tooltip text="Test tooltip" multiline>
        <span>Content</span>
      </Tooltip>
    ));
    const tooltip = page.getByTestId('tooltip');
    expect(tooltip).toHaveClass('tooltip-multiline');
  });

  it('passes through class prop', () => {
    render(() => (
      <Tooltip text="Test tooltip" class="test-dummy-class">
        <span>Content</span>
      </Tooltip>
    ));
    const tooltip = page.getByTestId('tooltip');
    expect(tooltip).toHaveClass('test-dummy-class');
  });

  it('passes through classList prop', () => {
    render(() => (
      <Tooltip text="Test tooltip" classList={{ 'test-dummy-class': true }}>
        <span>Content</span>
      </Tooltip>
    ));
    const tooltip = page.getByTestId('tooltip');
    expect(tooltip).toHaveClass('test-dummy-class');
  });

  describe('when text is empty', () => {
    it('does not apply tooltip classes', async () => {
      render(() => <Tooltip text="">Content</Tooltip>);
      const tooltip = page.getByTestId('tooltip');
      await expect.element(tooltip).not.toHaveClass('tooltip');
      await expect.element(tooltip).not.toHaveClass('tooltip-above');
      await expect.element(tooltip).not.toHaveClass('tooltip-align-left');
      await expect.element(tooltip).not.toHaveClass('tooltip-multiline');
    });

    it('still passes through class prop when text is empty', async () => {
      render(() => (
        <Tooltip text="" class="test-dummy-class">
          Content
        </Tooltip>
      ));
      const tooltip = page.getByTestId('tooltip');
      await expect.element(tooltip).toHaveClass('test-dummy-class');
    });

    it('still passes through classList prop when text is empty', async () => {
      render(() => (
        <Tooltip text="" classList={{ 'test-dummy-class': true }}>
          Content
        </Tooltip>
      ));
      const tooltip = page.getByTestId('tooltip');
      await expect.element(tooltip).toHaveClass('test-dummy-class');
    });

    it('sets data-tooltip to empty string when text is empty', async () => {
      render(() => <Tooltip text="">Content</Tooltip>);
      const tooltip = page.getByTestId('tooltip');
      await expect.element(tooltip).toHaveAttribute('data-tooltip', '');
    });
  });
});
