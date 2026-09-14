'use client';

import { useEffect, useRef } from 'react';
import {
  historyIndexOf,
  initialFlowHistory,
  planMount,
  planPop,
  planPush,
  planReset,
  type EntryStep,
  type FlowStep,
} from '@/lib/flow-history';

interface FlowHistoryOptions {
  /** The step currently on screen. */
  step: FlowStep;
  /** Back landed on an earlier flow entry: show that step. */
  onBack: (step: EntryStep) => void;
  /** A reset reached the page's original entry: show a search pre-filled with `query`. */
  onReset: (query: string) => void;
}

/**
 * Keeps the phone/browser Back gesture inside the RSVP flow. The decisions live in
 * `@/lib/flow-history`; this hook only applies them to `window.history`.
 */
export function useFlowHistory(options: FlowHistoryOptions) {
  const modelRef = useRef(initialFlowHistory());
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  useEffect(() => {
    function handlePopState(event: PopStateEvent) {
      const { model, action } = planPop(modelRef.current, optionsRef.current.step, historyIndexOf(event.state));
      modelRef.current = model;
      if (action.kind === 'show') optionsRef.current.onBack(action.step);
      else if (action.kind === 'undoForward' || action.kind === 'startReset') window.history.go(action.delta);
      else if (action.kind === 'applyReset' && !action.silent) optionsRef.current.onReset(action.query);
    }

    window.addEventListener('popstate', handlePopState);
    // Reloaded on a flow entry: rewind so history matches the fresh search on screen.
    // planMount is a no-op the second time StrictMode runs this effect.
    const mounted = planMount(modelRef.current, historyIndexOf(window.history.state));
    modelRef.current = mounted.model;
    if (mounted.action.kind === 'go') window.history.go(mounted.action.delta);
    else if (mounted.action.kind === 'applyReset' && !mounted.action.silent) optionsRef.current.onReset(mounted.action.query);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  /** Move forward to `step`, adding a history entry for it. */
  function pushStep(step: EntryStep) {
    const { model, state } = planPush(modelRef.current, step);
    modelRef.current = model;
    window.history.pushState(state, '');
  }

  /** Start over at a search pre-filled with `query`, rewinding history to the page's entry. */
  function resetToSearch(query: string) {
    const { model, action } = planReset(modelRef.current, query);
    modelRef.current = model;
    if (action.kind === 'go') window.history.go(action.delta);
    else if (action.kind === 'applyReset') optionsRef.current.onReset(action.query);
  }

  return { pushStep, resetToSearch, back: () => window.history.back() };
}
