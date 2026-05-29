export function getApiUrl(path: string): string {
  const baseUrl = (import.meta as any).env.VITE_API_URL || "";
  // String hygiene: ensure we don't duplicate slashes
  const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}

export async function apiRequest<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = getApiUrl(path);
  
  // Set default JSON content-type if there is a body and method is POST/PUT/PATCH
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  
  const finalOptions: RequestInit = {
    ...options,
    headers,
  };

  const response = await fetch(url, finalOptions);

  const contentType = response.headers.get("content-type") || "";
  let data: any = null;
  const isJson = contentType.includes("application/json");

  if (isJson) {
    try {
      data = await response.json();
    } catch (err) {
      console.error(`Error parsing JSON response from ${url}:`, err);
    }
  }

  if (!response.ok) {
    // If we have parsed JSON containing an error field, use that.
    // Otherwise, generate a clear, descriptive HTTP status message.
    const errorMessage = (data && data.error) || `Server responded with status ${response.status} (${response.statusText || "unspecified status text"}). This was triggered by requesting endpoint: ${url}`;
    throw new Error(errorMessage);
  }

  return (isJson && data !== null ? data : response) as unknown as T;
}
