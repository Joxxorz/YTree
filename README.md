# Connect your accounts

A Y TREE full-stack assessment: help one client collect a current statement from every financial provider before submitting for advice.

React 19 + TypeScript + Vite frontend; Java 21 + Spring Boot backend. The service seeds three providers with Uploaded, Missing and Outdated statements, relative to today's date. Data is in memory and resets on restart. Uploads are filename/date metadata only.

## Run locally

Prerequisites: Node.js 22.12+ (or 24), npm, JDK 21 and Maven 3.9+. Make sure `JAVA_HOME` points to a **JDK**, not only a Java runtime.

Terminal 1:

```sh
cd backend
mvn spring-boot:run
```

Terminal 2:

```sh
cd frontend
npm ci
npm run dev
```

Open http://localhost:5173 in your local browser. Vite proxies `/api` to Spring Boot on port 8080. No credentials, database or environment variables are required. These are local development addresses, not a hosted deployment.

## Checks

```sh
cd backend
mvn verify
cd ../frontend
npm run build
npm test
```

`mvn verify` runs service and HTTP controller tests and builds the runnable backend JAR. The frontend build checks TypeScript before bundling. Vitest covers UI behaviour with a mocked typed API.

Optional real-browser integration check (requires the backend JAR from `mvn verify`, and ports 8080/5173 free):

```sh
cd frontend
npx playwright install chromium
npm run test:e2e
```

The test starts fresh backend/frontend processes and exercises batch add, remove, statement upload/replacement, server rejection of incomplete submission, successful submission and mobile layout. To use an installed Chromium, set `CHROMIUM_PATH=/path/to/chromium` instead of downloading a browser.

## Behaviour

- Search a separate provider catalogue and add several providers together; selected providers are excluded.
- View, remove and filter selected accounts; readiness always counts all accounts, irrespective of the filter.
- Enter a filename and statement date, or replace an existing statement. Invalid/future dates and blank filenames are rejected.
- Statements dated on or after the UTC date minus three calendar months are current. The exact cutoff is displayed.
- Submit only a nonempty set of current statements. The backend rechecks all business rules; failed operations preserve previous data and form drafts.
- Loading, validation, failure and success messages are accessible through status/alert regions.

See [NOTES.md](NOTES.md) for decisions and limitations and [WALKTHROUGH.md](WALKTHROUGH.md) for a review guide.

## Hosted demo

See [DEPLOYMENT.md](DEPLOYMENT.md) for deploying the frontend on Vercel and the Spring Boot API on Render. Hosting configuration is included; live deployment requires connecting your accounts in those dashboards.
