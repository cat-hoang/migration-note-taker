import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ResultItem from '@/components/ResultItem';
import type { AnalysisItem } from '@/types';

const FACT_ITEM: AnalysisItem = {
  id: 'fact-001',
  type: 'fact',
  summary: 'Client is on a 482 visa',
  quote: 'I am on a 482 visa expiring in March 2025',
  speaker: 'client',
};

const QUESTION_ITEM: AnalysisItem = {
  id: 'question-001',
  type: 'question',
  summary: 'What is the processing time',
  quote: 'What is the processing time for a permanent residency application?',
  speaker: 'client',
};

describe('ResultItem', () => {
  describe('default (inactive) state', () => {
    it('renders the item summary', () => {
      render(<ResultItem item={FACT_ITEM} isActive={false} onSelect={jest.fn()} />);
      expect(screen.getByText('Client is on a 482 visa')).toBeInTheDocument();
    });

    it('renders the speaker badge', () => {
      render(<ResultItem item={FACT_ITEM} isActive={false} onSelect={jest.fn()} />);
      expect(screen.getByText('client')).toBeInTheDocument();
    });

    it('does NOT show the quote blockquote when inactive', () => {
      render(<ResultItem item={FACT_ITEM} isActive={false} onSelect={jest.fn()} />);
      expect(screen.queryByText(/482 visa expiring in March/)).not.toBeInTheDocument();
    });

    it('renders as a button', () => {
      render(<ResultItem item={FACT_ITEM} isActive={false} onSelect={jest.fn()} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('active state', () => {
    it('shows the quote when item is active', () => {
      render(<ResultItem item={FACT_ITEM} isActive={true} onSelect={jest.fn()} />);
      expect(
        screen.getByText(/482 visa expiring in March/)
      ).toBeInTheDocument();
    });

    it('still renders the summary when active', () => {
      render(<ResultItem item={FACT_ITEM} isActive={true} onSelect={jest.fn()} />);
      expect(screen.getByText('Client is on a 482 visa')).toBeInTheDocument();
    });
  });

  describe('interaction', () => {
    it('calls onSelect with the item id when clicked (inactive)', async () => {
      const handleSelect = jest.fn();
      render(<ResultItem item={FACT_ITEM} isActive={false} onSelect={handleSelect} />);
      await userEvent.click(screen.getByRole('button'));
      expect(handleSelect).toHaveBeenCalledWith('fact-001');
    });

    it('calls onSelect with empty string when clicked while active (deselect)', async () => {
      const handleSelect = jest.fn();
      render(<ResultItem item={FACT_ITEM} isActive={true} onSelect={handleSelect} />);
      await userEvent.click(screen.getByRole('button'));
      expect(handleSelect).toHaveBeenCalledWith('');
    });
  });

  describe('speaker badges', () => {
    it('renders "agent" badge for agent speaker', () => {
      const agentItem: AnalysisItem = { ...FACT_ITEM, speaker: 'agent' };
      render(<ResultItem item={agentItem} isActive={false} onSelect={jest.fn()} />);
      expect(screen.getByText('agent')).toBeInTheDocument();
    });

    it('renders "unknown" badge for unknown speaker', () => {
      const unknownItem: AnalysisItem = { ...FACT_ITEM, speaker: 'unknown' };
      render(<ResultItem item={unknownItem} isActive={false} onSelect={jest.fn()} />);
      expect(screen.getByText('unknown')).toBeInTheDocument();
    });
  });

  describe('question item', () => {
    it('renders question summary correctly', () => {
      render(<ResultItem item={QUESTION_ITEM} isActive={false} onSelect={jest.fn()} />);
      expect(screen.getByText('What is the processing time')).toBeInTheDocument();
    });

    it('shows question quote when active', () => {
      render(<ResultItem item={QUESTION_ITEM} isActive={true} onSelect={jest.fn()} />);
      expect(
        screen.getByText(/What is the processing time for a permanent residency/)
      ).toBeInTheDocument();
    });
  });
});
