/* eslint-disable react/display-name */
import React, { useEffect } from 'react';
import { render } from '@testing-library/react-native';
import { withLayout } from '@/utils/withLayout';

// AppLayout uses `useRoute()` which requires a NavigationContainer ancestor.
// For this focused unit test we mock it to a pass-through so the test stays
// isolated from react-navigation; the KB-04 contract we're proving is about
// component identity / mount-once, not the layout chrome itself.
jest.mock('@/components/layout/AppLayout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

/**
 * IT-NAV-NOREMOUNT (gap analysis §15.4 / KB-04 regression).
 *
 * <p>The original bug: navigators called {@code withLayout(Screen)} inside
 * their render body, so React Navigation saw a brand-new component identity
 * on every parent render and unmounted/remounted the entire screen — losing
 * scroll position, form state, etc.
 *
 * <p>The fix: call {@code withLayout(Screen)} ONCE at module scope so each
 * screen has a stable identity. These two tests pin that contract.
 */
describe('withLayout (KB-04 fix)', () => {
  it('mounts a module-scope-wrapped screen exactly once across parent re-renders', () => {
    const mountSpy = jest.fn();
    const Inner = () => {
      useEffect(() => {
        mountSpy();
      }, []);
      return null;
    };
    // The fix: wrap once at module scope.
    const WrappedOnce = withLayout(Inner);

    const Parent = ({ tick: _tick }: { tick: number }) => <WrappedOnce />;

    const { rerender } = render(<Parent tick={1} />);
    rerender(<Parent tick={2} />);
    rerender(<Parent tick={3} />);

    expect(mountSpy).toHaveBeenCalledTimes(1);
  });

  it('remounts on every parent render when withLayout is called INSIDE render (the original bug)', () => {
    const mountSpy = jest.fn();
    const Inner = () => {
      useEffect(() => {
        mountSpy();
      }, []);
      return null;
    };
    // The bug: each render produces a NEW component identity.
    const BuggyParent = ({ tick: _tick }: { tick: number }) => {
      const Wrapped = withLayout(Inner);
      return <Wrapped />;
    };

    const { rerender } = render(<BuggyParent tick={1} />);
    rerender(<BuggyParent tick={2} />);
    rerender(<BuggyParent tick={3} />);

    // Three mounts because React sees a different component each render.
    expect(mountSpy).toHaveBeenCalledTimes(3);
  });
});
