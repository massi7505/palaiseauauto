import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { buildRequestWhere, parseRequestFilters, toCsv } from "@/lib/requests";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const url = new URL(req.url);
  const flat: Record<string, string | undefined> = {};
  url.searchParams.forEach((v, k) => {
    flat[k] = v;
  });
  const filters = parseRequestFilters(flat);
  const where = buildRequestWhere(filters);
  const rows = await prisma.request.findMany({
    where,
    include: { customer: true },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });
  const csv = toCsv(rows);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="palpiauto-demandes.csv"`,
    },
  });
}
