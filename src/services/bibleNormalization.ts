/**
 * Bible Books Mapping (English -> [French, Spanish, Portuguese])
 */
export const BIBLE_BOOKS_MAPPING: Record<string, string[]> = {
  // Old Testament
  "Genesis": ["Genèse", "Génesis", "Gênesis"],
  "Exodus": ["Exode", "Éxodo", "Êxodo"],
  "Leviticus": ["Lévitique", "Levítico", "Levítico"],
  "Numbers": ["Nombres", "Números", "Números"],
  "Deuteronomy": ["Deutéronome", "Deuteronomio", "Deuteronômio"],
  "Joshua": ["Josué", "Josué", "Josué"],
  "Judges": ["Juges", "Jueces", "Juízes"],
  "Ruth": ["Ruth", "Rut", "Rute"],
  "1 Samuel": ["1 Samuel", "1 Samuel", "1 Samuel"],
  "2 Samuel": ["2 Samuel", "2 Samuel", "2 Samuel"],
  "1 Kings": ["1 Rois", "1 Reyes", "1 Reis"],
  "2 Kings": ["2 Rois", "2 Reyes", "2 Reis"],
  "1 Chronicles": ["1 Chroniques", "1 Crónicas", "1 Crônicas"],
  "2 Chronicles": ["2 Chroniques", "2 Crónicas", "2 Crônicas"],
  "Ezra": ["Esdras", "Esdras", "Esdras"],
  "Nehemiah": ["Néhémie", "Nehemías", "Neemias"],
  "Esther": ["Esther", "Ester", "Ester"],
  "Job": ["Job", "Job", "Jó"],
  "Psalms": ["Psaumes", "Salmos", "Salmos"],
  "Proverbs": ["Proverbes", "Proverbios", "Provérbios"],
  "Ecclesiastes": ["Ecclésiaste", "Eclesiastés", "Eclesiastes"],
  "Song of Solomon": ["Cantique des Cantiques", "Cantares", "Cânticos"],
  "Isaiah": ["Ésaïe", "Isaías", "Isaías"],
  "Jeremiah": ["Jérémie", "Jeremías", "Jeremias"],
  "Lamentations": ["Lamentations", "Lamentaciones", "Lamentações"],
  "Ezekiel": ["Ézéchiel", "Ezequiel", "Ezequiel"],
  "Daniel": ["Daniel", "Daniel", "Daniel"],
  "Hosea": ["Osée", "Oseas", "Oseias"],
  "Joel": ["Joël", "Joel", "Joel"],
  "Amos": ["Amos", "Amós", "Amós"],
  "Obadiah": ["Abdias", "Abdías", "Obadias"],
  "Jonah": ["Jonas", "Jonás", "Jonas"],
  "Micah": ["Michée", "Miqueas", "Miqueias"],
  "Nahum": ["Nahum", "Nahúm", "Naum"],
  "Habakkuk": ["Habacuc", "Habacuc", "Habacuque"],
  "Zephaniah": ["Sophonie", "Sofonías", "Sofonias"],
  "Haggai": ["Aggée", "Hageo", "Ageu"],
  "Zechariah": ["Zacharie", "Zacarías", "Zacarias"],
  "Malachi": ["Malachie", "Malaquías", "Malaquias"],

  // New Testament
  "Matthew": ["Matthieu", "Mateo", "Mateus"],
  "Mark": ["Marc", "Marcos", "Marcos"],
  "Luke": ["Luc", "Lucas", "Lucas"],
  "John": ["Jean", "Juan", "João"],
  "Acts": ["Actes", "Hechos", "Atos"],
  "Romans": ["Romains", "Romanos", "Romanos"],
  "1 Corinthians": ["1 Corinthiens", "1 Corintios", "1 Coríntios"],
  "2 Corinthians": ["2 Corinthiens", "2 Corintios", "2 Coríntios"],
  "Galatians": ["Galates", "Gálatas", "Gálatas"],
  "Ephesians": ["Éphésiens", "Efesios", "Efésios"],
  "Philippians": ["Philippiens", "Filipenses", "Filipenses"],
  "Colossians": ["Colossiens", "Colosenses", "Colossenses"],
  "1 Thessalonians": ["1 Thessaloniciens", "1 Tesalonicenses", "1 Tessalonicenses"],
  "2 Thessalonians": ["2 Thessaloniciens", "2 Tesalonicenses", "2 Tessalonicenses"],
  "1 Timothy": ["1 Timothée", "1 Timoteo", "1 Timóteo"],
  "2 Timothy": ["2 Timothée", "2 Timoteo", "2 Timóteo"],
  "Titus": ["Tite", "Tito", "Tito"],
  "Philemon": ["Philémon", "Filemón", "Filemom"],
  "Hebrews": ["Hébreux", "Hebreos", "Hebreus"],
  "James": ["Jacques", "Santiago", "Tiago"],
  "1 Peter": ["1 Pierre", "1 Pedro", "1 Pedro"],
  "2 Peter": ["2 Pierre", "2 Pedro", "2 Pedro"],
  "1 John": ["1 Jean", "1 Juan", "1 João"],
  "2 John": ["2 Jean", "2 Juan", "2 João"],
  "3 John": ["3 Jean", "3 Juan", "3 João"],
  "Jude": ["Jude", "Judas", "Judas"],
  "Revelation": ["Apocalypse", "Apocalipsis", "Apocalipse"]
};

/**
 * Normalizes a Bible reference by converting French, Spanish, or Portuguese book names to English.
 * @param input The raw reference input (e.g., "Matthieu 5:3", "Mateo 5:3", or "Mateus 5:3")
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
