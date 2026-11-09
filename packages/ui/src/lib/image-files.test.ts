import { describe, expect, it } from 'vitest';
import { checkImageFiles, moveItem } from './image-files';

const MB = 1024 * 1024;

function file(name: string, type: string, size = 100) {
  return { name, type, size } as File;
}

const RULES = {
  acceptedTypes: ['image/jpeg', 'image/png'],
  maxFileSize: 5 * MB,
  remainingSlots: 2,
};

describe('checkImageFiles', () => {
  it('accepts files that meet the rules', () => {
    const photo = file('a.jpg', 'image/jpeg');
    expect(checkImageFiles([photo], RULES)).toEqual({ accepted: [photo], errors: [] });
  });

  it('rejects an unsupported type by name', () => {
    expect(checkImageFiles([file('a.pdf', 'application/pdf')], RULES)).toEqual({
      accepted: [],
      errors: ['a.pdf: nieobsługiwany format pliku'],
    });
  });

  it('accepts a file of exactly the maximum size', () => {
    expect(checkImageFiles([file('a.jpg', 'image/jpeg', 5 * MB)], RULES).errors).toEqual([]);
  });

  it('rejects a file one byte over the limit', () => {
    expect(checkImageFiles([file('a.jpg', 'image/jpeg', 5 * MB + 1)], RULES).errors).toEqual([
      'a.jpg: plik jest większy niż 5 MB',
    ]);
  });

  it('accepts only as many files as there are free slots', () => {
    const result = checkImageFiles(
      [file('a.jpg', 'image/jpeg'), file('b.jpg', 'image/jpeg'), file('c.jpg', 'image/jpeg')],
      RULES,
    );
    expect(result.accepted.map(({ name }) => name)).toEqual(['a.jpg', 'b.jpg']);
    expect(result.errors).toEqual(['c.jpg: osiągnięto limit zdjęć']);
  });

  it('does not let a rejected file use up a slot', () => {
    const result = checkImageFiles(
      [file('a.pdf', 'application/pdf'), file('b.jpg', 'image/jpeg'), file('c.png', 'image/png')],
      RULES,
    );
    expect(result.accepted).toHaveLength(2);
  });
});

describe('moveItem', () => {
  it('moves an item forwards', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
  });

  it('moves an item backwards', () => {
    expect(moveItem(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b']);
  });

  it('leaves the original untouched', () => {
    const items = ['a', 'b'];
    moveItem(items, 0, 1);
    expect(items).toEqual(['a', 'b']);
  });
});
