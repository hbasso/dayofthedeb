/**
 * Pure decision logic that keeps the RSVP flow's steps and the browser history in lockstep.
 *
 * Every forward step pushes an entry stamped `{ rsvpIndex: n }` (1, 2, …); the page's own
 * entry has no index and counts as 0. `entrySteps[n]` records which step entry n shows.
 * A "reset" rewinds history all the way to entry 0 before showing a fresh search, so after
 * any reset one Back leaves `/rsvp`.
 */

export type EntryStep = 'search' | 'results' | 'roster';
export type FlowStep = EntryStep | 'done';

export interface PendingReset {
  query: string;
  /** A silent reset (page reloaded mid-flow) rewinds history without touching the screen. */
  silent: boolean;
}

export interface FlowHistory {
  currentIndex: number;
  entrySteps: readonly EntryStep[];
  pendingReset: PendingReset | null;
}

export type PopAction =
  | { kind: 'show'; step: EntryStep }
  | { kind: 'undoForward'; delta: number }
  | { kind: 'startReset'; delta: number }
  | { kind: 'applyReset'; query: string; silent: boolean }
  | { kind: 'ignore' };

export type HistoryAction = { kind: 'go'; delta: number } | { kind: 'applyReset'; query: string; silent: boolean } | { kind: 'none' };

const AT_START: FlowHistory = { currentIndex: 0, entrySteps: ['search'], pendingReset: null };

export function initialFlowHistory(): FlowHistory {
  return AT_START;
}

export function historyIndexOf(state: unknown): number {
  const index = (state as { rsvpIndex?: unknown } | null)?.rsvpIndex;
  return typeof index === 'number' && Number.isInteger(index) && index > 0 ? index : 0;
}

/** A forward step: the entry to push and the model after pushing it. */
export function planPush(model: FlowHistory, step: EntryStep): { model: FlowHistory; state: { rsvpIndex: number } } {
  const rsvpIndex = model.currentIndex + 1;
  return {
    model: { ...model, currentIndex: rsvpIndex, entrySteps: [...model.entrySteps.slice(0, rsvpIndex), step] },
    state: { rsvpIndex },
  };
}

/** Rewind to the page's original entry, then show a search pre-filled with `query`. */
export function planReset(model: FlowHistory, query: string): { model: FlowHistory; action: HistoryAction } {
  if (model.pendingReset) return { model, action: { kind: 'none' } };
  if (model.currentIndex === 0) return { model: AT_START, action: { kind: 'applyReset', query, silent: false } };
  return {
    model: { ...model, pendingReset: { query, silent: false } },
    action: { kind: 'go', delta: -model.currentIndex },
  };
}

/** On mount: if the page was reloaded on a flow entry, silently rewind to the original entry. */
export function planMount(model: FlowHistory, stateIndex: number): { model: FlowHistory; action: HistoryAction } {
  if (stateIndex === 0 || model.pendingReset) return { model, action: { kind: 'none' } };
  return {
    model: { ...model, currentIndex: stateIndex, pendingReset: { query: '', silent: true } },
    action: { kind: 'go', delta: -stateIndex },
  };
}

/** A `popstate` landed on the entry stamped `targetIndex` while `step` is on screen. */
export function planPop(model: FlowHistory, step: FlowStep, targetIndex: number): { model: FlowHistory; action: PopAction } {
  const { currentIndex, entrySteps, pendingReset } = model;

  if (pendingReset) {
    if (targetIndex !== 0) return { model: { ...model, currentIndex: targetIndex }, action: { kind: 'ignore' } };
    return { model: AT_START, action: { kind: 'applyReset', ...pendingReset } };
  }

  if (targetIndex === currentIndex) return { model, action: { kind: 'ignore' } };

  if (targetIndex > currentIndex) {
    return { model, action: { kind: 'undoForward', delta: currentIndex - targetIndex } };
  }

  // Back. A finished RSVP never reopens its roster or results: rewind to a fresh search.
  if (step === 'done') {
    if (targetIndex === 0) return { model: AT_START, action: { kind: 'applyReset', query: '', silent: false } };
    return {
      model: { ...model, currentIndex: targetIndex, pendingReset: { query: '', silent: false } },
      action: { kind: 'startReset', delta: -targetIndex },
    };
  }

  return {
    model: { ...model, currentIndex: targetIndex },
    action: { kind: 'show', step: entrySteps[targetIndex] ?? 'search' },
  };
}
