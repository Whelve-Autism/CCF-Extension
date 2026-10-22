/** Google Scholar search, author profiles and publication detail dialogs. */
const scholar = {};
scholar._started = false;
scholar._timer = null;
scholar._state = new WeakMap();
scholar._detailTitle = null;
scholar.badgeSelector = '[data-ccfrank-owned="true"]';
scholar.contentSelector =
  "#gs_res_ccl_mid, #gsc_a_t, tr.gsc_a_tr, #gsc_oci_table, #gsc_oci_title";

scholar.extractVenueFromGsA = function (text) {
  // Never match the title, authors, abstract, publisher or download URL.
  const parts = String(text || "")
    .replace(/\u00a0/g, " ")
    .split(/\s+[-–—]\s+/);
  if (parts.length < 2) return "";
  // Only discard a recognizable publisher/host suffix. Internal dashes may
  // belong to a venue name or introduce qualifiers such as Workshop/arXiv.
  const last = parts[parts.length - 1].trim();
  if (
    parts.length > 2 &&
    (/^(?:https?:\/\/)?(?:[\p{L}\d-]+\.)+[a-z]{2,}(?::\d+)?(?:\/\S*)?$/iu.test(
      last,
    ) ||
      /^(?:IEEE|ACM|Springer(?: Nature|Link)?|Elsevier|Wiley(?: Online Library)?|Taylor\s*(?:&|and)\s*Francis|Oxford University Press|Cambridge University Press|MIT Press|AAAI Press)$/i.test(
        last,
      ))
  )
    parts.pop();
  // Keep the entire publication segment. A leading year is part of a venue
  // label, and qualifiers after a year (Workshop, Findings, etc.) still matter.
  const source = parts.slice(1).join(" - ").trim();
  return /^\(?\s*(?:19|20)\d{2}\s*\)?$/.test(source) ? "" : source;
};

scholar.updateBadge = function (container, anchor, source) {
  const titleText = [...anchor.childNodes]
    .filter(
      (node) => !(node.nodeType === 1 && node.matches(scholar.badgeSelector)),
    )
    .map((node) => node.textContent)
    .join("");
  const signature =
    source + "\n" + titleText + "\n" + (anchor.getAttribute("href") || "");
  const previous = scholar._state.get(container);
  const heading = /^H[1-6]$/.test(anchor.tagName);
  const placed =
    previous?.badge?.isConnected &&
    (heading
      ? previous.badge.parentElement === anchor
      : previous.badge.previousElementSibling === anchor);
  if (
    previous &&
    previous.anchor === anchor &&
    previous.signature === signature &&
    (!previous.matched || placed)
  )
    return;
  // Each slot owns its badge directly. A detail dialog must never remove
  // badges belonging to search results/profiles sharing a broader parent.
  previous?.badge?.remove();
  const match = ccf.matchVenueName(source);
  const badge = match
    ? ccf.getRankSpan(match.refine, match.type, match.method)
    : null;
  if (badge) {
    if (heading) anchor.append(badge);
    else anchor.insertAdjacentElement("afterend", badge);
  }
  scholar._state.set(container, { signature, anchor, badge, matched: !!badge });
};

scholar.scan = function () {
  document
    .querySelectorAll("#gs_res_ccl_mid .gs_ri")
    .forEach(function (result) {
      const title = result.querySelector("h3.gs_rt, h3");
      const metadata = result.querySelector(".gs_a");
      if (!title) return;
      const anchor = title.querySelector("a") || title;
      scholar.updateBadge(
        result,
        anchor,
        scholar.extractVenueFromGsA(metadata?.textContent),
      );
    });
  document.querySelectorAll("tr.gsc_a_tr").forEach(function (row) {
    const anchor = row.querySelector(".gsc_a_at");
    if (!anchor) return;
    const metadata = row.querySelectorAll(".gsc_a_t .gs_gray");
    scholar.updateBadge(row, anchor, metadata[1]?.textContent.trim() || "");
  });
  const detail = document.getElementById("gsc_oci_table");
  const title = document.getElementById("gsc_oci_title");
  if (scholar._detailTitle && scholar._detailTitle !== title) {
    scholar._state.get(scholar._detailTitle)?.badge?.remove();
    scholar._state.delete(scholar._detailTitle);
  }
  scholar._detailTitle = title;
  if (title) {
    let source = "";
    for (const row of detail?.querySelectorAll(".gs_scl") || []) {
      const field = row.querySelector(".gsc_oci_field")?.textContent.trim();
      if (
        /^(?:journal|conference|publication|source|期刊|会议|出版物|来源)$/i.test(
          field || "",
        )
      ) {
        source = row.querySelector(".gsc_oci_value")?.textContent.trim() || "";
        break;
      }
    }
    scholar.updateBadge(title, title, source);
  }
};

scholar.scheduleScan = function () {
  if (scholar._timer !== null) return;
  scholar._timer = setTimeout(function () {
    scholar._timer = null;
    scholar.scan();
  }, 100);
};

scholar.isOwnMutation = function (record) {
  const target =
    record.target.nodeType === 1 ? record.target : record.target.parentElement;
  if (target?.closest(scholar.badgeSelector)) return true;
  if (record.type !== "childList") return false;
  const nodes = [...record.addedNodes, ...record.removedNodes];
  return (
    record.removedNodes.length === 0 &&
    nodes.length > 0 &&
    nodes.every(
      (node) => node.nodeType === 1 && node.matches(scholar.badgeSelector),
    )
  );
};

scholar.isRelevantMutation = function (record) {
  if (scholar.isOwnMutation(record)) return false;
  const target =
    record.target.nodeType === 1 ? record.target : record.target.parentElement;
  if (target?.closest(scholar.contentSelector)) return true;
  if (record.type !== "childList") return false;
  return [...record.addedNodes, ...record.removedNodes].some(
    (node) =>
      node.nodeType === 1 &&
      (node.matches(scholar.badgeSelector) ||
        node.matches(scholar.contentSelector) ||
        node.querySelector(scholar.contentSelector)),
  );
};

scholar.run = function () {
  if (scholar._started) {
    scholar.scheduleScan();
    return;
  }
  scholar._started = true;
  scholar._observer = new MutationObserver(function (records) {
    if (records.some(scholar.isRelevantMutation)) scholar.scheduleScan();
  });
  scholar._observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["href", "class", "id"],
  });
  window.addEventListener("scroll", scholar.scheduleScan, { passive: true });
  window.addEventListener("pageshow", scholar.scheduleScan);
  window.addEventListener("popstate", scholar.scheduleScan);
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) scholar.scheduleScan();
  });
  scholar.scan();
};
