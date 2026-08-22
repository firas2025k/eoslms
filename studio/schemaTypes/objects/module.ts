import {BlockElementIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'

export const courseModule = defineType({
  name: 'module',
  title: 'Module',
  type: 'object',
  icon: BlockElementIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'lessons',
      title: 'Lessons',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'lesson'}]})],
      validation: (rule) => rule.min(1),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      lessons: 'lessons',
    },
    prepare({title, lessons}) {
      const count = Array.isArray(lessons) ? lessons.length : 0
      return {
        title: title || 'Untitled module',
        subtitle: `${count} lesson${count === 1 ? '' : 's'}`,
      }
    },
  },
})
