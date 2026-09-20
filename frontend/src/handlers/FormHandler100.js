export function FormHandler100(formData) {
  return { validate: (data) => true, submit: async (data) => ({ success: true }), reset: () => ({}) };
}
