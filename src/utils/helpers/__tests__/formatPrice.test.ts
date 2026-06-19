import { formatPrice } from '../formatPrice';

describe('formatPrice', () => {
  it('formats values below 1000 as plain dollar amount', () => {
    expect(formatPrice(0)).toBe('$0');
    expect(formatPrice(800)).toBe('$800');
    expect(formatPrice(999)).toBe('$999');
  });

  it('formats values in the thousands as $NNK', () => {
    expect(formatPrice(1000)).toBe('$1K');
    expect(formatPrice(250000)).toBe('$250K');
    expect(formatPrice(999999)).toBe('$1000K');
  });

  it('formats values at or above one million as $N.NM', () => {
    expect(formatPrice(1000000)).toBe('$1.0M');
    expect(formatPrice(1200000)).toBe('$1.2M');
    expect(formatPrice(5500000)).toBe('$5.5M');
  });
});
