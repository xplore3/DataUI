import api from './axios';
import { pinyin } from "pinyin-pro";
import { useUserStore } from '@/stores/useUserStore';
import { Message } from '../types/chat';
import { getWaitTip } from '@/utils/common';

export const QualityApi = {
  getFileName: (file: File) => {
    let newFileName = file.name;
    try {
      const dotIndex = file.name.lastIndexOf(".");
      const baseName = dotIndex !== -1 ? file.name.slice(0, dotIndex) : file.name;
      const ext = dotIndex !== -1 ? file.name.slice(dotIndex) : "";
      const baseNamePinyin = pinyin(baseName, { toneType: "none" })
        .replace(/\s+/g, "_") // Replace spaces with underscores
        .toLowerCase();
      newFileName = baseNamePinyin + ext;
    } catch (e) {
      console.error('Error encoding file name:', e);
      newFileName = encodeURIComponent(file.name);
    }
    return newFileName;
  },

  imageRead: async (text: string, files: File[], model: string = 'bailian') => {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        let newFileName = QualityApi.getFileName(file);
        formData.append('files', file, newFileName);
      });
      formData.append('text', text);
      formData.append('model', model);

      const result = await api.post('/image_read', formData, {
        headers: {'Content-Type': 'multipart/form-data'}
      });
      console.log('image read result', result);
      let response = result.data || result;
      return response;
    } catch (e) {
      console.error('Error preparing form data:', e);
    }
    return 'Error';
  },

  productName: async (text: string) => {
    try {
      const result = await api.post('/routine', {
        text: text,
        option: 'product_name',
        userId: 'qualitywebuser',
      });
      console.log('product name result', result);

      let response = result.data.text;
      if (result.status != 200) {
        response = "Error in response " + result.statusText;
      }
      try {
        const json = JSON.parse(response);
        /*if (json && json.result === 'success') {
          response = json.product;
        }
        else if (json && json.result === 'fail') {
          response = json.reason;
        }*/
        return json;
      } catch (err) {
        //response = response.product || response;
      }
      return response;
    } catch (e) {
      console.error('Error preparing form data:', e);
    }
    return null;
  },

  productQuality: async (text: string) => {
    try {
      const result = await api.post('/routine', {
        text: text,
        option: 'product_quality',
        userId: 'qualitywebuser',
      });
      console.log('product result', result);

      let response = result.data.text;
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
        //console.log(err);
        newTaskId = response.taskId || result.data.taskId;
        useUserStore.getState().setTaskId(newTaskId);
        response = (response.process_result + response.option_description) || response.data_result || response.question_description || response;
      }
      return response;
    } catch (e) {
      console.error('Error preparing form data:', e);
    }
    return 'Error';
  },

  checkTaskStatus: async (): Promise<Message> => {
    let completed = false;
    try {
      let taskId = useUserStore.getState().getTaskId();
      if (!taskId) {
        return {
          text: '',
          user: 'client',
          action: 'NONE',
          completed: false
        };
      }
      const result = await api.get(`/task_status?taskId=${taskId}`, {});
      //console.log(result);
      let response = result.data.task_status;
      if (result.status != 200) {
        response = "Error in response " + result.statusText;
      }
      try {
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

          let newTaskId = '';
          try {
            const json = JSON.parse(response);
            if (json) {
              newTaskId = json.taskId;
              if (newTaskId) {
                useUserStore.getState().setTaskId(newTaskId);
              }
              response = (json.process_result + json.option_description) || json.data_result || json.question_description;
            }
          } catch (err) {
            //console.log(err);
            newTaskId = response.taskId;
            if (newTaskId) {
              useUserStore.getState().setTaskId(newTaskId);
            }
            response = (response.process_result + response.option_description) || response.data_result || response.question_description || response;
          }
          // Task Ended
          if (completed) {
            //useUserStore.getState().setTaskId("");
          }
          return {
            text: response,
            user: 'agent',
            action: 'NONE',
            taskId: newTaskId,
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
};
