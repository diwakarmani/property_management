import locationReducer, { selectCity, confirmLocation } from '../locationSlice';
import { logout } from '../authSlice';

jest.mock('@/api/queryClient', () => ({
  queryClient: { clear: jest.fn() },
  queryKeys: {},
  STALE_TIME: {},
}));
jest.mock('@/utils/helpers/storage', () => ({
  saveTokens: jest.fn(),
  clearTokens: jest.fn().mockResolvedValue(undefined),
  getAccessToken: jest.fn().mockResolvedValue(null),
  clearActiveRole: jest.fn().mockResolvedValue(undefined),
  getActiveRole: jest.fn().mockResolvedValue(null),
  saveActiveRole: jest.fn().mockResolvedValue(undefined),
  set: jest.fn().mockResolvedValue(undefined),
  get: jest.fn().mockResolvedValue(null),
  remove: jest.fn().mockResolvedValue(undefined),
}));

const CITY = { id: 1, name: 'Austin', stateName: 'Texas', latitude: 30.27, longitude: -97.74 };

describe('locationSlice (Bug 14)', () => {
  it('resets to initial state on logout.fulfilled, so a confirmed location does not leak to the next login', () => {
    let state = locationReducer(undefined, { type: '@@INIT' });
    state = locationReducer(state, selectCity(CITY as any));
    state = locationReducer(state, confirmLocation());

    expect(state.hasSelected).toBe(true);
    expect(state.selectedCity).toEqual(CITY);

    const afterLogout = locationReducer(state, { type: logout.fulfilled.type });

    expect(afterLogout.hasSelected).toBe(false);
    expect(afterLogout.selectedCity).toBeNull();
    expect(afterLogout.selectedLocalities).toEqual([]);
    expect(afterLogout.coordinates).toEqual({ latitude: null, longitude: null });
  });
});
