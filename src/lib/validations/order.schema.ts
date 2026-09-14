import { z } from "zod";

export const PART_CATEGORIES = [
  "MOTEUR",
  "CARROSSERIE",
  "FREINAGE",
  "ELECTRONIQUE",
  "VITRAGE",
  "SUSPENSION",
  "ECHAPPEMENT",
  "TRANSMISSION",
  "INTERIEUR",
  "ECLAIRAGE",
  "AUTRE",
] as const;

export type PartCategoryValue = (typeof PART_CATEGORIES)[number];

export const PART_CATEGORY_LABELS: Record<PartCategoryValue, string> = {
  MOTEUR: "Moteur",
  CARROSSERIE: "Carrosserie",
  FREINAGE: "Freinage",
  ELECTRONIQUE: "Électronique",
  VITRAGE: "Pare-brise / Vitrage",
  SUSPENSION: "Suspension",
  ECHAPPEMENT: "Échappement",
  TRANSMISSION: "Transmission",
  INTERIEUR: "Intérieur",
  ECLAIRAGE: "Éclairage",
  AUTRE: "Autre",
};

export const REQUEST_STATUSES = [
  "NOUVEAU",
  "EN_COURS",
  "TRAITE",
  "ANNULE",
] as const;

export type RequestStatusValue = (typeof REQUEST_STATUSES)[number];

export const REQUEST_STATUS_LABELS: Record<RequestStatusValue, string> = {
  NOUVEAU: "Nouveau",
  EN_COURS: "En cours",
  TRAITE: "Traité",
  ANNULE: "Annulé",
};

export const VEHICLE_BRANDS = [
  "Renault",
  "Peugeot",
  "Citroën",
  "Volkswagen",
  "BMW",
  "Mercedes",
  "Audi",
  "Toyota",
  "Dacia",
  "Fiat",
  "Ford",
  "Opel",
  "Nissan",
  "Hyundai",
  "Kia",
  "Volvo",
  "Autre",
] as const;

// Immatriculation FR : AA-123-AA (tirets/espaces tolérés, normalisée en MAJUSCULES)
const plateRegex = /^[A-Z]{2}[-\s]?[0-9]{3}[-\s]?[A-Z]{2}$/;
// Téléphone FR : 06/07 + 8 chiffres, espaces/points/tirets tolérés
const phoneRegex = /^(?:(?:\+33|0033)\s?|0)[67](?:[\s.-]?\d{2}){4}$/;

export const fuelEnum = z.enum(["ESSENCE", "DIESEL", "HYBRIDE", "ELECTRIQUE", "GPL", "AUTRE"]);

export type FuelValue = z.infer<typeof fuelEnum>;

export const FUEL_LABELS: Record<FuelValue, string> = {
  ESSENCE: "Essence",
  DIESEL: "Diesel",
  HYBRIDE: "Hybride",
  ELECTRIQUE: "Électrique",
  GPL: "GPL",
  AUTRE: "Autre",
};

export const orderSchema = z.object({
  lastName: z
    .string()
    .trim()
    .min(2, "Nom trop court (2 caractères minimum)")
    .max(60, "Nom trop long"),
  firstName: z
    .string()
    .trim()
    .min(2, "Prénom trop court (2 caractères minimum)")
    .max(60, "Prénom trop long"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Adresse e-mail invalide")
    .max(120, "E-mail trop long"),
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, "Numéro invalide (ex : 06 01 63 99 59)"),
  vehicleBrand: z
    .string()
    .trim()
    .min(2, "Marque requise")
    .max(60, "Marque trop longue"),
  vehicleModel: z
    .string()
    .trim()
    .min(1, "Modèle requis")
    .max(80, "Modèle trop long"),
  plateNumber: z
    .string()
    .trim()
    .toUpperCase()
    .regex(plateRegex, "Format invalide (ex : AB-123-CD)"),
  partCategory: z.enum(PART_CATEGORIES, {
    message: "Choisissez une catégorie de pièce",
  }),
  partDescription: z
    .string()
    .trim()
    .min(5, "Décrivez la pièce (5 caractères minimum)")
    .max(1000, "Description trop longue (1000 caractères max)"),
  // Carburant (optionnel) : liste fermée.
  fuel: fuelEnum.optional(),
  // Consentement RGPD : booléen, doit être true (validé côté serveur).
  consent: z.boolean().refine((v) => v === true, { message: "Vous devez accepter l'utilisation de vos données." }),
  // Token reCAPTCHA (v2 ou v3) — vérifié côté serveur si activé.
  recaptchaToken: z.string().default(""),
});

export type OrderFormValues = z.infer<typeof orderSchema>;

export const updateRequestSchema = z.object({
  id: z.string().min(1),
  status: z.enum(REQUEST_STATUSES).optional(),
  visitDate: z.string().nullable().optional(),
  internalNote: z.string().max(2000).nullable().optional(),
});

export type UpdateRequestValues = z.infer<typeof updateRequestSchema>;

export const requestsFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  q: z.string().trim().max(100).default(""),
  status: z
    .string()
    .optional()
    .transform((v) =>
      v && (REQUEST_STATUSES as readonly string[]).includes(v)
        ? (v as RequestStatusValue)
        : undefined,
    ),
  category: z
    .string()
    .optional()
    .transform((v) =>
      v && (PART_CATEGORIES as readonly string[]).includes(v)
        ? (v as PartCategoryValue)
        : undefined,
    ),
  brand: z.string().trim().max(60).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  sort: z.enum(["createdAt", "visitDate", "status"]).default("createdAt"),
  dir: z.enum(["asc", "desc"]).default("desc"),
});

export type RequestsFilterValues = z.infer<typeof requestsFilterSchema>;
