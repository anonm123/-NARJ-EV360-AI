import { z } from 'zod';

const email = z.string().trim().toLowerCase().max(160).email('Geçerli bir e-posta adresi girin.');
const name = z.string().trim().min(2, 'Ad en az 2 karakter olmalı.').max(80, 'Ad çok uzun.').regex(/^[^<>{}]*$/, 'Geçersiz karakter.');

export const passwordSchema = z
  .string()
  .min(10, 'Parola en az 10 karakter olmalı.')
  .max(128, 'Parola çok uzun.')
  .regex(/[a-zçğıöşü]/, 'En az bir küçük harf içermeli.')
  .regex(/[A-ZÇĞİÖŞÜ]/, 'En az bir büyük harf içermeli.')
  .regex(/[0-9]/, 'En az bir rakam içermeli.');

export const registerSchema = z
  .object({
    name,
    email,
    password: passwordSchema,
    confirm: z.string(),
    role: z.enum(['driver', 'fleet', 'operator']),
    company: z.string().trim().max(120).optional(),
    terms: z.literal('on', { message: 'Kullanım koşullarını ve KVKK aydınlatma metnini onaylamalısınız.' }),
  })
  .refine((d) => d.password === d.confirm, { path: ['confirm'], message: 'Parolalar eşleşmiyor.' })
  .refine((d) => d.role === 'driver' || (d.company && d.company.length >= 2), { path: ['company'], message: 'Kurumsal hesaplar için şirket adı gerekli.' });

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Parola gerekli.').max(128),
});

export const vehicleSchema = z.object({
  nickname: z.string().trim().min(2, 'Araç adı en az 2 karakter.').max(40),
  profileId: z.string().min(1),
  batteryKwh: z.coerce.number().min(10, 'En az 10 kWh').max(250, 'En fazla 250 kWh'),
  consumptionKwhPer100: z.coerce.number().min(8, 'En az 8').max(45, 'En fazla 45'),
  maxDcKw: z.coerce.number().min(0).max(500),
  plate: z
    .string()
    .trim()
    .toUpperCase()
    .max(12)
    .regex(/^$|^[0-9]{2}\s?[A-Z]{1,3}\s?[0-9]{2,4}$/, 'Plaka biçimi: 34 ABC 123')
    .optional(),
});

export const leadSchema = z.object({
  name,
  email,
  company: z.string().trim().max(120).optional(),
  interest: z.enum(['surucu', 'filo', 'operator', 'yatirimci', 'basin', 'diger']),
  message: z.string().trim().max(2000, 'Mesaj en fazla 2000 karakter.').optional(),
  consent: z.literal('on', { message: 'KVKK aydınlatma metnini onaylamalısınız.' }),
  website: z.string().max(0).optional(), // honeypot
});

export const profileSchema = z.object({ name, company: z.string().trim().max(120).optional() });

export const passwordChangeSchema = z
  .object({ current: z.string().min(1, 'Mevcut parola gerekli.'), password: passwordSchema, confirm: z.string() })
  .refine((d) => d.password === d.confirm, { path: ['confirm'], message: 'Parolalar eşleşmiyor.' });

/** Luhn kontrolü — yalnızca demo ödeme formunun istemci/sunucu doğrulaması için. Kart verisi saklanmaz. */
export function luhn(num: string) {
  const digits = num.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let dbl = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = +digits[i];
    if (dbl) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}

export const reservationSchema = z.object({
  stationId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slot: z.string().regex(/^\d{2}:\d{2}$/),
  durationMin: z.coerce.number().int().min(15).max(240),
  cardNumber: z.string().refine(luhn, 'Kart numarası geçersiz (test kartı: 4242 4242 4242 4242).'),
  cardName: z.string().trim().min(3, 'Kart üzerindeki ad gerekli.').max(60),
  expiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'AA/YY biçiminde girin.'),
  cvc: z.string().regex(/^\d{3,4}$/, 'CVC 3–4 haneli olmalı.'),
});

export type FieldErrors = Record<string, string | undefined>;
export function flatten(err: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of err.issues) {
    const k = String(issue.path[0] ?? 'form');
    out[k] ??= issue.message;
  }
  return out;
}
