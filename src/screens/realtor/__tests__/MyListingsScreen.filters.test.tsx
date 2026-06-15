import React from 'react';
import { FlatList } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import MyListingsScreen from '../MyListingsScreen';
import {
  useDeletePropertyMutation,
  useMyListingsQuery,
  usePublishPropertyMutation,
} from '@/api/hooks/useProperties';

jest.mock('@/api/hooks/useProperties', () => ({
  useMyListingsQuery: jest.fn(),
  useDeletePropertyMutation: jest.fn(),
  usePublishPropertyMutation: jest.fn(),
}));

const mockUseMyListingsQuery = useMyListingsQuery as jest.MockedFunction<typeof useMyListingsQuery>;
const mockUseDeletePropertyMutation = useDeletePropertyMutation as jest.MockedFunction<typeof useDeletePropertyMutation>;
const mockUsePublishPropertyMutation = usePublishPropertyMutation as jest.MockedFunction<typeof usePublishPropertyMutation>;

describe('MyListingsScreen status filters', () => {
  it('keeps every filter reachable in a horizontal strip', () => {
    mockUseMyListingsQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isFetching: false,
    } as any);
    mockUseDeletePropertyMutation.mockReturnValue({ mutate: jest.fn() } as any);
    mockUsePublishPropertyMutation.mockReturnValue({ mutate: jest.fn() } as any);

    const screen = render(<MyListingsScreen navigation={{ navigate: jest.fn() }} />);
    const filterList = screen.UNSAFE_getAllByType(FlatList).find(list => list.props.horizontal);

    expect(filterList).toBeDefined();
    expect(filterList?.props.showsHorizontalScrollIndicator).toBe(false);
    expect(filterList?.props.data).toEqual([
      'ALL',
      'DRAFT',
      'ACTIVE',
      'PENDING_APPROVAL',
      'SOLD',
      'RENTED',
    ]);

    fireEvent.press(screen.getByText('PENDING'));
    expect(screen.getByText('No pending_approval listings')).toBeTruthy();
  });
});
