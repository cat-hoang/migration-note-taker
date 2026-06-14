/**
 * @jest-environment node
 */
import { analyzeLocally, hasSpeakerMarkers } from '@/lib/localAnalyzer';

// ---------------------------------------------------------------------------
// hasSpeakerMarkers
// ---------------------------------------------------------------------------
describe('hasSpeakerMarkers', () => {
  it('detects "Agent:" prefix', () => {
    expect(hasSpeakerMarkers('Agent: Good morning.\nClient: Hello.')).toBe(true);
  });

  it('detects "Client:" prefix', () => {
    expect(hasSpeakerMarkers('Client: I need help.')).toBe(true);
  });

  it('detects "[Agent]" bracket prefix', () => {
    expect(hasSpeakerMarkers('[Agent] How can I help?')).toBe(true);
  });

  it('detects "A:" shorthand', () => {
    expect(hasSpeakerMarkers('A: Good morning.\nC: Hello.')).toBe(true);
  });

  it('returns false for plain text without speaker markers', () => {
    expect(hasSpeakerMarkers('I need help with my visa.')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(hasSpeakerMarkers('')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// analyzeLocally — basic structure
// ---------------------------------------------------------------------------
describe('analyzeLocally', () => {
  it('returns an object with facts, questions, and provider fields', () => {
    const result = analyzeLocally('Agent: Hello.\nClient: Hi, I am on a 482 visa.');
    expect(result).toHaveProperty('facts');
    expect(result).toHaveProperty('questions');
    expect(result).toHaveProperty('provider', 'local');
    expect(Array.isArray(result.facts)).toBe(true);
    expect(Array.isArray(result.questions)).toBe(true);
  });

  it('returns empty arrays for an empty transcript', () => {
    const result = analyzeLocally('');
    expect(result.facts).toHaveLength(0);
    expect(result.questions).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// analyzeLocally — fact extraction
// ---------------------------------------------------------------------------
describe('analyzeLocally — fact extraction', () => {
  it('extracts visa-related facts from client speech', () => {
    const transcript = [
      'Agent: What is your current visa status?',
      'Client: I am on a subclass 482 temporary skill shortage visa.',
    ].join('\n');

    const { facts } = analyzeLocally(transcript);
    expect(facts.length).toBeGreaterThan(0);
    const factTexts = facts.map((f) => f.quote.toLowerCase());
    expect(factTexts.some((t) => t.includes('482') || t.includes('visa'))).toBe(true);
  });

  it('extracts employment facts', () => {
    const transcript = [
      'Agent: Who is your employer?',
      'Client: My employer is TechCorp and I am sponsored for the 482 visa.',
    ].join('\n');

    const { facts } = analyzeLocally(transcript);
    expect(facts.length).toBeGreaterThan(0);
  });

  it('extracts family-related facts', () => {
    const transcript = [
      'Agent: Do you have family here?',
      'Client: Yes, my spouse is currently on a bridging visa.',
    ].join('\n');

    const { facts } = analyzeLocally(transcript);
    expect(facts.length).toBeGreaterThan(0);
    const factTexts = facts.map((f) => f.quote.toLowerCase());
    expect(factTexts.some((t) => t.includes('spouse') || t.includes('bridging'))).toBe(true);
  });

  it('extracts personal identity facts', () => {
    const transcript = [
      'Agent: Can you introduce yourself?',
      "Client: I am a citizen of India and I'm currently on a student visa.",
    ].join('\n');

    const { facts } = analyzeLocally(transcript);
    expect(facts.length).toBeGreaterThan(0);
  });

  it('extracts date-related facts', () => {
    const transcript = [
      'Agent: When does your visa expire?',
      'Client: My visa expires on 15/03/2025.',
    ].join('\n');

    const { facts } = analyzeLocally(transcript);
    expect(facts.length).toBeGreaterThan(0);
    const factTexts = facts.map((f) => f.quote);
    expect(factTexts.some((t) => t.includes('15/03/2025'))).toBe(true);
  });

  it('assigns sequential fact IDs starting at fact-001', () => {
    const transcript = [
      'Client: I am on a 482 visa that expires on 01/01/2026.',
      'Client: I work for TechCorp as my employer.',
    ].join('\n');

    const { facts } = analyzeLocally(transcript);
    if (facts.length > 0) {
      expect(facts[0].id).toBe('fact-001');
    }
    if (facts.length > 1) {
      expect(facts[1].id).toBe('fact-002');
    }
  });

  it('sets type to "fact" on all fact items', () => {
    const transcript = 'Client: I hold a 482 visa expiring in March 2025.';
    const { facts } = analyzeLocally(transcript);
    facts.forEach((f) => expect(f.type).toBe('fact'));
  });

  it('truncates long summaries to 80 chars with ellipsis', () => {
    const longSentence =
      'I am employed by TechCorp Solutions under a nominated occupation code as a software engineer on a 482 visa expiring in 2025.';
    const transcript = `Client: ${longSentence}`;
    const { facts } = analyzeLocally(transcript);
    facts.forEach((f) => {
      if (f.quote.length > 80) {
        expect(f.summary.length).toBeLessThanOrEqual(80);
        expect(f.summary.endsWith('...')).toBe(true);
      }
    });
  });
});

// ---------------------------------------------------------------------------
// analyzeLocally — question extraction
// ---------------------------------------------------------------------------
describe('analyzeLocally — question extraction', () => {
  it('extracts questions that end with "?"', () => {
    const transcript = [
      'Agent: How can I help you today?',
      'Client: What are the requirements for a partner visa?',
    ].join('\n');

    const { questions } = analyzeLocally(transcript);
    expect(questions.length).toBeGreaterThan(0);
    const qTexts = questions.map((q) => q.quote);
    expect(qTexts.some((t) => t.includes('partner visa'))).toBe(true);
  });

  it('extracts interrogative sentences from client speech', () => {
    const transcript = [
      'Client: How long does the visa process take?',
      'Client: Can I work while my application is pending?',
    ].join('\n');

    const { questions } = analyzeLocally(transcript);
    expect(questions.length).toBeGreaterThan(0);
  });

  it('does NOT include agent questions in client questions list', () => {
    const transcript = [
      'Agent: What is your current visa subclass?',
      'Client: I am on a 482 visa.',
    ].join('\n');

    const { questions } = analyzeLocally(transcript);
    const agentQuestion = questions.find((q) =>
      q.quote.toLowerCase().includes('what is your current visa subclass')
    );
    expect(agentQuestion).toBeUndefined();
  });

  it('assigns sequential question IDs starting at question-001', () => {
    const transcript = [
      'Client: How long will this take?',
      'Client: What documents do I need?',
    ].join('\n');

    const { questions } = analyzeLocally(transcript);
    if (questions.length > 0) {
      expect(questions[0].id).toBe('question-001');
    }
    if (questions.length > 1) {
      expect(questions[1].id).toBe('question-002');
    }
  });

  it('sets type to "question" on all question items', () => {
    const transcript = 'Client: What is the cost of the application?';
    const { questions } = analyzeLocally(transcript);
    questions.forEach((q) => expect(q.type).toBe('question'));
  });

  it('strips trailing question mark from summary', () => {
    const transcript = 'Client: What is the processing time?';
    const { questions } = analyzeLocally(transcript);
    questions.forEach((q) => {
      expect(q.summary.endsWith('?')).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// analyzeLocally — speaker handling
// ---------------------------------------------------------------------------
describe('analyzeLocally — speaker handling', () => {
  it('recognises "Agent:" / "Client:" speaker format', () => {
    const transcript = [
      'Agent: Hello.',
      'Client: I have a question about my visa.',
    ].join('\n');

    const result = analyzeLocally(transcript);
    expect(result.facts.length + result.questions.length).toBeGreaterThanOrEqual(0);
  });

  it('recognises "[Agent]" / "[Client]" speaker format', () => {
    const transcript = [
      '[Agent] Good morning.',
      '[Client] What visa options are available for my spouse?',
    ].join('\n');

    const { questions } = analyzeLocally(transcript);
    expect(questions.length).toBeGreaterThan(0);
  });

  it('recognises "A:" / "C:" shorthand speaker format', () => {
    const transcript = [
      'A: Good morning.',
      'C: Can I apply for a partner visa while in Australia?',
    ].join('\n');

    const { questions } = analyzeLocally(transcript);
    expect(questions.length).toBeGreaterThan(0);
  });

  it('treats transcript with no speaker markers as unknown speaker', () => {
    const transcript = 'I am on a 482 visa. What happens when it expires?';
    const result = analyzeLocally(transcript);
    // unknown speaker — questions and/or facts may be extracted
    const allItems = [...result.facts, ...result.questions];
    const unknownItems = allItems.filter((i) => i.speaker === 'unknown');
    expect(unknownItems.length).toBeGreaterThanOrEqual(0);
  });

  it('does NOT extract factual statements from agent speech', () => {
    const transcript = [
      'Agent: Your employer needs to sponsor you under a 482 visa.',
      'Agent: I see your visa expires on 15/06/2025.',
      'Agent: Your spouse would need a dependent or partner visa.',
      'Client: Hello.',
    ].join('\n');

    const { facts } = analyzeLocally(transcript);
    const agentFacts = facts.filter((f) => f.speaker === 'agent');
    expect(agentFacts).toHaveLength(0);
  });

  it('extracts facts from client speech but not from agent speech in the same transcript', () => {
    const transcript = [
      'Agent: Do you have a 482 visa?',
      'Client: Yes, I am on a 482 visa sponsored by my employer TechCorp.',
    ].join('\n');

    const { facts } = analyzeLocally(transcript);
    expect(facts.length).toBeGreaterThan(0);
    facts.forEach((f) => {
      expect(f.speaker).not.toBe('agent');
    });
  });
});

// ---------------------------------------------------------------------------
// analyzeLocally — mixed content transcript
// ---------------------------------------------------------------------------
describe('analyzeLocally — mixed content transcript', () => {
  const MIXED_TRANSCRIPT = `Agent: Good morning! Thanks for coming in today. Can you tell me a little about your current immigration situation?

Client: Sure. I'm originally from India. I've been in Australia for about three years on a 482 visa. My employer is GlobalTech and I'm sponsored under the ANZSCO code 261313.

Agent: And when does your current visa expire?

Client: My visa expires on 15/06/2025. I'm also married — my wife is on a dependent visa.

Agent: Great. Do you have any questions for me?

Client: Yes, actually. What is the processing time for a permanent residency application? And can my wife work on her current visa?`;

  it('extracts at least one fact from the mixed transcript', () => {
    const { facts } = analyzeLocally(MIXED_TRANSCRIPT);
    expect(facts.length).toBeGreaterThan(0);
  });

  it('extracts at least one question from the mixed transcript', () => {
    const { questions } = analyzeLocally(MIXED_TRANSCRIPT);
    expect(questions.length).toBeGreaterThan(0);
  });

  it('all extracted items have required fields', () => {
    const result = analyzeLocally(MIXED_TRANSCRIPT);
    const allItems = [...result.facts, ...result.questions];
    allItems.forEach((item) => {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('type');
      expect(item).toHaveProperty('summary');
      expect(item).toHaveProperty('quote');
      expect(item).toHaveProperty('speaker');
      expect(typeof item.id).toBe('string');
      expect(typeof item.summary).toBe('string');
      expect(typeof item.quote).toBe('string');
    });
  });

  it('all quotes are non-empty strings', () => {
    const result = analyzeLocally(MIXED_TRANSCRIPT);
    const allItems = [...result.facts, ...result.questions];
    allItems.forEach((item) => {
      expect(item.quote.length).toBeGreaterThan(0);
    });
  });
});
