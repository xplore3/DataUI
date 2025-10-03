import api from './axios';
import { pinyin } from "pinyin-pro";

export const ImageApi = {
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

  imageEdit: async (text: string, files: File[], model: string = 'bailian') => {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        let newFileName = ImageApi.getFileName(file);
        formData.append('files', file, newFileName);
      });
      formData.append('text', text);
      formData.append('model', model);

      const result = await api.post('/gen_image', formData, {
        headers: {'Content-Type': 'multipart/form-data'}
      });
      console.log('image result', result);
      let response = result.data || result;
      return response;
    } catch (e) {
      console.error('Error preparing form data:', e);
    }
    return 'Error';
  },

  imageToVideo: async (text: string, files: File[], model: string = 'bailian') => {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        let newFileName = ImageApi.getFileName(file);
        formData.append('files', file, newFileName);
      });
      formData.append('text', text);
      formData.append('model', model);

      const result = await api.post('/gen_video', formData, {
        headers: {'Content-Type': 'multipart/form-data'}
      });
      console.log('video result', result);
      let response = result.data || result;
      return response;
    } catch (e) {
      console.error('Error preparing form data:', e);
    }
    return 'Error';
  },

  imageToAnimate: async (text: string, files: File[], model: string = 'bailian') => {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        let newFileName = ImageApi.getFileName(file);
        formData.append('files', file, newFileName);
      });
      formData.append('text', text);
      formData.append('model', model);

      const result = await api.post('/gen_animate', formData, {
        headers: {'Content-Type': 'multipart/form-data'}
      });
      console.log('video result', result);
      let response = result.data || result;
      return response;
    } catch (e) {
      console.error('Error preparing form data:', e);
    }
    return 'Error';
  },

  readVideo: async (taskId: string, model: string = 'bailian') => {
    try {
      const result = await api.get(`/get_video_result?task_id=${taskId}&model=${model}`, {});
      console.log('video result', result);
      let response = result.data || result;
      return response;
    } catch (e) {
      console.error('Error preparing form data:', e);
    }
    return 'Error';
  },
};
