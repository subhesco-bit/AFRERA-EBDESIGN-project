(function () {
  const { el, card, decisionBlock, crossLinks, toast, field, timeline, gauge, pill } = AfreraUI;
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
    title().textContent = 'Three Module OS';
    main().innerHTML = '';
    main().appendChild(
      card('Platform', [
        el('p', { text: 'Veterinary · Nutrition · Agro — interlinked decision support with ERP/GST and event bus.' }),
        el('div', { className: 'grid' }, [
          card('Veterinary', [el('p', { className: 'muted', text: 'Panel, One Health, PCICDA' }), el('a', { href: '#/veterinary', className: 'btn primary', text: 'Open' })]),
          card('Nutrition', [el('p', { className: 'muted', text: 'Rituraj, life-stage, drug–food' }), el('a', { href: '#/nutrition', className: 'btn primary', text: 'Open' })]),
          card('Agro', [el('p', { className: 'muted', text: 'Crops, soil, organic, biochar' }), el('a', { href: '#/agro', className: 'btn primary', text: 'Open' })]),
        ]),
      ]),
    );
  }

  function renderResult(container, data, moduleId) {
    container.innerHTML = '';
    container.appendChild(card('Decision', decisionBlock(data.decision_quality)));
    if (data.workflow?.history) container.appendChild(card('Workflow', timeline(data.workflow.history)));
    if (data.interaction?.audio?.text) {
      container.appendChild(
        card('Audio narrative', [
          el('p', { text: data.interaction.audio.text }),
          el('button', {
            className: 'btn',
            type: 'button',
            text: 'Speak',
            onClick: () => {
              if (!window.speechSynthesis) return toast('TTS not available');
              const u = new SpeechSynthesisUtterance(data.interaction.audio.text);
              u.lang = data.interaction.audio.language === 'hi' ? 'hi-IN' : 'en-IN';
              speechSynthesis.speak(u);
            },
          }),
        ]),
      );
    }
    if (data.interpretation?.human_narrative) {
      container.appendChild(card('One-runtime interpretation', el('p', { text: data.interpretation.human_narrative })));
    }
    if (data.inter_module_events?.length) {
      container.appendChild(
        card(
          'Inter-module events',
          el(
            'ul',
            {},
            data.inter_module_events.map((e) => el('li', { text: `${e.type} · ${e.event_id?.slice(0, 8) || ''}` })),
          ),
        ),
      );
    }
    container.appendChild(card('Continue', crossLinks(moduleId)));
    container.appendChild(card('Raw JSON', el('pre', { className: 'pre', text: JSON.stringify(data, null, 2).slice(0, 8000) })));
  }

  function veterinaryPage() {
    title().textContent = 'Veterinary Intelligence';
    const species = el('select', {}, ['cow', 'goat', 'pig', 'poultry', 'buffalo', 'sheep', 'duck', 'rabbit', 'dog', 'cat'].map((s) => el('option', { value: s, text: s })));
    const symptoms = el('textarea', { placeholder: 'Clinical signs, history…' });
    const out = el('div', { id: 'vetOut' });
    const run = el('button', {
      className: 'btn primary',
      type: 'button',
      text: 'Run enhanced analysis',
      onClick: async () => {
        run.disabled = true;
        try {
          const res = await AfreraAPI.veterinaryEnhanced({
            species: species.value,
            clinical: { symptoms: symptoms.value.split(/[,\n]/).map((s) => s.trim()).filter(Boolean) },
            description: symptoms.value,
            lang: document.getElementById('langSelect')?.value || 'en',
          });
          renderResult(out, res.result || res.data || res, 'veterinary');
          toast('Veterinary analysis complete');
        } catch (e) {
          toast(e.message);
        } finally {
          run.disabled = false;
        }
      },
    });
    main().innerHTML = '';
    main().appendChild(card('Case intake', [field('Species', species), field('Symptoms / history', symptoms), run]));
    main().appendChild(out);
    main().appendChild(card('Cross-module', crossLinks('veterinary')));
  }

  function nutritionPage() {
    title().textContent = 'Rituraj Nutrition';
    const age = el('input', { type: 'number', value: '30', min: '1' });
    const weight = el('input', { type: 'number', value: '65', min: '1' });
    const height = el('input', { type: 'number', value: '165', min: '50' });
    const sex = el('select', {}, [el('option', { value: 'female', text: 'Female' }), el('option', { value: 'male', text: 'Male' })]);
    const goal = el('select', {}, ['maintain', 'loss', 'gain'].map((g) => el('option', { value: g, text: g })));
    const out = el('div');
    const run = el('button', {
      className: 'btn primary',
      type: 'button',
      text: 'Run nutrition conference',
      onClick: async () => {
        run.disabled = true;
        try {
          const res = await AfreraAPI.nutritionEnhanced({
            profile: {
              age_years: Number(age.value),
              weight_kg: Number(weight.value),
              height_cm: Number(height.value),
              sex: sex.value,
            },
            goal: goal.value,
            lang: document.getElementById('langSelect')?.value || 'en',
          });
          renderResult(out, res.result || res.data || res, 'nutrition');
          toast('Nutrition analysis complete');
        } catch (e) {
          toast(e.message);
        } finally {
          run.disabled = false;
        }
      },
    });
    main().innerHTML = '';
    main().appendChild(
      card('Profile', [
        el('div', { className: 'form-row' }, [field('Age', age), field('Sex', sex)]),
        el('div', { className: 'form-row' }, [field('Weight kg', weight), field('Height cm', height)]),
        field('Goal', goal),
        run,
      ]),
    );
    main().appendChild(out);
    main().appendChild(card('Cross-module', crossLinks('nutrition')));
  }

  function agroPage() {
    title().textContent = 'Agro Farming';
    const crop = el('input', { value: 'tomato', placeholder: 'crop id' });
    const mode = el('select', {}, ['integrated', 'organic', 'inorganic'].map((m) => el('option', { value: m, text: m })));
    const desc = el('textarea', { placeholder: 'Field notes or leaf symptoms…' });
    const out = el('div');
    const run = el('button', {
      className: 'btn primary',
      type: 'button',
      text: 'Run agro enhanced',
      onClick: async () => {
        run.disabled = true;
        try {
          const res = await AfreraAPI.agroEnhanced({
            crop: crop.value,
            farming_mode: mode.value,
            description: desc.value,
            organic: mode.value === 'organic',
            lang: document.getElementById('langSelect')?.value || 'en',
          });
          renderResult(out, res.result || res.data || res, 'agro');
          toast('Agro analysis complete');
        } catch (e) {
          toast(e.message);
        } finally {
          run.disabled = false;
        }
      },
    });
    main().innerHTML = '';
    main().appendChild(
      card('Field case', [
        el('div', { className: 'form-row' }, [field('Crop', crop), field('Mode', mode)]),
        field('Notes / symptoms', desc),
        run,
      ]),
    );
    main().appendChild(out);
    main().appendChild(card('Cross-module', crossLinks('agro')));
  }

  function unifiedPage() {
    title().textContent = 'Unified Intelligence OS';
    const out = el('div');
    const run = el('button', {
      className: 'btn primary',
      type: 'button',
      text: 'Operate all pillars',
      onClick: async () => {
        run.disabled = true;
        try {
          const res = await AfreraAPI.unifiedOperate({
            domains: ['veterinary', 'nutrition', 'agro'],
            species: 'cow',
            crop: 'wheat',
            profile: { age_years: 35, weight_kg: 70, height_cm: 170, sex: 'male' },
          });
          renderResult(out, res.result || res.data || res, 'unified');
          toast('Unified operate complete');
        } catch (e) {
          toast(e.message);
        } finally {
          run.disabled = false;
        }
      },
    });
    main().innerHTML = '';
    main().appendChild(card('Cross-pillar continuum', [el('p', { className: 'muted', text: 'Animal + human + farm in one pass.' }), run]));
    main().appendChild(out);
    main().appendChild(card('Navigate', crossLinks('unified')));
  }

  function erpPage() {
    title().textContent = 'ERP & GST';
    const mod = el('select', {}, ['veterinary', 'nutrition', 'agro'].map((m) => el('option', { value: m, text: m })));
    const out = el('div');
    const load = el('button', {
      className: 'btn primary',
      type: 'button',
      text: 'Load financial dashboard',
      onClick: async () => {
        try {
          const fin = await AfreraAPI.financeDashboard(mod.value);
          const op = await AfreraAPI.erpDashboard(mod.value);
          out.innerHTML = '';
          out.appendChild(card('P&L', el('pre', { className: 'pre', text: JSON.stringify((fin.result || fin.data || fin).pnl, null, 2) })));
          out.appendChild(card('GST snapshot', el('pre', { className: 'pre', text: JSON.stringify((fin.result || fin.data || fin).gst, null, 2) })));
          out.appendChild(card('Operational ERP', el('pre', { className: 'pre', text: JSON.stringify(op.result || op.data || op, null, 2) })));
        } catch (e) {
          toast(e.message);
        }
      },
    });
    main().innerHTML = '';
    main().appendChild(card('Module books', [field('Module', mod), load]));
    main().appendChild(out);
    main().appendChild(card('Cross-module', crossLinks('erp')));
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
              'Recent events',
              events.length
                ? el(
                    'ul',
                    { className: 'timeline' },
                    events.map((e) =>
                      el('li', {}, [
                        el('span', { text: e.type }),
                        el('span', { className: 'muted', text: e.meta?.at || '' }),
                      ]),
                    ),
                  )
                : el('p', { className: 'muted', text: 'No events yet — run an enhanced analysis first.' }),
            ),
          );
        } catch (e) {
          toast(e.message);
        }
      },
    });
    main().innerHTML = '';
    main().appendChild(card('Event log', [load]));
    main().appendChild(out);
  }

  function route() {
    nav();
    const h = location.hash || '#/';
    if (h.startsWith('#/veterinary')) veterinaryPage();
    else if (h.startsWith('#/nutrition')) nutritionPage();
    else if (h.startsWith('#/agro')) agroPage();
    else if (h.startsWith('#/unified')) unifiedPage();
    else if (h.startsWith('#/erp')) erpPage();
    else if (h.startsWith('#/bus')) busPage();
    else home();
  }

  document.getElementById('btnHealth')?.addEventListener('click', async () => {
    try {
      const h = await AfreraAPI.health();
      toast(JSON.stringify(h.result || h.data || h));
    } catch (e) {
      toast(e.message);
    }
  });
  document.getElementById('btnBus')?.addEventListener('click', () => {
    location.hash = '#/bus';
  });

  window.addEventListener('hashchange', route);
  route();
})();
