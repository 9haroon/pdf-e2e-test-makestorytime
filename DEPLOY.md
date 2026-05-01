# DEPLOY.md - Interactive Children's Storytelling Project Deployment Guide

This guide outlines the steps required to set up production and preview deployments for the Interactive Children's Storytelling project on Vercel.

## Prerequisites

*   A Vercel account.
*   A GitHub account with access to the project repository.
*   A PostgreSQL database instance (e.g., Supabase, AWS RDS, Neon).
*   API keys for the AI services (e.g., Gemini API).
*   Cloud storage credentials (e.g., AWS S3, Google Cloud Storage) for image assets.

## Step 1: Set up Vercel Project

1.  **Import Project**:
    *   Log in to your Vercel dashboard.
    *   Click "Add New..." and select "Project".
    *   Import the project from your GitHub repository. Vercel should auto-detect the monorepo structure based on the `vercel.json`.
2.  **Configure Build Settings**:
    *   Vercel will use the `vercel.json` file to understand the project structure and build processes for both the frontend (Next.js) and backend (Node.js Serverless Functions).
    *   Ensure Vercel correctly identifies the `frontend` directory for `@vercel/next` and the `backend` directory for `@vercel/node`.
3.  **Environment Variables**:
    *   Navigate to your project's settings on Vercel.
    *   Go to the "Environment Variables" section.
    *   Add the following required environment variables for production and preview deployments:
        *   `DATABASE_URL`: Your PostgreSQL connection string for the production database.
        *   `GEMINI_API_KEY`: Your Gemini API key. This is used server-side. Do not prefix with `NEXT_PUBLIC_` unless it's explicitly needed client-side.
        *   `CLOUD_STORAGE_BUCKET_NAME`: Name of your cloud storage bucket (e.g., for illustrations).
        *   `CLOUD_STORAGE_ACCESS_KEY_ID`: Access key for your cloud storage.
        *   `CLOUD_STORAGE_SECRET_ACCESS_KEY`: Secret access key for your cloud storage.
        *   `CLOUD_STORAGE_REGION`: The AWS region or equivalent for your cloud storage.
        *   `NODE_ENV`: Set to `production` for production deployments.
        *   `POSTGRES_PRISMA_URL`: Required if using Prisma ORM with a connection string (use production DB URL).
        *   `POSTGRES_URL_NON_UNIQUE`: Required if using Prisma ORM with a non-unique URL.
    *   **Security**: Sensitive API keys and credentials should ONLY be configured as environment variables in Vercel and not exposed client-side unless absolutely necessary and prefixed with `NEXT_PUBLIC_`.

## Step 2: Configure GitHub Integration and Deployments

1.  **Connect GitHub Repository**: Ensure the GitHub repository containing this project is correctly linked to the Vercel project.
2.  **Preview Deployments (Pull Requests)**:
    *   The `.github/workflows/vercel-preview.yml` workflow is configured to automatically trigger Vercel preview deployments for every pull request targeting the `main` branch.
    *   You must add the following as encrypted secrets in your GitHub repository's settings ("Settings" > "Secrets and variables" > "Actions"):
        *   `VERCEL_TOKEN`: Your Vercel API token.
        *   `VERCEL_ORG_ID`: Your Vercel Organization ID.
        *   `VERCEL_PROJECT_ID`: Your Vercel Project ID.
    *   These secrets allow the GitHub Action to authenticate with Vercel and deploy preview builds. Vercel will automatically comment the preview URL on the corresponding PR.
3.  **Production Deployments**:
    *   Production deployments are typically triggered automatically when code is merged into the `main` branch (or your configured production branch).
    *   Vercel will build and deploy the production version of the application upon detecting a merge to `main`. Ensure `NODE_ENV` is set to `production` for these deployments.

## Step 3: Database and Storage Setup

1.  **PostgreSQL Database**:
    *   Provision and configure your production PostgreSQL database instance.
    *   Set the `DATABASE_URL` (and Prisma-specific variables if applicable) in Vercel's environment variables with the connection string for this production database.
    *   **Database Migrations**: If your backend uses an ORM like Prisma, you may need to run migrations. This can often be configured as a "Build Step" in Vercel or as a post-deployment script. For example, you might run `npx prisma migrate deploy` after the build. Consult Vercel's documentation for advanced build configurations if needed.
2.  **Cloud Storage**:
    *   Set up your chosen cloud storage bucket (e.g., AWS S3, Google Cloud Storage) for storing generated illustrations.
    *   Configure the `CLOUD_STORAGE_*` environment variables in Vercel with the necessary credentials and bucket details.
    *   Ensure the credentials provided grant the Vercel serverless functions the required permissions to write objects to the bucket.

## Step 4: Testing and Verification

*   **Preview Deployments**: After a PR is opened or updated, navigate to the Vercel preview URL (commented on the PR) to test the changes. Verify functionality, UI, and critical user journeys.
*   **Production Deployments**: Once code is merged to `main` and deployed to production, verify the production URL. Conduct thorough testing, especially for core features like story generation and interaction.
*   **Monitoring and Logging**: Utilize Vercel's built-in logging and error monitoring. Consider integrating a dedicated error tracking service like Sentry for more advanced error analysis, as suggested by the project's constitution regarding error handling.

## Troubleshooting Common Issues

*   **Build Failures**: Review Vercel's build logs for specific error messages. Common causes include missing Node.js dependencies, incorrect build commands (if custom ones are used), or issues with environment variable loading.
*   **Runtime Errors**: Inspect Vercel's runtime logs for your serverless functions. Ensure all required environment variables (API keys, database URLs) are correctly set and accessible.
*   **Database Connection Errors**: Double-check the `DATABASE_URL` and ensure your PostgreSQL database is accessible from Vercel's serverless environment. Firewall rules or network configurations might need adjustment.
*   **AI API Errors**: Verify your `GEMINI_API_KEY` is correct and has sufficient quotas/permissions. Check the AI service's status page if issues persist.

---
This guide provides a baseline for deploying the project on Vercel. Specific configurations may require adjustments based on the evolving needs of the project and Vercel's platform updates.
```