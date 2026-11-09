'use client';

import { ChevronLeft, ChevronRight, LoaderCircle, Star, Upload, X } from 'lucide-react';
import {
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
} from 'react';
import { cn } from '../lib/cn';
import { checkImageFiles, moveItem } from '../lib/image-files';
import { Alert } from './alert';
import { Button } from './button';
import { IconButton, UNAVAILABLE_ICON_BUTTON } from './icon-button';

export type UploaderImage = {
  id: string;
  url: string;
  alt: string;
  /** Absent once stored on the server */
  status?: 'uploading' | 'error';
  errorMessage?: string;
};

export type ImageUploaderProps = {
  images: readonly UploaderImage[];
  acceptedTypes: readonly string[];
  maxFileSize: number;
  maxImages: number;
  /** Shown on the add tile, e.g. "JPG, PNG, WebP · do 5 MB" */
  hint: string;
  onFilesAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
  /** Receives the ids of the stored images in their new order */
  onReorder: (ids: string[]) => void;
  onRetry: (id: string) => void;
};

type TileAction = 'left' | 'right' | 'main';

type TileButtonProps = {
  action: TileAction;
  label: string;
  isUnavailable: boolean;
  onPress: () => void;
  children: ReactNode;
};

function TileButton({ action, label, isUnavailable, onPress, children }: TileButtonProps) {
  return (
    <IconButton
      size="sm"
      data-action={action}
      aria-label={label}
      aria-disabled={isUnavailable || undefined}
      className={UNAVAILABLE_ICON_BUTTON}
      onClick={isUnavailable ? undefined : onPress}
    >
      {children}
    </IconButton>
  );
}

export function ImageUploader({
  images,
  acceptedTypes,
  maxFileSize,
  maxImages,
  hint,
  onFilesAdd,
  onRemove,
  onReorder,
  onRetry,
}: ImageUploaderProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const draggedIdRef = useRef<string | null>(null);
  const focusAfterUpdateRef = useRef<{ id: string; action: TileAction } | 'add' | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [isFileOver, setIsFileOver] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [announcement, setAnnouncement] = useState('');

  const storedIds = images.filter((image) => !image.status).map((image) => image.id);

  // Reordering can re-insert the focused tile in the DOM, and removal deletes it: either way the
  // browser drops focus, so it is put back once the new list has rendered
  useLayoutEffect(() => {
    const target = focusAfterUpdateRef.current;
    if (!target) return;
    focusAfterUpdateRef.current = null;

    if (target === 'add') addButtonRef.current?.focus();
    else
      rootRef.current
        ?.querySelector<HTMLElement>(
          `[data-image-id="${CSS.escape(target.id)}"] [data-action="${target.action}"]`,
        )
        ?.focus();
  }, [images]);

  function addFiles(files: File[]) {
    const { accepted, errors: nextErrors } = checkImageFiles(files, {
      acceptedTypes,
      maxFileSize,
      remainingSlots: maxImages - images.length,
    });
    setErrors(nextErrors);
    if (accepted.length > 0) onFilesAdd(accepted);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    addFiles(Array.from(event.target.files ?? []));
    // Otherwise choosing the same file again would not fire a change
    event.target.value = '';
  }

  function move(image: UploaderImage, to: number, action?: TileAction) {
    const from = storedIds.indexOf(image.id);
    if (action) focusAfterUpdateRef.current = { id: image.id, action };
    onReorder(moveItem(storedIds, from, to));
    setAnnouncement(`${image.alt}: pozycja ${to + 1} z ${storedIds.length}`);
  }

  function setAsMain(image: UploaderImage) {
    focusAfterUpdateRef.current = { id: image.id, action: 'main' };
    onReorder(moveItem(storedIds, storedIds.indexOf(image.id), 0));
    setAnnouncement(`${image.alt}: ustawiono jako główne`);
  }

  function remove(image: UploaderImage) {
    focusAfterUpdateRef.current = 'add';
    onRemove(image.id);
    setAnnouncement(`Usunięto: ${image.alt}`);
  }

  function isDraggingFiles(event: DragEvent) {
    return event.dataTransfer.types.includes('Files');
  }

  function handleTileDragOver(event: DragEvent, image: UploaderImage) {
    if (!draggedIdRef.current || image.status) return;
    event.preventDefault();
    setDropTargetId(image.id);
  }

  function handleTileDrop(event: DragEvent, image: UploaderImage) {
    const draggedId = draggedIdRef.current;
    if (!draggedId || image.status) return;
    event.preventDefault();
    event.stopPropagation();
    setDropTargetId(null);
    draggedIdRef.current = null;

    const dragged = images.find((item) => item.id === draggedId);
    if (dragged && draggedId !== image.id) move(dragged, storedIds.indexOf(image.id));
  }

  function handleGridDragOver(event: DragEvent) {
    if (!isDraggingFiles(event)) return;
    event.preventDefault();
    setIsFileOver(true);
  }

  function handleGridDrop(event: DragEvent) {
    setIsFileOver(false);
    if (!isDraggingFiles(event)) return;
    event.preventDefault();
    addFiles(Array.from(event.dataTransfer.files));
  }

  const isFull = images.length >= maxImages;

  return (
    <div ref={rootRef} data-slot="image-uploader" className="flex flex-col gap-3">
      <ul
        className={cn(
          'grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-3 rounded-lg',
          isFileOver && 'outline-2 outline-offset-4 outline-ring',
        )}
        onDragOver={handleGridDragOver}
        onDragLeave={() => setIsFileOver(false)}
        onDrop={handleGridDrop}
      >
        {images.map((image) => {
          const position = storedIds.indexOf(image.id);
          const isMain = position === 0;
          return (
            <li
              key={image.id}
              data-image-id={image.id}
              aria-busy={image.status === 'uploading' || undefined}
              draggable={!image.status}
              className={cn(
                'flex flex-col gap-1.5 rounded-lg',
                !image.status && 'cursor-grab',
                dropTargetId === image.id && 'outline-2 outline-offset-2 outline-ring',
              )}
              onDragStart={(event) => {
                draggedIdRef.current = image.id;
                event.dataTransfer.effectAllowed = 'move';
                // Firefox does not start a drag without any data
                event.dataTransfer.setData('text/plain', image.id);
              }}
              onDragOver={(event) => handleTileDragOver(event, image)}
              onDragLeave={() => setDropTargetId(null)}
              onDrop={(event) => handleTileDrop(event, image)}
              onDragEnd={() => {
                draggedIdRef.current = null;
                setDropTargetId(null);
              }}
            >
              <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                <img
                  src={image.url}
                  alt={image.alt}
                  draggable={false}
                  className={cn('size-full object-cover', image.status && 'opacity-40')}
                />

                {isMain && (
                  <span className="absolute top-2 left-2 rounded-full bg-foreground/80 px-2 py-0.5 text-caption font-semibold text-background">
                    Główne
                  </span>
                )}

                <IconButton
                  variant="overlay"
                  size="sm"
                  aria-label={`Usuń: ${image.alt}`}
                  className="absolute top-1.5 right-1.5 size-6"
                  onClick={() => remove(image)}
                >
                  <X aria-hidden className="size-3!" />
                </IconButton>

                {image.status === 'uploading' && (
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-card/90 py-1 text-caption">
                    <LoaderCircle aria-hidden className="size-3 animate-spin" />
                    Wysyłanie…
                  </div>
                )}

                {image.status === 'error' && (
                  <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-1 bg-card/95 p-2 text-center text-caption text-destructive">
                    {image.errorMessage ?? 'Nie udało się wysłać'}
                    <Button
                      variant="secondary"
                      size="sm"
                      aria-label={`Ponów wysyłanie: ${image.alt}`}
                      onClick={() => onRetry(image.id)}
                    >
                      Ponów
                    </Button>
                  </div>
                )}
              </div>

              {!image.status && (
                // Dragging needs a mouse, so every reorder also has a button (WCAG 2.5.7)
                <div className="flex justify-center gap-1">
                  <TileButton
                    action="left"
                    label={`Przesuń w lewo: ${image.alt}`}
                    isUnavailable={isMain}
                    onPress={() => move(image, position - 1, 'left')}
                  >
                    <ChevronLeft aria-hidden />
                  </TileButton>
                  <TileButton
                    action="main"
                    label={`Ustaw jako główne: ${image.alt}`}
                    isUnavailable={isMain}
                    onPress={() => setAsMain(image)}
                  >
                    <Star aria-hidden />
                  </TileButton>
                  <TileButton
                    action="right"
                    label={`Przesuń w prawo: ${image.alt}`}
                    isUnavailable={position === storedIds.length - 1}
                    onPress={() => move(image, position + 1, 'right')}
                  >
                    <ChevronRight aria-hidden />
                  </TileButton>
                </div>
              )}
            </li>
          );
        })}

        {!isFull && (
          <li>
            <button
              ref={addButtonRef}
              type="button"
              className="flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-input bg-background p-2 text-center text-label text-muted-foreground transition-colors duration-(--duration-fast) hover:border-primary hover:text-primary-ink"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload aria-hidden className="size-5" />
              Dodaj zdjęcie
              <span className="text-caption">{hint}</span>
            </button>
          </li>
        )}
      </ul>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        hidden
        data-testid="file-input"
        accept={acceptedTypes.join(',')}
        onChange={handleFileChange}
      />

      {errors.length > 0 && (
        <Alert>
          <ul>
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </Alert>
      )}

      <div role="status" className="sr-only">
        {announcement}
      </div>
    </div>
  );
}
