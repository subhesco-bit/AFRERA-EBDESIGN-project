module.exports = function viteEnvForJest({ types: t }) {
  return {
    name: 'vite-env-for-jest',
    visitor: {
      MetaProperty(path) {
        if (path.node.meta.name === 'import' && path.node.property.name === 'meta') {
          path.replaceWith(t.memberExpression(t.identifier('globalThis'), t.identifier('__VITE_ENV__')))
        }
      }
    }
  }
}
