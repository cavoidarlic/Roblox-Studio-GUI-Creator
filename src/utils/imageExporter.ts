import JSZip from 'jszip';
import { RobloxElement } from '../types/roblox';
import { hexToRgb } from './robloxMath';

/**
 * Loads an image src (data URL, blob URL, or external http/https URL) into an HTMLImageElement.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = err => reject(err);
    img.src = src;
  });
}

/**
 * Renders an image element onto an offscreen canvas, applying ImageColor3 tinting and ImageTransparency if configured.
 * Returns a PNG Blob.
 */
export async function elementImageToBlob(element: RobloxElement): Promise<Blob | null> {
  const imgSrc = element.image;
  if (!imgSrc || imgSrc.startsWith('rbxassetid://') || imgSrc.startsWith('rbxasset://')) {
    // If it's a raw roblox asset ID without resolved image URL, skip or return null
    return null;
  }

  try {
    const img = await loadImage(imgSrc);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || 300;
    canvas.height = img.naturalHeight || 300;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Apply transparency
    const alpha = 1 - (element.imageTransparency ?? 0);
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

    // Draw base image
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // If ImageColor3 is tinted (not #ffffff)
    if (element.imageColor && element.imageColor.toLowerCase() !== '#ffffff') {
      const rgb = hexToRgb(element.imageColor);
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Restore destination-in to preserve image alpha silhouette
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }

    return new Promise<Blob | null>(resolve => {
      canvas.toBlob(blob => resolve(blob), 'image/png');
    });
  } catch (err) {
    console.warn(`Failed to export image for element ${element.name}:`, err);
    return null;
  }
}

/**
 * Extracts and packages all ImageLabel / ImageButton images from the elements tree
 * and downloads them as a single .zip file.
 */
export async function exportAllImagesAsZip(
  elements: RobloxElement[],
  zipFilename: string = `RobloxStudio_Images_${Date.now()}.zip`
): Promise<{ count: number; skipped: number }> {
  const imageElements = elements.filter(
    el => (el.type === 'ImageLabel' || el.type === 'ImageButton') && el.image
  );

  if (imageElements.length === 0) {
    return { count: 0, skipped: 0 };
  }

  const zip = new JSZip();
  const folder = zip.folder('images') || zip;
  const nameCounts: Record<string, number> = {};
  let count = 0;
  let skipped = 0;

  for (const el of imageElements) {
    const blob = await elementImageToBlob(el);
    if (!blob) {
      skipped++;
      continue;
    }

    // Clean safe filename
    let baseName = (el.name || el.type).replace(/[^a-zA-Z0-9_-]/g, '_');
    if (!baseName) baseName = 'image';

    if (nameCounts[baseName] !== undefined) {
      nameCounts[baseName]++;
      baseName = `${baseName}_${nameCounts[baseName]}`;
    } else {
      nameCounts[baseName] = 1;
    }

    folder.file(`${baseName}.png`, blob);
    count++;
  }

  if (count > 0) {
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = zipFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return { count, skipped };
}

/**
 * Downloads a single element's image as a .png
 */
export async function exportSingleImage(element: RobloxElement): Promise<boolean> {
  const blob = await elementImageToBlob(element);
  if (!blob) return false;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const baseName = (element.name || element.type).replace(/[^a-zA-Z0-9_-]/g, '_');
  a.download = `${baseName}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}
