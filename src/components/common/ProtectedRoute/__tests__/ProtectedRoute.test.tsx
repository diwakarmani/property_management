import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import ProtectedRoute from '../index';

/**
 * NB-17 — `ProtectedRoute` role/permission gate.
 *
 * <p>`useSelector` is mocked to a pass-through over a per-test fake auth state,
 * keeping the test isolated from the real Redux store (mirrors the
 * `withLayout` test's mock-it-out style).
 */
const mockUseSelector = jest.fn();
const mockDispatch = jest.fn();
jest.mock('react-redux', () => ({
  useSelector: (selector: any) => mockUseSelector(selector),
  useDispatch: () => mockDispatch,
}));

/** Drives `useSelector` with an auth slice carrying the given roles. */
const withRoles = (roles: string[] | null) => {
  const state = { auth: { user: roles === null ? null : { roles } } };
  mockUseSelector.mockImplementation((selector: any) => selector(state));
};

const Child = () => <Text>SECRET</Text>;

describe('ProtectedRoute (NB-17)', () => {
  afterEach(() => mockUseSelector.mockReset());

  it('renders children when the user has a required role', () => {
    withRoles(['SUPER_ADMIN']);
    const { queryByText } = render(
      <ProtectedRoute requiredRoles={['SUPER_ADMIN']}>
        <Child />
      </ProtectedRoute>
    );
    expect(queryByText('SECRET')).not.toBeNull();
  });

  it('renders the default Access Denied fallback when the role is missing', () => {
    withRoles(['BUYER']);
    const { queryByText } = render(
      <ProtectedRoute requiredRoles={['SUPER_ADMIN']}>
        <Child />
      </ProtectedRoute>
    );
    expect(queryByText('SECRET')).toBeNull();
    expect(queryByText('Access Restricted')).not.toBeNull();
  });

  it('fails closed for a session with no roles (the NB-17 case)', () => {
    withRoles([]);
    const { queryByText } = render(
      <ProtectedRoute requiredRoles={['BUYER']}>
        <Child />
      </ProtectedRoute>
    );
    expect(queryByText('SECRET')).toBeNull();
  });

  it('fails closed when there is no user at all', () => {
    withRoles(null);
    const { queryByText } = render(
      <ProtectedRoute requiredRoles={['BUYER']}>
        <Child />
      </ProtectedRoute>
    );
    expect(queryByText('SECRET')).toBeNull();
  });

  it('renders children when the user has the required permission', () => {
    withRoles(['BUYER']); // BUYER has the view_properties permission
    const { queryByText } = render(
      <ProtectedRoute requiredPermission="view_properties">
        <Child />
      </ProtectedRoute>
    );
    expect(queryByText('SECRET')).not.toBeNull();
  });

  it('denies when the user lacks the required permission', () => {
    withRoles(['BUYER']); // BUYER does NOT have manage_system
    const { queryByText } = render(
      <ProtectedRoute requiredPermission="manage_system">
        <Child />
      </ProtectedRoute>
    );
    expect(queryByText('SECRET')).toBeNull();
  });

  it('ANDs permission and role constraints when both are supplied', () => {
    // BUYER satisfies the permission but not the role → overall denied.
    withRoles(['BUYER']);
    const { queryByText } = render(
      <ProtectedRoute requiredPermission="view_properties" requiredRoles={['SUPER_ADMIN']}>
        <Child />
      </ProtectedRoute>
    );
    expect(queryByText('SECRET')).toBeNull();
  });

  it('renders a custom fallback when access is denied', () => {
    withRoles(['BUYER']);
    const { queryByText } = render(
      <ProtectedRoute requiredRoles={['SUPER_ADMIN']} fallback={<Text>NOPE</Text>}>
        <Child />
      </ProtectedRoute>
    );
    expect(queryByText('NOPE')).not.toBeNull();
    expect(queryByText('Access Restricted')).toBeNull();
  });
});
