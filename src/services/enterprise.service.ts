import { mockContacts, mockCampaigns } from "./mocks/enterprise.mock";
import { Contact, Campaign } from "@/schemas/enterprise";

export class ContactService {
  async getAll(): Promise<Contact[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockContacts), 800);
    });
  }

  async getById(id: string): Promise<Contact | undefined> {
    return mockContacts.find(c => c.id === id);
  }

  async create(data: Contact): Promise<Contact> {
    const newContact = { ...data, id: crypto.randomUUID() };
    mockContacts.push(newContact);
    return newContact;
  }
}

export class CampaignService {
  async getAll(): Promise<Campaign[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockCampaigns), 1000);
    });
  }
}

export const contactService = new ContactService();
export const campaignService = new CampaignService();
