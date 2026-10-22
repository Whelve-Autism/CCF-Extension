const searchHTML = `<!doctype html><html><head><meta charset="utf-8"><style>
body{font:14px Arial;margin:40px;background:white;color:#222} .gs_ri{margin:26px 0;max-width:760px}
h3{font-size:19px;font-weight:normal;margin:0 0 4px}a{color:#1a0dab}.gs_a{color:#006621}
</style></head><body><main id="gs_res_ccl_mid">
<div class="gs_ri" id="formal"><h3 class="gs_rt"><a href="https://arxiv.org/abs/1706.03762">Attention Is All You Need</a></h3><div class="gs_a">A Vaswani et al. - Advances in neural information …, 2017 - proceedings.neurips.cc</div><p>Formal publication metadata, with an arXiv download link.</p></div>
<div class="gs_ri" id="preprint"><h3 class="gs_rt"><a href="https://arxiv.org/abs/2601.1">ICML and NeurIPS in a preprint title</a></h3><div class="gs_a">A Author - arXiv preprint arXiv:2601.1, 2026 - arxiv.org</div></div>
<div class="gs_ri" id="journal"><h3 class="gs_rt"><a href="https://example.org/paper">A journal paper</a></h3><div class="gs_a">A Author - IEEE Trans. Pattern Anal. Mach. Intell., 2024 - ieeexplore.ieee.org</div></div>
<div class="gs_ri" id="ambiguous"><h3 class="gs_rt"><a href="https://example.org/ambiguous">Ambiguous publication metadata</a></h3><div class="gs_a">A Author - IEEE Transactions on …, 2024 - ieeexplore.ieee.org</div></div>
<div class="gs_ri" id="late"><h3 class="gs_rt"><a href="https://example.org/late">Late metadata</a></h3><div class="gs_a"></div></div>
<div class="gs_ri" id="findings"><h3 class="gs_rt"><a href="https://aclanthology.org/">A Findings paper</a></h3><div class="gs_a">A Author - Findings of the Association for Computational Linguistics: ACL, 2025 - aclanthology.org</div></div>
<div class="gs_ri" id="citation"><h3 class="gs_rt">[CITATION] A citation-only result</h3><div class="gs_a">A Author - ICPR, 2024</div></div>
</main></body></html>`;
const profileHTML = `<!doctype html><meta charset="utf-8"><table id="gsc_a_t"><tbody>
<tr class="gsc_a_tr" id="profile"><td class="gsc_a_t"><a class="gsc_a_at" href="/citations?view_op=view_citation">Profile paper</a><div class="gs_gray">ICML NeurIPS Author</div><div class="gs_gray">World Wide Web 27 (1), 1-12, 2024</div></td></tr>
</tbody></table><button id="gsc_bpf_more"><span>显示更多</span></button>`;

module.exports = { searchHTML, profileHTML };
