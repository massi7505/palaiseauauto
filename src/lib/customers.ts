import { prisma } from "@/lib/prisma";

export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export function normalizePhone(phone: string): string {
  // Garde uniquement les chiffres, convertit 06... -> 336...
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0033")) return `33${digits.slice(4)}`;
  if (digits.startsWith("33") && digits.length >= 11) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `33${digits.slice(1)}`;
  return digits;
}

export interface CustomerGroup {
  key: string;
  emails: string[];
  phones: string[];
  customerIds: string[];
  primaryCustomerId: string;
  firstName: string;
  lastName: string;
  requestCount: number;
  lastRequestAt: Date;
}

export async function getCustomerGroups(): Promise<CustomerGroup[]> {
  const customers = await prisma.customer.findMany({
    include: {
      requests: { select: { id: true, createdAt: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  // Union-find : deux fiches sont liées si même email normalisé OU même téléphone normalisé
  const parent = new Map<string, string>();
  const find = (x: string): string => {
    const p = parent.get(x) ?? x;
    if (p === x) return x;
    const root = find(p);
    parent.set(x, root);
    return root;
  };
  const union = (a: string, b: string) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  };

  for (const c of customers) parent.set(c.id, c.id);

  const emailToIds = new Map<string, string[]>();
  const phoneToIds = new Map<string, string[]>();
  for (const c of customers) {
    const e = normalizeEmail(c.email);
    const p = normalizePhone(c.phone);
    if (e) {
      const arr = emailToIds.get(e) ?? [];
      arr.push(c.id);
      emailToIds.set(e, arr);
    }
    if (p) {
      const arr = phoneToIds.get(p) ?? [];
      arr.push(c.id);
      phoneToIds.set(p, arr);
    }
  }
  for (const ids of emailToIds.values()) {
    for (let i = 1; i < ids.length; i++) union(ids[0], ids[i]);
  }
  for (const ids of phoneToIds.values()) {
    for (let i = 1; i < ids.length; i++) union(ids[0], ids[i]);
  }

  const groups = new Map<string, typeof customers>();
  for (const c of customers) {
    const root = find(c.id);
    const arr = groups.get(root) ?? [];
    arr.push(c);
    groups.set(root, arr);
  }

  const out: CustomerGroup[] = [];
  for (const [root, members] of groups) {
    const emails = [...new Set(members.map((m) => m.email))];
    const phones = [...new Set(members.map((m) => m.phone))];
    const requestCount = members.reduce((n, m) => n + m.requests.length, 0);
    let lastRequestAt = members[0]?.createdAt ?? new Date();
    let primary = members[0];
    for (const m of members) {
      for (const r of m.requests) {
        if (r.createdAt > lastRequestAt) {
          lastRequestAt = r.createdAt;
          primary = m;
        }
      }
    }
    // Le client principal = celui avec le plus de demandes, sinon le plus récent
    const byCount = [...members].sort((a, b) => b.requests.length - a.requests.length);
    if ((byCount[0]?.requests.length ?? 0) > (primary.requests.length ?? 0)) {
      primary = byCount[0];
    }
    out.push({
      key: root,
      emails,
      phones,
      customerIds: members.map((m) => m.id),
      primaryCustomerId: primary?.id ?? members[0].id,
      firstName: primary?.firstName ?? members[0].firstName,
      lastName: primary?.lastName ?? members[0].lastName,
      requestCount,
      lastRequestAt,
    });
  }

  out.sort((a, b) => b.lastRequestAt.getTime() - a.lastRequestAt.getTime());
  return out;
}
