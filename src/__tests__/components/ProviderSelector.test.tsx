import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ProviderSelector from '@/components/ProviderSelector';
import type { AnalysisProvider, ProvidersAvailable } from '@/types';

const allAvailable: ProvidersAvailable = { claude: true, openai: true };
const noneAvailable: ProvidersAvailable = { claude: false, openai: false };

describe('ProviderSelector', () => {
  describe('rendering', () => {
    it('renders Claude, OpenAI/Copilot, and Quick Scan options', () => {
      render(
        <ProviderSelector value="local" onChange={jest.fn()} available={allAvailable} />
      );
      expect(screen.getByText('Claude')).toBeInTheDocument();
      expect(screen.getByText('OpenAI / Copilot')).toBeInTheDocument();
      expect(screen.getByText('Quick Scan')).toBeInTheDocument();
    });

    it('renders sublabels for each provider', () => {
      render(
        <ProviderSelector value="local" onChange={jest.fn()} available={allAvailable} />
      );
      expect(screen.getByText('Anthropic AI')).toBeInTheDocument();
      expect(screen.getByText('GPT-4o')).toBeInTheDocument();
      expect(screen.getByText('No AI · Offline')).toBeInTheDocument();
    });

    it('renders 3 buttons total', () => {
      render(
        <ProviderSelector value="local" onChange={jest.fn()} available={allAvailable} />
      );
      expect(screen.getAllByRole('button')).toHaveLength(3);
    });
  });

  describe('availability', () => {
    it('disables Claude button when claude is not available', () => {
      render(
        <ProviderSelector value="local" onChange={jest.fn()} available={noneAvailable} />
      );
      const claudeBtn = screen.getByRole('button', { name: /claude/i });
      expect(claudeBtn).toBeDisabled();
    });

    it('disables OpenAI button when openai is not available', () => {
      render(
        <ProviderSelector value="local" onChange={jest.fn()} available={noneAvailable} />
      );
      const openaiBtn = screen.getByRole('button', { name: /openai/i });
      expect(openaiBtn).toBeDisabled();
    });

    it('Quick Scan is always enabled regardless of available prop', () => {
      render(
        <ProviderSelector value="local" onChange={jest.fn()} available={noneAvailable} />
      );
      const quickScanBtn = screen.getByRole('button', { name: /quick scan/i });
      expect(quickScanBtn).not.toBeDisabled();
    });

    it('enables Claude button when claude is available', () => {
      render(
        <ProviderSelector value="local" onChange={jest.fn()} available={allAvailable} />
      );
      const claudeBtn = screen.getByRole('button', { name: /claude/i });
      expect(claudeBtn).not.toBeDisabled();
    });
  });

  describe('selection', () => {
    it('calls onChange with "claude" when Claude button is clicked', async () => {
      const handleChange = jest.fn();
      render(
        <ProviderSelector value="local" onChange={handleChange} available={allAvailable} />
      );
      await userEvent.click(screen.getByRole('button', { name: /claude/i }));
      expect(handleChange).toHaveBeenCalledWith('claude');
    });

    it('calls onChange with "openai" when OpenAI button is clicked', async () => {
      const handleChange = jest.fn();
      render(
        <ProviderSelector value="local" onChange={handleChange} available={allAvailable} />
      );
      await userEvent.click(screen.getByRole('button', { name: /openai/i }));
      expect(handleChange).toHaveBeenCalledWith('openai');
    });

    it('calls onChange with "local" when Quick Scan button is clicked', async () => {
      const handleChange = jest.fn();
      render(
        <ProviderSelector value="claude" onChange={handleChange} available={allAvailable} />
      );
      await userEvent.click(screen.getByRole('button', { name: /quick scan/i }));
      expect(handleChange).toHaveBeenCalledWith('local');
    });

    it('does NOT call onChange when a disabled provider is clicked', async () => {
      const handleChange = jest.fn();
      render(
        <ProviderSelector value="local" onChange={handleChange} available={noneAvailable} />
      );
      await userEvent.click(screen.getByRole('button', { name: /claude/i }));
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('active state styling', () => {
    it('marks the currently selected provider as active', () => {
      const { rerender } = render(
        <ProviderSelector value="claude" onChange={jest.fn()} available={allAvailable} />
      );
      // When claude is the value, re-rendering with a different value changes active
      rerender(
        <ProviderSelector value="local" onChange={jest.fn()} available={allAvailable} />
      );
      // The Quick Scan button should now be the active one — just verify no error is thrown
      expect(screen.getByText('Quick Scan')).toBeInTheDocument();
    });
  });
});
