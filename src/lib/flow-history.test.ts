import { describe, expect, it } from 'vitest';
import {
  initialFlowHistory,
  planMount,
  planPop,
  planPush,
  planReset,
  type EntryStep,
  type FlowHistory,
  type FlowStep,
  type PopAction,
} from '@/lib/flow-history';

/**
 * A tiny stand-in for the browser plus the useFlowHistory hook: a history stack of
 * `rsvpIndex` values (undefined = the page's original entry) and the step on screen.
 */
class FlowSim {
  stack: (number | undefined)[] = [undefined];
  position = 0;
  left = false;
  model: FlowHistory = initialFlowHistory();
  step: FlowStep = 'search';
  query = '';
  traversals = 0;
  actions: PopAction['kind'][] = [];

  forward(step: EntryStep) {
    const { model, state } = planPush(this.model, step);
    this.model = model;
    this.stack = [...this.stack.slice(0, this.position + 1), state.rsvpIndex];
    this.position += 1;
    this.step = step;
  }

  submit() {
    this.step = 'done';
  }

  reset(query: string) {
    const { model, action } = planReset(this.model, query);
    this.model = model;
    if (action.kind === 'go') this.go(action.delta);
    else if (action.kind === 'applyReset') this.showSearch(action.query);
  }

  go(delta: number) {
    this.traversals += 1;
    const next = this.position + delta;
    if (next < 0) {
      this.left = true;
      return;
    }
    this.position = Math.min(next, this.stack.length - 1);
    this.pop(this.stack[this.position] ?? 0);
  }

  back() {
    this.go(-1);
  }

  private pop(targetIndex: number) {
    const { model, action } = planPop(this.model, this.step, targetIndex);
    this.model = model;
    this.actions.push(action.kind);
    if (action.kind === 'show') {
      this.step = action.step;
    } else if (action.kind === 'undoForward' || action.kind === 'startReset') {
      this.go(action.delta);
    } else if (action.kind === 'applyReset' && !action.silent) {
      this.showSearch(action.query);
    }
  }

  private showSearch(query: string) {
    this.step = 'search';
    this.query = query;
  }

  /** Simulate the mount effect re-running (e.g. Next `<Activity>` re-showing the route). */
  mount(stateIndex: number) {
    const { model, action } = planMount(this.model, stateIndex);
    this.model = model;
    if (action.kind === 'go') this.go(action.delta);
    else if (action.kind === 'applyReset' && !action.silent) this.showSearch(action.query);
  }
}

describe('flow history', () => {
  it('pushes an increasing rsvpIndex for each forward step', () => {
    const first = planPush(initialFlowHistory(), 'results');
    expect(first.state).toEqual({ rsvpIndex: 1 });
    const second = planPush(first.model, 'roster');
    expect(second.state).toEqual({ rsvpIndex: 2 });
    expect(second.model.entrySteps).toEqual(['search', 'results', 'roster']);
  });

  it('(a) single match: Back from the roster shows search, then Back leaves the page', () => {
    const sim = new FlowSim();
    sim.forward('roster');
    sim.back();
    expect(sim.step).toBe('search');
    expect(sim.model.currentIndex).toBe(0);
    expect(sim.position).toBe(0);
    sim.back();
    expect(sim.left).toBe(true);
    expect(sim.stack).toHaveLength(2);
  });

  it('(a) a same-document popstate onto the original entry while on search is ignored', () => {
    expect(planPop(initialFlowHistory(), 'search', 0).action).toEqual({ kind: 'ignore' });
  });

  it('(b) several matches: Back from the roster shows results, then search, then leaves', () => {
    const sim = new FlowSim();
    sim.forward('results');
    sim.forward('roster');
    sim.back();
    expect(sim.step).toBe('results');
    sim.back();
    expect(sim.step).toBe('search');
    expect(sim.model.currentIndex).toBe(0);
    sim.back();
    expect(sim.left).toBe(true);
  });

  it('(d) single match: Back from done resets to a fresh search at the original entry', () => {
    const sim = new FlowSim();
    sim.query = 'Mario Rossi';
    sim.forward('roster');
    sim.submit();
    sim.back();
    expect(sim.step).toBe('search');
    expect(sim.query).toBe('');
    expect(sim.position).toBe(0);
    expect(sim.traversals).toBe(1);
    sim.back();
    expect(sim.left).toBe(true);
  });

  it('(d) several matches: Back from done resets in one extra traversal, never showing results', () => {
    const sim = new FlowSim();
    sim.forward('results');
    sim.forward('roster');
    sim.submit();
    sim.back();
    expect(sim.actions).toEqual(['startReset', 'applyReset']);
    expect(sim.step).toBe('search');
    expect(sim.query).toBe('');
    expect(sim.position).toBe(0);
    expect(sim.traversals).toBe(2);
    expect(sim.model.pendingReset).toBeNull();
    sim.back();
    expect(sim.left).toBe(true);
  });

  it('ignores an intermediate popstate while a reset is still travelling', () => {
    const model: FlowHistory = {
      currentIndex: 2,
      entrySteps: ['search', 'results', 'roster'],
      pendingReset: { query: '', silent: false },
    };
    expect(planPop(model, 'done', 1).action).toEqual({ kind: 'ignore' });
    expect(planPop(model, 'done', 0).action).toEqual({ kind: 'applyReset', query: '', silent: false });
  });

  it('(e) "RSVP for another party" rewinds to the original entry, then a new search pushes index 1', () => {
    const sim = new FlowSim();
    sim.forward('results');
    sim.forward('roster');
    sim.submit();
    sim.reset('');
    expect(sim.step).toBe('search');
    expect(sim.position).toBe(0);
    expect(sim.model.currentIndex).toBe(0);
    sim.forward('roster');
    expect(sim.stack).toEqual([undefined, 1]);
    sim.back();
    expect(sim.step).toBe('search');
    sim.back();
    expect(sim.left).toBe(true);
  });

  it('(e) a reset from the original entry changes the step without touching history', () => {
    expect(planReset(initialFlowHistory(), 'Ann').action).toEqual({ kind: 'applyReset', query: 'Ann', silent: false });
  });

  it('(f) "Search again" after an invalid submit rewinds to a pre-filled search', () => {
    const sim = new FlowSim();
    sim.forward('results');
    sim.forward('roster');
    sim.reset('Mario Rossi');
    expect(sim.step).toBe('search');
    expect(sim.query).toBe('Mario Rossi');
    expect(sim.position).toBe(0);
    sim.back();
    expect(sim.left).toBe(true);
  });

  it('a second reset while one is travelling does nothing', () => {
    const { model } = planReset({ currentIndex: 2, entrySteps: ['search', 'results', 'roster'], pendingReset: null }, '');
    expect(planReset(model, '').action).toEqual({ kind: 'none' });
  });

  it('Forward after Back is undone and never changes the step', () => {
    const sim = new FlowSim();
    sim.forward('results');
    sim.forward('roster');
    sim.back();
    expect(sim.step).toBe('results');
    sim.go(1);
    expect(sim.actions.slice(-2)).toEqual(['undoForward', 'ignore']);
    expect(sim.step).toBe('results');
    expect(sim.position).toBe(1);
    expect(sim.model.currentIndex).toBe(1);
  });

  it('a page reload mid-flow silently rewinds to the original entry', () => {
    const first = planMount(initialFlowHistory(), 2);
    expect(first.action).toEqual({ kind: 'go', delta: -2 });
    expect(planMount(first.model, 2).action).toEqual({ kind: 'none' });
    expect(planPop(first.model, 'search', 0).action).toEqual({ kind: 'applyReset', query: '', silent: true });
    expect(planMount(initialFlowHistory(), 0).action).toEqual({ kind: 'none' });
  });

  it('Activity re-show at a matching index is a no-op', () => {
    const sim = new FlowSim();
    sim.forward('roster');
    const before = sim.model;
    sim.mount(1);
    expect(sim.model).toEqual(before);
    expect(sim.step).toBe('roster');
    sim.back();
    expect(sim.step).toBe('search');
    sim.back();
    expect(sim.left).toBe(true);
  });

  it('Multi-match Activity re-show is a no-op', () => {
    const sim = new FlowSim();
    sim.forward('results');
    sim.forward('roster');
    const before = sim.model;
    sim.mount(2);
    expect(sim.model).toEqual(before);
    expect(sim.step).toBe('roster');
    sim.back();
    expect(sim.step).toBe('results');
    sim.back();
    expect(sim.step).toBe('search');
  });

  it('Mismatch re-show resets visibly', () => {
    const model: FlowHistory = { currentIndex: 2, entrySteps: ['search', 'results', 'roster'], pendingReset: null };
    const { model: nextModel, action } = planMount(model, 1);
    expect(nextModel).toEqual(initialFlowHistory());
    expect(action).toEqual({ kind: 'applyReset', query: '', silent: false });
  });
});
