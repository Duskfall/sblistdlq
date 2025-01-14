import axios from 'axios';
import { ServiceBusMetrics } from '../types/servicebus';

const API_BASE_URL = 'http://localhost:8081/api';

export const serviceBusService = {
  getMetrics: async (): Promise<ServiceBusMetrics> => {
    const response = await axios.get(`${API_BASE_URL}/metrics`);
    return response.data;
  },

  sendMessage: async (queueName: string, message: string): Promise<void> => {
    await axios.post(`${API_BASE_URL}/queues/${queueName}/messages`, { content: message });
  },

  peekMessages: async (queueName: string, count: number = 10): Promise<any[]> => {
    const response = await axios.get(`${API_BASE_URL}/queues/${queueName}/messages?count=${count}`);
    return response.data;
  },

  getDeadLetterMessages: async (queueName: string): Promise<any[]> => {
    const response = await axios.get(`${API_BASE_URL}/queues/${queueName}/deadletter`);
    return response.data;
  }
}; 