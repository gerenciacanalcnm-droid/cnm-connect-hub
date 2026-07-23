import type { Company } from "@/types/company";
import { companyConfig } from "@/config/company.config";

export const availableCompanies: Company[] = [
  companyConfig as unknown as Company,
  {
    id: "cnm-latam",
    name: "CNM LATAM Operaciones",
    product: "SMS CNM",
    domain: "latam.canalcnm.com",
    website: "https://canalcnm.com",
    logoUrl: "https://canalcnm.com/wp-content/uploads/2026/07/logo-cnm.png",
    supportEmail: "latam@canalcnm.com",
    whatsapp: "+525500000000",
    currency: "MXN",
    locale: "es-MX",
    timezone: "America/Mexico_City",
  } as unknown as Company,
  {
    id: "cnm-europe",
    name: "CNM Europe SL",
    product: "SMS CNM",
    domain: "eu.canalcnm.com",
    website: "https://canalcnm.com",
    logoUrl: "https://canalcnm.com/wp-content/uploads/2026/07/logo-cnm.png",
    supportEmail: "eu@canalcnm.com",
    whatsapp: "+34600000000",
    currency: "EUR",
    locale: "es-ES",
    timezone: "Europe/Madrid",
  } as unknown as Company,
];
