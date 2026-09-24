window.AfreraUI = (function () {
  function el(tag, props = {}, children = []) {
    const n = document.createElement(tag);
    Object.entries(props).forEach(([k, v]) => {
      if (k === 'className') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2).toLowerCase(), v);
      else if (v !== false && v != null) n.setAttribute(k, v === true ? '' : v);
    });
    (Array.isArray(children) ? children : [children]).forEach((c) => {
      if (c == null) return;
      n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return n;
  }

  function card(title, bodyNodes, footer) {
    const c = el('section', { className: 'card' }, [el('h3', { text: title })]);
    (Array.isArray(bodyNodes) ? bodyNodes : [bodyNodes]).forEach((b) =>
      c.appendChild(typeof b === 'string' ? el('p', { text: b }) : b),
    );
    if (footer) c.appendChild(footer);
    return c;
  }

  function gauge(label, value0to100) {
    const v = Math.max(0, Math.min(100, Number(value0to100) || 0));
    return el('div', {}, [
      el('div', { className: 'kpi' }, [String(Math.round(v)), el('small', { text: label })]),
      el(
        'div',
        {
          className: 'gauge-wrap',
          role: 'meter',
          'aria-valuenow': String(v),
          'aria-valuemin': '0',
          'aria-valuemax': '100',
        },
        [el('div', { className: 'gauge-fill', style: `width:${v}%` })],
      ),
    ]);
  }

  function pill(text, kind) {
    return el('span', { className: `pill ${kind || ''}`, text });
  }

  function timeline(history = []) {
    const ul = el('ul', { className: 'timeline' });
    history.forEach((h) => {
      ul.appendChild(
        el('li', {}, [
          el('span', { text: h.state || h.label || '—' }),
          el('span', { className: 'muted', text: (h.at || '').replace('T', ' ').slice(0, 19) }),
        ]),
      );
    });
    return ul;
  }

  function decisionBlock(dq) {
    if (!dq) return el('p', { className: 'muted', text: 'No decision yet' });
    const conf = Math.round((dq.confidence?.value || 0) * 100);
    return el('div', {}, [
      el('p', {}, [el('strong', { text: 'Action: ' }), dq.action || '—']),
      gauge('Confidence %', conf),
      el('p', {}, [
        pill(dq.escalation?.band || 'monitor', dq.escalation?.score > 40 ? 'warn' : 'ok'),
        ' ',
        pill(`Grade ${dq.evaluation?.grade || '—'}`, 'ok'),
      ]),
      el('p', { className: 'muted', text: dq.human_message || '' }),
    ]);
  }

  function crossLinks(fromId) {
    const map = {
      disease: [
        { href: '#/agro', label: 'Agro field case' },
        { href: '#/veterinary', label: 'Vet panel (animal domain)' },
        { href: '#/erp', label: 'Spray / treatment stock' },
      ],
      veterinary: [
        { href: '#/disease', label: 'Disease AI image bridge' },
        { href: '#/nutrition', label: 'Farm family nutrition' },
        { href: '#/unified', label: 'Unified One Health' },
        { href: '#/erp', label: 'Treatment stock & GST' },
      ],
      nutrition: [
        { href: '#/veterinary', label: 'Animal health context' },
        { href: '#/agro', label: 'Soil–food quality' },
        { href: '#/erp', label: 'Consult invoicing' },
      ],
      agro: [
        { href: '#/disease', label: 'Disease AI (leaf/image)' },
        { href: '#/nutrition', label: 'Produce → diet quality' },
        { href: '#/erp', label: 'Inputs inventory & GST' },
      ],
      unified: [
        { href: '#/disease', label: 'Disease AI' },
        { href: '#/veterinary', label: 'Vet module' },
        { href: '#/nutrition', label: 'Nutrition module' },
        { href: '#/agro', label: 'Agro module' },
      ],
      erp: [
        { href: '#/veterinary', label: 'Vet ERP entities' },
        { href: '#/agro', label: 'Agro ERP entities' },
        { href: '#/disease', label: 'Disease treatment hooks' },
      ],
    };
    const box = el('div', { className: 'links' });
    (map[fromId] || []).forEach((l) => box.appendChild(el('a', { href: l.href, className: 'btn ghost', text: l.label })));
    return box;
  }

  function toast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3200);
  }

  function setCorrelation(cid) {
    const b = document.getElementById('corrBadge');
    if (b) b.textContent = `corr: ${cid}`;
  }

  function field(label, inputEl) {
    return el('label', { className: 'field' }, [el('span', { text: label }), inputEl]);
  }

  return { el, card, gauge, pill, timeline, decisionBlock, crossLinks, toast, setCorrelation, field };
})();
