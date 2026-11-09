import { fireEvent } from 'storybook/test';

/**
 * Does what the browser does on Esc: cancel event, then close unless prevented.
 * The play function's userEvent sends untrusted key events, which never reach a native dialog.
 */
export function pressEscape(dialog: HTMLDialogElement) {
  const shouldClose = dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
  if (shouldClose) dialog.close();
}

/** Clicks whatever is really at this point of the viewport, the way a mouse would. */
export async function clickAt(x: number, y: number) {
  const target = document.elementFromPoint(x, y);
  if (!target) throw new Error(`Nothing to click at ${x},${y}`);

  const position = { clientX: x, clientY: y };
  await fireEvent.mouseDown(target, position);
  await fireEvent.mouseUp(target, position);
  await fireEvent.click(target, position);
}

export async function clickBackdrop() {
  await clickAt(1, 1);
}
