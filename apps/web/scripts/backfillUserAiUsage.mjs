import { createClient } from '@supabase/supabase-js'

const PAGE_SIZE = 1000

function requiredEnv(name) {
  const value = process.env[name]
  if (!value || value.trim().length === 0) {
    throw new Error(`${name} is required to run AI usage backfill.`)
  }
  return value
}

function createServiceClient() {
  return createClient(
    requiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}

function monthKeyFromTimestamp(timestamp) {
  const date = new Date(timestamp)
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function aggregateUserAIUsage(calls, photoAnalysisCallIds) {
  const photoCallIdSet = new Set(photoAnalysisCallIds)
  const usageByUserAndMonth = new Map()

  for (const call of calls) {
    if (!call.user_id) continue

    const monthKey = monthKeyFromTimestamp(call.created_at)
    const aggregateKey = `${call.user_id}:${monthKey}`
    const current = usageByUserAndMonth.get(aggregateKey) ?? {
      user_id: call.user_id,
      month_key: monthKey,
      llm_calls_count: 0,
      photo_analysis_count: 0,
      tokens_in_total: 0,
      tokens_out_total: 0,
      cost_usd_total: 0,
    }

    current.llm_calls_count += 1
    current.tokens_in_total += call.tokens_in ?? 0
    current.tokens_out_total += call.tokens_out ?? 0
    current.cost_usd_total += call.cost_usd ?? 0

    if (photoCallIdSet.has(call.id)) {
      current.photo_analysis_count += 1
    }

    usageByUserAndMonth.set(aggregateKey, current)
  }

  return [...usageByUserAndMonth.values()]
    .sort((left, right) => {
      if (left.user_id === right.user_id) {
        return left.month_key.localeCompare(right.month_key)
      }
      return left.user_id.localeCompare(right.user_id)
    })
    .map((row) => ({
      ...row,
      cost_usd_total: Number(row.cost_usd_total.toFixed(6)),
    }))
}

async function fetchAllLlmCalls(supabase) {
  const rows = []

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('llm_calls')
      .select('id, user_id, created_at, cost_usd, tokens_in, tokens_out')
      .not('user_id', 'is', null)
      .order('created_at', { ascending: true })
      .range(from, from + PAGE_SIZE - 1)

    if (error) {
      throw new Error(`Failed to load llm_calls: ${error.message}`)
    }

    const batch = data ?? []
    rows.push(...batch)

    if (batch.length < PAGE_SIZE) {
      break
    }
  }

  return rows
}

async function fetchPhotoAnalysisCallIds(supabase) {
  const llmCallIds = new Set()

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('meal_logs')
      .select('llm_call_id, created_at')
      .eq('source', 'photo')
      .not('llm_call_id', 'is', null)
      .order('created_at', { ascending: true })
      .range(from, from + PAGE_SIZE - 1)

    if (error) {
      throw new Error(`Failed to load photo meal logs: ${error.message}`)
    }

    const batch = data ?? []
    for (const row of batch) {
      if (typeof row.llm_call_id === 'string' && row.llm_call_id.length > 0) {
        llmCallIds.add(row.llm_call_id)
      }
    }

    if (batch.length < PAGE_SIZE) {
      break
    }
  }

  return llmCallIds
}

async function replaceUserAiUsage(supabase, rows) {
  const now = new Date().toISOString()
  const { error: deleteError } = await supabase
    .from('user_ai_usage')
    .delete()
    .not('user_id', 'is', null)

  if (deleteError) {
    throw new Error(`Failed to clear user_ai_usage: ${deleteError.message}`)
  }

  if (rows.length === 0) {
    return
  }

  for (let from = 0; from < rows.length; from += PAGE_SIZE) {
    const chunk = rows.slice(from, from + PAGE_SIZE).map((row) => ({
      ...row,
      updated_at: now,
    }))

    const { error: insertError } = await supabase.from('user_ai_usage').insert(chunk)

    if (insertError) {
      throw new Error(`Failed to insert user_ai_usage rows: ${insertError.message}`)
    }
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const supabase = createServiceClient()

  const [llmCalls, photoAnalysisCallIds] = await Promise.all([
    fetchAllLlmCalls(supabase),
    fetchPhotoAnalysisCallIds(supabase),
  ])

  const aggregatedRows = aggregateUserAIUsage(llmCalls, photoAnalysisCallIds)
  const totalCost = aggregatedRows.reduce((sum, row) => sum + row.cost_usd_total, 0)
  const totalCalls = aggregatedRows.reduce((sum, row) => sum + row.llm_calls_count, 0)
  const totalPhotos = aggregatedRows.reduce((sum, row) => sum + row.photo_analysis_count, 0)

  console.log(
    JSON.stringify(
      {
        dryRun,
        llmCalls: llmCalls.length,
        userAiUsageRows: aggregatedRows.length,
        totalCalls,
        totalPhotos,
        totalCostUsd: Number(totalCost.toFixed(6)),
      },
      null,
      2,
    ),
  )

  if (dryRun) {
    return
  }

  await replaceUserAiUsage(supabase, aggregatedRows)
  console.log('Backfill complete.')
}

void main().catch((error) => {
  const message = error instanceof Error ? error.message : 'Unknown backfill error'
  console.error(message)
  process.exitCode = 1
})
