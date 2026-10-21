<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

Use Node.js 24.15+ (or Node.js 22.22.3+) for the current Nest CLI toolchain.

Copy `.env.example` to `.env` before starting the API. The local database is
SQLite (`DATABASE_URL=file:./prisma/talentlens.db`). Set a random `JWT_SECRET`.
The frontend uses `app/.env` with `VITE_API_URL=http://localhost:3000`;
the API allows that frontend through `CORS_ORIGINS=http://localhost:5173`.

Apply the database migrations before starting the API:

```bash
node node_modules/prisma/build/index.js migrate deploy --config prisma7.config.ts
```

The schema-alignment migration adds the missing profile, skill and job timestamps
and skill description column while preserving existing records and relations.

### AI providers and CV import

`POST /profiles/upload-cv` accepts an authenticated multipart request with a
`cv` field containing a PDF up to 5 MB. The API extracts text locally, sends it
to the configured provider and validates the resulting name, description and
skills before saving. PDFs must contain selectable text; OCR is not included.
The maximum extracted text length is 50,000 characters.

Configure these variables **only in `api/.env`**:

| Variable | Meaning |
| --- | --- |
| `AI_PROVIDER` | Protocol: `openrouter`, `openai`, `anthropic` or `gemini` |
| `AI_MODEL` | Exact text/chat model identifier available to your account |
| `AI_API_KEY` | Provider key; may be blank for local OpenAI-compatible servers |
| `AI_API_URL` | Versioned base URL, without the operation path |
| `AI_TIMEOUT_MS` | Request timeout, defaults to 60000 (maximum 300000) |

Provider base URLs:

| Protocol | Example base URL | Operation appended by the service |
| --- | --- | --- |
| `openrouter` | `https://openrouter.ai/api/v1` | `/chat/completions` |
| `openai` | `https://api.openai.com/v1` | `/chat/completions` |
| `anthropic` | `https://api.anthropic.com/v1` | `/messages` |
| `gemini` | `https://generativelanguage.googleapis.com/v1beta` | `/models/{AI_MODEL}:generateContent` |

For another OpenAI-compatible provider, keep `AI_PROVIDER=openai` and change
the URL, model and key. For example, a local Ollama server uses
`AI_API_URL=http://localhost:11434/v1` and a model installed on that server.
Compatibility requires the Chat Completions protocol and text responses.
Native Azure deployments and other protocols require an additional adapter.

The default configuration uses OpenRouter with `AI_MODEL=openrouter/free`.
This router selects one model from the currently available free pool for each
request. CV extraction sends a strict `json_schema` response format and
`provider.require_parameters=true`, so endpoints cannot silently ignore the
profile schema. Models without the required structured-output support are
excluded, including safety classifiers that return labels instead of profiles.
It does not send a CV to every model. There is no hardcoded model list to age.
The OpenRouter adapter only accepts `openrouter/free` or a `vendor/model:free`
identifier and sends no paid fallback models. Free requests remain subject to
OpenRouter account quotas, rate limits and provider availability.
See the [Free Models Router documentation](https://openrouter.ai/docs/guides/routing/routers/free-router).

Set your OpenRouter key in `AI_API_KEY` in the ignored local `.env` file.
Keys are intentionally empty in the examples: supply your own value.

To test a real CV against the configured provider without writing to the database:

```bash
npm run test:cv -- "path/to/cv.pdf"
```

This command sends the extracted CV text to the configured AI provider and
prints the validated profile JSON. The PDF is not added to the repository.

The API can start without AI configuration; CV import returns HTTP 503 until
configured. Invalid PDFs return 400, oversized uploads 413, invalid provider
responses 502 and provider timeouts 504. No mock profile is saved on failure.
Never put provider secrets in `VITE_*` variables, which are bundled for browsers.

Protocol references: [Chat Completions](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create),
[Anthropic Messages](https://platform.claude.com/docs/en/api/messages/create),
[Gemini generateContent](https://ai.google.dev/api/generate-content).

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

The CV upload integration tests authenticate through `/login`, submit a real
fictional PDF and verify the saved profile, skills and education in SQLite.
Only the external AI response is mocked. Each test run uses an isolated temporary
database with the committed migrations; no real AI key or local development data
is needed. Invalid AI output is also checked to leave no partial records.

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Observability

In production applications, observability is essential for understanding how your system behaves, detecting issues early, and maintaining reliable performance.

[NestJS Observe](https://observe.nestjs.com) automatically instruments your NestJS application, giving you deep visibility into your system with minimal setup:

- **Distributed tracing:** Follow requests across services and understand how they flow through your system.
- **Waterfall analysis:** Visualize request execution and identify slow operations, bottlenecks, and unexpected delays.
- **Performance analysis:** Analyze application performance in real time and quickly pinpoint areas that need optimization.
- **Metrics:** Track key application and infrastructure metrics to understand system health and performance trends.
- **Logging:** Centralize and correlate logs with traces and other telemetry to make debugging easier.
- **Error tracking:** Detect errors quickly and investigate their root causes with the surrounding context.
- **SLA monitoring:** Track service-level objectives and identify when your application is approaching or exceeding defined thresholds.
- **Alarms and alerts:** Set up alerts for critical errors, performance degradation, SLA violations, and other anomalies so your team can react quickly.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Auto-instrument your application with [NestJS Observer](https://observer.nestjs.com). Distributed tracing, metrics, and logging made easy. Error tracking and performance monitoring for your NestJS applications.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

## Create a candidate profile from a CV

The authenticated `POST /profiles/upload-cv` endpoint accepts one PDF as multipart form data under the field name `cv`. The file must be a valid PDF and no larger than 5 MB. The AI parser returns the structured profile, and the API saves the profile, extracted skills, and any education records in one database transaction. The response contains the created profile and its saved education and skills.

```bash
curl -X POST http://localhost:3000/profiles/upload-cv \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "cv=@./candidate.pdf;type=application/pdf"
```

The AI result follows the `CreateProfileDto` shape: `name` is required; `description`, `skills`, and `educationalBackground` are optional. Each education entry contains `institution`, `degree`, an ISO `startDate`, and an optional ISO `endDate` (or `null` when the course is ongoing). Invalid AI output is rejected before any profile is saved. The OpenRouter schema requests all four fields, using an empty description or arrays when information is unavailable. Education is extracted only when the CV supplies the required fields and dates.

Swagger documents the multipart field and response at `http://localhost:3000/docs`.
