const IMGBB_API_KEY = "f4bada3d0a88f3906cbffdf3dd038876"; // <-- IMPORTANT: Replace with your ImgBB API key
const IMGBB_UPLOAD_URL = "https://api.imgbb.com/1/upload";

/**
 * Checks if a URL is a Google Drive link.
 * @param {string} url The URL to check.
 * @returns {boolean} True if it's a Google Drive link.
 */
function isGoogleDriveLink(url) {
  try {
    const a = new URL(url);
    return a.hostname.includes("drive.google.com");
  } catch (e) {
    return false;
  }
}

/**
 * Uploads an image from a URL to ImgBB and returns a direct link.
 * @param {string|File} imageSource The URL of the image to upload, or a File object.
 * @returns {Promise<string>} The new direct URL from ImgBB.
 */
export async function uploadImageToImgBB(imageSource) {
  // If the source is a string (URL)
  if (typeof imageSource === 'string') {
    if (!isGoogleDriveLink(imageSource)) {
      // If it's not a Google Drive link, assume it's already a direct link and return it.
      return imageSource;
    }
    // If it is a Google Drive link, it will be processed below.
  } else if (!(imageSource instanceof File)) {
    // If it's not a string and not a File, it's invalid.
    throw new Error("Invalid image source provided.");
  }

  const formData = new FormData();
  formData.append("key", IMGBB_API_KEY);
  formData.append("image", imageSource); // This works for both a URL string and a File object

  const response = await fetch(IMGBB_UPLOAD_URL, {
    method: "POST",
    body: formData,
  });

  const result = await response.json();

  if (!response.ok || !result.data || !result.data.url) {
    throw new Error(result.error?.message || "Failed to upload image to ImgBB.");
  }

  return result.data.url; // This is the direct, displayable URL
}