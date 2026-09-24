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
    title().textContent = 'Three Module OS · 10x';
    main().innerHTML = '';
    main().appendChild(
      card('Platform', [
        el('p', {
          text: 'Disease AI (image→symptoms→solution) · Veterinary specialist panel · Rituraj clinical MNT · Agro · ERP/GST.',
        }),
        el('div', { className: 'grid' }, [
          card('Disease AI', [
            el('p', { className: 'muted', text: 'Image / tags → disease → discussion → treatment' }),
            el('a', { href: '#/disease', className: 'btn primary', text: 'Open' }),
          ]),
          card('Veterinary', [
            el('p', { className: 'muted', text: 'Full specialist panel + One Health' }),
            el('a', { href: '#/veterinary', className: 'btn primary', text: 'Open' }),
          ]),
          card('Nutrition', [
            el('p', { className: 'muted', text: 'Clinical protocols T2DM CKD HTN…' }),
            el('a', { href: '#/nutrition', className: 'btn primary', text: 'Open' }),
          ]),
          card('Agro', [
            el('p', { className: 'muted', text: 'Field case + organic systems' }),
            el('a', { href: '#/agro', className: 'btn primary', text: 'Open' }),
          ]),
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
    container.appendChild(card('Continue', crossLinks(moduleId)));
    container.appendChild(card('Raw JSON', el('pre', { className: 'pre', text: JSON.stringify(data, null, 2).slice(0, 12000) })));
  }

  // -------- Disease AI (M782) --------
  function diseasePage() {
    title().textContent = 'Disease AI · Image → Symptoms → Solution';
    const domain = el('select', {}, [
      el('option', { value: 'plant', text: 'Plant (Agro)' }),
      el('option', { value: 'animal', text: 'Animal (Vet bridge)' }),
    ]);
    const crop = el('input', { value: 'tomato', placeholder: 'crop' });
    const species = el('input', { value: 'cattle', placeholder: 'species' });
    const desc = el('textarea', { placeholder: 'Describe symptoms or paste CV tags…' });
    const tags = el('input', { placeholder: 'cv_tags comma-separated e.g. powdery,yellowing' });
    const organic = el('input', { type: 'checkbox', checked: true });
    const out = el('div');
    const discussBox = el('textarea', { placeholder: 'Follow-up question for discussion…' });
    let sessionId = null;
    let lastDisease = null;

    const run = el('button', {
      className: 'btn primary',
      type: 'button',
      text: 'Analyze (symptoms → disease → treatment)',
      onClick: async () => {
        run.disabled = true;
        try {
          const body = {
            domain: domain.value,
            description: desc.value,
            cv_tags: tags.value.split(',').map((s) => s.trim()).filter(Boolean),
            organic_preference: organic.checked,
            crop: crop.value,
            species: species.value,
          };
          const res = await AfreraAPI.diseaseAnalyze(body);
          const data = res.result || res.data || res;
          sessionId = res.sessionId || data.sessionId || sessionId;
          lastDisease = data.diseases?.top || null;
          out.innerHTML = '';
          if (data.symptoms) {
            out.appendChild(
              card(
                'Symptom series',
                el(
                  'ul',
                  {},
                  (data.symptoms.symptom_series || []).map((s) => el('li', { text: s })),
                ),
              ),
            );
          }
          if (data.diseases?.top) {
            out.appendChild(
              card('Top disease', [
                el('p', {}, [el('strong', { text: data.diseases.top.name })]),
                gauge('Confidence %', (data.diseases.top.confidence || 0) * 100),
                el('p', { className: 'muted', text: data.diseases.disclaimer || '' }),
              ]),
            );
          }
          if (data.treatment) {
            out.appendChild(
              card('Treatment / solution', [
                el('p', {}, [pill(data.treatment.preferred_path || 'integrated', 'ok')]),
                el('p', { text: 'Organic: ' + (data.treatment.organic_options || []).join('; ') }),
                el('p', { text: 'Cultural: ' + (data.treatment.cultural_practices || []).join('; ') }),
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
      text: 'Send discussion',
      onClick: async () => {
        if (!sessionId) return toast('Run analyze first');
        try {
          const res = await AfreraAPI.diseaseDiscussion({
            sessionId,
            message: discussBox.value,
            domain: domain.value,
          });
          const data = res.result || res.data || res;
          out.appendChild(card('Discussion reply', el('p', { text: data.assistant || JSON.stringify(data) })));
          toast('Discussion updated');
        } catch (e) {
          toast(e.message);
        }
      },
    });

    main().innerHTML = '';
    main().appendChild(
      card('Case intake', [
        el('div', { className: 'form-row' }, [field('Domain', domain), field('Organic first', organic)]),
        el('div', { className: 'form-row' }, [field('Crop', crop), field('Species', species)]),
        field('Description', desc),
        field('CV tags', tags),
        run,
      ]),
    );
    main().appendChild(card('Multi-turn discussion', [field('Message', discussBox), discussBtn]));
    main().appendChild(out);
    main().appendChild(card('Cross-module', crossLinks('disease')));
  }

  // -------- Veterinary + full panel --------
  function veterinaryPage() {
    title().textContent = 'Veterinary · Specialist Panel';
    const species = el(
      'select',
      {},
      ['cattle', 'buffalo', 'goat', 'sheep', 'pig', 'poultry', 'dog', 'cat', 'equine'].map((s) =>
        el('option', { value: s, text: s }),
      ),
    );
    const symptoms = el('textarea', { placeholder: 'Clinical signs, history…' });
    const herdSize = el('input', { type: 'number', value: '50', min: '0' });
    const affected = el('input', { type: 'number', value: '3', min: '0' });
    const out = el('div');

    const runDiag = el('button', {
      className: 'btn primary',
      type: 'button',
      text: 'Diagnose + panel preview',
      onClick: async () => {
        runDiag.disabled = true;
        try {
          const res = await AfreraAPI.vetDiagnose({
            species: species.value,
            symptoms_text: symptoms.value,
            description: symptoms.value,
            run_panel: true,
          });
          const data = res.result || res.data || res;
          out.innerHTML = '';
          out.appendChild(
            card('Urgency', [
              pill(data.urgency || '—', data.urgency === 'emergency' ? 'warn' : 'ok'),
              el('p', { className: 'muted', text: data.safety_floor || '' }),
            ]),
          );
          if (data.symptom_series?.length) {
            out.appendChild(
              card(
                'Symptom series',
                el(
                  'ul',
                  {},
                  data.symptom_series.map((s) => el('li', { text: s })),
                ),
              ),
            );
          }
          if (data.panel_preview?.opinions) {
            out.appendChild(
              card(
                'Specialist panel preview',
                data.panel_preview.opinions.map((o) =>
                  el('div', { className: 'panel-opinion' }, [
                    el('strong', { text: o.specialist_name }),
                    el('p', { text: o.opinion }),
                  ]),
                ),
              ),
            );
            if (data.panel_preview.consensus) {
              out.appendChild(card('Consensus', el('p', { text: data.panel_preview.consensus.summary })));
            }
          }
          renderResult(out, data, 'veterinary');
          toast('Veterinary analysis complete');
        } catch (e) {
          toast(e.message);
        } finally {
          runDiag.disabled = false;
        }
      },
    });

    const runPanel = el('button', {
      className: 'btn',
      type: 'button',
      text: 'Full specialist panel',
      onClick: async () => {
        try {
          const res = await AfreraAPI.vetPanel({
            species: species.value,
            symptoms_text: symptoms.value,
            description: symptoms.value,
          });
          const data = res.result || res.data || res;
          out.appendChild(
            card(
              'Full panel opinions',
              (data.opinions || []).map((o) =>
                el('div', {}, [
                  el('strong', { text: `${o.specialist_name} (${o.relevance})` }),
                  el('p', { text: o.opinion }),
                ]),
              ),
            ),
          );
          if (data.consensus) out.appendChild(card('Consensus', el('p', { text: data.consensus.summary })));
          if (data.ai_synthesis) out.appendChild(card('AI synthesis', el('p', { text: data.ai_synthesis })));
          toast('Panel complete');
        } catch (e) {
          toast(e.message);
        }
      },
    });

    const runHerd = el('button', {
      className: 'btn ghost',
      type: 'button',
      text: 'Herd risk',
      onClick: async () => {
        try {
          const res = await AfreraAPI.vetHerdRisk({
            species: species.value,
            herd_size: Number(herdSize.value),
            affected: Number(affected.value),
          });
          const data = res.result || res.data || res;
          out.appendChild(
            card('Herd risk', [
              pill(data.risk_band || '—', data.risk_band === 'high' ? 'warn' : 'ok'),
              el('p', { text: `Attack rate: ${data.attack_rate}` }),
            ]),
          );
        } catch (e) {
          toast(e.message);
        }
      },
    });

    main().innerHTML = '';
    main().appendChild(
      card('Case intake', [
        field('Species', species),
        field('Symptoms / history', symptoms),
        el('div', { className: 'form-row' }, [field('Herd size', herdSize), field('Affected', affected)]),
        el('div', { className: 'form-row' }, [runDiag, runPanel, runHerd]),
      ]),
    );
    main().appendChild(out);
    main().appendChild(card('Cross-module', crossLinks('veterinary')));
  }

  // -------- Nutrition + clinical protocols --------
  function nutritionPage() {
    title().textContent = 'Rituraj Nutrition · Clinical MNT';
    const age = el('input', { type: 'number', value: '45', min: '1' });
    const weight = el('input', { type: 'number', value: '72', min: '1' });
    const height = el('input', { type: 'number', value: '165', min: '50' });
    const sex = el('select', {}, [
      el('option', { value: 'female', text: 'Female' }),
      el('option', { value: 'male', text: 'Male' }),
    ]);
    const protocol = el('select', {}, [
      el('option', { value: '', text: '— none —' }),
      ...['t2dm', 'ckd', 'htn', 'hypothyroidism', 'pcos', 'pregnancy', 'geriatric_sarcopenia'].map((p) =>
        el('option', { value: p, text: p }),
      ),
    ]);
    const meds = el('input', { placeholder: 'medications e.g. metformin, warfarin' });
    const out = el('div');

    const runPlan = el('button', {
      className: 'btn primary',
      type: 'button',
      text: 'Plan + apply protocol',
      onClick: async () => {
        runPlan.disabled = true;
        try {
          const body = {
            profile: {
              age: Number(age.value),
              weight_kg: Number(weight.value),
              height_cm: Number(height.value),
              sex: sex.value,
              activity: 'moderate',
            },
            protocol_id: protocol.value || undefined,
            diagnoses: protocol.value ? [protocol.value] : [],
            medications: meds.value.split(',').map((s) => s.trim()).filter(Boolean),
          };
          const res = await AfreraAPI.nutritionPlan(body);
          const data = res.result || res.data || res;
          out.innerHTML = '';
          if (data.assessment) {
            out.appendChild(
              card('Energy', [
                el('p', { text: `BMR ${data.assessment.bmr} · TDEE ${data.assessment.tdee}` }),
                gauge('Confidence %', (data.confidence || 0.8) * 100),
              ]),
            );
          }
          if (data.clinical_protocols_applied?.length) {
            out.appendChild(
              card(
                'Clinical protocols',
                data.clinical_protocols_applied.map((p) =>
                  el('div', {}, [
                    el('strong', { text: p.name }),
                    el('p', { className: 'muted', text: (p.goals || []).join(' · ') }),
                    el('p', { text: p.escalation || '' }),
                  ]),
                ),
              ),
            );
          }
          if (data.plan_summary) out.appendChild(card('Plan summary', el('p', { text: data.plan_summary })));
          renderResult(out, data, 'nutrition');
          toast('Nutrition plan complete');
        } catch (e) {
          toast(e.message);
        } finally {
          runPlan.disabled = false;
        }
      },
    });

    const loadProto = el('button', {
      className: 'btn',
      type: 'button',
      text: 'Load full protocol card',
      onClick: async () => {
        if (!protocol.value) return toast('Select a protocol');
        try {
          const res = await AfreraAPI.nutritionProtocol({ protocol_id: protocol.value });
          const data = res.result || res.data || res;
          const p = data.protocol;
          if (!p) return toast(data.message || 'Not found');
          out.appendChild(
            card(p.name, [
              el('p', { text: 'Energy: ' + (p.energy || '—') }),
              el('p', { text: 'Protein: ' + (p.protein || '—') }),
              el('p', { text: 'Key foods: ' + (p.key_foods || []).join(', ') }),
              el('p', { text: 'Limit: ' + (p.avoid_or_limit || []).join(', ') }),
              el('p', { className: 'muted', text: data.safety_floor || '' }),
            ]),
          );
        } catch (e) {
          toast(e.message);
        }
      },
    });

    main().innerHTML = '';
    main().appendChild(
      card('Profile + clinical', [
        el('div', { className: 'form-row' }, [field('Age', age), field('Sex', sex)]),
        el('div', { className: 'form-row' }, [field('Weight kg', weight), field('Height cm', height)]),
        field('Clinical protocol', protocol),
        field('Medications', meds),
        el('div', { className: 'form-row' }, [runPlan, loadProto]),
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
    const toDisease = el('button', {
      className: 'btn',
      type: 'button',
      text: 'Open in Disease AI',
      onClick: () => {
        location.hash = '#/disease';
      },
    });
    main().innerHTML = '';
    main().appendChild(
      card('Field case', [
        el('div', { className: 'form-row' }, [field('Crop', crop), field('Mode', mode)]),
        field('Notes / symptoms', desc),
        el('div', { className: 'form-row' }, [run, toDisease]),
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
    if (h.startsWith('#/disease')) diseasePage();
    else if (h.startsWith('#/veterinary')) veterinaryPage();
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
