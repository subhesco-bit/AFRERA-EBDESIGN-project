export function FormHandler002(formData) {
  return { validate: (data) => true, submit: async (data) => ({ success: true }), reset: () => ({}) };
}
