import { prisma } from "@/lib/prisma";
import {
  PART_CATEGORIES,
  REQUEST_STATUSES,
  type PartCategoryValue,
  type RequestStatusValue,
} from "@/lib/validations/order.schema";
import type { Prisma } from "@prisma/client";

export type RequestWithCustomer = Prisma.RequestGetPayload<{
  include: { customer: true };
}>;

export interface PaginatedRequests {
  items: RequestWithCustomer[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

type RawFilters = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export interface RequestsFilter {
  page: number;
  pageSize: number;
  q: string;
  status?: RequestStatusValue;
  category?: PartCategoryValue;
  brand?: string;
  from?: string;
  to?: string;
  sort: "createdAt" | "visitDate" | "status";
  dir: "asc" | "desc";
}

function cleanStr(v: string | string[] | undefined): string | undefined {
  const s = first(v)?.trim();
  return s ? s : undefined;
}

export function parseRequestFilters(searchParams: RawFilters): RequestsFilter {
  const statusRaw = cleanStr(searchParams.status);
  const catRaw = cleanStr(searchParams.category);
  const sortRaw = cleanStr(searchParams.sort);
  const dirRaw = cleanStr(searchParams.dir);
  const page = Math.max(1, parseInt(cleanStr(searchParams.page) ?? "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(cleanStr(searchParams.pageSize) ?? "10", 10) || 10));
  return {
    page,
    pageSize,
    q: cleanStr(searchParams.q) ?? "",
    status: statusRaw && (REQUEST_STATUSES as readonly string[]).includes(statusRaw) ? (statusRaw as RequestStatusValue) : undefined,
    category: catRaw && (PART_CATEGORIES as readonly string[]).includes(catRaw) ? (catRaw as PartCategoryValue) : undefined,
    brand: cleanStr(searchParams.brand),
    from: cleanStr(searchParams.from),
    to: cleanStr(searchParams.to),
    sort: sortRaw === "visitDate" || sortRaw === "status" ? sortRaw : "createdAt",
    dir: dirRaw === "asc" ? "asc" : "desc",
  };
}


export function buildRequestWhere(filters: {
  q?: string;
  status?: RequestStatusValue;
  category?: PartCategoryValue;
  brand?: string;
  from?: string;
  to?: string;
}): Prisma.RequestWhereInput {
  const where: Prisma.RequestWhereInput = {};
  if (filters.status) where.status = filters.status;
  if (filters.category) where.partCategory = filters.category;
  if (filters.brand) {
    where.vehicleBrand = { contains: filters.brand };
  }
  const createdAt: Prisma.DateTimeFilter | undefined = (() => {
    const gte = filters.from ? new Date(`${filters.from}T00:00:00`) : undefined;
    const lte = filters.to ? new Date(`${filters.to}T23:59:59.999`) : undefined;
    if (gte && !Number.isNaN(gte.getTime()) && lte && !Number.isNaN(lte.getTime()))
      return { gte, lte };
    if (gte && !Number.isNaN(gte.getTime())) return { gte };
    if (lte && !Number.isNaN(lte.getTime())) return { lte };
    return undefined;
  })();
  if (createdAt) where.createdAt = createdAt;

  const q = filters.q?.trim();
  if (q) {
    where.OR = [
      { customer: { lastName: { contains: q } } },
      { customer: { firstName: { contains: q } } },
      { customer: { email: { contains: q } } },
      { customer: { phone: { contains: q } } },
      { plateNumber: { contains: q.toUpperCase() } },
      { vehicleModel: { contains: q } },
      { partDescription: { contains: q } },
    ];
  }
  return where;
}

export async function getPaginatedRequests(
  filters: RequestsFilter,
): Promise<PaginatedRequests> {
  const where = buildRequestWhere(filters);
  const orderBy: Prisma.RequestOrderByWithRelationInput =
    filters.sort === "visitDate"
      ? { visitDate: filters.dir }
      : filters.sort === "status"
        ? { status: filters.dir }
        : { createdAt: filters.dir };

  const [total, items] = await Promise.all([
    prisma.request.count({ where }),
    prisma.request.findMany({
      where,
      include: { customer: true },
      orderBy,
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
  ]);

  return {
    items,
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
  };
}

export interface AdminStats {
  total: number;
  today: number;
  pending: number;
  processedRate: number;
  byDay: Array<{ date: string; count: number }>;
}

export async function getAdminStats(): Promise<AdminStats> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfWeek.getDate() - 6);

  const [total, today, pending, processed, weekRows] = await Promise.all([
    prisma.request.count(),
    prisma.request.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.request.count({ where: { status: "NOUVEAU" } }),
    prisma.request.count({ where: { status: "TRAITE" } }),
    prisma.request.findMany({
      where: { createdAt: { gte: startOfWeek } },
      select: { createdAt: true },
    }),
  ]);

  const byDay: Array<{ date: string; count: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(startOfDay);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    });
    const count = weekRows.filter(
      (r) => r.createdAt.toISOString().slice(0, 10) === key,
    ).length;
    byDay.push({ date: label, count });
  }

  return {
    total,
    today,
    pending,
    processedRate: total === 0 ? 0 : Math.round((processed / total) * 100),
    byDay,
  };
}

export function toCsv(rows: RequestWithCustomer[]): string {
  const esc = (v: string | null | undefined): string => {
    const s = (v ?? "").replace(/"/g, '""');
    return `"${s}"`;
  };
  const header = [
    "Date",
    "Nom",
    "Prénom",
    "Email",
    "Téléphone",
    "Marque",
    "Modèle",
    "Immatriculation",
    "Catégorie",
    "Pièce",
    "Statut",
    "Date de visite",
  ].join(";");
  const lines = rows.map((r) =>
    [
      new Date(r.createdAt).toLocaleString("fr-FR"),
      r.customer.lastName,
      r.customer.firstName,
      r.customer.email,
      r.customer.phone,
      r.vehicleBrand,
      r.vehicleModel,
      r.plateNumber,
      r.partCategory,
      r.partDescription,
      r.status,
      r.visitDate ? new Date(r.visitDate).toLocaleString("fr-FR") : "",
    ]
      .map((c) => esc(String(c)))
      .join(";"),
  );
  return ["\uFEFF" + header, ...lines].join("\n");
}
