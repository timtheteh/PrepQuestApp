export interface PlanDetails {
  fileUploadRequests: number;
  genAIFormRequests: number;
  youtubeLinkRequests: number;
  chatWithAIRequests: number;
}

export type SubscriptionPlan = 'Free Plan' | 'Pro Plan' | 'Premium Plan';

export const subscriptionPlanDetails: Record<SubscriptionPlan, PlanDetails> = {
  'Free Plan': {
    fileUploadRequests: 10,
    genAIFormRequests: 10,
    youtubeLinkRequests: 10,
    chatWithAIRequests: 10,
  },
  'Pro Plan': {
    fileUploadRequests: 50,
    genAIFormRequests: 50,
    youtubeLinkRequests: 50,
    chatWithAIRequests: 50,
  },
  'Premium Plan': {
    fileUploadRequests: -1, // -1 represents unlimited
    genAIFormRequests: -1,
    youtubeLinkRequests: -1,
    chatWithAIRequests: -1,
  },
};

