import { communicationService, type CommunicationService } from "@/services/communication.service";

export const communicationRepository: CommunicationService = {
  analytics: () => communicationService.analytics(),
  settings: () => communicationService.settings(),
  providers: () => communicationService.providers(),
};
