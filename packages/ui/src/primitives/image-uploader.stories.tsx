import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fireEvent, fn, waitFor } from 'storybook/test';
import { ImageUploader, type ImageUploaderProps, type UploaderImage } from './image-uploader';

const MB = 1024 * 1024;

function picture(color: string) {
  return `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%23${color}"/%3E%3C/svg%3E`;
}

const IMAGES: UploaderImage[] = [
  { id: 'a', url: picture('8a9a7b'), alt: 'Przód opakowania' },
  { id: 'b', url: picture('b84a33'), alt: 'Tył opakowania' },
  { id: 'c', url: picture('2b1d14'), alt: 'Ziarna' },
];

function Harness({ images: initial, onReorder, onRemove, ...props }: ImageUploaderProps) {
  const [images, setImages] = useState(initial);
  return (
    <div className="max-w-xl">
      <ImageUploader
        {...props}
        images={images}
        onReorder={(ids) => {
          onReorder(ids);
          setImages(ids.flatMap((id) => images.find((image) => image.id === id) ?? []));
        }}
        onRemove={(id) => {
          onRemove(id);
          setImages(images.filter((image) => image.id !== id));
        }}
      />
    </div>
  );
}

const meta = {
  title: 'Composites/ImageUploader',
  component: Harness,
  args: {
    images: IMAGES,
    acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxFileSize: 5 * MB,
    maxImages: 12,
    hint: 'JPG, PNG, WebP · do 5 MB',
    onFilesAdd: fn(),
    onRemove: fn(),
    onReorder: fn(),
    onRetry: fn(),
  },
} satisfies Meta<typeof Harness>;

export default meta;

type Story = StoryObj<typeof meta>;

function tiles(element: HTMLElement) {
  return Array.from(element.querySelectorAll('[data-image-id]')).map((tile) =>
    tile.getAttribute('data-image-id'),
  );
}

function tile(element: HTMLElement, id: string) {
  return element.querySelector(`[data-image-id="${id}"]`) as HTMLElement;
}

function makeFile(name: string, type: string, size = 100) {
  return new File([new Uint8Array(size)], name, { type });
}

function transferOf(...files: File[]) {
  const transfer = new DataTransfer();
  files.forEach((file) => transfer.items.add(file));
  return transfer;
}

// Dispatched by hand: fireEvent replaces the DataTransfer with an empty copy, losing the files
function dispatchDrag(element: HTMLElement, type: string, dataTransfer: DataTransfer) {
  element.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer }));
}

function fileInput(element: HTMLElement) {
  return element.querySelector('input[type="file"]') as HTMLInputElement;
}

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('img', { name: 'Przód opakowania' })).toBeInTheDocument();
    await expect(canvas.getAllByText('Główne')).toHaveLength(1);
    await expect(canvas.getByRole('button', { name: /Dodaj zdjęcie/ })).toHaveTextContent(
      'JPG, PNG, WebP · do 5 MB',
    );
  },
};

export const Empty: Story = {
  args: { images: [] },
  play: async ({ canvas }) => {
    await expect(canvas.queryByText('Główne')).not.toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: /Dodaj zdjęcie/ })).toBeInTheDocument();
  },
};

export const FileInputRestrictsTypes: Story = {
  play: async ({ canvasElement }) => {
    await expect(fileInput(canvasElement)).toHaveAttribute(
      'accept',
      'image/jpeg,image/png,image/webp',
    );
    await expect(fileInput(canvasElement)).toHaveAttribute('multiple');
  },
};

export const MoveWithButtons: Story = {
  play: async ({ args, canvas, canvasElement, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: 'Przesuń w prawo: Przód opakowania' }),
    );
    await expect(args.onReorder).toHaveBeenCalledWith(['b', 'a', 'c']);
    await expect(tiles(canvasElement)).toEqual(['b', 'a', 'c']);
    await expect(canvas.getByRole('status')).toHaveTextContent('Przód opakowania: pozycja 2 z 3');

    await userEvent.click(canvas.getByRole('button', { name: 'Przesuń w lewo: Ziarna' }));
    await expect(tiles(canvasElement)).toEqual(['b', 'c', 'a']);
  },
};

export const FocusFollowsMovedImage: Story = {
  play: async ({ canvas, userEvent }) => {
    const button = canvas.getByRole('button', { name: 'Przesuń w prawo: Przód opakowania' });
    button.focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() =>
      expect(
        canvas.getByRole('button', { name: 'Przesuń w prawo: Przód opakowania' }),
      ).toHaveFocus(),
    );
  },
};

export const SetAsMain: Story = {
  play: async ({ args, canvas, canvasElement, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Ustaw jako główne: Ziarna' }));
    await expect(args.onReorder).toHaveBeenCalledWith(['c', 'a', 'b']);
    await expect(tile(canvasElement, 'c')).toHaveTextContent('Główne');
  },
};

export const EdgeButtonsAreUnavailable: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const left = canvas.getByRole('button', { name: 'Przesuń w lewo: Przód opakowania' });
    const right = canvas.getByRole('button', { name: 'Przesuń w prawo: Ziarna' });
    await expect(left).toHaveAttribute('aria-disabled', 'true');
    await expect(right).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(left);
    await userEvent.click(right);
    await expect(args.onReorder).not.toHaveBeenCalled();
  },
};

export const DragToReorder: Story = {
  play: async ({ args, canvasElement }) => {
    const dataTransfer = new DataTransfer();
    await fireEvent.dragStart(tile(canvasElement, 'a'), { dataTransfer });
    await fireEvent.dragOver(tile(canvasElement, 'c'), { dataTransfer });
    await fireEvent.drop(tile(canvasElement, 'c'), { dataTransfer });
    await expect(args.onReorder).toHaveBeenCalledWith(['b', 'c', 'a']);
  },
};

export const DropOnItselfDoesNothing: Story = {
  play: async ({ args, canvasElement }) => {
    const dataTransfer = new DataTransfer();
    await fireEvent.dragStart(tile(canvasElement, 'a'), { dataTransfer });
    await fireEvent.drop(tile(canvasElement, 'a'), { dataTransfer });
    await expect(args.onReorder).not.toHaveBeenCalled();
  },
};

export const RemoveMovesFocusToAddButton: Story = {
  play: async ({ args, canvas, canvasElement, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Usuń: Tył opakowania' }));
    await expect(args.onRemove).toHaveBeenCalledWith('b');
    await expect(tiles(canvasElement)).toEqual(['a', 'c']);
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: /Dodaj zdjęcie/ })).toHaveFocus(),
    );
  },
};

export const RemoveButtonTargetSize: Story = {
  play: async ({ canvas }) => {
    const box = canvas.getByRole('button', { name: 'Usuń: Ziarna' }).getBoundingClientRect();
    await expect(box.width).toBe(24);
    await expect(box.height).toBe(24);
  },
};

export const ChooseFiles: Story = {
  play: async ({ args, canvasElement, userEvent }) => {
    const photo = makeFile('a.jpg', 'image/jpeg');
    await userEvent.upload(fileInput(canvasElement), photo);
    await expect(args.onFilesAdd).toHaveBeenCalledWith([photo]);
  },
};

export const RejectsInvalidFiles: Story = {
  play: async ({ args, canvas, canvasElement }) => {
    const photo = makeFile('ok.png', 'image/png');
    const dataTransfer = transferOf(makeFile('notatki.pdf', 'application/pdf'), photo);
    const grid = canvasElement.querySelector('ul') as HTMLElement;

    dispatchDrag(grid, 'dragover', dataTransfer);
    dispatchDrag(grid, 'drop', dataTransfer);

    await expect(await canvas.findByRole('alert')).toHaveTextContent(
      'notatki.pdf: nieobsługiwany format pliku',
    );
    await expect(args.onFilesAdd).toHaveBeenCalledOnce();
    await expect(args.onFilesAdd).toHaveBeenCalledWith([photo]);
  },
};

export const RejectsTooLargeFile: Story = {
  args: { maxFileSize: 10 },
  play: async ({ args, canvas, canvasElement, userEvent }) => {
    await userEvent.upload(fileInput(canvasElement), makeFile('duze.jpg', 'image/jpeg', 11));
    await expect(canvas.getByRole('alert')).toHaveTextContent('duze.jpg: plik jest większy niż');
    await expect(args.onFilesAdd).not.toHaveBeenCalled();
  },
};

export const FullHidesAddTile: Story = {
  args: { maxImages: 3 },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('button', { name: /Dodaj zdjęcie/ })).not.toBeInTheDocument();
  },
};

export const Uploading: Story = {
  args: {
    images: [...IMAGES, { id: 'd', url: picture('b84a33'), alt: 'Nowe', status: 'uploading' }],
  },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByText('Wysyłanie…')).toBeInTheDocument();
    await expect(tile(canvasElement, 'd')).toHaveAttribute('aria-busy', 'true');
    await expect(tile(canvasElement, 'd')).toHaveAttribute('draggable', 'false');
    await expect(
      canvas.queryByRole('button', { name: 'Ustaw jako główne: Nowe' }),
    ).not.toBeInTheDocument();
    // The stored images end before the one still uploading
    await expect(canvas.getByRole('button', { name: 'Przesuń w prawo: Ziarna' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  },
};

export const UploadFailed: Story = {
  args: {
    images: [
      ...IMAGES,
      { id: 'd', url: picture('b84a33'), alt: 'Nowe', status: 'error', errorMessage: 'Błąd sieci' },
    ],
  },
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByText('Błąd sieci')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Ponów wysyłanie: Nowe' }));
    await expect(args.onRetry).toHaveBeenCalledWith('d');
  },
};
