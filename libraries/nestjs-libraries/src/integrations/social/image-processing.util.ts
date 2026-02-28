import sharp from 'sharp';

export interface PlatformImageConstraints {
  minAspectRatio?: number; // width / height
  maxAspectRatio?: number;
  maxWidth?: number;
  maxHeight?: number;
  minWidth?: number;
  minHeight?: number;
  maxFileSizeKB?: number;
}

export const PLATFORM_CONSTRAINTS: Record<string, PlatformImageConstraints> = {
  instagram: {
    minAspectRatio: 4 / 5,     // 0.8 (portrait)
    maxAspectRatio: 1.91,       // landscape
    maxWidth: 1920,
    maxHeight: 1080,
  },
  'instagram-standalone': {
    minAspectRatio: 4 / 5,
    maxAspectRatio: 1.91,
    maxWidth: 1920,
    maxHeight: 1080,
  },
  threads: {
    minAspectRatio: 4 / 5,
    maxAspectRatio: 1.91,
    maxWidth: 1920,
    maxHeight: 1080,
  },
  pinterest: {
    minAspectRatio: 2 / 3,     // 0.667 (tall pin)
    maxAspectRatio: 1,          // square max
  },
  tiktok: {
    minWidth: 720,
    minHeight: 720,
  },
  facebook: {
    maxFileSizeKB: 4096,        // 4MB
  },
  bluesky: {
    maxFileSizeKB: 976,
  },
};

export interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
  wasModified: boolean;
}

export async function processImageBuffer(
  buffer: Buffer,
  constraints: PlatformImageConstraints
): Promise<ProcessedImage> {
  const metadata = await sharp(buffer).metadata();
  let width = metadata.width!;
  let height = metadata.height!;
  let currentBuffer = buffer;
  let modified = false;
  const isAnimated = metadata.pages && metadata.pages > 1;

  // Skip animated images (GIFs)
  if (isAnimated) {
    return { buffer: currentBuffer, width, height, wasModified: false };
  }

  // 1. Aspect ratio cropping (center crop)
  const currentRatio = width / height;

  if (constraints.minAspectRatio && currentRatio < constraints.minAspectRatio) {
    // Image is too tall — crop height from center
    const targetHeight = Math.floor(width / constraints.minAspectRatio);
    const top = Math.floor((height - targetHeight) / 2);
    currentBuffer = await sharp(currentBuffer)
      .extract({ left: 0, top, width, height: targetHeight })
      .toBuffer();
    height = targetHeight;
    modified = true;
  } else if (constraints.maxAspectRatio && currentRatio > constraints.maxAspectRatio) {
    // Image is too wide — crop width from center
    const targetWidth = Math.floor(height * constraints.maxAspectRatio);
    const left = Math.floor((width - targetWidth) / 2);
    currentBuffer = await sharp(currentBuffer)
      .extract({ left, top: 0, width: targetWidth, height })
      .toBuffer();
    width = targetWidth;
    modified = true;
  }

  // 2. Max dimensions (resize down, maintain aspect ratio)
  if (
    (constraints.maxWidth && width > constraints.maxWidth) ||
    (constraints.maxHeight && height > constraints.maxHeight)
  ) {
    const result = await sharp(currentBuffer)
      .resize({
        width: constraints.maxWidth,
        height: constraints.maxHeight,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .toBuffer({ resolveWithObject: true });
    currentBuffer = result.data;
    width = result.info.width;
    height = result.info.height;
    modified = true;
  }

  // 3. Min dimensions (upscale if needed)
  if (
    (constraints.minWidth && width < constraints.minWidth) ||
    (constraints.minHeight && height < constraints.minHeight)
  ) {
    const scaleX = constraints.minWidth ? constraints.minWidth / width : 1;
    const scaleY = constraints.minHeight ? constraints.minHeight / height : 1;
    const scale = Math.max(scaleX, scaleY);
    const newWidth = Math.ceil(width * scale);
    const newHeight = Math.ceil(height * scale);
    const result = await sharp(currentBuffer)
      .resize({ width: newWidth, height: newHeight })
      .toBuffer({ resolveWithObject: true });
    currentBuffer = result.data;
    width = result.info.width;
    height = result.info.height;
    modified = true;
  }

  // 4. File size reduction (iteratively reduce by 10%)
  if (constraints.maxFileSizeKB) {
    while (currentBuffer.length / 1024 > constraints.maxFileSizeKB) {
      width = Math.floor(width * 0.9);
      height = Math.floor(height * 0.9);
      if (width < 10 || height < 10) break;
      currentBuffer = await sharp(currentBuffer)
        .resize({ width, height })
        .jpeg({ quality: 85 })
        .toBuffer();
      modified = true;
    }
  }

  return { buffer: currentBuffer, width, height, wasModified: modified };
}

export async function downloadAndProcessImage(
  url: string,
  constraints: PlatformImageConstraints
): Promise<ProcessedImage> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return processImageBuffer(buffer, constraints);
}

/**
 * Process a media array for a specific platform.
 * Returns a new array with processed image URLs.
 * Videos are skipped. Images already within constraints are returned unchanged.
 */
export async function processMediaForPlatform<T extends { path: string }>(
  media: T[] | undefined,
  platformId: string
): Promise<T[]> {
  if (!media || media.length === 0) return media || [];

  const constraints = PLATFORM_CONSTRAINTS[platformId];
  if (!constraints) return media;

  const { UploadFactory } = await import('../../upload/upload.factory');
  const uploader = UploadFactory.createStorage();

  return Promise.all(
    media.map(async (m) => {
      // Skip videos
      if (m.path.indexOf('.mp4') > -1) return m;

      try {
        const result = await downloadAndProcessImage(m.path, constraints);
        if (!result.wasModified) return m;

        // Re-upload the processed image
        const filename = `processed-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
        const newUrl = await uploader.uploadBuffer(
          result.buffer,
          filename,
          'image/jpeg'
        );
        return { ...m, path: newUrl };
      } catch (e) {
        console.error(`Image processing failed for ${m.path}:`, e);
        return m; // Return original on error
      }
    })
  );
}
