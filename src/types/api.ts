export type ApiResponse<T> = {
  success: true;
  data: T;
};

export type ApiError = {
  success: false;
  error: {
    code: string;
    message: string;
  };
};

export type AspectRatioEnum = "SQUARE" | "PORTRAIT" | "STORY";
export type RollStatusEnum = "ACTIVE" | "FINISHED" | "ARCHIVED";
export type PhotoStatusEnum = "TEMP" | "ARCHIVED" | "DELETED";

export type VisitorType = {
  id: string;
  visitorToken: string;
  createdAt: string;
};

export type FilmStockType = {
  id: string;
  name: string;
  brand: string;
  iso: number;
  grainStrength: number;
  contrastLevel: number;
  saturationLevel: number;
  fadeAmount: number;
  temperatureShift: number;
};

export type RollType = {
  id: string;
  visitorId: string;
  filmStockId: string;
  filmStock?: FilmStockType;
  title?: string | null;
  aspectRatio: AspectRatioEnum;
  status: RollStatusEnum;
  exposureLimit: number;
  capturedCount: number;
  createdAt: string;
  updatedAt: string;
  photos?: PhotoType[];
};

export type PhotoType = {
  id: string;
  rollId: string;
  status: PhotoStatusEnum;
  storagePath: string;
  thumbnailPath?: string | null;
  caption?: string | null;
  width?: number | null;
  height?: number | null;
  fileSize?: number | null;
  mimeType?: string | null;
  capturedAt: string;
  archivedAt?: string | null;
};

export type ShareRollType = {
  id: string;
  rollId: string;
  shareToken: string;
  isActive: boolean;
  expiresAt?: string | null;
  createdAt: string;
};

export type ContactSheetType = {
  id: string;
  rollId: string;
  imagePath: string;
  generatedAt: string;
};
