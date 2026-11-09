import { describe, expect, it } from 'vitest';
import { formatMoneyInput, parseMoney } from './money';

describe('parseMoney', () => {
  it.each([
    ['19,99', 1999],
    ['19.99', 1999],
    ['4,35', 435],
    ['1,15', 115],
    ['0,07', 7],
    ['12', 1200],
    ['12,5', 1250],
    ['12,', 1200],
    ['0', 0],
  ])('reads %s as %i grosze', (text, grosze) => {
    expect(parseMoney(text)).toBe(grosze);
  });

  it('ignores spaces, including non-breaking ones from pasted prices', () => {
    expect(parseMoney(' 1 234,50 ')).toBe(123450);
    expect(parseMoney('1 234,50')).toBe(123450);
    expect(parseMoney('1 234,50')).toBe(123450);
  });

  it.each(['', '   ', 'abc', '12,345', '1,2,3', '-5', ',50', '12 zł', '1e3'])(
    'rejects %j',
    (text) => {
      expect(parseMoney(text)).toBeNull();
    },
  );

  it('rejects amounts beyond the safe integer range', () => {
    expect(parseMoney('99999999999999999999')).toBeNull();
  });
});

describe('formatMoneyInput', () => {
  it.each([
    [1250, '12,50'],
    [1999, '19,99'],
    [7, '0,07'],
    [0, '0,00'],
    [123450, '1234,50'],
  ])('shows %i grosze as %s', (grosze, text) => {
    expect(formatMoneyInput(grosze)).toBe(text);
  });

  it('shows no value as an empty field', () => {
    expect(formatMoneyInput(null)).toBe('');
  });

  it('round-trips with parseMoney', () => {
    for (const grosze of [0, 1, 99, 100, 1999, 435, 2147483647]) {
      expect(parseMoney(formatMoneyInput(grosze))).toBe(grosze);
    }
  });
});
