import api from './axios';

export const CodeApi = {
  codeGen: async () => {
    const response = await api.post('/code_gen');
    return response.data;
  },
  codeUse: async (code: string) => {
    const response = await api.post('/code_use', { code });
    return response.data;
  },
  codeValidate: async (code: string) => {
    const response = await api.post('/code_validate', { code });
    return response.data;
  },
};
