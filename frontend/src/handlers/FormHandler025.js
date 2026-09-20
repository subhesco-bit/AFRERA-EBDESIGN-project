export function FormHandler025(formData) {
  return { validate: (data) => true, submit: async (data) => ({ success: true }), reset: () => ({}) };
}
