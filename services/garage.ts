const GARAGE_WEB_HOST = "bucket-utama.web.43.156.104.232.sslip.io";

const ACCEPTED_TYPES: Record<string, RegExp> = {
  image: /^image\//,
  document: /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|txt|csv|odt|ods|odp)$/i,
};

export function isUploadableFile(file: File): boolean {
  if (ACCEPTED_TYPES.image.test(file.type) || ACCEPTED_TYPES.image.test(file.name)) return true;
  return ACCEPTED_TYPES.document.test(file.name);
}

export function getProxiedUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.includes(GARAGE_WEB_HOST)) {
    if (url.match(/\.(mp4|webm)(\?|$)/i)) {
      return `/api/video-proxy?url=${encodeURIComponent(url)}`;
    }
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}

export const uploadToGarage = async (file: File): Promise<string | null> => {
  if (!file) return null;

  if (!isUploadableFile(file)) {
    console.error("GarageService: Only image or document files are allowed.");
    return null;
  }

  const EDGE_FUNCTION_URL = process.env.NEXT_PUBLIC_UPLOAD_FUNCTION_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_upload_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!EDGE_FUNCTION_URL || !supabaseAnonKey) {
    console.error("GarageService: Missing env vars");
    return null;
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${supabaseAnonKey}`,
        "apikey": supabaseAnonKey,
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Gagal upload.");
    return data.url;
  } catch (error: any) {
    console.error("GarageService Error:", error.message);
    return null;
  }
};
