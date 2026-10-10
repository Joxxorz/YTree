# Deploy the assessment: Vercel + Render

Vercel hosts the React frontend. Spring Boot runs as a Docker web service on Render. This keeps the required Java backend; the Vite development proxy is not present in the production bundle.

## 1. Create the backend on Render

1. Sign in to Render and connect GitHub.
2. Select **New → Blueprint**, choose `Joxxorz/YTree`, and use branch `main`. The root `render.yaml` defines the Docker service.
3. When asked for `CORS_ALLOWED_ORIGINS`, enter `http://localhost:5173` temporarily. Replace it with your Vercel site's origin in step 3. Do not enter a path or a trailing slash.
4. Review the selected free plan and create the service. If your account does not offer that plan, choose an available plan after reviewing its cost.
5. Wait for the deployment to finish. Copy the actual service URL from Render, for example `https://ytree-api-xxxx.onrender.com`.
6. Open `<service-url>/api/accounts`. Expect JSON with three sample providers, a ready count of one, and `canSubmit: false`. Also check `<service-url>/api/providers`.

Render supplies `PORT`; Spring Boot reads it. The Docker build runs backend tests before packaging. Free instances may sleep, so the first request after inactivity may take longer.

## 2. Create the frontend on Vercel

1. Sign in to Vercel and choose **Add New → Project**.
2. Import `Joxxorz/YTree` from GitHub.
3. Set **Root Directory** to `frontend` and **Framework Preset** to Vite. The build command is `npm run build`; the output directory is `dist`.
4. Set the Node.js version to **24.x** (22.x also works).
5. Add environment variable **`VITE_API_BASE_URL`** with the Render origin from step 1, e.g. `https://ytree-api-xxxx.onrender.com`. Do not include `/api`. This value is public configuration, not a secret.
6. Apply it to Production; use the same value for Preview only if you deliberately want previews sharing the same demo state.
7. Deploy and copy the actual production URL from Vercel.

Vite embeds this variable at build time. Changing it later requires a new deployment.

## 3. Allow the deployed frontend

1. In Render, open the backend service's Environment settings.
2. Change **`CORS_ALLOWED_ORIGINS`** to your exact Vercel production origin, e.g. `https://your-project.vercel.app`.
3. Save the change and redeploy/restart the service as directed by Render.
4. Wait until the service is live, then refresh the Vercel site.

Multiple exact origins can be comma-separated if you need a custom domain or a particular preview URL. Do not use `*` or allow every Vercel domain. Preview URLs vary and need their own explicit origin. CORS governs browser access; it is not authentication, and this intentionally unauthenticated assessment API remains publicly callable.

## 4. Verify the hosted application

- Confirm the page loads and displays seed data with all three statuses.
- Search and add two providers, then remove one.
- Upload a current filename/date for a Missing account; replace the Outdated statement.
- Confirm readiness updates and submit successfully.
- Refresh: changes should remain while that backend instance is running.
- In browser developer tools, confirm API requests go to your Render origin without CORS errors.

If the page reports failure, check the Render logs and the browser Network tab. A wrong `VITE_API_BASE_URL` needs a Vercel rebuild. A wrong `CORS_ALLOWED_ORIGINS` needs a Render configuration update. A sleeping backend needs time to start.

## Demo limitations

This remains the assessment's single-client in-memory demo. All visitors share the same account list; restarts, redeployments or instance replacement reset it. Use one backend instance. Do not enter real financial information. A public link is useful for review, but is not a production wealth-management service.

## Local reproduction

Local development still uses Vite's `/api` proxy when `VITE_API_BASE_URL` is unset. For a local build against an alternate backend:

```sh
cd frontend
VITE_API_BASE_URL=http://localhost:8081 npm run build
```

Then serve `dist` on an origin explicitly included in `CORS_ALLOWED_ORIGINS`.
