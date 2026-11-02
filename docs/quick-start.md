# Start using Insomnia

## On the website

1. Open https://insomnia-iomete.vercel.app/portal/#auth.
2. Choose account creation if you have not registered on the public site. Local accounts are stored separately and are not copied to the cloud.
3. Enter your name, email, and a password of 12–128 characters. Sign in with the same email and password on future visits.
4. Create an evaluation and record its requirements and workloads. Workspace edits save to the cloud database; wait for the save to finish before leaving the page.
5. Sign out when finished, especially on a shared computer.

The landing page's Documentation button opens the product PDF. For the current difference between cloud and local functionality, see [feature availability](feature-availability.md).

## Run the full-stack application locally

Use Node.js 24.11 or a newer Node 24 release. From the repository directory:

```sh
npm ci
npm run dev
```

Open the URL printed in the terminal. Keep that terminal running while using the app. Local accounts and workspaces are stored in `.data/insomnia.sqlite`; changing the data path creates a separate database. Use the full-stack command above so the interface can reach the API.

For a first evaluation, record success criteria, add workloads, assign tests, capture observations, and generate a tool report. Import CSV measurements when available: a benchmark based on real measurements is more informative than an assumed performance claim.

## When something goes wrong

| Symptom | Next step |
| --- | --- |
| Local credentials fail on the public website | Register a separate cloud account. |
| Invalid email or password | Check the email and password; credentials are not interchangeable between local and cloud databases. |
| Too many login attempts | Wait 15 minutes before trying again. |
| Workspace revision conflict | Refresh to load the latest saved workspace before retrying the change. |
| Feature has not been migrated | Consult the availability guide; that route currently requires the local full-stack backend. |
| Local port is occupied | Use the URL printed by the development server, which can select another port. |

## Check the public deployment

```sh
npm run check:cloud
# Or supply another deployment origin:
npm run check:cloud -- https://your-deployment.example
```

This read-only check verifies the landing page, portal, PDF, backend health, anonymous session, and protected workspace response. It does not create accounts or test a signed-in workflow.
