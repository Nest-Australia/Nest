import * as React from 'react'
import { render } from '@react-email/components'
import { createClient } from '@supabase/supabase-js'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { TEMPLATES } from '@/lib/email-templates/registry'

const TEMPLATE_NAME = 'job-brief-submission'
const SITE_NAME = 'Nest'
const SENDER_DOMAIN = 'notify.mynest.pro'
const FROM_DOMAIN = 'mynest.pro'

const ContactSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(254),
  phone: z.string().min(3).max(40),
  address: z.string().min(2).max(300),
})

const SummarySchema = z.object({
  title: z.string().max(200).optional().default(''),
  category: z.string().max(80).optional().default(''),
  overview: z.string().max(2000).optional().default(''),
  scopeOfWork: z.array(z.string().max(500)).max(30).optional().default([]),
  keyDetails: z
    .array(z.object({ label: z.string().max(80), value: z.string().max(500) }))
    .max(30)
    .optional()
    .default([]),
  accessAndLocation: z.string().max(1000).optional().default(''),
  timing: z.string().max(500).optional().default(''),
  additionalNotes: z.string().max(2000).optional().default(''),
  openQuestions: z.array(z.string().max(500)).max(20).optional().default([]),
})

const BodySchema = z.object({
  contact: ContactSchema,
  summary: SummarySchema,
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export const Route = createFileRoute('/api/public/submit-request')({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      POST: async ({ request }) => {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (!supabaseUrl || !supabaseServiceKey) {
          console.error('Supabase env not configured')
          return Response.json({ error: 'Email service not configured' }, { status: 500 })
        }

        let raw: unknown
        try {
          raw = await request.json()
        } catch {
          return Response.json({ error: 'Invalid JSON' }, { status: 400 })
        }

        const parsed = BodySchema.safeParse(raw)
        if (!parsed.success) {
          return Response.json(
            { error: 'Invalid request', issues: parsed.error.issues },
            { status: 400 },
          )
        }

        const { contact, summary } = parsed.data
        const entry = TEMPLATES[TEMPLATE_NAME]
        if (!entry) {
          return Response.json({ error: 'Server configuration error' }, { status: 500 })
        }

        const recipient = entry.to!
        const submittedAt = new Date().toUTCString()
        const templateData = { contact, summary, submittedAt }

        let html: string
        let text: string
        try {
          const element = React.createElement(entry.component, templateData)
          html = await render(element)
          text = await render(element, { plainText: true })
        } catch (err) {
          console.error('Failed to render email', err)
          return Response.json({ error: 'Failed to prepare email' }, { status: 500 })
        }

        const subject =
          typeof entry.subject === 'function'
            ? entry.subject(templateData)
            : entry.subject

        const messageId = crypto.randomUUID()
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // Get or create unsubscribe token for recipient (required by Lovable Emails)
        const normalizedEmail = recipient.toLowerCase()
        let unsubscribeToken: string
        const { data: existingToken } = await supabase
          .from('email_unsubscribe_tokens')
          .select('token, used_at')
          .eq('email', normalizedEmail)
          .maybeSingle()

        if (existingToken && !existingToken.used_at) {
          unsubscribeToken = existingToken.token
        } else {
          const bytes = new Uint8Array(32)
          crypto.getRandomValues(bytes)
          unsubscribeToken = Array.from(bytes)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')
          await supabase
            .from('email_unsubscribe_tokens')
            .upsert(
              { token: unsubscribeToken, email: normalizedEmail },
              { onConflict: 'email', ignoreDuplicates: true },
            )
          const { data: storedToken } = await supabase
            .from('email_unsubscribe_tokens')
            .select('token')
            .eq('email', normalizedEmail)
            .maybeSingle()
          if (storedToken?.token) unsubscribeToken = storedToken.token
        }

        await supabase.from('email_send_log').insert({
          message_id: messageId,
          template_name: TEMPLATE_NAME,
          recipient_email: recipient,
          status: 'pending',
        })

        const { error: enqueueError } = await supabase.rpc('enqueue_email', {
          queue_name: 'transactional_emails',
          payload: {
            message_id: messageId,
            to: recipient,
            from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
            reply_to: contact.email,
            sender_domain: SENDER_DOMAIN,
            subject,
            html,
            text,
            purpose: 'transactional',
            label: TEMPLATE_NAME,
            idempotency_key: messageId,
            unsubscribe_token: unsubscribeToken,
            queued_at: new Date().toISOString(),
          },
        })


        if (enqueueError) {
          console.error('Failed to enqueue email', enqueueError)
          await supabase.from('email_send_log').insert({
            message_id: messageId,
            template_name: TEMPLATE_NAME,
            recipient_email: recipient,
            status: 'failed',
            error_message: 'Failed to enqueue email',
          })
          return Response.json({ error: 'Failed to send request' }, { status: 500 })
        }

        return Response.json(
          { success: true, id: messageId, queued: true },
          { status: 200, headers: corsHeaders },
        )
      },
    },
  },
})
