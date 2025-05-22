import api from './axios';
import { Chat, Message } from '../types/chat';
import { useUserStore } from '@/stores/useUserStore';

export const chatApi = {
  // chat with cuckoo, send message to cuckoo and get response
  getChatList: async (): Promise<Chat[]> => {
    const response = await api.get<{ chats: Chat[] }>('/chat/list');
    return response.data.chats;
  },

  createChat: async (initialMessage: string): Promise<Message> => {
    try {
      const taskId = useUserStore.getState().getTaskId();
      const result = await api.post(`/message`, {
        text: initialMessage,
        taskId,
      });
      let response = result.data;
      if (result.status != 200) {
        response = "Error in response " + result.statusText;
      }
      try {
        const json = JSON.parse(response.text);
        if (json) {
          useUserStore.getState().setTaskId(json.taskId);
          if (json.need_more) {
            response = `${json.question_description}\n\n${json.available_options.join('\n\r')}`;
          }
          else {
            response = json.question_description;
          }
        }
      } catch (err) {
        console.log(err);
      }
      return {
        text: response,
        user: 'agent',
        action: 'NONE',
      };
    } catch (err) {
      console.log(err);
    }
    return {
      text: 'No result is available. Please check.',
      user: 'agent',
      action: 'NONE',
    };
  },
//   createChat: async (initialMessage: string): Promise<Message> => {
//     const userId = useUserStore.getState().getUserId();
//     const result = await api.post(`/chat`, {
//       text: initialMessage,
//       userId: userId,
//     });
//     const response = result.data.data?.response;
//     const json = JSON.parse(response);
//     return {
//       text: json.text,
//       user: 'agent',
//       action: 'NONE',
//     };
//   },


  deleteChat: async (chatId: string): Promise<void> => {
    await api.delete(`/chat/${chatId}`);
  },

  getChatMessages: async (chatId: string): Promise<Message[]> => {
    const response = await api.get(`/chat/${chatId}/messages`);
    return response.data.data;
  },

  checkTaskStatus: async (): Promise<Message> => {
    try {
      const taskId = useUserStore.getState().getTaskId();
      const result = await api.get(`/task_status`, {
        taskId,
      });
      console.log(result);
      let response = result.data;
      if (result.status != 200) {
        response = "Error in response " + result.statusText;
      }
      try {
        const json = JSON.parse(response.text);
        response = json.task_status;
      } catch (err) {
        console.log(err);
      }
      return {
        text: response,
        user: 'agent',
        action: 'NONE',
      };
    } catch (err) {
      console.log(err);
    }
    return {
      text: 'Please wait a few seconds.',
      user: 'agent',
      action: 'NONE',
    };
  },

  async translateText(text: string): Promise<string> {
    try {
      //console.log('translateText: 000 ', text);
      const response = await api.post(`/translate_text`, { text });
      //console.log('translateText: 111 ', response.data.data.result);
      return response.data.data.result;
    } catch (error) {
      console.error('reTweeted error:', error);
      throw error;
    }
  }
};
