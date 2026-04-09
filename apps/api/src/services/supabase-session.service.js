import supabase from '../lib/supabase.js';
import { env } from '../config/env.js';
import fs from 'fs/promises';
import path from 'path';

const BUCKET = env.SUPABASE_SESSIONS_BUCKET;

/** Downloads all Baileys session files from Supabase Storage to a local temp dir */
export async function downloadSession(userId, localDir) {
  await fs.mkdir(localDir, { recursive: true });

  const { data: files, error } = await supabase.storage.from(BUCKET).list(userId);
  if (error || !files || files.length === 0) return;

  await Promise.all(
    files.map(async (file) => {
      const { data, error: dlErr } = await supabase.storage
        .from(BUCKET)
        .download(`${userId}/${file.name}`);
      if (dlErr || !data) return;
      const text = await data.text();
      await fs.writeFile(path.join(localDir, file.name), text, 'utf-8');
    })
  );
}

/** Uploads all local session files back to Supabase Storage */
export async function uploadSession(userId, localDir) {
  let files;
  try {
    files = await fs.readdir(localDir);
  } catch {
    return;
  }

  await Promise.all(
    files.map(async (filename) => {
      const content = await fs.readFile(path.join(localDir, filename), 'utf-8');
      const blob = new Blob([content], { type: 'application/json' });
      await supabase.storage
        .from(BUCKET)
        .upload(`${userId}/${filename}`, blob, { upsert: true });
    })
  );
}

/** Deletes all session files for a user from Supabase Storage */
export async function deleteSession(userId) {
  const { data: files } = await supabase.storage.from(BUCKET).list(userId);
  if (!files || files.length === 0) return;
  const paths = files.map((f) => `${userId}/${f.name}`);
  await supabase.storage.from(BUCKET).remove(paths);
}

/** Ensures the sessions bucket exists — call once on startup */
export async function ensureBucketExists() {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === BUCKET);
  if (!exists) {
    await supabase.storage.createBucket(BUCKET, { public: false });
    console.log(`✅ Created Supabase Storage bucket: ${BUCKET}`);
  }
}
