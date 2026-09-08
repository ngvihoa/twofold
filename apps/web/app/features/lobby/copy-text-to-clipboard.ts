interface ClipboardPort {
  readonly writeText?: (text: string) => Promise<void>;
  readonly legacyCopy: (text: string) => boolean;
}

/** Copy text với fallback cho browser không cấp Clipboard API trên HTTP. */
export async function copyTextToClipboard(
  text: string,
  port: ClipboardPort = createBrowserClipboardPort()
): Promise<boolean> {
  if (port.writeText) {
    try {
      await port.writeText(text);
      return true;
    } catch {
      // Thử API đồng bộ cũ khi Clipboard API bị chặn bởi permission/context.
    }
  }

  return port.legacyCopy(text);
}

function createBrowserClipboardPort(): ClipboardPort {
  const writeText =
    typeof navigator !== 'undefined' && navigator.clipboard?.writeText
      ? navigator.clipboard.writeText.bind(navigator.clipboard)
      : undefined;

  return {
    ...(writeText ? { writeText } : {}),
    legacyCopy: copyWithTemporaryTextArea,
  };
}

function copyWithTemporaryTextArea(text: string): boolean {
  if (typeof document === 'undefined' || !document.body) return false;

  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.readOnly = true;
  textArea.style.position = 'fixed';
  textArea.style.left = '-9999px';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.select();

  try {
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    textArea.remove();
  }
}
