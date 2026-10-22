/**
 * MIT License
 * Copyright (c) 2019-2023 WenyanLiu, Kai Chen, dozed
 * Local, conservative venue matching for Google Scholar.
 */
const ccf = {};

ccf.catalogYear = 2026;
ccf._venueIndex = null;
ccf._matchCache = new Map();

ccf.normalizeVenueName = function (value) {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/&amp;/g, " and ")
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
};

// Only publication metadata is eligible. An arXiv PDF link does not override
// an explicitly named formal publication venue in Scholar's source line.
ccf.isExcludedPublication = function (value) {
  return /\b(?:arxiv|biorxiv|medrxiv|chemrxiv|techrxiv|ssrn|corr|preprints?|unpublished|submitted|under\s+review|working\s+papers?|technical\s+reports?|research\s+square|findings|companion|adjunct|extended\s+abstracts?|short\s+papers?|demo(?:nstration)?\s+papers?|doctoral\s+consortium|poster\s+(?:session|track)|industry\s+track|tutorials?)\b/i.test(
    String(value || ""),
  );
};

ccf.ensureVenueIndex = function () {
  if (ccf._venueIndex) return ccf._venueIndex;
  const byName = new Map();
  const byUrl = new Map();
  const entries = new Map();
  const names = [];

  function addName(name, entry, isAbbreviation) {
    const normalized = ccf.normalizeVenueName(name);
    if (!normalized) return;
    if (!byName.has(normalized)) byName.set(normalized, new Set());
    byName.get(normalized).add(entry);
    // A leading English article is optional in many journal source labels.
    if (!isAbbreviation && normalized.startsWith("the ")) {
      const withoutArticle = normalized.slice(4);
      if (!byName.has(withoutArticle)) byName.set(withoutArticle, new Set());
      byName.get(withoutArticle).add(entry);
    }
    if (
      !isAbbreviation &&
      !names.some((n) => n.name === normalized && n.entry === entry)
    ) {
      names.push({
        name: normalized,
        entry,
        words: ccf.significantWords(name),
      });
    }
  }

  (ccf.catalogEntries || []).forEach(function ([url, rank, abbr, full]) {
    if (!/^[ABC]$/.test(rank)) return;
    if (!full || ccf.isExcludedPublication(full)) return;
    // Multiple DBLP URLs can refer to the same catalog entry. Different full
    // names or ranks remain separate, even when they share an acronym.
    const key = rank + ":" + ccf.normalizeVenueName(full);
    if (!entries.has(key)) {
      entries.set(key, {
        refine: url,
        type: "url",
        rank,
        name: full,
        abbr: abbr || "",
      });
    }
    const entry = entries.get(key);
    byUrl.set(url, entry);
    addName(full, entry, false);
    addName(abbr, entry, true);
  });

  Object.entries(ccf.venueAliases || {}).forEach(function ([url, aliases]) {
    const entry = byUrl.get(url);
    if (!entry) return;
    aliases.forEach((alias) => addName(alias, entry, false));
  });
  ccf._venueIndex = { byName, byUrl, names };
  return ccf._venueIndex;
};

ccf.stripYearDecorations = function (value) {
  // All papers use the bundled 2026 catalog. Years identify a conference
  // edition, never a historical rank; preserve every nonnumeric qualifier.
  return value
    .replace(/([a-z])(?:19|20)\d{2}\b/gi, "$1")
    .replace(/\b(?:19|20)\d{2}\b/g, " ")
    .replace(/\b([a-z][a-z0-9&+\-/]*)\s*['’′]\s*\d{2}\b/gi, "$1")
    .replace(/\b\d+\s*(?:st|nd|rd|th)\b/gi, " ")
    .replace(/\(\s*\)|\[\s*\]/g, " ")
    .replace(/[,;](?:\s*[,;])+/g, ",")
    .replace(/^[\s,;:'’′–—-]+|[\s,;:'’′–—-]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

// Only remove known publication wrappers and edition counters at the front.
// Never search for a conference name inside arbitrary title/qualifier text.
ccf.editionPrefix = new RegExp(
  "^(?:the\\s+)?(?:" +
    "\\d+\\s*(?:st|nd|rd|th)|" +
    "(?:twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)[\\s\\u2010-\\u2015-]+(?:first|second|third|fourth|fifth|sixth|seventh|eighth|ninth)|" +
    "first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|thirteenth|fourteenth|fifteenth|sixteenth|seventeenth|eighteenth|nineteenth|twentieth|thirtieth|fortieth|fiftieth|sixtieth|seventieth|eightieth|ninetieth|hundredth" +
    ")\\s+",
  "i",
);

ccf.stripProceedingsPrefix = function (value) {
  let name = value.trim();
  for (let i = 0; i < 2; i++) {
    name = name
      .replace(/^(?:in(?:\s*:\s*|\s+))?(?:proceedings|proc)\.?\s+(?:of\s+)?(?:the\s+)?/i, "")
      .replace(ccf.editionPrefix, "")
      .trim();
  }
  return name;
};

ccf.venueNameVariants = function (raw) {
  const variants = new Set();
  let value = String(raw || "")
    .normalize("NFKC")
    .replace(/\u00a0/g, " ")
    .trim();
  if (!value) return [];
  variants.add(value);
  // Remove recognizable bibliographic suffixes, never arbitrary words.
  value = value
    .replace(/(?:,\s*|\s+)(?:pp?\.?|pages)\s*\d+(?:\s*[-–—]\s*\d+)?\s*$/i, "")
    .replace(
      /\s*[,;]\s*(?:vol\.?\s*)?\d+(?:\s*\(\d+\))?(?:\s*[-–—]\s*\d+)?(?:\s*[,;:]\s*\d+(?:\s*[-–—]\s*\d+)?)?(?:\s*[,;]\s*(?:19|20)\d{2})?\s*$/i,
      "",
    )
    .replace(
      /\s*[,;]?\s*\(?\b(?:19|20)\d{2}\)?(?:\s*[,;:]\s*\d+(?:\s*[-–]\s*\d+)?)?\s*$/,
      "",
    )
    .trim();
  variants.add(value);
  variants.add(
    value
      .replace(
        /\s+\d+(?:\s*\(\d+\))?(?:\s*[,;:]\s*\d+(?:\s*[-–]\s*\d+)?)?\s*$/,
        "",
      )
      .trim(),
  );
  for (const item of [...variants])
    variants.add(ccf.stripYearDecorations(item));
  for (const item of [...variants]) {
    const withoutYear = item.replace(/^(?:19|20)\d{2}\s+/, "");
    variants.add(withoutYear);
    variants.add(ccf.stripProceedingsPrefix(withoutYear));
  }
  for (const item of [...variants]) {
    variants.add(item.replace(/^the\s+/i, ""));
    variants.add(
      item
        .replace(/^(?:19|20)\d{2}\s+/, "")
        .replace(/^\d+(?:st|nd|rd|th)\s+/i, ""),
    );
    variants.add(item.replace(/\s*['’′]\s*\d{2}\s*$/, ""));
  }
  return [...variants].filter(Boolean);
};

ccf.significantWords = function (value) {
  return ccf
    .normalizeVenueName(value)
    .split(" ")
    .filter(
      (word) =>
        word && !/^(?:a|an|the|of|on|and|for|in|to|at|with)$/.test(word),
    );
};

ccf.matchVenueName = function (raw) {
  const cacheKey = String(raw || "").trim();
  if (!cacheKey || ccf.isExcludedPublication(cacheKey)) return null;
  if (ccf._matchCache.has(cacheKey)) return ccf._matchCache.get(cacheKey);
  const index = ccf.ensureVenueIndex();
  const variants = ccf.venueNameVariants(cacheKey);
  const hasEllipsis = /…|\.{3}/.test(cacheKey);
  const candidates = new Set();
  let method = "exact";

  function collectExact(value) {
    const matches = index.byName.get(ccf.normalizeVenueName(value));
    if (matches) for (const entry of matches) candidates.add(entry);
  }

  if (!hasEllipsis) {
    variants.forEach(collectExact);
    // Both names must identify the same entry; never blindly discard a suffix.
    for (const value of variants) {
      const suffix = value.match(/^(.*?)\s*\(([\w &+\-/]+)\)\s*$/);
      if (!suffix) continue;
      const left = index.byName.get(ccf.normalizeVenueName(suffix[1]));
      const right = index.byName.get(ccf.normalizeVenueName(suffix[2]));
      if (left && right)
        for (const entry of left) if (right.has(entry)) candidates.add(entry);
    }
  }

  // Workshops explicitly listed in CCF can match above. Added workshop/track
  // qualifiers must never inherit the parent conference rank.
  const restricted =
    /\b(?:workshops?|symposia|posters?|demos?|demonstrations?|tracks?)\b/i.test(
      cacheKey,
    );
  if (candidates.size === 0 && !restricted) {
    if (hasEllipsis) {
      method = "truncated";
      for (const value of variants) {
        const parts = value.split(/…|\.{3}/);
        if (parts.length !== 2) continue;
        const head = ccf.significantWords(parts[0]);
        const tail = ccf.significantWords(parts[1]);
        // Bare acronyms and generic 'IEEE Transactions on …' are insufficient.
        if (head.length < 3 || head.join(" ").length < 18) continue;
        for (const name of index.names) {
          const words = name.words;
          if (head.length + tail.length > words.length) continue;
          if ((head.length + tail.length) / words.length < 0.6) continue;
          const prefix = head.every(
            (word, i) =>
              word === words[i] ||
              (word.length >= 3 && words[i].startsWith(word)),
          );
          const suffix = tail.every(
            (word, i) => word === words[words.length - tail.length + i],
          );
          if (prefix && suffix) candidates.add(name.entry);
        }
      }
    } else {
      method = "abbreviated";
      // Whole word sequences only; no substring or edit-distance matching.
      for (const value of variants) {
        const visible = ccf.significantWords(value);
        if (visible.length < 3) continue;
        for (const name of index.names) {
          const words = name.words;
          if (visible.length !== words.length) continue;
          if (!visible.some((word, i) => word !== words[i])) continue;
          if (
            visible.every(
              (word, i) =>
                word === words[i] ||
                (word.length >= 3 && words[i].startsWith(word)),
            )
          ) {
            candidates.add(name.entry);
          }
        }
      }
    }
  }

  const result =
    candidates.size === 1 ? { ...[...candidates][0], method } : null;
  if (ccf._matchCache.size >= 1000) ccf._matchCache.clear();
  ccf._matchCache.set(cacheKey, result);
  return result;
};

ccf.isRankedVenue = function (match) {
  return (
    !!match &&
    /^[ABC]$/.test(ccf.getRankInfo(match.refine, match.type).ranks[0])
  );
};

ccf.getRankInfo = function (refine, type) {
  const index = ccf.ensureVenueIndex();
  let entry;
  if (type === "url") entry = index.byUrl.get(refine);
  else {
    const entries = index.byName.get(ccf.normalizeVenueName(refine));
    if (entries && entries.size === 1) entry = [...entries][0];
  }
  return entry
    ? {
        ranks: [entry.rank],
        info:
          entry.name +
          (entry.abbr ? " (" + entry.abbr + ")" : "") +
          ": CCF " +
          entry.rank,
      }
    : { ranks: [], info: "" };
};

ccf.getRankSpan = function (refine, type, method) {
  const info = ccf.getRankInfo(refine, type);
  if (!/^[ABC]$/.test(info.ranks[0])) return null;
  const span = document.createElement("span");
  span.className = "ccf-rank ccf-" + info.ranks[0].toLowerCase();
  span.dataset.ccfrankOwned = "true";
  span.textContent = "CCF " + info.ranks[0];
  const basis =
    method === "truncated"
      ? "；截断名称在目录中的唯一匹配"
      : method === "abbreviated"
        ? "；单词简写唯一匹配"
        : "";
  span.title = "CCF " + ccf.catalogYear + "（第七版）\n" + info.info + basis;
  span.setAttribute("aria-label", span.textContent + "，" + info.info);
  return span;
};
