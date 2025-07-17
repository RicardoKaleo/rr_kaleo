"use client";

import React from 'react'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Separator } from '../ui/separator'
import { Textarea } from '../ui/textarea'

const genderOptions = ['Female', 'Male', 'Non-Binary'] as const
const ethnicityOptions = [
  'Asian',
  'Black or African American',
  'Hispanic or Latino',
  'Native American or Native Alaska',
  'Native Haiwaiian or other Pacific Islander',
  'Two or more races',
] as const
const veteranStatusOptions = [
  'I am a protected veteran',
  'I am a veteran but not protected',
  'I am not a veteran',
] as const
const disabilityOptions = [
  "I don't have a disability",
  'I have a disability',
] as const
const workPreferenceOptions = ['Full Remote', 'Hybrid', 'On-Site'] as const
const visaStatusOptions = [
  'I have a work permit',
  'I need to be sponsored for VISA',
  "I'm a citizen",
  'Other (Comment to Specify)',
] as const

type ClientMeta = {
  gender?: typeof genderOptions[number] | null
  ethnicity?: typeof ethnicityOptions[number] | null
  veteran_status?: typeof veteranStatusOptions[number] | null
  disability?: typeof disabilityOptions[number] | null
  salary_expectations?: string | null
  notice_period?: string | null
  title_role?: string | null
  travel_percent?: number | null
  client_references?: string | null
  geographic_preferences?: string | null
  work_experience?: string | null
  work_preference?: typeof workPreferenceOptions[number] | null
  visa_status?: typeof visaStatusOptions[number] | null
  observations?: string | null
}

type Props = {
  value: ClientMeta
  onChange: (meta: ClientMeta) => void
  readOnly?: boolean
  noCard?: boolean
  noTitle?: boolean
}

export function ClientMetaForm({ value, onChange, readOnly, noCard, noTitle }: Props) {
  // Helper for select fields
  const handleSelect = (field: keyof ClientMeta, val: string) => {
    onChange({ ...value, [field]: val })
  }
  // Helper for text/number fields
  const handleInput = (field: keyof ClientMeta, val: string | number) => {
    onChange({ ...value, [field]: val })
  }
  const formContent = (
    <div className="space-y-4 p-4 custom-scrollbar overflow-y-auto">
      <div className="flex flex-col gap-4">
        {/* Gender */}
        <div>
          <Label>Gender</Label>
          <select
            disabled={readOnly}
            value={value.gender ?? ''}
            onChange={e => handleSelect('gender', e.target.value)}
            className="w-full bg-background border border-input rounded px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select...</option>
            {genderOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        {/* Ethnicity */}
        <div>
          <Label>Ethnicity</Label>
          <select
            disabled={readOnly}
            value={value.ethnicity ?? ''}
            onChange={e => handleSelect('ethnicity', e.target.value)}
            className="w-full bg-background border border-input rounded px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select...</option>
            {ethnicityOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        {/* Veteran Status */}
        <div>
          <Label>Veteran Status</Label>
          <select
            disabled={readOnly}
            value={value.veteran_status ?? ''}
            onChange={e => handleSelect('veteran_status', e.target.value)}
            className="w-full bg-background border border-input rounded px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select...</option>
            {veteranStatusOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        {/* Disability */}
        <div>
          <Label>Disability</Label>
          <select
            disabled={readOnly}
            value={value.disability ?? ''}
            onChange={e => handleSelect('disability', e.target.value)}
            className="w-full bg-background border border-input rounded px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select...</option>
            {disabilityOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        {/* Salary Expectations */}
        <div>
          <Label>Salary Expectations</Label>
          <Input
            disabled={readOnly}
            value={value.salary_expectations ?? ''}
            onChange={e => handleInput('salary_expectations', e.target.value)}
            placeholder="e.g. $80,000/year"
          />
        </div>
        {/* Notice Period */}
        <div>
          <Label>Notice Period</Label>
          <Input
            disabled={readOnly}
            value={value.notice_period ?? ''}
            onChange={e => handleInput('notice_period', e.target.value)}
            placeholder="e.g. 2 weeks"
          />
        </div>
        {/* Title/Role */}
        <div>
          <Label>Title/Role</Label>
          <Input
            disabled={readOnly}
            value={value.title_role ?? ''}
            onChange={e => handleInput('title_role', e.target.value)}
            placeholder="e.g. Software Engineer"
          />
        </div>
        {/* Travel Percent */}
        <div>
          <Label>Travel Percent</Label>
          <Input
            type="number"
            disabled={readOnly}
            value={value.travel_percent ?? ''}
            onChange={e => handleInput('travel_percent', Number(e.target.value))}
            placeholder="e.g. 10"
          />
        </div>
        {/* References */}
        <div className="md:col-span-2">
          <Label>References</Label>
          <Textarea
            disabled={readOnly}
            value={value.client_references ?? ''}
            onChange={e => handleInput('client_references', e.target.value)}
            placeholder="References or contacts"
            rows={4}
          />
        </div>
        {/* Geographic Preferences */}
        <div className="md:col-span-2">
          <Label>Geographic Preferences</Label>
          <Input
            disabled={readOnly}
            value={value.geographic_preferences ?? ''}
            onChange={e => handleInput('geographic_preferences', e.target.value)}
            placeholder="Preferred locations"
          />
        </div>
        {/* Work Experience */}
        <div className="md:col-span-2">
          <Label>Work Experience</Label>
          <Input
            disabled={readOnly}
            value={value.work_experience ?? ''}
            onChange={e => handleInput('work_experience', e.target.value)}
            placeholder="Summary of experience"
          />
        </div>
        {/* Work Preference */}
        <div>
          <Label>Work Preference</Label>
          <select
            disabled={readOnly}
            value={value.work_preference ?? ''}
            onChange={e => handleSelect('work_preference', e.target.value)}
            className="w-full bg-background border border-input rounded px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select...</option>
            {workPreferenceOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        {/* Visa Status */}
        <div>
          <Label>Visa Status</Label>
          <select
            disabled={readOnly}
            value={value.visa_status ?? ''}
            onChange={e => handleSelect('visa_status', e.target.value)}
            className="w-full bg-background border border-input rounded px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select...</option>
            {visaStatusOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        {/* Observations */}
        <div className="md:col-span-2">
          <Label>Observations</Label>
          <Textarea
            disabled={readOnly}
            value={value.observations ?? ''}
            onChange={e => handleInput('observations', e.target.value)}
            placeholder="Additional notes"
            rows={4}
          />
        </div>
      </div>
    </div>
  );
  if (noCard) return formContent;
  return (
    <Card>
      {!noTitle && (
        <CardHeader>
          <CardTitle>Client Meta Information</CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-4">{formContent}</CardContent>
    </Card>
  );
}

<style jsx global>{`
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #fff;
    border-radius: 4px;
  }
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #fff transparent;
  }
`}</style> 