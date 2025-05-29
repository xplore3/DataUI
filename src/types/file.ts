//
export interface DownloadResponse {
  data: Blob;
  headers: Record<string, string>;
  status: number;
  statusText: string;
}