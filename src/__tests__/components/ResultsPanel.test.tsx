import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ResultsPanel from '@/components/ResultsPanel';
import type { AnalysisResult } from '@/types';

const MOCK_RESULT: AnalysisResult = {
  provider: 'local',
  facts: [
    {
      id: 'fact-001',
      type: 'fact',
      summary: 'Client is on a 482 visa',
      quote: 'I am on a 482 visa',
      speaker: 'client',
    },
    {
      id: 'fact-002',
      type: 'fact',
      summary: 'Visa expires March 2025',
      quote: 'My visa expires in March 2025',
      speaker: 'client',
    },
  ],
  questions: [
    {
      id: 'question-001',
      type: 'question',
      summary: 'What is the processing time',
      quote: 'What is the processing time for permanent residency?',
      speaker: 'client',
    },
  ],
};

describe('ResultsPanel', () => {
  describe('loading state', () => {
    it('renders a loading spinner when isLoading is true', () => {
      render(
        <ResultsPanel result={null} activeId={null} onSelect={jest.fn()} isLoading={true} />
      );
      expect(screen.getByText(/analysing transcript/i)).toBeInTheDocument();
    });

    it('does not render the tabs when loading', () => {
      render(
        <ResultsPanel result={null} activeId={null} onSelect={jest.fn()} isLoading={true} />
      );
      expect(screen.queryByRole('button', { name: /facts/i })).not.toBeInTheDocument();
    });
  });

  describe('empty state (no result, not loading)', () => {
    it('renders a prompt to paste a transcript', () => {
      render(
        <ResultsPanel result={null} activeId={null} onSelect={jest.fn()} isLoading={false} />
      );
      expect(screen.getByText(/analysis results will appear here/i)).toBeInTheDocument();
    });

    it('renders a hint to click Analyse', () => {
      render(
        <ResultsPanel result={null} activeId={null} onSelect={jest.fn()} isLoading={false} />
      );
      expect(screen.getByText(/paste a transcript and click analyse/i)).toBeInTheDocument();
    });
  });

  describe('with results', () => {
    it('renders the Facts tab with fact count', () => {
      render(
        <ResultsPanel result={MOCK_RESULT} activeId={null} onSelect={jest.fn()} isLoading={false} />
      );
      expect(screen.getByRole('button', { name: /facts/i })).toBeInTheDocument();
    });

    it('renders the Client Questions tab', () => {
      render(
        <ResultsPanel result={MOCK_RESULT} activeId={null} onSelect={jest.fn()} isLoading={false} />
      );
      expect(screen.getByRole('button', { name: /client questions/i })).toBeInTheDocument();
    });

    it('shows facts by default', () => {
      render(
        <ResultsPanel result={MOCK_RESULT} activeId={null} onSelect={jest.fn()} isLoading={false} />
      );
      expect(screen.getByText('Client is on a 482 visa')).toBeInTheDocument();
    });

    it('shows questions tab content when Questions tab is clicked', async () => {
      render(
        <ResultsPanel result={MOCK_RESULT} activeId={null} onSelect={jest.fn()} isLoading={false} />
      );
      await userEvent.click(screen.getByRole('button', { name: /client questions/i }));
      expect(screen.getByText('What is the processing time')).toBeInTheDocument();
    });

    it('hides facts when Questions tab is active', async () => {
      render(
        <ResultsPanel result={MOCK_RESULT} activeId={null} onSelect={jest.fn()} isLoading={false} />
      );
      await userEvent.click(screen.getByRole('button', { name: /client questions/i }));
      expect(screen.queryByText('Client is on a 482 visa')).not.toBeInTheDocument();
    });

    it('displays the provider name', () => {
      render(
        <ResultsPanel result={MOCK_RESULT} activeId={null} onSelect={jest.fn()} isLoading={false} />
      );
      expect(screen.getByText('Quick Scan')).toBeInTheDocument();
    });

    it('displays "Claude (Anthropic)" for claude provider', () => {
      const claudeResult: AnalysisResult = { ...MOCK_RESULT, provider: 'claude' };
      render(
        <ResultsPanel result={claudeResult} activeId={null} onSelect={jest.fn()} isLoading={false} />
      );
      expect(screen.getByText('Claude (Anthropic)')).toBeInTheDocument();
    });

    it('displays "OpenAI / Copilot" for openai provider', () => {
      const openaiResult: AnalysisResult = { ...MOCK_RESULT, provider: 'openai' };
      render(
        <ResultsPanel result={openaiResult} activeId={null} onSelect={jest.fn()} isLoading={false} />
      );
      expect(screen.getByText('OpenAI / Copilot')).toBeInTheDocument();
    });

    it('shows "No facts found" message when facts array is empty', () => {
      const emptyFactsResult: AnalysisResult = { ...MOCK_RESULT, facts: [] };
      render(
        <ResultsPanel result={emptyFactsResult} activeId={null} onSelect={jest.fn()} isLoading={false} />
      );
      expect(screen.getByText(/no facts found/i)).toBeInTheDocument();
    });

    it('shows "No client questions found" message when questions array is empty on the Questions tab', async () => {
      const emptyQuestionsResult: AnalysisResult = { ...MOCK_RESULT, questions: [] };
      render(
        <ResultsPanel result={emptyQuestionsResult} activeId={null} onSelect={jest.fn()} isLoading={false} />
      );
      await userEvent.click(screen.getByRole('button', { name: /client questions/i }));
      expect(screen.getByText(/no client questions found/i)).toBeInTheDocument();
    });
  });

  describe('active item', () => {
    it('passes activeId to child ResultItems', () => {
      render(
        <ResultsPanel
          result={MOCK_RESULT}
          activeId="fact-001"
          onSelect={jest.fn()}
          isLoading={false}
        />
      );
      // The active item's quote should be visible
      expect(screen.getByText(/I am on a 482 visa/)).toBeInTheDocument();
    });
  });

  describe('onSelect callback', () => {
    it('calls onSelect when a result item is clicked', async () => {
      const handleSelect = jest.fn();
      render(
        <ResultsPanel
          result={MOCK_RESULT}
          activeId={null}
          onSelect={handleSelect}
          isLoading={false}
        />
      );
      // Click on the first fact item
      await userEvent.click(screen.getByText('Client is on a 482 visa'));
      expect(handleSelect).toHaveBeenCalledWith('fact-001');
    });
  });
});
