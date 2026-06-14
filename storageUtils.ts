import { Platform } from 'react-native';
import { supabase } from './supabaseClient';

type UploadPayload = {
  blob: Blob;
  contentType: string;
  extension: string;
};

/** Camera URIs, base64 strings, blob URLs, or in-memory Blobs from the browser. */
export type FoodImageSource = string | Blob;

const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

function extensionFromMime(mime: string): string {
  return MIME_TO_EXTENSION[mime.toLowerCase()] ?? 'jpg';
}

function extensionFromUri(uri: string, mime: string): string {
  const path = uri.split('?')[0];
  const candidate = path.split('.').pop()?.toLowerCase();

  if (candidate && Object.values(MIME_TO_EXTENSION).includes(candidate)) {
    return candidate === 'jpeg' ? 'jpg' : candidate;
  }

  return extensionFromMime(mime);
}

function decodeBase64ToBytes(base64: string): Uint8Array {
  const normalized = base64.replace(/\s/g, '');
  const binary =
    typeof atob === 'function'
      ? atob(normalized)
      : (() => {
          throw new Error('Base64 decoding is not available in this environment.');
        })();

  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function bytesToBlob(bytes: Uint8Array, contentType: string): Blob {
  return new Blob([bytes.slice()], { type: contentType });
}

function parseDataUri(dataUri: string): UploadPayload | null {
  const base64Marker = ';base64,';
  const markerIndex = dataUri.indexOf(base64Marker);
  if (!dataUri.startsWith('data:') || markerIndex === -1) {
    return null;
  }

  const meta = dataUri.slice('data:'.length, markerIndex);
  const contentType = meta.split(';')[0] || 'image/jpeg';
  const extension = extensionFromMime(contentType);
  const bytes = decodeBase64ToBytes(dataUri.slice(markerIndex + base64Marker.length));

  return {
    blob: bytesToBlob(bytes, contentType),
    contentType,
    extension,
  };
}

function isLikelyRawBase64(value: string): boolean {
  if (value.startsWith('data:') || value.includes('://')) {
    return false;
  }

  const sample = value.replace(/\s/g, '').slice(0, 256);
  return sample.length > 64 && /^[A-Za-z0-9+/=]+$/.test(sample);
}

function rawBase64ToPayload(base64: string, contentType = 'image/jpeg'): UploadPayload {
  const bytes = decodeBase64ToBytes(base64);
  return {
    blob: bytesToBlob(bytes, contentType),
    contentType,
    extension: extensionFromMime(contentType),
  };
}

function blobToPayload(blob: Blob): UploadPayload {
  const contentType = blob.type || 'image/jpeg';
  return {
    blob,
    contentType,
    extension: extensionFromMime(contentType),
  };
}

function payloadFromBlob(blob: Blob, fileUri: string): UploadPayload {
  const contentType = blob.type || 'image/jpeg';
  return {
    blob,
    contentType,
    extension: extensionFromUri(fileUri, contentType),
  };
}

async function readBlobUrl(blobUrl: string): Promise<UploadPayload> {
  try {
    const response = await fetch(blobUrl);
    if (!response.ok) {
      throw new Error(`Failed to read blob URL (${response.status}).`);
    }
    const blob = await response.blob();
    return payloadFromBlob(blob, blobUrl);
  } catch (fetchError) {
    if (typeof XMLHttpRequest === 'undefined') {
      throw fetchError;
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', blobUrl);
      xhr.responseType = 'blob';
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(payloadFromBlob(xhr.response as Blob, blobUrl));
          return;
        }
        reject(new Error(`Failed to read blob URL (${xhr.status}).`));
      };
      xhr.onerror = () => reject(fetchError);
      xhr.send();
    });
  }
}

async function readNativeFileUri(fileUri: string): Promise<UploadPayload> {
  if (Platform.OS === 'web') {
    throw new Error('Native file URIs cannot be read in the browser.');
  }

  const response = await fetch(fileUri);
  if (!response.ok) {
    throw new Error(`Failed to read image (${response.status}).`);
  }

  const blob = await response.blob();
  return payloadFromBlob(blob, fileUri);
}

async function uriToUploadPayload(fileUri: string): Promise<UploadPayload> {
  const trimmed = fileUri.trim();

  if (trimmed.startsWith('data:')) {
    const parsed = parseDataUri(trimmed);
    if (parsed) return parsed;
    throw new Error('Invalid data URI.');
  }

  if (isLikelyRawBase64(trimmed)) {
    return rawBase64ToPayload(trimmed);
  }

  if (trimmed.startsWith('blob:')) {
    return readBlobUrl(trimmed);
  }

  if (Platform.OS === 'web' && (trimmed.startsWith('file:') || trimmed.startsWith('content:'))) {
    throw new Error('Browser uploads require a data URI, base64 string, or Blob — not a native file path.');
  }

  try {
    return await readNativeFileUri(trimmed);
  } catch (error) {
    if (isLikelyRawBase64(trimmed)) {
      return rawBase64ToPayload(trimmed);
    }
    throw error;
  }
}

async function sourceToUploadPayload(source: FoodImageSource): Promise<UploadPayload> {
  if (typeof source !== 'string') {
    return blobToPayload(source);
  }

  return uriToUploadPayload(source);
}

async function bodyForSupabaseUpload(blob: Blob): Promise<Blob | ArrayBuffer> {
  if (Platform.OS !== 'web' || typeof blob.arrayBuffer !== 'function') {
    return blob;
  }

  return blob.arrayBuffer();
}

/**
 * Uploads a camera or gallery photo to the Supabase `food-images` bucket.
 * Accepts native file URIs, web `blob:` URLs, browser `data:` / base64 strings,
 * and in-memory `Blob` objects from webcam capture.
 */
export const uploadFoodImage = async (source: FoodImageSource): Promise<string | null> => {
  try {
    const { blob, contentType, extension } = await sourceToUploadPayload(source);
    const fileName = `${Date.now()}.${extension}`;
    const filePath = `raw_meals/${fileName}`;
    const uploadBody = await bodyForSupabaseUpload(blob);

    const { error } = await supabase.storage.from('food-images').upload(filePath, uploadBody, {
      contentType,
      upsert: false,
    });

    if (error) {
      console.error('Supabase Storage Upload Error:', error.message);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from('food-images')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Unexpected Upload Exception:', error);
    return null;
  }
};
