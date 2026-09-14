'use client';

import { useEffect, useRef } from 'react';

/**
 * Keeps the phone/browser Back gesture inside the RSVP flow instead of leaving `/rsvp`.
 *
 * The flow pushes a history entry (`pushFlowStep`) whenever it moves forward to a step
 * that should be reachable by Back, and replaces the current entry (`replaceFlowStep`)
 * when a step should NOT be reachable by Back (e.g. after a successful submit). This hook
 * just listens for the resulting `popstate` and asks the caller to move back one step; the
 * caller decides what "one step back" means from whatever step it is currently on.
 */
export function useFlowHistory(onPopBack: () => void): void {
  const onPopBackRef = useRef(onPopBack);
  useEffect(() => {
    onPopBackRef.current = onPopBack;
  });

  useEffect(() => {
    function handlePopState() {
      onPopBackRef.current();
    }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
}

export function pushFlowStep(name: string): void {
  window.history.pushState({ rsvpStep: name }, '');
}

export function replaceFlowStep(name: string): void {
  window.history.replaceState({ rsvpStep: name }, '');
}
