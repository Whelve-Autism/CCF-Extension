const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json")));
const context = vm.createContext({});
for (const file of manifest.content_scripts[0].js.filter(
  (file) => file !== "script.js",
)) {
  vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, {
    filename: file,
  });
}
const ccf = vm.runInContext("ccf", context);
const scholar = vm.runInContext("scholar", context);

const ranked = [
  ["NeurIPS", "A"],
  ["NIPS", "A"],
  ["ICLR 2026", "A"],
  ["ICML’23", "A"],
  ["KDD", "A"],
  ["IJCAI", "B"],
  ["AAAI", "A"],
  ["ICPR", "C"],
  ["IEEE INFOCOM 2026-IEEE Conference on Computer Communications, 1-10", "A"],
  ["IEEE INFOCOM", "A"],
  ["IEEE Conference on Computer Communications", "A"],
  ["IEEE INFOCOM 2026 — IEEE Conference on Computer Communications", "A"],
  ["IEEE INFOCOM 2026: IEEE Conference on Computer Communications", "A"],
  ["IEEE INFOCOM 2026 – IEEE Conf. on Comput. Commun.", "A"],
  ["IEEE INFOCOM 2026 - IEEE Conference on Computer Commun…", "A"],
  ["IEEE Conference on Computer Communications (IEEE INFOCOM 2026)", "A"],
  ["IEEE INFOCOM 2026 (IEEE Conference on Computer Communications)", "A"],
  ["Proceedings of IEEE INFOCOM 2026 - IEEE Conference on Computer Communications", "A"],
  ["ICWS 2019 - IEEE International Conference on Web Services", "B"],
  ["IEEE International Conference on Web Services - ICWS 2019", "B"],
  ["ICWS: IEEE Int. Conf. on Web Services", "B"],
  ["IEEE ICWS 2019-IEEE International Conference on Web Services, 1-8", "B"],
  ["ACM MobiCom 2026-ACM International Conference on Mobile Computing and Networking", "A"],
  ["IEEE/ACM MICRO 2026-IEEE/ACM International Symposium on Microarchitecture", "A"],
  ["WWW 2026 - The Web Conference", "A"],
  ["Proceedings of the 51st International Conference on Parallel Processing", "B"],
  ["Proc of the 51st International Conference on Parallel Processing", "B"],
  ["In Proceedings of the 51st International Conference on Parallel Processing", "B"],
  ["In: Proc. of the 51st International Conference on Parallel Processing", "B"],
  ["Proceedings of the Fifty-First International Conference on Parallel Processing", "B"],
  ["Proceedings of the Fifty First International Conference on Parallel Processing", "B"],
  ["Proceedings of the Fifty‑First International Conference on Parallel Processing", "B"],
  ["Proceedings of the 51 st International Conference on Parallel Processing", "B"],
  ["Proceedings of the 51st International Conference on Parallel Processing (ICPP '22)", "B"],
  ["2019 IEEE International Conference on Web Services", "B"],
  ["IEEE 2019 International Conference on Web Services", "B"],
  [
    "Proceedings of the 2019 IEEE International Conference on Web Services",
    "B",
  ],
  ["2019 IEEE 26th International Conference on Web Services (ICWS)", "B"],
  ["IEEE International Conference on Web Services (ICWS 2019)", "B"],
  ["IEEE International Conference on Web Services 2019, pp. 1–8", "B"],
  ["ICWS2019", "B"],
  ["ICWS-2019", "B"],
  ["ICWS (2019)", "B"],
  ["2019 IEEE International Conference on Web Services, 1-8", "B"],
  ["2019 IEEE Int. Conf. on Web Services", "B"],
  ["Advances in neural information processing systems 30", "A"],
  ["Proceedings of the 40th International Conference on Machine Learning", "A"],
  [
    "2025 IEEE/CVF Conference on Computer Vision and Pattern Recognition (CVPR)",
    "A",
  ],
  [
    "Proceedings of the AAAI Conference on Artificial Intelligence 38 (12), 123-129",
    "A",
  ],
  ["Int. Conf. Mach. Learn.", "A"],
  ["Int Conf Mach Learn", "A"],
  ["IEEE Trans Neural Netw Learn Syst", "B"],
  ["IEEE Trans. Pattern Anal. Mach. Intell.", "A"],
  ["IEEE Trans. on Knowl. and Data Eng.", "A"],
  ["J. Mach. Learn. Res.", "A"],
  ["Int. J. Comput. Vis.", "A"],
  ["Advances in neural information …", "A"],
  ["IEEE transactions on pattern analysis and …", "A"],
  ["IEEE transactions on pattern … intelligence", "A"],
  [
    "Proceedings of the IEEE/CVF conference on computer vision and pattern …",
    "A",
  ],
  ["The Web Conference", "A"],
  ["World Wide Web", "B"],
  ["Computer Supported Cooperative Work", "B"],
  [
    "ACM Conference On Computer-Supported Cooperative Work And Social Computing",
    "A",
  ],
  ["ASRU", "C"],
  ["Automatic Speech Recognition and Understanding Workshop", "C"],
  ["IEEE/ACM Transactions on Networking", "A"],
  ["IEEE/ACM Transactions on Audio, Speech and Language Processing", "B"],
  ["Information Retrieval Journal", "C"],
  ["IR", "C"],
  ["IEEE Virtual Reality", "A"],
  ["CASA", "C"],
  ["International Conference on Computer Animation and Social Agents", "C"],
  ["FITEE", "C"],
  ["Frontiers of Information Technology & Electronic Engineering", "C"],
  ["RTA", "C"],
  ["International World Wide Web Conference", "A"],
  ["VLDB Journal", "A"],
  ["The Journal of Strategic Information Systems", "C"],
];
for (const [source, rank] of ranked) {
  test("recognizes " + source, () => {
    assert.equal(ccf.matchVenueName(source)?.rank, rank);
  });
}

const unranked = [
  "",
  "arXiv",
  "arXiv preprint arXiv:2601.01234",
  "arXiv preprint (ICML)",
  "NeurIPS arXiv preprint",
  "CoRR abs/2601.12345",
  "bioRxiv",
  "SSRN",
  "ICLR under review",
  "ICML Workshop",
  "NeurIPS 2025 Workshop on Agents",
  "Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition Workshops",
  "Findings of the Association for Computational Linguistics: ACL 2025",
  "ACL Findings",
  "CHI Extended Abstracts",
  "CVPR Companion",
  "AAAI Short Papers",
  "A survey of ICML and NeurIPS",
  "An unrelated CVPR method",
  "International Conference on Machine Learning and Applications",
  "Journal of Machine Learning Research and Applications",
  "Nature",
  "IEEE Access",
  "IEEE Transactions on …",
  "International Conference on …",
  "Proceedings of the …",
  "ICML…",
  "IEEE transactions on pattern analysis and … Workshops",
  "TCC",
  "FSE",
  "CSCW",
  "WWW",
  "CC",
  "SEC",
  "Computational Visual Media",
  "International Conference on Machine Learning (ICLR)",
  "2019 IEEE International Conference on Web Services Workshops",
  "IEEE International Conference on Web Services (2019 ICWS Workshop)",
  "ICWS, 2019, Companion",
  "ICWS, 2019, arXiv preprint",
  "2019 Unknown International Conference on Web Services",
  "ICWS2019 and ICML2019",
  "Proceedings of the Fifty-First International Conference on Parallel Processing Companion",
  "In Proceedings of the 51st International Conference on Parallel Processing Workshops",
  "Proc of the 51st International Conference on Parallel Processing - arXiv preprint",
  "Proceedings of the 51st International Conference on Parallel Processing and Applications",
  "Proceedings of the 51st Unknown International Conference on Parallel Processing",
  "Workshop Proceedings of the 51st International Conference on Parallel Processing",
  "Proceedings of the 51st International Conference on Parallel Processing (ICML)",
  "IEEE INFOCOM 2026-IEEE Conference on Computer Communications Workshops, 1-10",
  "IEEE INFOCOM 2026-IEEE Conference on Computer Communications - Workshop",
  "IEEE INFOCOM 2026-IEEE Conference on Computer Communications, arXiv preprint",
  "IEEE INFOCOM 2026-IEEE Conference on Computer Communications Companion",
  "IEEE INFOCOM 2026 - IEEE International Conference on Web Services",
  "ICML 2026 - IEEE Conference on Computer Communications",
  "IEEE INFOCOM 2026 - Computer Communications",
  "IEEE INFOCOM 2026 - IEEE International Conference on Computer Communications and Networks",
  "IEEE INFOCOM 2026 - IEEE Conference on Computer Communications and Applications",
  "IEEE INFOCOM 2026 - Some unknown publication",
  "An INFOCOM paper - IEEE Conference on Computer Communications",
  "INFOCOM - IEEE Conference on Computer Communications - ICML",
  "IEEE Conference on Computer Communications (ICML)",
  "IEEE INFOCOM - IEEE Conference on …",
  "Unknown INFOCOM - IEEE Conference on Computer Communications",
  "IEEE ICML - International Conference on Machine Learning",
  "IEEE Conference on Computer …",
  "IEEE INFOCOM 2026 - IEEE Conference on Computer …",
  "IEEE Conf. on Comput. …",
];
for (const source of unranked) {
  test("withholds " + (source || "empty source"), () => {
    assert.equal(ccf.matchVenueName(source), null);
  });
}

test("reads only Scholar's source segment", () => {
  assert.equal(
    scholar.extractVenueFromGsA(
      "ICML Smith, A NeurIPS - arXiv preprint arXiv:2601.1, 2026 - arxiv.org",
    ),
    "arXiv preprint arXiv:2601.1, 2026",
  );
  assert.equal(
    scholar.extractVenueFromGsA(
      "A Smith-Jones - NeurIPS, 2025 - proceedings.neurips.cc",
    ),
    "NeurIPS, 2025",
  );
  assert.equal(
    scholar.extractVenueFromGsA(
      "A Smith – Advances in neural information …, 2025 – proceedings.neurips.cc",
    ),
    "Advances in neural information …, 2025",
  );
  assert.equal(scholar.extractVenueFromGsA("A Smith - 2025 - arxiv.org"), "");
});

test("Scholar keeps leading years and post-year qualifiers in the source", () => {
  const source = scholar.extractVenueFromGsA(
    "A Author - 2019 IEEE International Conference on Web Services, 2019 - ieeexplore.ieee.org",
  );
  assert.equal(
    source,
    "2019 IEEE International Conference on Web Services, 2019",
  );
  assert.equal(ccf.matchVenueName(source)?.rank, "B");
  for (const qualifier of [
    "Workshop",
    "Findings",
    "Companion",
    "arXiv preprint",
  ]) {
    const source = scholar.extractVenueFromGsA(
      `A Author - ICML, 2019, ${qualifier} - example.org`,
    );
    assert.ok(source.includes(qualifier));
    assert.equal(ccf.matchVenueName(source), null);
  }
});

test("Scholar preserves hyphenated venue names and additional source segments", () => {
  const publication = scholar.extractVenueFromGsA(
    "A Author - Software - Practice and Experience, 2024 - Wiley",
  );
  assert.equal(publication, "Software - Practice and Experience, 2024");
  assert.equal(ccf.matchVenueName(publication)?.rank, "B");
  for (const source of [
    "A Author - ICML - Workshop, 2024 - example.org",
    "A Author - ICML - Workshop, 2024",
    "A Author - ICML - arXiv preprint, 2024 - arxiv.org",
    "A Author - ACL - Findings, 2024 - aclanthology.org",
  ]) {
    assert.equal(
      ccf.matchVenueName(scholar.extractVenueFromGsA(source)),
      null,
      source,
    );
  }
  assert.equal(
    ccf.matchVenueName(
      scholar.extractVenueFromGsA("A Author - ICWS, 2019 - IEEE"),
    )?.rank,
    "B",
  );
});

test("conference year decorations preserve the current catalog entry", () => {
  let checked = 0;
  for (const [url, rank, abbr, full] of ccf.catalogEntries) {
    if (!url.startsWith("/conf/")) continue;
    const current = ccf.matchVenueName(full);
    if (!current) continue;
    for (const decorated of [
      `1999 ${full}`,
      `2019 ${full}`,
      `${full}, 2019`,
      `${full} (2019)`,
      `${full} [2019]`,
      `Proceedings of the 2019 ${full}`,
      `2019 19th ${full}`,
      `${full} 2019, pp. 1–8`,
      `2019 ${full}, 1–8`,
    ]) {
      const result = ccf.matchVenueName(decorated);
      assert.equal(result?.refine, current.refine, decorated);
      assert.equal(result?.rank, current.rank, decorated);
      checked++;
    }
  }
  assert.ok(checked > 2000);
});

test("proceedings prefixes and edition counters preserve the complete venue identity", () => {
  let checked = 0;
  for (const [url, rank, abbr, full] of ccf.catalogEntries) {
    if (!url.startsWith("/conf/")) continue;
    const current = ccf.matchVenueName(full);
    if (!current) continue;
    for (const decorated of [
      `Proceedings of the 51st ${full}`,
      `Proc of the 51st ${full}`,
      `In Proceedings of the 51st ${full}`,
      `In: Proc. of the 51st ${full}`,
      `Proceedings of the Fifty-First ${full}`,
      `Proceedings of the Thirty Second ${full}`,
      `Proceedings of the 51 st ${full}`,
    ]) {
      assert.equal(ccf.matchVenueName(decorated)?.refine, current.refine, decorated);
      checked++;
    }
    for (const suffix of ["Companion", "Workshop", "Findings", "arXiv preprint"]) {
      const decorated = `Proceedings of the Fifty-First ${full} - ${suffix}`;
      assert.equal(ccf.matchVenueName(decorated), null, decorated);
      checked++;
    }
  }
  assert.ok(checked > 3000);
});

test("paired conference names require agreement across the complete catalog", () => {
  const index = ccf.ensureVenueIndex();
  let checked = 0;
  for (const [url, rank, abbr, full] of ccf.catalogEntries) {
    if (!url.startsWith("/conf/") || !abbr) continue;
    const current = ccf.matchVenueName(full);
    if (!current || !index.byName.get(ccf.normalizeVenueName(abbr))?.has(index.byUrl.get(url)))
      continue;
    const qualified = full.match(/^((?:IEEE|ACM)(?:\/[A-Z]+)?)\s+/);
    const short = qualified && !/^(?:IEEE|ACM)\b/.test(abbr)
      ? qualified[1] + " " + abbr
      : abbr;
    for (const decorated of [
      `${abbr} 2026-${full}, 1-10`,
      `${full} - ${abbr} 2019`,
      `${abbr}: ${full}`,
      `${full} (${abbr} 2026)`,
      `${short} 2026-${full}`,
    ]) {
      assert.equal(ccf.matchVenueName(decorated)?.refine, current.refine, decorated);
      checked++;
    }
    for (const suffix of ["Workshop", "Companion", "Findings", "arXiv preprint", "and Unknown Applications"]) {
      const decorated = `${short} 2026-${full} ${suffix}`;
      assert.equal(ccf.matchVenueName(decorated), null, decorated);
      checked++;
    }
    const other = current.refine === "/conf/icml/icml" ? "INFOCOM" : "ICML";
    assert.equal(ccf.matchVenueName(`${other} 2026 - ${full}`), null, full);
    checked++;
  }
  assert.ok(checked > 3000);
});

test("all packaged scripts and styles exist; only Scholar can receive them", () => {
  assert.equal(manifest.content_scripts.length, 1);
  const content = manifest.content_scripts[0];
  assert.ok(content.matches.length > 0);
  assert.ok(
    content.matches.every((pattern) =>
      /^https:\/\/scholar\.google\.[a-z.]+\/\*$/.test(pattern),
    ),
  );
  assert.equal(manifest.host_permissions, undefined);
  assert.equal(manifest.permissions, undefined);
  for (const file of [...content.js, ...content.css])
    assert.ok(fs.existsSync(path.join(root, file)), file);
  assert.ok(
    !content.js.some((file) =>
      /fetchRank|apiCache|google\.js|filter|jquery/.test(file),
    ),
  );
});

test("the runtime guard rejects ordinary Google and other scholarly sites", () => {
  for (const hostname of [
    "www.google.com",
    "dblp.org",
    "arxiv.org",
    "scholar.google.com.evil.test",
    "semanticscholar.org",
  ]) {
    let runs = 0;
    vm.runInNewContext(fs.readFileSync(path.join(root, "script.js"), "utf8"), {
      window: { location: { hostname } },
      scholar: {
        run() {
          runs++;
        },
      },
    });
    assert.equal(runs, 0, hostname);
  }
});

test("generated data contains only A/B/C; preprints cannot produce a rank", () => {
  assert.ok(ccf.catalogEntries.every(([, rank]) => /^[ABC]$/.test(rank)));
  assert.ok(!ccf.catalogEntries.some(([url]) => url === "/journals/corr/corr"));
  assert.equal(ccf.getRankInfo("/journals/corr/corr", "url").ranks.length, 0);
});

test("every alias targets a catalog entry", () => {
  const index = ccf.ensureVenueIndex();
  for (const url of Object.keys(ccf.venueAliases))
    assert.ok(index.byUrl.has(url), url);
});

test("the portable package needs no localization files or installed dependencies", () => {
  assert.equal(manifest.default_locale, undefined);
  assert.ok(!JSON.stringify(manifest).includes("__MSG_"));
  assert.ok(!fs.existsSync(path.join(root, "_locales")));
  const pkg = JSON.parse(
    fs.readFileSync(path.join(root, "package.json"), "utf8"),
  );
  assert.equal(pkg.dependencies, undefined);
  assert.equal(pkg.devDependencies, undefined);
  for (const icon of Object.values(manifest.icons))
    assert.ok(fs.existsSync(path.join(root, icon)));
});
