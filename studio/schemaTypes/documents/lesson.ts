import {DocumentTextIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'

export const lesson = defineType({
  name: 'lesson',
  title: 'Lesson',
  type: 'document',
  icon: DocumentTextIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title', maxLength: 96},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'videoUrl',
      title: 'Video URL',
      type: 'url',
      description: 'YouTube, Vimeo, or Bunny embed URL.',
      validation: (rule) => rule.required().uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'poster',
      title: 'Poster',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'durationMinutes',
      title: 'Duration (minutes)',
      type: 'number',
      validation: (rule) => rule.required().integer().positive(),
    }),
    defineField({
      name: 'freePreview',
      title: 'Free preview',
      type: 'boolean',
      description: 'Presentational label only — not access control.',
      initialValue: false,
    }),
    defineField({
      name: 'studentCount',
      title: 'Student count',
      type: 'number',
      description: 'Display-only enrollment figure.',
      validation: (rule) => rule.integer().min(0),
      initialValue: 0,
    }),
    defineField({
      name: 'notes',
      title: 'Notes',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'H2', value: 'h2'},
            {title: 'H3', value: 'h3'},
            {title: 'Quote', value: 'blockquote'},
          ],
          lists: [
            {title: 'Bullet', value: 'bullet'},
            {title: 'Numbered', value: 'number'},
          ],
          marks: {
            decorators: [
              {title: 'Strong', value: 'strong'},
              {title: 'Emphasis', value: 'em'},
              {title: 'Code', value: 'code'},
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [
                  defineField({
                    name: 'href',
                    type: 'url',
                    title: 'URL',
                    validation: (rule) =>
                      rule.uri({scheme: ['http', 'https', 'mailto']}),
                  }),
                ],
              },
            ],
          },
        }),
      ],
    }),
    defineField({
      name: 'keyPoints',
      title: 'Key points',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      description: 'Short list for “In this lesson you will…”.',
    }),
    defineField({
      name: 'proTip',
      title: 'Pro tip',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'resources',
      title: 'Resources',
      type: 'array',
      of: [defineArrayMember({type: 'resource'})],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      media: 'poster',
      durationMinutes: 'durationMinutes',
      freePreview: 'freePreview',
    },
    prepare({title, media, durationMinutes, freePreview}) {
      const parts = [
        durationMinutes != null ? `${durationMinutes} min` : null,
        freePreview ? 'Free preview' : null,
      ].filter(Boolean)
      return {
        title: title || 'Untitled lesson',
        subtitle: parts.join(' · ') || undefined,
        media,
      }
    },
  },
})
