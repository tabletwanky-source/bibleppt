/**
 * Bible Books Mapping (English -> [French, Spanish])
 */
export const BIBLE_BOOKS_MAPPING: Record<string, string[]> = {
  // Old Testament
  "Genesis": ["Genèse", "Génesis"],
  "Exodus": ["Exode", "Éxodo"],
  "Leviticus": ["Lévitique", "Levítico"],
  "Numbers": ["Nombres", "Números"],
  "Deuteronomy": ["Deutéronome", "Deuteronomio"],
  "Joshua": ["Josué", "Josué"],
  "Judges": ["Juges", "Jueces"],
  "Ruth": ["Ruth", "Rut"],
  "1 Samuel": ["1 Samuel", "1 Samuel"],
  "2 Samuel": ["2 Samuel", "2 Samuel"],
  "1 Kings": ["1 Rois", "1 Reyes"],
  "2 Kings": ["2 Rois", "2 Reyes"],
  "1 Chronicles": ["1 Chroniques", "1 Crónicas"],
  "2 Chronicles": ["2 Chroniques", "2 Crónicas"],
  "Ezra": ["Esdras", "Esdras"],
  "Nehemiah": ["Néhémie", "Nehemías"],
  "Esther": ["Esther", "Ester"],
  "Job": ["Job", "Job"],
  "Psalms": ["Psaumes", "Salmos"],
  "Proverbs": ["Proverbes", "Proverbios"],
  "Ecclesiastes": ["Ecclésiaste", "Eclesiastés"],
  "Song of Solomon": ["Cantique des Cantiques", "Cantares"],
  "Isaiah": ["Ésaïe", "Isaías"],
  "Jeremiah": ["Jérémie", "Jeremías"],
  "Lamentations": ["Lamentations", "Lamentaciones"],
  "Ezekiel": ["Ézéchiel", "Ezequiel"],
  "Daniel": ["Daniel", "Daniel"],
  "Hosea": ["Osée", "Oseas"],
  "Joel": ["Joël", "Joel"],
  "Amos": ["Amos", "Amós"],
  "Obadiah": ["Abdias", "Abdías"],
  "Jonah": ["Jonas", "Jonás"],
  "Micah": ["Michée", "Miqueas"],
  "Nahum": ["Nahum", "Nahúm"],
  "Habakkuk": ["Habacuc", "Habacuc"],
  "Zephaniah": ["Sophonie", "Sofonías"],
  "Haggai": ["Aggée", "Hageo"],
  "Zechariah": ["Zacharie", "Zacarías"],
  "Malachi": ["Malachie", "Malaquías"],

  // New Testament
  "Matthew": ["Matthieu", "Mateo"],
  "Mark": ["Marc", "Marcos"],
  "Luke": ["Luc", "Lucas"],
  "John": ["Jean", "Juan"],
  "Acts": ["Actes", "Hechos"],
  "Romans": ["Romains", "Romanos"],
  "1 Corinthians": ["1 Corinthiens", "1 Corintios"],
  "2 Corinthians": ["2 Corinthiens", "2 Corintios"],
  "Galatians": ["Galates", "Gálatas"],
  "Ephesians": ["Éphésiens", "Efesios"],
  "Philippians": ["Philippiens", "Filipenses"],
  "Colossians": ["Colossiens", "Colosenses"],
  "1 Thessalonians": ["1 Thessaloniciens", "1 Tesalonicenses"],
  "2 Thessalonians": ["2 Thessaloniciens", "2 Tesalonicenses"],
  "1 Timothy": ["1 Timothée", "1 Timoteo"],
  "2 Timothy": ["2 Timothée", "2 Timoteo"],
  "Titus": ["Tite", "Tito"],
  "Philemon": ["Philémon", "Filemón"],
  "Hebrews": ["Hébreux", "Hebreos"],
  "James": ["Jacques", "Santiago"],
  "1 Peter": ["1 Pierre", "1 Pedro"],
  "2 Peter": ["2 Pierre", "2 Pedro"],
  "1 John": ["1 Jean", "1 Juan"],
  "2 John": ["2 Jean", "2 Juan"],
  "3 John": ["3 Jean", "3 Juan"],
  "Jude": ["Jude", "Judas"],
  "Revelation": ["Apocalypse", "Apocalipsis"]
};

/**
 * Normalizes a Bible reference by converting French or Spanish book names to English.
 * @param input The raw reference input (e.g., "Matthieu 5:3")
 * @returns The normalized English reference (e.g., "Matthew 5:3")
 */
export function normalizeBibleReference(input: string): string {
  if (!input) return input;
  
  const trimmedInput = input.trim();
  const lowerInput = trimmedInput.toLowerCase();

  for (const [english, translations] of Object.entries(BIBLE_BOOKS_MAPPING)) {
    // Check English name itself (case-insensitive)
    if (lowerInput.startsWith(english.toLowerCase())) {
       // It's already in English or starts with English name, but we might want to ensure standard casing
       // However, for simplicity and to avoid breaking ranges, we just return if it matches English
       // Actually, it's better to replace it to ensure standard English book name for the API
       const regex = new RegExp(`^${english}`, "i");
       if (regex.test(trimmedInput)) {
         const normalized = trimmedInput.replace(regex, english);
         console.log(`Normalized (EN): ${trimmedInput} -> ${normalized}`);
         return normalized;
       }
    }

    // Check translations
    for (const t of translations) {
      // Use word boundary or start of string to avoid partial matches (e.g. "Marc" matching "Marcos")
      // But since we use startsWith, we should be careful.
      // The user's suggested logic: if (lowerInput.startsWith(t.toLowerCase()))
      if (lowerInput.startsWith(t.toLowerCase())) {
        const regex = new RegExp(`^${t}`, "i");
        const normalized = trimmedInput.replace(regex, english);
        console.log(`Normalized: ${trimmedInput} -> ${normalized}`);
        return normalized;
      }
    }
  }

  return trimmedInput;
}
