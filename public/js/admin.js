// ===== Datadog Quest Admin =====

const Admin = {
  data: { categories: { ja: {}, en: {} }, questions: [] },
  filtered: [],
  editing: null, // null=add, or id when editing

  async init() {
    this.bind();
    await this.load();
  },

  bind() {
    document.getElementById('btn-new').addEventListener('click', () => this.openEdit(null));
    document.getElementById('btn-cancel').addEventListener('click', () => this.closeModal());
    document.getElementById('modal-close').addEventListener('click', () => this.closeModal());
    document.getElementById('btn-save').addEventListener('click', () => this.save());
    document.getElementById('btn-delete').addEventListener('click', () => this.deleteCurrent());

    document.getElementById('search').addEventListener('input', () => this.applyFilters());
    document.getElementById('filter-category').addEventListener('change', () => this.applyFilters());
    document.getElementById('filter-level').addEventListener('change', () => this.applyFilters());

    document.getElementById('modal').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) this.closeModal();
    });
  },

  async load() {
    try {
      const res = await fetch('/api/admin/questions');
      if (res.status === 401) {
        location.reload();
        return;
      }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert('読み込み失敗: ' + (j.error || res.status));
        return;
      }
      this.data = await res.json();
      this.populateCategoryFilter();
      this.applyFilters();
      this.renderStats();
    } catch (e) {
      alert('Fetch error: ' + e.message);
    }
  },

  populateCategoryFilter() {
    const sel = document.getElementById('filter-category');
    sel.innerHTML = '<option value="">全カテゴリ</option>';
    Object.entries(this.data.categories.ja || {}).forEach(([key, label]) => {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = label;
      sel.appendChild(opt);
    });
  },

  applyFilters() {
    const q = document.getElementById('search').value.toLowerCase().trim();
    const cat = document.getElementById('filter-category').value;
    const lv = document.getElementById('filter-level').value;

    this.filtered = this.data.questions.filter(item => {
      if (cat && item.category !== cat) return false;
      if (lv && String(item.level) !== lv) return false;
      if (q) {
        const hay = [
          item.id, item.ja.question, item.ja.explanation,
          ...(item.ja.choices || []),
          item.en?.question || '', item.en?.explanation || '',
          ...((item.en?.choices) || [])
        ].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    this.renderTable();
  },

  renderStats() {
    const total = this.data.questions.length;
    const byLv = { 1: 0, 2: 0, 3: 0 };
    const byCat = {};
    let withEn = 0;
    this.data.questions.forEach(q => {
      byLv[q.level] = (byLv[q.level] || 0) + 1;
      byCat[q.category] = (byCat[q.category] || 0) + 1;
      if (q.en) withEn++;
    });
    const el = document.getElementById('stats');
    el.innerHTML =
      `<strong>${total}</strong> 問 ` +
      `(Lv1: ${byLv[1]||0} / Lv2: ${byLv[2]||0} / Lv3: ${byLv[3]||0}) ` +
      `· 英訳あり: <strong>${withEn}</strong>`;
  },

  renderTable() {
    const tb = document.getElementById('q-tbody');
    if (this.filtered.length === 0) {
      tb.innerHTML = '<tr><td colspan="7" class="empty">該当する問題なし</td></tr>';
      return;
    }
    tb.innerHTML = '';
    this.filtered.forEach(item => {
      const tr = document.createElement('tr');
      const excerpt = (item.ja.question || '').slice(0, 60) + (item.ja.question.length > 60 ? '...' : '');
      const catLabel = this.data.categories.ja[item.category] || item.category;
      tr.innerHTML =
        `<td class="col-id">${esc(item.id)}</td>` +
        `<td><span class="col-cat">${esc(catLabel)}</span></td>` +
        `<td><span class="col-lv lv${item.level}">Lv${item.level}</span></td>` +
        `<td>${esc(excerpt)}</td>` +
        `<td class="${item.en ? 'col-en-yes' : 'col-en-no'}">${item.en ? '✓' : '×'}</td>` +
        `<td>${item.answer}</td>` +
        `<td class="actions-cell"><button class="btn btn-edit">編集</button></td>`;
      tr.querySelector('.btn-edit').addEventListener('click', () => this.openEdit(item.id));
      tb.appendChild(tr);
    });
  },

  openEdit(id) {
    this.editing = id;
    const modal = document.getElementById('modal');
    document.getElementById('form-errors').classList.remove('show');
    document.getElementById('modal-title').textContent = id ? `問題を編集: ${id}` : '問題を新規追加';
    document.getElementById('btn-delete').style.display = id ? 'inline-block' : 'none';

    const item = id ? this.data.questions.find(q => q.id === id) : null;

    document.getElementById('f-id').value = item ? item.id : '';
    document.getElementById('f-id').disabled = !!id;
    document.getElementById('f-category').value = item ? item.category : 'apm_rum';
    document.getElementById('f-level').value = item ? String(item.level) : '1';
    document.getElementById('f-answer').value = item ? String(item.answer) : '0';

    document.getElementById('ja-question').value = item?.ja.question || '';
    document.getElementById('ja-c0').value = item?.ja.choices?.[0] || '';
    document.getElementById('ja-c1').value = item?.ja.choices?.[1] || '';
    document.getElementById('ja-c2').value = item?.ja.choices?.[2] || '';
    document.getElementById('ja-c3').value = item?.ja.choices?.[3] || '';
    document.getElementById('ja-explanation').value = item?.ja.explanation || '';

    document.getElementById('en-question').value = item?.en?.question || '';
    document.getElementById('en-c0').value = item?.en?.choices?.[0] || '';
    document.getElementById('en-c1').value = item?.en?.choices?.[1] || '';
    document.getElementById('en-c2').value = item?.en?.choices?.[2] || '';
    document.getElementById('en-c3').value = item?.en?.choices?.[3] || '';
    document.getElementById('en-explanation').value = item?.en?.explanation || '';

    modal.classList.remove('hidden');
    setTimeout(() => document.getElementById(id ? 'ja-question' : 'f-id').focus(), 100);
  },

  closeModal() {
    document.getElementById('modal').classList.add('hidden');
    this.editing = null;
  },

  collectPayload() {
    const enQ = document.getElementById('en-question').value.trim();
    const enExpl = document.getElementById('en-explanation').value.trim();
    const enC = [
      document.getElementById('en-c0').value.trim(),
      document.getElementById('en-c1').value.trim(),
      document.getElementById('en-c2').value.trim(),
      document.getElementById('en-c3').value.trim()
    ];
    const hasEn = enQ || enExpl || enC.some(c => c);
    return {
      id: document.getElementById('f-id').value.trim(),
      category: document.getElementById('f-category').value,
      level: Number(document.getElementById('f-level').value),
      answer: Number(document.getElementById('f-answer').value),
      ja: {
        question: document.getElementById('ja-question').value.trim(),
        choices: [
          document.getElementById('ja-c0').value.trim(),
          document.getElementById('ja-c1').value.trim(),
          document.getElementById('ja-c2').value.trim(),
          document.getElementById('ja-c3').value.trim()
        ],
        explanation: document.getElementById('ja-explanation').value.trim()
      },
      en: hasEn ? {
        question: enQ,
        choices: enC,
        explanation: enExpl
      } : null
    };
  },

  async save() {
    const payload = this.collectPayload();
    const id = this.editing;
    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/admin/questions/${encodeURIComponent(id)}` : '/api/admin/questions';

    document.getElementById('form-errors').classList.remove('show');
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errs = j.errors || [j.error || `HTTP ${res.status}`];
        this.showErrors(errs);
        return;
      }
      this.closeModal();
      await this.load();
    } catch (e) {
      this.showErrors([e.message]);
    }
  },

  showErrors(errs) {
    const el = document.getElementById('form-errors');
    el.innerHTML = '<ul>' + errs.map(e => `<li>${esc(e)}</li>`).join('') + '</ul>';
    el.classList.add('show');
  },

  async deleteCurrent() {
    if (!this.editing) return;
    if (!confirm(`「${this.editing}」を削除します。よろしいですか?`)) return;
    try {
      const res = await fetch(`/api/admin/questions/${encodeURIComponent(this.editing)}`, {
        method: 'DELETE'
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        this.showErrors([j.error || `HTTP ${res.status}`]);
        return;
      }
      this.closeModal();
      await this.load();
    } catch (e) {
      this.showErrors([e.message]);
    }
  }
};

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

window.addEventListener('DOMContentLoaded', () => Admin.init());
