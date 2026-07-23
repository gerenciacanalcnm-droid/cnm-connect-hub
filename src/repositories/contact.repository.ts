import { contactService, type ContactService } from "@/services/contact.service";
export const contactRepository: ContactService = {
  list: (p) => contactService.list(p),
  getById: (id) => contactService.getById(id),
  create: (i) => contactService.create(i),
  update: (id, p) => contactService.update(id, p),
  remove: (id) => contactService.remove(id),
  bulkImport: (rows) => contactService.bulkImport(rows),
};
