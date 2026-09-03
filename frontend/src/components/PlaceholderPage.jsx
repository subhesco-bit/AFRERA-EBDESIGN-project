import AdvancedPageShell from './AdvancedPageShell'

export default function PlaceholderPage({ title, description, featureName }) {
  return (
    <AdvancedPageShell
      title={title}
      description={description}
      featureName={featureName}
    />
  )
}