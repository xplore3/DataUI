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
      let response = result.data.text;
      if (result.status != 200) {
        response = "Error in response " + result.statusText;
      }
      try {
        const json = JSON.parse(response);
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
      const result = await api.get(`/task_status?taskId=${taskId}`, {});
      console.log(result);
      let response = result.data.task_status;
      if (result.status != 200) {
        response = "Error in response " + result.statusText;
      }
      try {
        const match = response.match(/current_step:\s*(\d+)/);
        const step = match ? parseInt(match[1], 10) : null;
        response = `Step ${step} ...`;
      } catch (err) {
        console.log(err);
      }
      return {
        text: response || 'Processing ......',
        user: 'client',
        action: 'NONE',
      };
    } catch (err) {
      console.log(err);
    }
    return {
      text: 'Please wait a few seconds.',
      user: 'client',
      action: 'NONE',
    };
  },

  getPromptTemplates: async (): Promise<Message> => {
    try {
      const result = await api.get(`/prompt_templates`, {});
      console.log(result);
      let response = result.data;
      if (result.status != 200) {
        response = "Error in response " + result.statusText;
      }
      return {
        text: response || '......',
        user: 'client',
        action: 'NONE',
      };
    } catch (err) {
      console.log(err);
    }
    return {
      text: 'Error in tempates process',
      user: 'client',
      action: 'NONE',
    };
  },

  downloadWithCode: async (code: string): Promise<Message> => {
    let status = 200;
    try {
      const taskId = useUserStore.getState().getTaskId();
      const result = await api.post<Blob>(`/download`, {
        code: code,
        type: 'data',
        taskId,
      }, { responseType: 'blob' });
      console.log(result);
      status = result.status;
      //if (result.status !== 200) {
      //  throw new Error(`Download failed with status: ${result.status}`);
      //}

      const url = window.URL.createObjectURL(new Blob([result.data]));
      const link = document.createElement('a');
      link.href = url;
      const contentDisposition = result.headers['content-disposition'];
      let filename = 'download';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch?.[1]) {
          filename = filenameMatch[1];
        }
      }

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return {
        text: `文件 ${filename} 下载成功`,
        user: 'agent',
        action: 'NONE',
      };
    } catch (err) {
      console.log(err);
      let errorMessage = '下载失败，请稍后再试';
      if (err instanceof Error) {
        switch (status) {
          case 403:
            errorMessage = '提取码错误，请重试';
            break;
          case 404:
            errorMessage = '文件不存在';  
            break;
          default:
            errorMessage = `服务器错误: ${err.message}`;
            break
        }
      }
      return {
        text: errorMessage,
        user: 'client',
        action: 'NONE',
      };
    }
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
