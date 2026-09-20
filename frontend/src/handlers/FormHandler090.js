export function FormHandler090(formData) {
  return { validate: (data) => true, submit: async (data) => ({ success: true }), reset: () => ({}) };
}
