import {ClipboardIcon} from '@sanity/icons/Clipboard'
import {defineField, defineType} from 'sanity'

/**
 * Per-learner onboarding survey, keyed by Clerk user id. Written only through
 * the Next.js `/api/onboarding` route — not authored in Studio. `readOnly` is
 * Studio UI only; the HTTP API with a write token can still create these.
 */
export const onboarding = defineType({
  name: 'onboarding',
  title: 'Onboarding',
  type: 'document',
  icon: ClipboardIcon,
  readOnly: true,
  description:
    'Pre-course survey for a signed-in learner. Created by the web app, not by authors.',
  fields: [
    defineField({
      name: 'clerkUserId',
      title: 'Clerk user id',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'fullName',
      title: 'Full name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'email',
      title: 'Email address',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'location',
      title: 'Where do you live? (City/Country)',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'stage',
      title: 'Which best describes your current situation?',
      type: 'string',
      options: {
        list: [
          {
            title: 'I plan to start a social business within the next 3 years',
            value: 'planning_3_years',
          },
          {
            title: 'I am currently setting up a business (not yet operational)',
            value: 'setting_up',
          },
          {
            title: 'I run a new business (under 42 months)',
            value: 'new_business',
          },
          {
            title: 'I run an established business (42+ months)',
            value: 'established',
          },
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'motivation',
      title: 'What draws you to social entrepreneurship?',
      type: 'text',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'twelveMonthGoal',
      title: 'What is your main goal for the next 12 months?',
      type: 'text',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'submittedAt',
      title: 'Submitted at',
      type: 'datetime',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {
      fullName: 'fullName',
      email: 'email',
      clerkUserId: 'clerkUserId',
    },
    prepare({fullName, email, clerkUserId}) {
      return {
        title: fullName || clerkUserId || 'Unknown learner',
        subtitle: email || undefined,
      }
    },
  },
})
