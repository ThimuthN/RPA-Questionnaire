#!/bin/bash

# Set environment variables for Vercel production
npx vercel env add DATABASE_URL "postgresql://neondb_owner:npg_vV9Awx5KMLIc@ep-late-bonus-a4dwjjni-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" production

npx vercel env add DIRECT_URL "postgresql://neondb_owner:npg_vV9Awx5KMLIc@ep-late-bonus-a4dwjjni.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" production

npx vercel env add APP_URL "https://screener-v2-staging-41qjn4geq-thimuthns-projects.vercel.app" production

npx vercel env add BLOB_READ_WRITE_TOKEN "vercel_blob_rw_a2gICu94cdfaT6YU_FLqXvuHRwWbTgMENMmtCG6HPWeY2ME" production

echo "✅ Environment variables set"
