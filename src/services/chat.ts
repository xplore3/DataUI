import api from './axios';
import { Chat, Message } from '../types/chat';
import { useUserStore } from '@/stores/useUserStore';
import { useUser } from '@/hooks/useUser';
import { getRandomElements, getUnknownErrorDesc, getWaitTip } from '@/utils/common';

export const chatApi = {
  getOrCreateUUID: () => {
    let uuid = localStorage.getItem('device_uuid');
    if (!uuid) {
      uuid = crypto.randomUUID();
      localStorage.setItem('device_uuid', uuid);
    }
    return uuid;
  },

  getUserId: ():string => {
    const { userInfo } = useUser();
    //let userId = useUserStore.getState().getUserId();
    let userId = userInfo?.unionid;
    if (!userId) {
      userId = chatApi.getOrCreateUUID();
    }
    return userId;
  },

  // chat with cuckoo, send message to cuckoo and get response
  getChatList: async (): Promise<Chat[]> => {
    const response = await api.get<{ chats: Chat[] }>('/chat/list');
    return response.data.chats;
  },

  createChat: async (initialMessage: string, newTask: boolean = false): Promise<Message> => {
    let response = null;
    let debug = null;
    try {
      let taskId = useUserStore.getState().getTaskId();
      if (newTask) {
        taskId = '';
      }
      const result = await api.post(`/message`, {
        text: initialMessage,
        taskId,
        userId: chatApi.getUserId(),
      });
      //let options: string[] = [];
      //let backup_options = [];
      response = result.data.text;
      let newTaskId = '';
      if (result.status != 200) {
        response = "Error in response " + result.statusText;
      }
      try {
        const json = JSON.parse(response);
        if (json) {
          useUserStore.getState().setTaskId(json.taskId);
          newTaskId = json.taskId;
          //backup_options = json.intention_options || json.available_options;
          response = (json.process_result + json.option_description) || json.data_result || json.question_description;
        }
      } catch (err) {
        console.log(err);
        newTaskId = response.taskId || result.data.taskId;
        useUserStore.getState().setTaskId(newTaskId);
        //backup_options = response.intention_options || response.available_options;
        response = (response.process_result + response.option_description) || response.data_result || response.question_description || response;
      }
      //if (backup_options) {
      //  options = getRandomElements<string>(backup_options, 3, 5);
      //}
      return {
        text: response,
        user: 'agent',
        action: 'NONE',
        taskId: newTaskId,
        //options: options,
        //backup_options: backup_options,
      };
    } catch (err) {
      debug = err;
      console.log(err);
    }
    return {
      text: response || getUnknownErrorDesc(debug),
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

  dataProcess: async (option: string, taskId: string, fromOptions: boolean): Promise<Message> => {
    let response = null;
    let debug = null;
    try {
      //const taskId = useUserStore.getState().getTaskId();
      const result = await api.post(`/data_process`, {
        text: option,
        taskId,
        userId: chatApi.getUserId(),
        fromOptions
      });
      //let options: string[] = [];
      //let backup_options = [];
      response = result.data.text;
      let newTaskId = '';
      if (result.status != 200) {
        response = "Error in response " + result.statusText;
      }
      try {
        const json = JSON.parse(response);
        if (json) {
          newTaskId = json.taskId;
          useUserStore.getState().setTaskId(newTaskId);
          //backup_options = json.intention_options;
          response = (json.process_result + json.option_description) || json.data_result || json.question_description;
        }
      } catch (err) {
        console.log(err);
        newTaskId = response.taskId || result.data.taskId;
        useUserStore.getState().setTaskId(newTaskId);
        //backup_options = response.intention_options;
        response = (response.process_result + response.option_description) || response.data_result || response.question_description || response;
      }
      // Task Ended
      //if (!backup_options || backup_options.length < 1) {
      //  useUserStore.getState().setTaskId("");
      //}
      //if (backup_options) {
      //  options = getRandomElements<string>(backup_options, 3, 5);
      //}
      return {
        text: response,
        user: 'agent',
        action: 'NONE',
        taskId: newTaskId,
        //options: options,
        //backup_options: backup_options,
      };
    } catch (err) {
      debug = err;
      console.log(err);
    }
    return {
      text: response || getUnknownErrorDesc(debug),
      user: 'agent',
      action: 'NONE',
    };
  },

  routineTask: async (text: string, option: string): Promise<Message> => {
    let response = null;
    let debug = null;
    try {
      const result = await api.post(`/routine`, {
        text: text,
        option,
        userId: chatApi.getUserId(),
      });
      response = result.data.text;
      let newTaskId = '';
      if (result.status != 200) {
        response = "Error in response " + result.statusText;
      }
      try {
        const json = JSON.parse(response);
        if (json) {
          newTaskId = json.taskId;
          useUserStore.getState().setTaskId(newTaskId);
          response = (json.process_result + json.option_description) || json.data_result || json.question_description;
        }
      } catch (err) {
        console.log(err);
        newTaskId = response.taskId || result.data.taskId;
        useUserStore.getState().setTaskId(newTaskId);
        response = (response.process_result + response.option_description) || response.data_result || response.question_description || response;
      }
      return {
        text: response,
        user: 'agent',
        action: 'NONE',
        taskId: newTaskId,
      };
    } catch (err) {
      debug = err;
      console.log(err);
    }
    return {
      text: response || getUnknownErrorDesc(debug),
      user: 'agent',
      action: 'NONE',
    };
  },

  deleteChat: async (chatId: string): Promise<void> => {
    await api.delete(`/chat/${chatId}`);
  },

  getChatMessages: async (chatId: string): Promise<Message[]> => {
    const response = await api.get(`/chat/${chatId}/messages`);
    return response.data.data;
  },

  checkTaskStatus: async (): Promise<Message> => {
    let completed = false;
    try {
      const taskId = useUserStore.getState().getTaskId();
      if (!taskId) {
        return {
          text: getWaitTip(),
          user: 'client',
          action: 'NONE',
        };
      }
      const result = await api.get(`/task_status?taskId=${taskId}`, {});
      console.log(result);
      let response = result.data.task_status;
      if (result.status != 200) {
        response = "Error in response " + result.statusText;
      }
      try {
        //const match = response.match(/current_step:\s*(\d+)/);
        //const step = match ? parseInt(match[1], 10) : null;
        //response = `Step ${step} ...`;
        const status = JSON.parse(response);
        if (status) {
          response = status.text;
          completed = status.completed;
          if (response === '' && completed) {
            return {
              text: '',
              user: 'agent',
              action: 'NONE',
              completed,
            };
          }

          let options: string[] = [];
          let backup_options = [];
          let newTaskId = '';
          try {
            const json = JSON.parse(response);
            if (json) {
              newTaskId = json.taskId;
              if (newTaskId) {
                useUserStore.getState().setTaskId(newTaskId);
              }
              backup_options = json.intention_options;
              response = (json.process_result + json.option_description) || json.data_result || json.question_description;
            }
          } catch (err) {
            console.log(err);
            newTaskId = response.taskId;
            if (newTaskId) {
              useUserStore.getState().setTaskId(newTaskId);
            }
            backup_options = response.intention_options;
            response = (response.process_result + response.option_description) || response.data_result || response.question_description || response;
          }
          // Task Ended
          if (completed) {
            //useUserStore.getState().setTaskId("");
          }
          if (backup_options) {
            options = getRandomElements<string>(backup_options, 3, 5);
          }
          return {
            text: response,
            user: 'agent',
            action: 'NONE',
            taskId: newTaskId,
            options: options,
            backup_options: backup_options,
            completed,
          };
        }
      } catch (err) {
        console.log(err);
      }
      return {
        text: response || '还在处理中哦～这个问题的信息量有点大，我正在尽力生成最有价值的答案！',
        user: 'client',
        action: 'NONE',
        completed,
      };
    } catch (err) {
      console.log(err);
    }
    return {
      text: getWaitTip(),
      user: 'client',
      action: 'NONE',
      completed,
    };
  },

  getPromptTemplates: async (): Promise<Message> => {
    let debug = null;
    try {
      const userId = chatApi.getUserId();
      const result = await api.get(`/prompt_templates?userId=${userId}`, {});
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
      debug = err;
      console.log(err);
    }
    return {
      text: getUnknownErrorDesc(debug),
      user: 'client',
      action: 'NONE',
    };
  },

  addKnowledges: async (knowledges: string): Promise<Message> => {
    let debug = null;
    try {
      const result = await api.post(`/add_knowledge`, {
        userId: chatApi.getUserId(),
        knowledges: knowledges
      });
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
      debug = err;
      console.log(err);
    }
    return {
      text: getUnknownErrorDesc(debug),
      user: 'client',
      action: 'NONE',
    };
  },

  getKnowledges: async (): Promise<string> => {
    const response = await api.get(`/read_knowledge?userId=${chatApi.getUserId()}`, {});
    return response.data;
  },

  parseContentDisposition: (contentDisposition: string) => {
    if (!contentDisposition) return null;

    // RFC 5987  (filename*=utf-8'')
    const rfc5987Match = contentDisposition.match(/filename\*=([^;]+)/i);
    if (rfc5987Match) {
      const parts = rfc5987Match[1].split("'");
      if (parts.length >= 3) {
        try {
          return decodeURIComponent(parts[2]);
        } catch (e) {
          console.warn('Failed to decode RFC5987 filename:', e);
        }
      }
    }

    // (filename="...")
    const standardMatch = contentDisposition.match(/filename="([^"]*)"/i);
    if (standardMatch) {
      return standardMatch[1];
    }

    // (filename=...)
    const unquotedMatch = contentDisposition.match(/filename=([^;]*)/i);
    if (unquotedMatch) {
      return unquotedMatch[1].trim();
    }

    return null;
  },

  downloadWithCode: async (code: string, taskId: string, type: string): Promise<Message> => {
    let status = 200;
    try {
      //const taskId = useUserStore.getState().getTaskId();
      const result = await api.post<Blob>(`/download`, {
        verify_code: code,
        file_type: type,
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
        //const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        //if (filenameMatch?.[1]) {
        //  filename = filenameMatch[1];
        //}
        filename = chatApi.parseContentDisposition(contentDisposition) || filename;
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
    } catch (err: any) {
      console.log(err);
      let errorMessage = '下载失败，请稍后再试';
      if (err) {
        errorMessage = '下载失败，' + await err.response.data.text();
        status = err.response.status || 500;
        console.error('Download error:', err.response.statusText);
        if (!errorMessage) {
          switch (status) {
            case 403:
              errorMessage = '提取码错误，请重试';
              break;
            case 404:
              errorMessage = '文件不存在';  
              break;
            default:
              errorMessage = `服务器错误: ${err.response.statusText}`;
              break
          }
        }
      }
      return {
        text: errorMessage,
        user: 'client',
        action: 'NONE',
      };
    }
  },

  // 生成新的下载链接（假接口）
  generateNewLink: async (taskId: string, fileType: string): Promise<string> => {
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(taskId, fileType);
      
      // 模拟生成新的链接
      const newTaskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newDownloadUrl = `https://data3.site/download?taskId=${newTaskId}&file_type=${fileType}`;
      
      return newDownloadUrl;
    } catch (error) {
      console.error('生成新链接失败:', error);
      throw new Error('生成新链接失败，请稍后再试');
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
