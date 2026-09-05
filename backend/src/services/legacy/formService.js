/**
 * Enterprise Form Management Service
 * Provides a metadata-driven form runtime for the AFRERA form platform.
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const { logger } = require('../../../utils/logger');
const { getPostgreSQL } = require('../../../database/connection');
const { authMiddleware, requireRole } = require('../../../middleware/auth');

const router = express.Router();
const STORE_PATH = path.join(__dirname, '..', '..', 'database', 'form_store.json');
const SCHEMA_PATH = path.join(__dirname, '..', '..', 'database', 'form_management_schema.sql');

function buildId(prefix = 'form') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function ensureDefaultStore() {
  return {
    forms: [],
    submissions: []
  };
}

// FIXES.md H3 (2026-08-28): converted from fs.readFileSync/writeFileSync
// (blocking the event loop on every fallback-mode form request) to
// fs.promises - all call sites are already inside async functions. Same
// fix already applied to the equivalent pattern in
// services/dual-use/authService.js.
async function readStore() {
  try {
    if (!fs.existsSync(STORE_PATH)) {
      await fs.promises.writeFile(STORE_PATH, JSON.stringify(ensureDefaultStore(), null, 2));
      return ensureDefaultStore();
    }

    const raw = await fs.promises.readFile(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      forms: Array.isArray(parsed.forms) ? parsed.forms : [],
      submissions: Array.isArray(parsed.submissions) ? parsed.submissions : []
    };
  } catch (error) {
    logger.warn('Unable to read form store, resetting it', { error: error.message });
    return ensureDefaultStore();
  }
}

async function writeStore(store) {
  try {
    await fs.promises.writeFile(STORE_PATH, JSON.stringify(store, null, 2));
    return true;
  } catch (error) {
    logger.error('Unable to persist form store', { error: error.message, stack: error.stack });
    return false;
  }
}

async function ensureDatabaseSchema() {
  const pg = getPostgreSQL();
  if (!pg) {
    return false;
  }

  try {
    const schema = await fs.promises.readFile(SCHEMA_PATH, 'utf8');
    await pg.query(schema);
    logger.info('Form management schema ready in PostgreSQL');
    return true;
  } catch (error) {
    logger.warn('Unable to initialize PostgreSQL form schema', { error: error.message });
    return false;
  }
}

async function loadFormsFromDb() {
  let pg = getPostgreSQL();
  if (!pg) {
    return null;
  }

  try {
    await ensureDatabaseSchema();
    const formResult = await pg.query('SELECT id, title, description, category, status, version, fields, workflow, metadata, created_at, updated_at FROM form_definitions ORDER BY created_at DESC');
    const submissionResult = await pg.query('SELECT id, form_id, payload, status, created_at FROM form_submissions ORDER BY created_at DESC');

    return {
      forms: formResult.rows.map((row) => ({
        ...row,
        fields: row.fields || [],
        workflow: row.workflow || {},
        metadata: row.metadata || {}
      })),
      submissions: submissionResult.rows.map((row) => ({
        ...row,
        payload: row.payload || {}
      }))
    };
  } catch (error) {
    logger.warn('Falling back to file-based form storage', { error: error.message });
    return null;
  }
}

function buildAiInsights(formData) {
  const fieldCount = Array.isArray(formData.fields) ? formData.fields.length : 0;
  const requiredCount = Array.isArray(formData.fields)
    ? formData.fields.filter((field) => field.required).length
    : 0;
  const workflowStages = Array.isArray(formData.workflow?.stages) ? formData.workflow.stages.length : 0;
  const suggestions = [];

  if (fieldCount > 8) {
    suggestions.push('Group repetitive fields into logical sections to reduce friction.');
  }

  if (requiredCount > 4) {
    suggestions.push('Reduce required fields where possible to increase completion rates.');
  }

  if (!workflowStages) {
    suggestions.push('Add an approval workflow to support governance and sign-off.');
  }

  if (suggestions.length === 0) {
    suggestions.push('The form is ready for pilot deployment.');
  }

  return {
    score: Math.min(98, 72 + fieldCount * 2 + requiredCount + workflowStages * 4),
    summary: suggestions,
    generatedAt: new Date().toISOString()
  };
}

function normalizeForm(formData, existingForm = null) {
  const fields = Array.isArray(formData.fields)
    ? formData.fields.map((field, index) => ({
        id: field.id || `field-${index + 1}`,
        label: field.label || `Field ${index + 1}`,
        type: field.type || 'text',
        required: Boolean(field.required),
        placeholder: field.placeholder || '',
        options: Array.isArray(field.options) ? field.options : [],
        defaultValue: field.defaultValue || '',
        helpText: field.helpText || ''
      }))
    : [];

  const workflow = formData.workflow || {
    enabled: true,
    stages: [
      { name: 'Draft', role: 'submitter' },
      { name: 'Review', role: 'manager' },
      { name: 'Approval', role: 'approver' }
    ]
  };

  const now = new Date().toISOString();

  return {
    id: existingForm?.id || formData.id || buildId('form'),
    title: formData.title || 'Untitled Form',
    description: formData.description || '',
    category: formData.category || 'general',
    status: formData.status || 'draft',
    version: existingForm?.version || 1,
    fields,
    workflow,
    metadata: {
      owner: formData.metadata?.owner || 'system',
      department: formData.metadata?.department || 'operations',
      compliance: formData.metadata?.compliance || 'standard',
      tags: Array.isArray(formData.metadata?.tags) ? formData.metadata.tags : []
    },
    aiInsights: buildAiInsights({ fields, workflow }),
    createdAt: existingForm?.createdAt || now,
    updatedAt: now
  };
}

async function listForms(search = '', category = '', status = '') {
  const databaseForms = await loadFormsFromDb();
  let forms = databaseForms?.forms || (await readStore()).forms;

  if (databaseForms === null) {
    forms = (await readStore()).forms;
  }

  return forms
    .filter((form) => !category || form.category === category)
    .filter((form) => !status || form.status === status)
    .filter((form) => {
      if (!search) {
        return true;
      }
      const haystack = `${form.title} ${form.description} ${form.category}`.toLowerCase();
      return haystack.includes(search.toLowerCase());
    })
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

async function getFormById(formId) {
  const forms = await listForms();
  return forms.find((form) => form.id === formId) || null;
}

async function createForm(formData) {
  const normalized = normalizeForm(formData);
  let pg = getPostgreSQL();

  if (pg) {
    try {
      await ensureDatabaseSchema();
      await pg.query(
        `INSERT INTO form_definitions (id, title, description, category, status, version, fields, workflow, metadata, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [normalized.id, normalized.title, normalized.description, normalized.category, normalized.status, normalized.version, JSON.stringify(normalized.fields), JSON.stringify(normalized.workflow), JSON.stringify(normalized.metadata), normalized.createdAt, normalized.updatedAt]
      );
      return normalized;
    } catch (error) {
      logger.warn('PostgreSQL insert failed, using file-store for forms', { error: error.message });
    }
  }

  const store = await readStore();
  store.forms.unshift(normalized);
  await writeStore(store);
  return normalized;
}

async function updateForm(formId, formData) {
  const existingForm = await getFormById(formId);
  if (!existingForm) {
    throw new Error('Form not found');
  }

  let normalized = normalizeForm({ ...existingForm, ...formData }, existingForm);
  normalized.version = (existingForm.version || 1) + 1;

  let pg = getPostgreSQL();
  if (pg) {
    try {
      await ensureDatabaseSchema();
      await pg.query(
        `UPDATE form_definitions SET title=$2, description=$3, category=$4, status=$5, version=$6, fields=$7, workflow=$8, metadata=$9, updated_at=$10 WHERE id=$1`,
        [formId, normalized.title, normalized.description, normalized.category, normalized.status, normalized.version, JSON.stringify(normalized.fields), JSON.stringify(normalized.workflow), JSON.stringify(normalized.metadata), normalized.updatedAt]
      );
      return normalized;
    } catch (error) {
      logger.warn('PostgreSQL update failed, using file-store for forms', { error: error.message });
    }
  }

  let store = await readStore();
  store.forms = store.forms.map((form) => (form.id === formId ? normalized : form));
  await writeStore(store);
  return normalized;
}

async function deleteForm(formId) {
  let pg = getPostgreSQL();
  if (pg) {
    try {
      await ensureDatabaseSchema();
      await pg.query('DELETE FROM form_definitions WHERE id=$1', [formId]);
      return { success: true, id: formId };
    } catch (error) {
      logger.warn('PostgreSQL delete failed, using file-store for forms', { error: error.message });
    }
  }

  let store = await readStore();
  store.forms = store.forms.filter((form) => form.id !== formId);
  await writeStore(store);
  return { success: true, id: formId };
}

async function submitForm(formId, payload) {
  const form = await getFormById(formId);
  if (!form) {
    throw new Error('Form not found');
  }

  const submission = {
    id: buildId('submission'),
    formId,
    payload,
    status: 'submitted',
    submittedAt: new Date().toISOString(),
    reviewState: 'pending'
  };

  let pg = getPostgreSQL();
  if (pg) {
    try {
      await ensureDatabaseSchema();
      await pg.query(
        `INSERT INTO form_submissions (id, form_id, payload, status, created_at) VALUES ($1, $2, $3, $4, $5)`,
        [submission.id, formId, JSON.stringify(payload), submission.status, submission.submittedAt]
      );
      return submission;
    } catch (error) {
      logger.warn('PostgreSQL submission write failed, using file-store', { error: error.message });
    }
  }

  let store = await readStore();
  store.submissions.unshift(submission);
  await writeStore(store);
  return submission;
}

async function listSubmissions(formId) {
  let pg = getPostgreSQL();
  if (pg) {
    try {
      await ensureDatabaseSchema();
      const result = await pg.query('SELECT id, form_id, payload, status, created_at FROM form_submissions WHERE form_id=$1 ORDER BY created_at DESC', [formId]);
      return result.rows.map((row) => ({ ...row, payload: row.payload || {} }));
    } catch (error) {
      logger.warn('PostgreSQL submission read failed, using file-store', { error: error.message });
    }
  }

  let store = await readStore();
  return store.submissions.filter((submission) => submission.formId === formId).sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
}

router.get('/', async (req, res) => {
  try {
    const { search = '', category = '', status = '' } = req.query;
    let forms = await listForms(search, category, status);
    res.json({ forms });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/templates', async (req, res) => {
  try {
    const templates = [
      {
        id: 'template-packhouse-dpr',
        title: 'Packhouse DPR',
        category: 'operations',
        description: 'Operational daily reporting for packhouse conditions and approvals.'
      },
      {
        id: 'template-inspection',
        title: 'Inspection Checklist',
        category: 'quality',
        description: 'Structured quality inspection flow with digital signature support.'
      },
      {
        id: 'template-shipment',
        title: 'Shipment Declaration',
        category: 'logistics',
        description: 'Shipment declaration and traceability workflow with GIS metadata.'
      }
    ];

    res.json({ templates });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    let form = await createForm(req.body);
    res.status(201).json(form);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    let form = await getFormById(req.params.id);
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }
    res.json(form);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// form_definitions has no per-user ownership column (it's a shared
// config/workflow object, not user-owned content like a product), so the
// IDOR fix here is a role gate rather than an ownership check: any
// authenticated user could previously edit or delete any form definition.
router.put('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    let form = await updateForm(req.params.id, req.body);
    res.json(form);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

router.delete('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    let result = await deleteForm(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/submit', authMiddleware, async (req, res) => {
  try {
    let submission = await submitForm(req.params.id, req.body);
    res.status(201).json(submission);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

router.get('/:id/submissions', async (req, res) => {
  try {
    const submissions = await listSubmissions(req.params.id);
    res.json({ submissions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = {
  router,
  createForm,
  getFormById,
  listForms,
  updateForm,
  deleteForm,
  submitForm,
  listSubmissions,
  buildAiInsights
};

