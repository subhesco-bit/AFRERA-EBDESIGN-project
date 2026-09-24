(function () {
  const { el, card, decisionBlock, crossLinks, toast, field, timeline, gauge, pill } = AfreraUI;
  const EP = window.AfreraEnterprisePages;
  const main = () => document.getElementById('main');
  const title = () => document.getElementById('pageTitle');

  function nav() {
    const n = document.getElementById('nav');
    n.innerHTML = '';
    AFRERA_CONFIG.modules.forEach((m) => {
      const a = el('a', {
        href: m.path,
        text: m.title,
        className: location.hash === m.path || (!location.hash && m.id === 'home') ? 'active' : '',
      });
      n.appendChild(a);
    });
  }

  function home() {
    title().textContent = 'AFRERA Platform OS · 10x';
    main().innerHTML = '';
    main().appendChild(
      card('Complete platform', [
        el('p', {
          text: 'Health AI · Agro · Enterprise: Ecommerce, Insurance, Finance, Cold Storage, Rental, ERP, Platform.',
        }),
        el('div', { className: 'grid' }, [
          card('Disease AI', [el('a', { href: '#/disease', className: 'btn primary', text: 'Open' })]),
          card('Veterinary', [el('a', { href: '#/veterinary', className: 'btn primary', text: 'Open' })]),
          card('Nutrition', [el('a', { href: '#/nutrition', className: 'btn primary', text: 'Open' })]),
          card('Enterprise Hub', [el('a', { href: '#/enterprise', className: 'btn primary', text: 'Open' })]),
          card('Ecommerce', [el('a', { href: '#/ecommerce', className: 'btn primary', text: 'Open' })]),
          card('Insurance', [el('a', { href: '#/insurance', className: 'btn primary', text: 'Open' })]),
          card('Finance', [el('a', { href: '#/finance', className: 'btn primary', text: 'Open' })]),
          card('Cold Storage', [el('a', { href: '#/cold-storage', className: 'btn primary', text: 'Open' })]),
          card('Rental', [el('a', { href: '#/rental', className: 'btn primary', text: 'Open' })]),
          card('ERP', [el('a', { href: '#/erp', className: 'btn primary', text: 'Open' })]),
        ]),
      ]),
    );
  }

  function renderResult(container, data, moduleId) {
    container.innerHTML = '';
    if (data.decision_quality) container.appendChild(card('Decision', decisionBlock(data.decision_quality)));
    if (data.safety_floor || data.meta?.safety_floor) {
      container.appendChild(
        card('Safety floor', el('p', { className: 'muted', text: data.safety_floor || data.meta.safety_floor })),
      );
    }
    if (data.confidence != null) container.appendChild(card('Confidence', gauge('Confidence %', data.confidence * 100)));
    if (data.workflow?.history) container.appendChild(card('Workflow', timeline(data.workflow.history)));
    container.appendChild(card('Continue', crossLinks(moduleId)));
    container.appendChild(card('Raw JSON', el('pre', { className: 'pre', text: JSON.stringify(data, null, 2).slice(0, 12000) })));
  }

  function diseasePage() {
    title().textContent = 'Disease AI · Image → Symptoms → Solution';
    const domain = el('select', {}, [
      el('option', { value: 'plant', text: 'Plant (Agro)' }),
      el('option', { value: 'animal', text: 'Animal (Vet bridge)' }),
    ]);
    const crop = el('input', { value: 'tomato', placeholder: 'crop' });
    const species = el('input', { value: 'cattle', placeholder: 'species' });
    const desc = el('textarea', { placeholder: 'Describe symptoms or paste CV tags…' });
    const tags = el('input', { placeholder: 'cv_tags comma-separated' });
    const organic = el('input', { type: 'checkbox', checked: true });
    const out = el('div');
    const discussBox = el('textarea', { placeholder: 'Follow-up discussion…' });
    let sessionId = null;

    const run = el('button', {
      className: 'btn primary',
      type: 'button',
      text: 'Analyze',
      onClick: async () => {
        run.disabled = true;
        try {
          const res = await AfreraAPI.diseaseAnalyze({
            domain: domain.value,
            description: desc.value,
            cv_tags: tags.value.split(',').map((s) => s.trim()).filter(Boolean),
            organic_preference: organic.checked,
            crop: crop.value,
            species: species.value,
          });
          const data = res.result || res.data || res;
          sessionId = res.sessionId || data.sessionId || sessionId;
          out.innerHTML = '';
          if (data.symptoms?.symptom_series) {
            out.appendChild(
              card(
                'Symptom series',
                el(
                  'ul',
                  {},
                  data.symptoms.symptom_series.map((s) => el('li', { text: s })),
                ),
              ),
            );
          }
          if (data.diseases?.top) {
            out.appendChild(
              card('Top disease', [
                el('p', {}, [el('strong', { text: data.diseases.top.name })]),
                gauge('Confidence %', (data.diseases.top.confidence || 0) * 100),
              ]),
            );
          }
          if (data.treatment) {
            out.appendChild(
              card('Treatment', [
                el('p', { text: 'Organic: ' + (data.treatment.organic_options || []).join('; ') }),
                el('p', { className: 'muted', text: data.treatment.safety_floor || '' }),
              ]),
            );
          }
          renderResult(out, data, 'disease');
          toast('Disease analysis complete');
        } catch (e) {
          toast(e.message);
        } finally {
          run.disabled = false;
        }
      },
    });

    const discussBtn = el('button', {
      className: 'btn',
      type: 'button',
      text: 'Discussion',
      onClick: async () => {
        if (!sessionId) return toast('Run analyze first');
        try {
          const res = await AfreraAPI.diseaseDiscussion({
            sessionId,
            message: discussBox.value,
            domain: domain.value,
          });
          const data = res.result || res.data || res;
          out.appendChild(card('Discussion', el('p', { text: data.assistant || JSON.stringify(data) })));
        } catch (e) {
          toast(e.message);
        }
      },
    });

    main().innerHTML = '';
    main().appendChild(
      card('Case', [
        el('div', { className: 'form-row' }, [field('Domain', domain), field('Organic', organic)]),
        el('div', { className: 'form-row' }, [field('Crop', crop), field('Species', species)]),
        field('Description', desc),
        field('CV tags', tags),
        run,
      ]),
    );
    main().appendChild(card('Discussion', [field('Message', discussBox), discussBtn]));
    main().appendChild(out);
  }

  function veterinaryPage() {
    title().textContent = 'Veterinary · Specialist Panel';
    const species = el(
      'select',
      {},
      ['cattle', 'buffalo', 'goat', 'sheep', 'pig', 'poultry', 'dog', 'cat'].map((s) =>
        el('option', { value: s, text: s }),
      ),
    );
    const symptoms = el('textarea', { placeholder: 'Clinical signs…' });
    const out = el('div');
    const runDiag = el('button', {
      className: 'btn primary',
      type: 'button',
      text: 'Diagnose + panel preview',
      onClick: async () => {
        try {
          const res = await AfreraAPI.vetDiagnose({
            species: species.value,
            symptoms_text: symptoms.value,
            run_panel: true,
          });
          const data = res.result || res.data || res;
          out.innerHTML = '';
          out.appendChild(card('Urgency', [pill(data.urgency || '—', data.urgency === 'emergency' ? 'warn' : 'ok')]));
          if (data.panel_preview?.opinions) {
            out.appendChild(
              card(
                'Panel preview',
                data.panel_preview.opinions.map((o) =>
                  el('div', {}, [el('strong', { text: o.specialist_name }), el('p', { text: o.opinion })]),
                ),
              ),
            );
          }
          renderResult(out, data, 'veterinary');
        } catch (e) {
          toast(e.message);
        }
      },
    });
    const runPanel = el('button', {
      className: 'btn',
      type: 'button',
      text: 'Full panel',
      onClick: async () => {
        const res = await AfreraAPI.vetPanel({ species: species.value, symptoms_text: symptoms.value });
        const data = res.result || res.data || res;
        out.appendChild(
          card(
            'Full panel',
            (data.opinions || []).map((o) =>
              el('div', {}, [el('strong', { text: o.specialist_name }), el('p', { text: o.opinion })]),
            ),
          ),
        );
      },
    });
    main().innerHTML = '';
    main().appendChild(card('Case', [field('Species', species), field('Symptoms', symptoms), runDiag, runPanel]));
    main().appendChild(out);
  }

  function nutritionPage() {
    title().textContent = 'Nutrition · Clinical MNT';
    const age = el('input', { type: 'number', value: '45' });
    const weight = el('input', { type: 'number', value: '72' });
    const height = el('input', { type: 'number', value: '165' });
    const sex = el('select', {}, [
      el('option', { value: 'female', text: 'Female' }),
      el('option', { value: 'male', text: 'Male' }),
    ]);
    const protocol = el('select', {}, [
      el('option', { value: '', text: '— none —' }),
      ...['t2dm', 'ckd', 'htn', 'pregnancy', 'pcos'].map((p) => el('option', { value: p, text: p })),
    ]);
    const out = el('div');
    const run = el('button', {
      className: 'btn primary',
      type: 'button',
      text: 'Plan',
      onClick: async () => {
        const res = await AfreraAPI.nutritionPlan({
          profile: {
            age: Number(age.value),
            weight_kg: Number(weight.value),
            height_cm: Number(height.value),
            sex: sex.value,
          },
          protocol_id: protocol.value || undefined,
          diagnoses: protocol.value ? [protocol.value] : [],
        });
        renderResult(out, res.result || res.data || res, 'nutrition');
      },
    });
    main().innerHTML = '';
    main().appendChild(
      card('Profile', [
        el('div', { className: 'form-row' }, [field('Age', age), field('Sex', sex)]),
        el('div', { className: 'form-row' }, [field('Weight', weight), field('Height', height)]),
        field('Protocol', protocol),
        run,
      ]),
    );
    main().appendChild(out);
  }

  function agroPage() {
    title().textContent = 'Agro';
    const crop = el('input', { value: 'tomato' });
    const desc = el('textarea', { placeholder: 'Field notes…' });
    const out = el('div');
    const run = el('button', {
      className: 'btn primary',
      type: 'button',
      text: 'Agro enhanced',
      onClick: async () => {
        try {
          const res = await AfreraAPI.agroEnhanced({ crop: crop.value, description: desc.value, organic: true });
          renderResult(out, res.result || res.data || res, 'agro');
        } catch (e) {
          toast(e.message);
        }
      },
    });
    main().innerHTML = '';
    main().appendChild(card('Field', [field('Crop', crop), field('Notes', desc), run]));
    main().appendChild(out);
  }

  function unifiedPage() {
    title().textContent = 'Unified OS';
    const out = el('div');
    const run = el('button', {
      className: 'btn primary',
      type: 'button',
      text: 'Operate pillars',
      onClick: async () => {
        try {
          const res = await AfreraAPI.unifiedOperate({
            domains: ['veterinary', 'nutrition', 'agro'],
            species: 'cow',
            crop: 'wheat',
            profile: { age_years: 35, weight_kg: 70, height_cm: 170, sex: 'male' },
          });
          renderResult(out, res.result || res.data || res, 'unified');
        } catch (e) {
          toast(e.message);
        }
      },
    });
    main().innerHTML = '';
    main().appendChild(card('Unified', [run]));
    main().appendChild(out);
  }

  function erpLegacyPage() {
    if (EP && EP.erpCorePage) return EP.erpCorePage(main, title);
    title().textContent = 'ERP';
    main().innerHTML = '';
    main().appendChild(card('ERP', el('p', { text: 'Use Enterprise ERP routes.' })));
  }

  function busPage() {
    title().textContent = 'Inter-module bus';
    const out = el('div');
    const load = el('button', {
      className: 'btn primary',
      type: 'button',
      text: 'Refresh events',
      onClick: async () => {
        try {
          const res = await AfreraAPI.busEvents();
          const events = res.result || res.data || [];
          out.innerHTML = '';
          out.appendChild(
            card(
              'Events',
              events.length
                ? el(
                    'ul',
                    {},
                    events.map((e) => el('li', { text: e.type || JSON.stringify(e) })),
                  )
                : el('p', { className: 'muted', text: 'No events yet.' }),
            ),
          );
        } catch (e) {
          toast(e.message);
        }
      },
    });
    main().innerHTML = '';
    main().appendChild(card('Bus', [load]));
    main().appendChild(out);
  }

  function route() {
    nav();
    const h = location.hash || '#/';
    if (h.startsWith('#/disease')) diseasePage();
    else if (h.startsWith('#/veterinary')) veterinaryPage();
    else if (h.startsWith('#/nutrition')) nutritionPage();
    else if (h.startsWith('#/agro')) agroPage();
    else if (h.startsWith('#/enterprise') && EP) EP.enterpriseHub(main, title);
    else if (h.startsWith('#/ecommerce') && EP) EP.ecommercePage(main, title);
    else if (h.startsWith('#/insurance') && EP) EP.insurancePage(main, title);
    else if (h.startsWith('#/finance') && EP) EP.financePage(main, title);
    else if (h.startsWith('#/cold-storage') && EP) EP.coldPage(main, title);
    else if (h.startsWith('#/rental') && EP) EP.rentalPage(main, title);
    else if (h.startsWith('#/erp')) erpLegacyPage();
    else if (h.startsWith('#/unified')) unifiedPage();
    else if (h.startsWith('#/bus')) busPage();
    else home();
  }

  document.getElementById('btnHealth')?.addEventListener('click', async () => {
    try {
      const h = await AfreraAPI.health();
      toast(JSON.stringify(h.result || h.data || h));
    } catch (e) {
      try {
        const h2 = await AfreraAPI.enterpriseHealth();
        toast(JSON.stringify(h2));
      } catch (e2) {
        toast(e.message);
      }
    }
  });
  document.getElementById('btnBus')?.addEventListener('click', () => {
    location.hash = '#/bus';
  });

  window.addEventListener('hashchange', route);
  route();
})();
