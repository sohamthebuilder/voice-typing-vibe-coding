import { Provider } from "./providers/types";

export interface LanguageOption {
  code: string;
  name: string;
}

// ---------------------------------------------------------------------------
// Unified language list (deduplicated across all providers)
// Users pick from this list first, then see which models support that language.
// ---------------------------------------------------------------------------

export const UNIFIED_LANGUAGES: LanguageOption[] = [
  { code: "auto", name: "Auto-detect" },
  { code: "multi", name: "Multilingual (Deepgram)" },
  { code: "af", name: "Afrikaans" },
  { code: "sq", name: "Albanian" },
  { code: "as", name: "Assamese" },
  { code: "am", name: "Amharic" },
  { code: "ar", name: "Arabic" },
  { code: "hy", name: "Armenian" },
  { code: "az", name: "Azerbaijani" },
  { code: "eu", name: "Basque" },
  { code: "be", name: "Belarusian" },
  { code: "bn", name: "Bengali" },
  { code: "brx", name: "Bodo" },
  { code: "bs", name: "Bosnian" },
  { code: "bg", name: "Bulgarian" },
  { code: "my", name: "Burmese" },
  { code: "yue", name: "Cantonese" },
  { code: "ca", name: "Catalan" },
  { code: "zh", name: "Chinese" },
  { code: "hr", name: "Croatian" },
  { code: "cs", name: "Czech" },
  { code: "da", name: "Danish" },
  { code: "doi", name: "Dogri" },
  { code: "nl", name: "Dutch" },
  { code: "en", name: "English" },
  { code: "et", name: "Estonian" },
  { code: "fil", name: "Filipino" },
  { code: "fi", name: "Finnish" },
  { code: "fr", name: "French" },
  { code: "gl", name: "Galician" },
  { code: "ka", name: "Georgian" },
  { code: "de", name: "German" },
  { code: "el", name: "Greek" },
  { code: "gu", name: "Gujarati" },
  { code: "he", name: "Hebrew" },
  { code: "hi", name: "Hindi" },
  { code: "hu", name: "Hungarian" },
  { code: "is", name: "Icelandic" },
  { code: "id", name: "Indonesian" },
  { code: "ga", name: "Irish" },
  { code: "it", name: "Italian" },
  { code: "ja", name: "Japanese" },
  { code: "jv", name: "Javanese" },
  { code: "kn", name: "Kannada" },
  { code: "ks", name: "Kashmiri" },
  { code: "kk", name: "Kazakh" },
  { code: "km", name: "Khmer" },
  { code: "kok", name: "Konkani" },
  { code: "ko", name: "Korean" },
  { code: "lo", name: "Lao" },
  { code: "lv", name: "Latvian" },
  { code: "lt", name: "Lithuanian" },
  { code: "mk", name: "Macedonian" },
  { code: "ms", name: "Malay" },
  { code: "ml", name: "Malayalam" },
  { code: "mai", name: "Maithili" },
  { code: "mni", name: "Manipuri" },
  { code: "mi", name: "Maori" },
  { code: "mr", name: "Marathi" },
  { code: "mn", name: "Mongolian" },
  { code: "ne", name: "Nepali" },
  { code: "no", name: "Norwegian" },
  { code: "od", name: "Odia" },
  { code: "fa", name: "Persian" },
  { code: "pl", name: "Polish" },
  { code: "pt", name: "Portuguese" },
  { code: "pa", name: "Punjabi" },
  { code: "ro", name: "Romanian" },
  { code: "ru", name: "Russian" },
  { code: "sa", name: "Sanskrit" },
  { code: "sat", name: "Santali" },
  { code: "sr", name: "Serbian" },
  { code: "sd", name: "Sindhi" },
  { code: "si", name: "Sinhala" },
  { code: "sk", name: "Slovak" },
  { code: "sl", name: "Slovenian" },
  { code: "es", name: "Spanish" },
  { code: "su", name: "Sundanese" },
  { code: "sw", name: "Swahili" },
  { code: "sv", name: "Swedish" },
  { code: "tl", name: "Tagalog" },
  { code: "ta", name: "Tamil" },
  { code: "taq", name: "Tamasheq" },
  { code: "te", name: "Telugu" },
  { code: "th", name: "Thai" },
  { code: "tr", name: "Turkish" },
  { code: "uk", name: "Ukrainian" },
  { code: "ur", name: "Urdu" },
  { code: "vi", name: "Vietnamese" },
  { code: "cy", name: "Welsh" },
  { code: "zu", name: "Zulu" },
];

// ---------------------------------------------------------------------------
// Resolve a unified base language code to the provider-specific code
// needed for the actual API call.
// ---------------------------------------------------------------------------

const AZURE_DEFAULT_LOCALE: Record<string, string> = {
  af: "af-ZA", am: "am-ET", ar: "ar-SA", az: "az-AZ", bg: "bg-BG",
  bn: "bn-IN", bs: "bs-BA", ca: "ca-ES", cs: "cs-CZ", cy: "cy-GB",
  da: "da-DK", de: "de-DE", el: "el-GR", en: "en-US", es: "es-ES",
  et: "et-EE", eu: "eu-ES", fa: "fa-IR", fi: "fi-FI", fil: "fil-PH",
  fr: "fr-FR", ga: "ga-IE", gl: "gl-ES", gu: "gu-IN", he: "he-IL",
  hi: "hi-IN", hr: "hr-HR", hu: "hu-HU", hy: "hy-AM", id: "id-ID",
  is: "is-IS", it: "it-IT", ja: "ja-JP", jv: "jv-ID", ka: "ka-GE",
  kk: "kk-KZ", km: "km-KH", kn: "kn-IN", ko: "ko-KR", lo: "lo-LA",
  lt: "lt-LT", lv: "lv-LV", mk: "mk-MK", ml: "ml-IN", mn: "mn-MN",
  mr: "mr-IN", ms: "ms-MY", my: "my-MM", no: "nb-NO", ne: "ne-NP",
  nl: "nl-NL", pl: "pl-PL", pt: "pt-BR", ro: "ro-RO", ru: "ru-RU",
  si: "si-LK", sk: "sk-SK", sl: "sl-SI", sq: "sq-AL", sr: "sr-RS",
  sv: "sv-SE", sw: "sw-KE", ta: "ta-IN", te: "te-IN", th: "th-TH",
  tr: "tr-TR", uk: "uk-UA", ur: "ur-PK", vi: "vi-VN", zh: "zh-CN",
  yue: "zh-HK", zu: "zu-ZA",
};

const AWS_TRANSCRIBE_DEFAULT_LOCALE: Record<string, string> = {
  af: "af-ZA", ar: "ar-SA", zh: "zh-CN", da: "da-DK", nl: "nl-NL",
  en: "en-US", fr: "fr-FR", de: "de-DE", he: "he-IL", hi: "hi-IN",
  id: "id-ID", it: "it-IT", ja: "ja-JP", ko: "ko-KR", ms: "ms-MY",
  pt: "pt-BR", ru: "ru-RU", es: "es-US", sv: "sv-SE", ta: "ta-IN",
  te: "te-IN", th: "th-TH", tr: "tr-TR", vi: "vi-VN",
};

const SARVAM_DEFAULT_LOCALE: Record<string, string> = {
  en: "en-IN", hi: "hi-IN", bn: "bn-IN", gu: "gu-IN", kn: "kn-IN",
  ml: "ml-IN", mr: "mr-IN", od: "od-IN", pa: "pa-IN", ta: "ta-IN",
  te: "te-IN", as: "as-IN", ur: "ur-IN", ne: "ne-IN", kok: "kok-IN",
  ks: "ks-IN", sd: "sd-IN", sa: "sa-IN", sat: "sat-IN", mni: "mni-IN",
  brx: "brx-IN", mai: "mai-IN", doi: "doi-IN",
};

export function resolveLanguageCode(langId: string, provider: Provider): string {
  if (langId === "auto" || langId === "multi") return langId;

  switch (provider) {
    case "openai":
    case "deepgram":
      if (langId === "yue") return "zh-HK";
      return langId;
    case "azure":
      return AZURE_DEFAULT_LOCALE[langId] ?? langId;
    case "aws-transcribe":
      return AWS_TRANSCRIBE_DEFAULT_LOCALE[langId] ?? langId;
    case "assemblyai":
      return langId;
    case "elevenlabs":
      return langId;
    case "sarvam":
      return SARVAM_DEFAULT_LOCALE[langId] ?? langId;
  }
}
