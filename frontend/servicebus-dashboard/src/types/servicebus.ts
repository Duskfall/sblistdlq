export interface QueueInfo {
  name: string;
  messageCount: number;
  deadLetterCount: number;
  status: string;
}

export interface TopicInfo {
  name: string;
  subscriptionCount: number;
  status: string;
}

export interface SubscriptionInfo {
  name: string;
  messageCount: number;
  deadLetterCount: number;
  status: string;
  topicName: string;
}

export interface ServiceBusMetrics {
  messages: any[];
  queues: QueueInfo[];
  topics: TopicInfo[];
  subscriptions: SubscriptionInfo[];
} 