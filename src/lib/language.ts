export type LanguageCode = "ko" | "en" | "zh" | "ja" | "fr" | "vi";

export type LanguageOption = {
  code: LanguageCode;
  label: string;
  deeplCode?: string;
};

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: "ko", label: "한국어", deeplCode: "KO" },
  { code: "en", label: "English", deeplCode: "EN" },
  { code: "zh", label: "中文", deeplCode: "ZH" },
  { code: "ja", label: "日本語", deeplCode: "JA" },
  { code: "fr", label: "Français", deeplCode: "FR" },
  // DeepL (2024) does not currently support Vietnamese. Leave deeplCode undefined to skip translation.
  { code: "vi", label: "Tiếng Việt" },
];

export const DEFAULT_LANGUAGE: LanguageCode = "ko";
