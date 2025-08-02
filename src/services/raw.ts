import api from './axios';

export const RawApi = {
  rawdata: async (text: string) => {
    const response = await api.post('/rawdata',
      { text, code: 'rawdata' });
    return response.data;
  },
};
