import {CommentIcon} from '@sanity/icons/Comment'
import {defineField, defineType} from 'sanity'

/**
 * Per-learner per-course feedback. Written only through the Next.js
 * `/api/feedback` route — not authored in Studio. `readOnly` is Studio UI only;
 * the HTTP API with a write token can still create these.
 */
export const courseFeedback = defineType({
  name: 'courseFeedback',
  title: 'Course feedback',
  type: 'document',
  icon: CommentIcon,
  readOnly: true,
  description:
    'Post-course survey for a signed-in learner. Created by the web app, not by authors.',
  fields: [
    defineField({
      name: 'clerkUserId',
      title: 'Clerk user id',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'course',
      title: 'Course',
      type: 'reference',
      to: [{type: 'course'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'organised',
      title: 'The course was well organised and easy to follow.',
      type: 'number',
      validation: (rule) => rule.required().integer().min(1).max(5),
    }),
    defineField({
      name: 'knowledgeSkills',
      title: 'The learning materials genuinely increased my knowledge and skills.',
      type: 'number',
      validation: (rule) => rule.required().integer().min(1).max(5),
    }),
    defineField({
      name: 'navigation',
      title: 'The e-learning experience was smooth and easy to navigate.',
      type: 'number',
      validation: (rule) => rule.required().integer().min(1).max(5),
    }),
    defineField({
      name: 'workload',
      title: 'The workload was appropriate for the level.',
      type: 'number',
      validation: (rule) => rule.required().integer().min(1).max(5),
    }),
    defineField({
      name: 'peerConnection',
      title: 'I had meaningful opportunities to connect with other participants.',
      type: 'number',
      validation: (rule) => rule.required().integer().min(1).max(5),
    }),
    defineField({
      name: 'whatWouldChange',
      title: "What worked well, what didn't, and what would you change?",
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
      courseTitle: 'course.title',
      clerkUserId: 'clerkUserId',
    },
    prepare({courseTitle, clerkUserId}) {
      return {
        title: courseTitle || 'Course feedback',
        subtitle: clerkUserId || undefined,
      }
    },
  },
})
