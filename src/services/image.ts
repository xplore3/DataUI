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

  imageEdit: async (text: string, files: File[]) => {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        let newFileName = ImageApi.getFileName(file);
        formData.append('files', file, newFileName);
      });
      formData.append('text', text);

      const result = await api.post('/gen_image', formData, {
        headers: {'Content-Type': 'multipart/form-data'}
      });
      console.log('image result', result);
      let response = result.data;
      if (result.status != 200) {
        response = "Error in response " + result.statusText;
      }
      return response;
    } catch (e) {
      console.error('Error preparing form data:', e);
    }
    return 'Error';
  },

  imageToVideo: async (text: string, files: File[]) => {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        let newFileName = ImageApi.getFileName(file);
        formData.append('files', file, newFileName);
      });
      formData.append('text', text);

      const result = await api.post('/gen_video', formData, {
        headers: {'Content-Type': 'multipart/form-data'}
      });
      console.log('video result', result);
      let response = result.data;
      if (result.status != 200) {
        response = "Error in response " + result.statusText;
      }
      return response;
    } catch (e) {
      console.error('Error preparing form data:', e);
    }
    return 'Error';
  },
};
