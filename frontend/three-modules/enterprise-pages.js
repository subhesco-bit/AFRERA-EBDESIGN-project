/**
 * Enterprise 10x UI pages — loaded by app.js
 */
window.AfreraEnterprisePages = (function () {
  const { el, card, toast, field, gauge, pill } = window.AfreraUI;

  function unwrap(res) {
    return res.result || res.data || res;
  }

  function enterpriseHub(main, title) {
    title().textContent = 'Enterprise 10x Hub';
    main().innerHTML = '';
    const out = el('div');
    const load = el('button', {
      className: 'btn primary',
      type: 'button',
      text: 'Platform status + module map',
      onClick: async () => {
        try {
          const st = unwrap(await AfreraAPI.enterpriseOperate('platform', { action: 'status' }));
          const map = unwrap(await AfreraAPI.enterpriseOperate('platform', { action: 'module_map' }));
          out.innerHTML = '';
          out.appendChild(card('Status', el('pre', { className: 'pre', text: JSON.stringify(st, null, 2).slice(0, 4000) })));
          out.appendChild(card('Module map', el('pre', { className: 'pre', text: JSON.stringify(map.map || map, null, 2).slice(0, 6000) })));
          toast('Enterprise status loaded');
        } catch (e) {
          toast(e.message);
        }
      },
    });
    main().appendChild(
      card('Domains', [
        el('p', {
          text: 'Ecommerce · Insurance · Finance · Cold Storage · Rental · ERP · Platform — panel + operate on each route.',
        }),
        load,
        el('div', { className: 'links' }, [
          el('a', { href: '#/ecommerce', className: 'btn ghost', text: 'Ecommerce' }),
          el('a', { href: '#/insurance', className: 'btn ghost', text: 'Insurance' }),
          el('a', { href: '#/finance', className: 'btn ghost', text: 'Finance' }),
          el('a', { href: '#/cold-storage', className: 'btn ghost', text: 'Cold Storage' }),
          el('a', { href: '#/rental', className: 'btn ghost', text: 'Rental' }),
          el('a', { href: '#/erp', className: 'btn ghost', text: 'ERP' }),
        ]),
      ]),
    );
    main().appendChild(out);
  }

  function ecommercePage(main, title) {
    title().textContent = 'Ecommerce 10x';
    const out = el('div');
    const runQuote = el('button', {
      className: 'btn primary',
      type: 'button',
      text: 'Quote sample cart',
      onClick: async () => {
        try {
          const data = unwrap(
            await AfreraAPI.enterpriseOperate('ecommerce', {
              action: 'quote',
              lines: [
                { sku: 'TOM-ORG-1KG', qty: 3 },
                { sku: 'MILK-A2-1L', qty: 2 },
              ],
            }),
          );
          out.innerHTML = '';
          out.appendChild(card('Quote', el('pre', { className: 'pre', text: JSON.stringify(data, null, 2) })));
          if (data.total != null) out.appendChild(card('Total', gauge('INR (proxy)', Math.min(100, data.total / 20))));
          toast('Quote ready');
        } catch (e) {
          toast(e.message);
        }
      },
    });
    const runPanel = el('button', {
      className: 'btn',
      type: 'button',
      text: 'Business panel',
      onClick: async () => {
        try {
          const data = unwrap(await AfreraAPI.enterprisePanel('ecommerce', { action: 'quote' }));
          out.appendChild(
            card(
              'Panel',
              (data.opinions || []).map((o) =>
                el('div', {}, [el('strong', { text: o.lens_name }), el('p', { text: o.opinion })]),
              ),
            ),
          );
        } catch (e) {
          toast(e.message);
        }
      },
    });
    const runOrder = el('button', {
      className: 'btn ghost',
      type: 'button',
      text: 'Create order',
      onClick: async () => {
        try {
          const data = unwrap(
            await AfreraAPI.enterpriseOperate('ecommerce', {
              action: 'order',
              lines: [{ sku: 'RICE-BAS-5KG', qty: 1 }],
            }),
          );
          out.appendChild(card('Order', el('pre', { className: 'pre', text: JSON.stringify(data, null, 2) })));
        } catch (e) {
          toast(e.message);
        }
      },
    });
    main().innerHTML = '';
    main().appendChild(card('Operate', [runQuote, runPanel, runOrder]));
    main().appendChild(out);
  }

  function insurancePage(main, title) {
    title().textContent = 'Insurance 10x';
    const product = el(
      'select',
      {},
      ['crop_pmfby_like', 'livestock', 'warehouse', 'asset'].map((p) => el('option', { value: p, text: p })),
    );
    const sum = el('input', { type: 'number', value: '200000' });
    const out = el('div');
    const quote = el('button', {
      className: 'btn primary',
      type: 'button',
      text: 'Quote premium',
      onClick: async () => {
        try {
          const data = unwrap(
            await AfreraAPI.enterpriseOperate('insurance', {
              action: 'quote',
              product_id: product.value,
              sum_insured: Number(sum.value),
            }),
          );
          out.innerHTML = '';
          out.appendChild(card('Quote', el('pre', { className: 'pre', text: JSON.stringify(data, null, 2) })));
          out.appendChild(card('Safety', el('p', { className: 'muted', text: data.safety_floor || '' })));
        } catch (e) {
          toast(e.message);
        }
      },
    });
    const claim = el('button', {
      className: 'btn',
      type: 'button',
      text: 'FNOL claim intake',
      onClick: async () => {
        try {
          const data = unwrap(
            await AfreraAPI.enterpriseOperate('insurance', {
              action: 'claim_intake',
              claimed_amount: Number(sum.value) * 0.4,
            }),
          );
          out.appendChild(card('Claim', [pill('fraud ' + data.fraud_score, data.fraud_score > 0.55 ? 'warn' : 'ok'), el('pre', { className: 'pre', text: JSON.stringify(data, null, 2) })]));
        } catch (e) {
          toast(e.message);
        }
      },
    });
    const panel = el('button', {
      className: 'btn ghost',
      type: 'button',
      text: 'Panel',
      onClick: async () => {
        const data = unwrap(await AfreraAPI.enterprisePanel('insurance', { product_id: product.value }));
        out.appendChild(card('Panel consensus', el('p', { text: data.consensus || '' })));
      },
    });
    main().innerHTML = '';
    main().appendChild(card('Underwrite / claims', [field('Product', product), field('Sum insured', sum), quote, claim, panel]));
    main().appendChild(out);
  }

  function financePage(main, title) {
    title().textContent = 'Finance 10x';
    const out = el('div');
    const dash = el('button', {
      className: 'btn primary',
      type: 'button',
      text: 'Books dashboard',
      onClick: async () => {
        const data = unwrap(await AfreraAPI.enterpriseOperate('finance', { action: 'dashboard' }));
        out.innerHTML = '';
        out.appendChild(card('Books', el('pre', { className: 'pre', text: JSON.stringify(data, null, 2) })));
      },
    });
    const gst = el('button', {
      className: 'btn',
      type: 'button',
      text: 'GST estimate 5% on 10000',
      onClick: async () => {
        const data = unwrap(
          await AfreraAPI.enterpriseOperate('finance', { action: 'gst_estimate', taxable_value: 10000, rate: 0.05 }),
        );
        out.appendChild(card('GST', el('pre', { className: 'pre', text: JSON.stringify(data, null, 2) })));
      },
    });
    const panel = el('button', {
      className: 'btn ghost',
      type: 'button',
      text: 'Finance panel',
      onClick: async () => {
        const data = unwrap(await AfreraAPI.enterprisePanel('finance', { action: 'dashboard' }));
        out.appendChild(card('Consensus', el('p', { text: data.consensus || '' })));
      },
    });
    main().innerHTML = '';
    main().appendChild(card('Operate', [dash, gst, panel]));
    main().appendChild(out);
  }

  function coldPage(main, title) {
    title().textContent = 'Cold Storage 10x';
    const mt = el('input', { type: 'number', value: '5' });
    const out = el('div');
    const status = el('button', {
      className: 'btn primary',
      type: 'button',
      text: 'Bay status',
      onClick: async () => {
        const data = unwrap(await AfreraAPI.enterpriseOperate('cold_storage', { action: 'status' }));
        out.innerHTML = '';
        out.appendChild(card('Bays', el('pre', { className: 'pre', text: JSON.stringify(data, null, 2) })));
      },
    });
    const alloc = el('button', {
      className: 'btn',
      type: 'button',
      text: 'Allocate MT',
      onClick: async () => {
        const data = unwrap(
          await AfreraAPI.enterpriseOperate('cold_storage', { action: 'allocate', mt: Number(mt.value), temp_max: 5 }),
        );
        out.appendChild(card('Allocation', el('pre', { className: 'pre', text: JSON.stringify(data, null, 2) })));
      },
    });
    main().innerHTML = '';
    main().appendChild(card('Cold chain', [field('MT needed', mt), status, alloc]));
    main().appendChild(out);
  }

  function rentalPage(main, title) {
    title().textContent = 'Rental / Equipment 10x';
    const asset = el('input', { value: 'TR-101' });
    const days = el('input', { type: 'number', value: '3' });
    const out = el('div');
    const catalog = el('button', {
      className: 'btn primary',
      type: 'button',
      text: 'Fleet catalog',
      onClick: async () => {
        const data = unwrap(await AfreraAPI.enterpriseOperate('rental', { action: 'catalog' }));
        out.innerHTML = '';
        out.appendChild(card('Fleet', el('pre', { className: 'pre', text: JSON.stringify(data, null, 2) })));
      },
    });
    const book = el('button', {
      className: 'btn',
      type: 'button',
      text: 'Book asset',
      onClick: async () => {
        const data = unwrap(
          await AfreraAPI.enterpriseOperate('rental', {
            action: 'book',
            asset_id: asset.value,
            days: Number(days.value),
          }),
        );
        out.appendChild(card('Booking', el('pre', { className: 'pre', text: JSON.stringify(data, null, 2) })));
      },
    });
    main().innerHTML = '';
    main().appendChild(
      card('Rental', [field('Asset ID', asset), field('Days', days), catalog, book]),
    );
    main().appendChild(out);
  }

  function erpCorePage(main, title) {
    title().textContent = 'ERP Core 10x';
    const out = el('div');
    const stock = el('button', {
      className: 'btn primary',
      type: 'button',
      text: 'Stock snapshot',
      onClick: async () => {
        const data = unwrap(await AfreraAPI.enterpriseOperate('erp', { action: 'stock_snapshot' }));
        out.innerHTML = '';
        out.appendChild(card('Stock', el('pre', { className: 'pre', text: JSON.stringify(data, null, 2) })));
      },
    });
    const post = el('button', {
      className: 'btn',
      type: 'button',
      text: 'Post sales_order (sim)',
      onClick: async () => {
        const data = unwrap(
          await AfreraAPI.enterpriseOperate('erp', {
            action: 'post_document',
            doc_type: 'sales_order',
            lines: [{ sku: 'TOM-ORG-1KG', qty: 10 }],
          }),
        );
        out.appendChild(card('Document', el('pre', { className: 'pre', text: JSON.stringify(data, null, 2) })));
      },
    });
    const panel = el('button', {
      className: 'btn ghost',
      type: 'button',
      text: 'ERP panel',
      onClick: async () => {
        const data = unwrap(await AfreraAPI.enterprisePanel('erp', { doc_type: 'sales_order' }));
        out.appendChild(card('Consensus', el('p', { text: data.consensus || '' })));
      },
    });
    main().innerHTML = '';
    main().appendChild(card('ERP operate', [stock, post, panel]));
    main().appendChild(out);
  }

  return {
    enterpriseHub,
    ecommercePage,
    insurancePage,
    financePage,
    coldPage,
    rentalPage,
    erpCorePage,
  };
})();
