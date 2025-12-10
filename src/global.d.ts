declare module "*.css";
declare module "*.png";
declare module "*.jpg";
declare module "*.svg";

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
