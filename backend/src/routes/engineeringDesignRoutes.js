/**
 * AI Engineering, Design & Digital Twin — HTTP surface.
 *
 * Mounted at /api/v1/engineering-design.
 *
 * The specification behind this module lists 32 submodules and 6 specialised
 * engines. Three engines are built here with real engineering mathematics;
 * the rest are NOT, and no stub files were created for them. This codebase
 * already carries hundreds of byte-identical generated controllers and page
 * stubs, and they are the direct cause of most defects fixed on this branch --
 * adding more would repeat that mistake.
 *
 * GET /capabilities returns both the implemented and the not-implemented list
 * at runtime, each with a reason, so a client discovers the boundary instead
 * of assuming coverage.
 */

'use strict';

const express = require('express');

const router = express.Router();

const { authMiddleware } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');
const { InputError, NotImplementedError } = require('../services/engineering/advisory');
const structural = require('../services/engineering/structuralEngine');
const cost = require('../services/engineering/costEstimationEngine');
const solar = require('../services/engineering/solarEngine');
const sections = require('../services/engineering/sections');

// Everything here is authenticated and rate-limited. These endpoints run
// unbounded-ish numeric work (Monte Carlo up to 200k iterations) and their
// output carries an engineering claim, so neither is open to anonymous callers.
router.use(authMiddleware);
router.use(apiLimiter);

/**
 * Wrap an engine call.
 *   InputError          -> 400, with the specific failure
 *   NotImplementedError -> 501, naming what is missing and why
 *   anything else       -> 500, logged, not leaked as a clean 4xx
 */
function handle(fn) {
  return (req, res) => {
    try {
      const result = fn(req.body || {});
      return res.json({ success: true, data: result });
    } catch (error) {
      if (error instanceof InputError) {
        return res.status(400).json({ success: false, error: error.message, code: 'INVALID_INPUT' });
      }
      if (error instanceof NotImplementedError) {
        return res.status(501).json({ success: false, error: error.message, code: 'NOT_IMPLEMENTED' });
      }
      req.log?.error?.('Engineering engine fault', { error: error.message, stack: error.stack });
      return res.status(500).json({ success: false, error: 'Engineering engine fault', code: 'ENGINE_FAULT' });
    }
  };
}

// --- Structural -------------------------------------------------------------

router.post('/structural/wind-load', handle(structural.windLoad));
router.post('/structural/seismic-load', handle(structural.seismicLoad));
router.post('/structural/beam', handle(structural.beamSizing));
router.post('/structural/column', handle(structural.columnCapacity));
router.post('/structural/foundation', handle(structural.padFooting));

// --- Cost / bankability -----------------------------------------------------

router.post('/cost/estimate', handle(cost.estimateCapitalCost));
router.post('/cost/boq', handle(cost.extendBillOfQuantities));
router.post('/cost/financial-projection', handle(cost.financialProjection));
router.post('/cost/covenant-risk', handle(cost.covenantBreachProbability));
router.post('/cost/subsidy', handle(cost.matchSubsidySchemes));

// --- Solar ------------------------------------------------------------------

router.post('/solar/tilt', handle(solar.optimalTilt));
router.post('/solar/row-spacing', handle(solar.rowSpacing));
router.post('/solar/yield', handle(solar.annualYield));
router.post('/solar/battery', handle(solar.batterySizing));

// --- Reference data ---------------------------------------------------------

router.get('/reference/sections', (req, res) => {
  try {
    return res.json({ success: true, data: sections.listSections(req.query.table) });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message, code: 'INVALID_INPUT' });
  }
});

// --- Capabilities -----------------------------------------------------------

const IMPLEMENTED = {
  structural: [
    { endpoint: 'POST /structural/wind-load', basis: 'IS 875 (Part 3) : 2015 cl. 6.3, 7.2' },
    { endpoint: 'POST /structural/seismic-load', basis: 'IS 1893 (Part 1) : 2016 cl. 6.4.2, 7.6.3' },
    { endpoint: 'POST /structural/beam', basis: 'IS 800 : 2007 cl. 8.2.1.2, with IS 808 section selection' },
    { endpoint: 'POST /structural/column', basis: 'IS 800 : 2007 cl. 7.1.2.1 Perry-Robertson' },
    { endpoint: 'POST /structural/foundation', basis: 'IS 456 : 2000 cl. 34.1 plan sizing only' },
  ],
  cost: [
    { endpoint: 'POST /cost/estimate', basis: 'Parametric area-rate bands' },
    { endpoint: 'POST /cost/boq', basis: 'Quantity x caller-supplied rate extension' },
    { endpoint: 'POST /cost/financial-projection', basis: 'Level-payment amortisation, DSCR, NPV' },
    { endpoint: 'POST /cost/covenant-risk', basis: 'Seeded Monte Carlo over lognormal NOI' },
    { endpoint: 'POST /cost/subsidy', basis: 'Rule evaluation of a caller-supplied scheme set' },
  ],
  solar: [
    { endpoint: 'POST /solar/tilt', basis: 'Latitude-based fixed-tilt rule of thumb' },
    { endpoint: 'POST /solar/row-spacing', basis: 'Winter-solstice solar-noon shadow geometry' },
    { endpoint: 'POST /solar/yield', basis: 'PR model with NOCT temperature derating and degradation' },
    { endpoint: 'POST /solar/battery', basis: 'Autonomy-based capacity sizing' },
  ],
};

const NOT_IMPLEMENTED = [
  {
    capability: 'Lateral-torsional buckling of beams',
    reference: 'IS 800 : 2007 cl. 8.2.2',
    reason: 'Needs torsional and warping constants (It, Iw) and the effective laterally '
      + 'unsupported length. Until this exists, a beam result from /structural/beam is valid '
      + 'only for a fully restrained compression flange.',
  },
  {
    capability: 'Combined axial force and bending (beam-column interaction)',
    reference: 'IS 800 : 2007 cl. 9.3',
    reason: 'Needs the section classification and moment amplification that this engine does not compute.',
  },
  {
    capability: 'Reinforced concrete foundation design',
    reference: 'IS 456 : 2000 cl. 31, 34',
    reason: 'Only the plan area is sized. Depth, flexural reinforcement, one-way shear and '
      + 'punching shear are not designed.',
  },
  {
    capability: 'CFD — airflow, temperature, humidity and CO2 distribution',
    reason: 'Requires a Navier-Stokes solver. No CFD engine is available in this deployment.',
  },
  {
    capability: 'Thermal modelling — heat transfer, insulation optimisation, refrigeration sizing',
    reason: 'Requires a transient thermal solver and a climate file; neither is connected.',
  },
  {
    capability: 'BIM / CAD generation (.rvt, .dwg)',
    reason: 'Requires the Revit or AutoCAD API. No such licence or service is available here.',
  },
  {
    capability: 'Digital twin — live facility monitoring',
    reason: 'Requires a live IoT sensor feed. No hardware feed exists in this deployment.',
  },
  {
    capability: 'Drone survey, GIS/satellite terrain, live irradiation (TMY)',
    reason: 'Requires third-party geospatial and meteorological services that are not connected. '
      + 'This is why /solar/yield takes irradiation from the caller rather than looking it up.',
  },
  {
    capability: 'Tender / EPC document generation and construction progress monitoring',
    reason: 'Not built. Would depend on the procurement and scheduling modules, which do not '
      + 'expose the needed state.',
  },
];

router.get('/capabilities', (req, res) => {
  res.json({
    success: true,
    data: {
      module: 'AI Engineering, Design & Digital Twin',
      advisory: true,
      honestyBoundary:
        'These are first-pass sizing calculations, not certified design. There is no '
        + 'finite-element solver, no live supplier price feed and no measured irradiation feed '
        + 'in this deployment. Every result carries advisory:true and a basis string; cost '
        + 'results additionally carry priceBasis.',
      implemented: IMPLEMENTED,
      implementedCount: Object.values(IMPLEMENTED).reduce((n, group) => n + group.length, 0),
      notImplemented: NOT_IMPLEMENTED,
      notImplementedCount: NOT_IMPLEMENTED.length,
      stubPolicy:
        'No stub files were created for the unimplemented capabilities. They are declared here '
        + 'and absent from the codebase, rather than present as empty handlers that return '
        + 'plausible-looking numbers.',
    },
  });
});

module.exports = router;
