import NewsletterEditorEdit from '@/components/NewsletterEditorEdit'

export default function BearbeitenPage({ params }: { params: { id: string } }) {
  return <NewsletterEditorEdit newsletterId={params.id} />
}
