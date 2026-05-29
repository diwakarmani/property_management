import { toIsoDateOrEmpty } from '../dateOfBirth';

describe('toIsoDateOrEmpty (bug 2D — PUT /api/users/me 400)', () => {
  it('passes ISO YYYY-MM-DD through unchanged', () => {
    expect(toIsoDateOrEmpty('1990-03-15')).toBe('1990-03-15');
  });

  it('converts legacy DD/MM/YYYY to ISO', () => {
    expect(toIsoDateOrEmpty('15/03/1990')).toBe('1990-03-15');
  });

  it('returns empty string for empty / whitespace-only input', () => {
    expect(toIsoDateOrEmpty('')).toBe('');
    expect(toIsoDateOrEmpty('   ')).toBe('');
  });

  it('returns empty string for unrecognized input (caller should omit DOB)', () => {
    expect(toIsoDateOrEmpty('March 15, 1990')).toBe('');
    expect(toIsoDateOrEmpty('not-a-date')).toBe('');
    expect(toIsoDateOrEmpty('1990-3-15')).toBe('');
  });

  it('trims surrounding whitespace', () => {
    expect(toIsoDateOrEmpty('  1990-03-15  ')).toBe('1990-03-15');
  });
});
