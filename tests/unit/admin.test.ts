import { describe, expect, it } from 'vitest';
import { filterUsers, keepsAnAdmin, signupSeries, toCsv, type AdminUserRow } from '@/lib/admin';

const U = (id: string, role: AdminUserRow['role'], extra: Partial<AdminUserRow> = {}): AdminUserRow => ({ id, role, email: `${id}@test.dev`, name: `Kişi ${id}`, createdAt: '2026-11-20T10:00:00Z', ...extra });

describe('yönetim yardımcıları', () => {
  it('CSV: BOM, ; ayırıcı, tırnak kaçışı ve formül enjeksiyonu koruması', () => {
    const csv = toCsv([['Ad', 'Not'], ['Ayşe; Çelik', 'dedi ki "merhaba"'], ['=HYPERLINK("x")', null]]);
    expect(csv.startsWith('﻿')).toBe(true);
    const lines = csv.slice(1).trimEnd().split('\r\n');
    expect(lines[0]).toBe('Ad;Not');
    expect(lines[1]).toBe('"Ayşe; Çelik";"dedi ki ""merhaba"""');
    expect(lines[2]).toBe(`"'=HYPERLINK(""x"")";`);
  });
  it('kayıt serisi: gün sayısı, İstanbul saatine göre gün sınırı ve sayım', () => {
    const now = new Date('2026-11-23T12:00:00Z');
    const s = signupSeries(['2026-11-23T08:00:00Z', '2026-11-22T22:30:00Z', '2026-11-22T20:00:00Z', '2026-10-01T00:00:00Z'], 3, now);
    expect(s.map((x) => x.day)).toEqual(['2026-11-21', '2026-11-22', '2026-11-23']);
    // 22:30Z = 01:30 İstanbul (23 Kasım) → bugüne sayılır
    expect(s.map((x) => x.count)).toEqual([0, 1, 2]);
  });
  it('filtre: arama (Türkçe büyük/küçük harf), rol ve durum', () => {
    const list = [U('a', 'driver', { name: 'İsmail Yılmaz' }), U('b', 'fleet', { company: 'Lojistik A.Ş.' }), U('c', 'driver', { disabledAt: '2026-11-21T00:00:00Z' })];
    expect(filterUsers(list, { q: 'ismail' }).map((u) => u.id)).toEqual(['a']);
    expect(filterUsers(list, { q: 'lojistik' }).map((u) => u.id)).toEqual(['b']);
    expect(filterUsers(list, { role: 'driver', status: 'active' }).map((u) => u.id)).toEqual(['a']);
    expect(filterUsers(list, { status: 'suspended' }).map((u) => u.id)).toEqual(['c']);
  });
  it('son aktif yönetici korunur', () => {
    const one = [U('a', 'admin'), U('b', 'driver')];
    expect(keepsAnAdmin(one, 'a', { role: 'driver' })).toBe(false);
    expect(keepsAnAdmin(one, 'a', { disable: true })).toBe(false);
    expect(keepsAnAdmin(one, 'a', { remove: true })).toBe(false);
    expect(keepsAnAdmin(one, 'b', { role: 'admin' })).toBe(true);
    const two = [U('a', 'admin'), U('b', 'admin', { disabledAt: 'x' })];
    expect(keepsAnAdmin(two, 'a', { role: 'driver' })).toBe(false); // diğeri askıda
    expect(keepsAnAdmin([U('a', 'admin'), U('b', 'admin')], 'a', { remove: true })).toBe(true);
  });
});
