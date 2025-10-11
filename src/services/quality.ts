import api from './axios';
import { pinyin } from "pinyin-pro";

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

  prodctQuality: async (text: string) => {
    try {
      const result = await api.post('/routine', {
        text: text,
        option: 'product_quality',
        userId: 'webuser',
      });
      console.log('product result', result);
      let response = result.data || result;
      return response;
    } catch (e) {
      console.error('Error preparing form data:', e);
    }
    return 'Error';
  },
};
