import * as React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface KeyDetail {
  label: string
  value: string
}

interface ProjectSummary {
  title?: string
  category?: string
  overview?: string
  scopeOfWork?: string[]
  keyDetails?: KeyDetail[]
  accessAndLocation?: string
  timing?: string
  additionalNotes?: string
  openQuestions?: string[]
}

interface Contact {
  name?: string
  email?: string
  phone?: string
  address?: string
}

interface JobBriefSubmissionProps {
  summary?: ProjectSummary
  contact?: Contact
  submittedAt?: string
}

const JobBriefSubmissionEmail = ({
  summary,
  contact,
  submittedAt,
}: JobBriefSubmissionProps) => {
  const title = summary?.title || 'New job request'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{`New job request: ${title}`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>New job request</Heading>
          <Text style={meta}>
            {submittedAt
              ? `Submitted ${submittedAt}`
              : 'A new homeowner just submitted a request via Nest.'}
          </Text>

          <Section style={card}>
            <Heading as="h2" style={h2}>
              Customer
            </Heading>
            <Text style={kv}>
              <strong>Name:</strong> {contact?.name || '—'}
            </Text>
            <Text style={kv}>
              <strong>Email:</strong> {contact?.email || '—'}
            </Text>
            <Text style={kv}>
              <strong>Phone:</strong> {contact?.phone || '—'}
            </Text>
            <Text style={kv}>
              <strong>Address:</strong> {contact?.address || '—'}
            </Text>
          </Section>

          <Hr style={hr} />

          <Heading as="h2" style={h2}>
            {title}
          </Heading>
          {summary?.category ? (
            <Text style={tag}>{summary.category}</Text>
          ) : null}

          {summary?.overview ? (
            <>
              <Heading as="h3" style={h3}>
                Overview
              </Heading>
              <Text style={text}>{summary.overview}</Text>
            </>
          ) : null}

          {summary?.scopeOfWork && summary.scopeOfWork.length > 0 ? (
            <>
              <Heading as="h3" style={h3}>
                Scope of work
              </Heading>
              {summary.scopeOfWork.map((item, i) => (
                <Text key={i} style={listItem}>
                  • {item}
                </Text>
              ))}
            </>
          ) : null}

          {summary?.keyDetails && summary.keyDetails.length > 0 ? (
            <>
              <Heading as="h3" style={h3}>
                Key details
              </Heading>
              {summary.keyDetails.map((d, i) => (
                <Text key={i} style={kv}>
                  <strong>{d.label}:</strong> {d.value}
                </Text>
              ))}
            </>
          ) : null}

          {summary?.accessAndLocation ? (
            <>
              <Heading as="h3" style={h3}>
                Access &amp; location
              </Heading>
              <Text style={text}>{summary.accessAndLocation}</Text>
            </>
          ) : null}

          {summary?.timing ? (
            <>
              <Heading as="h3" style={h3}>
                Timing
              </Heading>
              <Text style={text}>{summary.timing}</Text>
            </>
          ) : null}

          {summary?.additionalNotes ? (
            <>
              <Heading as="h3" style={h3}>
                Additional notes
              </Heading>
              <Text style={text}>{summary.additionalNotes}</Text>
            </>
          ) : null}

          {summary?.openQuestions && summary.openQuestions.length > 0 ? (
            <>
              <Heading as="h3" style={h3}>
                Open questions
              </Heading>
              {summary.openQuestions.map((q, i) => (
                <Text key={i} style={listItem}>
                  • {q}
                </Text>
              ))}
            </>
          ) : null}
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: JobBriefSubmissionEmail,
  subject: (data: Record<string, any>) => {
    const title = data?.summary?.title || 'New job request'
    const name = data?.contact?.name
    return name ? `New request from ${name}: ${title}` : `New request: ${title}`
  },
  displayName: 'Job brief submission',
  to: 'info@mynest.pro',
  previewData: {
    submittedAt: '1 June 2026, 14:00',
    contact: {
      name: 'Alex Morgan',
      email: 'alex@example.com',
      phone: '0400 000 000',
      address: '12 Example St, Sydney NSW 2000',
    },
    summary: {
      title: 'Fix leaking kitchen tap',
      category: 'Plumbing',
      overview:
        'The cold-water tap in the kitchen drips constantly. Started about a week ago.',
      scopeOfWork: ['Diagnose the leak', 'Replace washer or cartridge as needed'],
      keyDetails: [
        { label: 'Tap type', value: 'Mixer' },
        { label: 'Age', value: '~5 years' },
      ],
      accessAndLocation: 'Ground floor apartment, intercom on arrival.',
      timing: 'Anytime this week, weekday mornings preferred.',
      additionalNotes: 'Water is currently shut off at the isolator.',
      openQuestions: ['Is the brand of tap known?'],
    },
  },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
}
const container = { padding: '24px', maxWidth: '600px' }
const h1 = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  color: '#1a1a1a',
  margin: '0 0 8px',
}
const h2 = {
  fontSize: '18px',
  fontWeight: 'bold' as const,
  color: '#1a1a1a',
  margin: '24px 0 8px',
}
const h3 = {
  fontSize: '14px',
  fontWeight: 'bold' as const,
  color: '#1a1a1a',
  margin: '20px 0 6px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.04em',
}
const meta = { fontSize: '13px', color: '#666', margin: '0 0 16px' }
const text = {
  fontSize: '14px',
  color: '#333',
  lineHeight: '1.55',
  margin: '0 0 10px',
}
const kv = {
  fontSize: '14px',
  color: '#333',
  lineHeight: '1.55',
  margin: '0 0 4px',
}
const listItem = {
  fontSize: '14px',
  color: '#333',
  lineHeight: '1.55',
  margin: '0 0 4px',
}
const card = {
  backgroundColor: '#f6f4ef',
  borderRadius: '10px',
  padding: '16px 18px',
  margin: '12px 0',
}
const hr = { borderColor: '#e5e1d8', margin: '24px 0' }
const tag = {
  display: 'inline-block',
  fontSize: '12px',
  color: '#5a4a2f',
  backgroundColor: '#f1ead7',
  borderRadius: '999px',
  padding: '3px 10px',
  margin: '0 0 8px',
}
