
import React, { useEffect } from 'react';
import { render } from '@testing-library/react-native';
import { withLayout } from '@/utils/withLayout';

jest.mock('@/components/layout/AppLayout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('withLayout (KB-04 fix)', () => {
  it('mounts a module-scope-wrapped screen exactly once across parent re-renders', () => {
    const mountSpy = jest.fn();
    const Inner = () => {
      useEffect(() => {
        mountSpy();
      }, []);
      return null;
    };

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

    const BuggyParent = ({ tick: _tick }: { tick: number }) => {
      const Wrapped = withLayout(Inner);
      return <Wrapped />;
    };

    const { rerender } = render(<BuggyParent tick={1} />);
    rerender(<BuggyParent tick={2} />);
    rerender(<BuggyParent tick={3} />);

    expect(mountSpy).toHaveBeenCalledTimes(3);
  });
});
