import {CheckmarkCircleIcon} from '@sanity/icons/CheckmarkCircle'
import {defineArrayMember, defineField, defineType} from 'sanity'

/**
 * Per-learner app state, keyed by Clerk user id. Written only through the Next.js
 * `/api/progress` route — not authored in Studio. `readOnly` is Studio UI only;
 * the HTTP API with a write token can still patch these documents.
 */
export const progress = defineType({
  name: 'progress',
  title: 'Learner progress',
  type: 'document',
  icon: CheckmarkCircleIcon,
  readOnly: true,
  description:
    'App state for a signed-in learner. Created and updated by the web app, not by authors.',
  fields: [
    defineField({
      name: 'clerkUserId',
      title: 'Clerk user id',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'completedLessons',
      title: 'Completed lessons',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'lesson'}]})],
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: 'lastLesson',
      title: 'Last lesson',
      description: 'The lesson this learner should resume.',
      type: 'reference',
      to: [{type: 'lesson'}],
    }),
    defineField({
      name: 'lastPositionSeconds',
      title: 'Last position (seconds)',
      description: 'Last known playback second in the last lesson.',
      type: 'number',
      validation: (rule) => rule.integer().min(0),
    }),
  ],
  preview: {
    select: {
      clerkUserId: 'clerkUserId',
      completed: 'completedLessons',
    },
    prepare({clerkUserId, completed}) {
      const count = Array.isArray(completed) ? completed.length : 0
      return {
        title: clerkUserId || 'Unknown learner',
        subtitle: `${count} lesson${count === 1 ? '' : 's'} completed`,
      }
    },
  },
})
