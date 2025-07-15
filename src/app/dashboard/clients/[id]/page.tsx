"use client"
import { useEffect, useState } from 'react'
import { getClientWithMeta, upsertClientMeta } from '@/lib/client'
import { ClientMetaForm } from '@/components/clients/ClientMetaForm'
import { useRouter } from 'next/navigation'

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const clientId = params.id
  const [client, setClient] = useState<any>(null)
  const [meta, setMeta] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const { client, meta, error } = await getClientWithMeta(clientId)
      if (error) setError(error.message)
      setClient(client)
      setMeta(meta || {})
      setLoading(false)
    }
    fetchData()
  }, [clientId])

  const handleMetaChange = (newMeta: any) => {
    setMeta(newMeta)
  }

  const handleSaveMeta = async () => {
    setSaving(true)
    setError(null)
    const { error } = await upsertClientMeta(clientId, meta)
    if (error) setError(error.message)
    setSaving(false)
  }

  if (loading) return <div>Loading...</div>
  if (!client) return <div>Client not found</div>

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h2 className="text-2xl font-bold mb-4">{client.name}</h2>
      <div className="mb-6">
        <div className="mb-2"><strong>Email:</strong> {client.email}</div>
        <div className="mb-2"><strong>Company:</strong> {client.company}</div>
        <div className="mb-2"><strong>Status:</strong> {client.status}</div>
      </div>
      <ClientMetaForm value={meta} onChange={handleMetaChange} />
      <button
        className="mt-4 px-4 py-2 bg-primary text-white rounded"
        onClick={handleSaveMeta}
        disabled={saving}
      >
        {saving ? 'Saving...' : 'Save Meta'}
      </button>
      {error && <div className="text-red-500 mt-2">{error}</div>}
    </div>
  )
} 