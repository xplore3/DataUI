import api from './axios';
import { chatApi } from './chat';

export const CodeApi = {
  codeGen: async (code: string) => {
    const response = await api.post('/code_gen',
      { code, userId: await chatApi.getUserId() });
    return response.data;
  },
  codeUse: async (code: string) => {
    const response = await api.post('/code_use',
      { code, userId: await chatApi.getUserId() });
    return response.data;
  },
  codeValidate: async (code: string) => {
    const response = await api.post('/code_validate',
      { code, userId: await chatApi.getUserId() });
    return response.data;
  },
  userList: async (code: string) => {
    const response = await api.post('/userlist',
      { code, userId: await chatApi.getUserId() });
    return response.data;
  },
};
