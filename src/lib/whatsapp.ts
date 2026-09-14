export function getWhatsAppPhone(): string {
  return (
    process.env.WHATSAPP_PHONE_NUMBER ??
    process.env.NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER ??
    "33601639959"
  );
}

export interface WhatsAppOrderMessage {
  lastName: string;
  firstName: string;
  phone: string;
  email: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear?: string;
  mileage?: string;
  fuelLabel?: string;
  urgent?: boolean;
  plateNumber: string;
  partCategoryLabel: string;
  partDescription: string;
}

export function buildWhatsAppMessage(data: WhatsAppOrderMessage): string {
  const lines = [
    `Nouvelle demande de pièce auto${data.urgent ? " [URGENTE]" : ""}`,
    `Nom : ${data.lastName} ${data.firstName}`,
    `Téléphone : ${data.phone}`,
    `Email : ${data.email}`,
    `Véhicule : ${data.vehicleBrand} ${data.vehicleModel}${data.vehicleYear ? ` (${data.vehicleYear})` : ""}`,
    data.mileage ? `Kilométrage : ${data.mileage} km` : null,
    data.fuelLabel ? `Carburant : ${data.fuelLabel}` : null,
    `Immatriculation : ${data.plateNumber}`,
    `Catégorie : ${data.partCategoryLabel}`,
    `Pièce recherchée : ${data.partDescription}`,
  ].filter((l): l is string => l !== null);
  return lines.join("\n");
}

export function buildWhatsAppUrl(message: string, phone?: string): string {
  const target = phone ?? getWhatsAppPhone();
  return `https://api.whatsapp.com/send?phone=${encodeURIComponent(target)}&text=${encodeURIComponent(message)}`;
}
