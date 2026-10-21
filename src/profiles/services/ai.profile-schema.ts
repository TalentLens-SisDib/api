// The provider schema complements CreateProfileDto validation before saving.
export const PROFILE_RESPONSE_FORMAT = {
  type: 'json_schema',
  json_schema: {
    name: 'applicant_profile',
    strict: true,
    schema: {
      type: 'object',
      additionalProperties: false,
      required: ['name', 'description', 'skills', 'educationalBackground'],
      properties: {
        name: { type: 'string', description: 'Candidate full name from the CV; empty if absent.' },
        description: { type: 'string', description: 'Factual summary in the language of the CV, at most 2000 characters; empty if unavailable.' },
        skills: {
          type: 'array',
          description: 'At most 100 skills explicitly supported by the CV.',
          items: { type: 'string' },
        },
        educationalBackground: {
          type: 'array',
          description: 'At most 25 education records with an explicit institution, degree and start date. Empty when unavailable. Never invent dates.',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['institution', 'degree', 'startDate', 'endDate'],
            properties: {
              institution: { type: 'string' },
              degree: { type: 'string' },
              startDate: { type: 'string', description: 'Start date from the CV in ISO YYYY-MM-DD format.' },
              endDate: { type: ['string', 'null'], description: 'End date in ISO YYYY-MM-DD format, or null when ongoing or unavailable.' },
            },
          },
        },
      },
    },
  },
} as const;
