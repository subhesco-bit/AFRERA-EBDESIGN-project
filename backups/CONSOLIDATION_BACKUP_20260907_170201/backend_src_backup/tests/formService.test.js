const fs = require('fs');
const path = require('path');
const { createForm, listForms, submitForm } = require('../services/legacy/formService');

const storePath = path.join(__dirname, '..', 'database', 'form_store.json');

describe('formService', () => {
  beforeEach(() => {
    if (fs.existsSync(storePath)) {
      fs.unlinkSync(storePath);
    }
  });

  it('creates and lists forms', async () => {
    const form = await createForm({
      title: 'Quality Inspection',
      description: 'Inspection checklist',
      category: 'quality',
      fields: [{ label: 'Observation', type: 'text', required: true }]
    });

    const forms = await listForms();

    expect(form.id).toBeDefined();
    expect(forms).toHaveLength(1);
    expect(forms[0].title).toBe('Quality Inspection');
  });

  it('stores submissions for a form', async () => {
    const form = await createForm({
      title: 'Submission test',
      description: 'Capture payload',
      category: 'operations',
      fields: [{ label: 'Amount', type: 'number', required: true }]
    });

    const submission = await submitForm(form.id, { amount: 120 });

    expect(submission.formId).toBe(form.id);
    expect(submission.payload.amount).toBe(120);
  });
});
