// نقل الداتا الحالية (data/store.json + data/uploads) إلى Supabase.
// الاستخدام:
//   SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node scripts/migrate-to-supabase.mjs
// لو فيه داتا موجودة في Supabase بالفعل، السكريبت يقف إلا لو أضفت --force
import fs from 'node:fs';
import path from 'node:path';

const URL_ = (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
const KEY = (process.env.SUPABASE_SERVICE_KEY || '').trim();
const FORCE = process.argv.includes('--force');
if (!URL_ || !KEY) {
  console.error('لازم تحدد SUPABASE_URL و SUPABASE_SERVICE_KEY');
  process.exit(1);
}
const H = (extra = {}) => ({ apikey: KEY, Authorization: `Bearer ${KEY}`, ...extra });

const dataDir = path.resolve(process.cwd(), 'data');
const storeFile = path.join(dataDir, 'store.json');
const uploadsDir = path.join(dataDir, 'uploads');
if (!fs.existsSync(storeFile)) {
  console.error('مش لاقي data/store.json. اتأكد إنك واقف في مجلد المشروع.');
  process.exit(1);
}

const existing = await fetch(`${URL_}/rest/v1/store_data?id=eq.1&select=id`, { headers: H() });
if (!existing.ok) {
  console.error('فشل الاتصال بـ Supabase:', existing.status, await existing.text());
  console.error('اتأكد إنك شغّلت supabase-setup.sql وإن المفاتيح صح.');
  process.exit(1);
}
if ((await existing.json()).length > 0 && !FORCE) {
  console.error('فيه داتا موجودة بالفعل في Supabase. لو عايز تستبدلها شغّل الأمر مع --force');
  process.exit(1);
}

let json = fs.readFileSync(storeFile, 'utf8');
const store = JSON.parse(json);

// رفع الصور وتغيير روابطها
const mime = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' };
let uploaded = 0;
if (fs.existsSync(uploadsDir)) {
  for (const file of fs.readdirSync(uploadsDir)) {
    const ext = file.split('.').pop().toLowerCase();
    if (!mime[ext]) continue;
    const res = await fetch(`${URL_}/storage/v1/object/products/${file}`, {
      method: 'POST',
      headers: H({ 'Content-Type': mime[ext], 'x-upsert': 'true' }),
      body: fs.readFileSync(path.join(uploadsDir, file)),
    });
    if (!res.ok) {
      console.error('فشل رفع', file, res.status, await res.text());
      process.exit(1);
    }
    json = json.split(`/api/uploads/${file}`).join(`${URL_}/storage/v1/object/public/products/${file}`);
    uploaded++;
  }
}

const data = JSON.parse(json);
const up = await fetch(`${URL_}/rest/v1/store_data?on_conflict=id`, {
  method: 'POST',
  headers: H({ 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' }),
  body: JSON.stringify({ id: 1, data, updated_at: new Date().toISOString() }),
});
if (!up.ok) {
  console.error('فشل حفظ الداتا:', up.status, await up.text());
  process.exit(1);
}
console.log(
  `تم النقل: ${data.products?.length ?? 0} منتج، ${data.orders?.length ?? 0} طلب، ${uploaded} صورة.`
);
