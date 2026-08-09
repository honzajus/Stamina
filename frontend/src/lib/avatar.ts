import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";

/** Opens the native camera/photo-library prompt and returns a data: URL, or null if cancelled. */
export async function pickAvatarPhoto(): Promise<string | null> {
  try {
    const photo = await Camera.getPhoto({
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Prompt,
      quality: 70,
      width: 512,
      height: 512,
      correctOrientation: true,
    });
    return photo.dataUrl ?? null;
  } catch {
    return null;
  }
}
