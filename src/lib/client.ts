import { supabase, Database } from './supabase'

// Fetch a client and its meta by client_id
export async function getClientWithMeta(clientId: string) {
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single()

  if (clientError) return { client: null, meta: null, error: clientError }

  const { data: meta, error: metaError } = await supabase
    .from('clients_meta')
    .select('*')
    .eq('client_id', clientId)
    .single()

  return { client, meta, error: metaError }
}

// Create a client (optionally also create empty meta)
export async function createClient(
  client: Omit<Database['public']['Tables']['clients']['Insert'], 'id'>,
  withEmptyMeta = true
) {
  const { data, error } = await supabase
    .from('clients')
    .insert([client])
    .select()
    .single()

  if (error || !data) return { client: null, meta: null, error }

  let meta = null
  if (withEmptyMeta) {
    const { data: metaData, error: metaError } = await supabase
      .from('clients_meta')
      .insert([{ client_id: data.id }])
      .select()
      .single()
    if (metaError) return { client: data, meta: null, error: metaError }
    meta = metaData
  }
  return { client: data, meta, error: null }
}

// Update or create meta for a client
export async function upsertClientMeta(
  clientId: string,
  meta: Partial<Omit<Database['public']['Tables']['clients_meta']['Insert'], 'client_id'>>
) {
  // Upsert: if exists, update; if not, insert
  const { data, error } = await supabase
    .from('clients_meta')
    .upsert([{ ...meta, client_id: clientId }], { onConflict: 'client_id' })
    .select()
    .single()
  return { meta: data, error }
}

// Fetch all clients (id and name for listing)
export async function getAllClients() {
  const { data, error } = await supabase
    .from('clients')
    .select('id, name')
    .order('name', { ascending: true })
  return { clients: data, error }
} 