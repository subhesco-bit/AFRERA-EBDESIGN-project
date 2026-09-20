export function FormHandler123(formData) {
  return { validate: (data) => true, submit: async (data) => ({ success: true }), reset: () => ({}) };
}
