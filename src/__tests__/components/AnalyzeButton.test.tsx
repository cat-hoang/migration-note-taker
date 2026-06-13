import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import AnalyzeButton from '@/components/AnalyzeButton';

describe('AnalyzeButton', () => {
  describe('default state', () => {
    it('renders "Analyse Transcript" label when not loading', () => {
      render(<AnalyzeButton onClick={jest.fn()} disabled={false} isLoading={false} />);
      expect(screen.getByText('Analyse Transcript')).toBeInTheDocument();
    });

    it('renders a button element', () => {
      render(<AnalyzeButton onClick={jest.fn()} disabled={false} isLoading={false} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('is enabled when disabled prop is false', () => {
      render(<AnalyzeButton onClick={jest.fn()} disabled={false} isLoading={false} />);
      expect(screen.getByRole('button')).not.toBeDisabled();
    });
  });

  describe('loading state', () => {
    it('renders "Analysing…" text when isLoading is true', () => {
      render(<AnalyzeButton onClick={jest.fn()} disabled={true} isLoading={true} />);
      expect(screen.getByText('Analysing…')).toBeInTheDocument();
    });

    it('does not show "Analyse Transcript" when loading', () => {
      render(<AnalyzeButton onClick={jest.fn()} disabled={true} isLoading={true} />);
      expect(screen.queryByText('Analyse Transcript')).not.toBeInTheDocument();
    });
  });

  describe('disabled state', () => {
    it('is disabled when disabled prop is true', () => {
      render(<AnalyzeButton onClick={jest.fn()} disabled={true} isLoading={false} />);
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('interaction', () => {
    it('calls onClick when clicked', async () => {
      const handleClick = jest.fn();
      render(<AnalyzeButton onClick={handleClick} disabled={false} isLoading={false} />);
      await userEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not fire onClick when disabled', async () => {
      const handleClick = jest.fn();
      render(<AnalyzeButton onClick={handleClick} disabled={true} isLoading={false} />);
      await userEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });
});
