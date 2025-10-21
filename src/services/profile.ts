import api from './axios';
import { pinyin } from "pinyin-pro";

export const ProfileApi = {
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

  uploadFile: async (files: File[]) => {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        let newFileName = ProfileApi.getFileName(file);
        formData.append('files', file, newFileName);
      });

      const result = await api.post('/memory_uploadfile', formData, {
        headers: {'Content-Type': 'multipart/form-data'}
      });
      console.log('upload result', result);
      let response = result.data || result;
      return response;
    } catch (e) {
      console.error('Error preparing form data:', e);
    }
    return 'Error';
  },

  add: async (text: string) => {
    try {
      const result = await api.post('/memory_add', {
        content: text,
        containerTag: 'sk_ai_quality'
      });
      console.log('add result', result);

      let response = result.data || result;
      if (result.status != 200) {
        return "Error in response " + result.statusText;
      }
      try {
        const json = JSON.parse(result.data || result);
        return json;
      } catch (err) {
      }
      return response;
    } catch (e) {
      console.error('Error add data:', e);
    }
    return null;
  },

  addUrls: async (text: string) => {
    try {
      const result = await api.post('/memory_add_urls', {
        content: text,
        containerTag: 'sk_ai_quality'
      });
      console.log('add urls result', result);

      let response = result.data || result;
      if (result.status != 200) {
        return "Error in response " + result.statusText;
      }
      try {
        const json = JSON.parse(result.data || result);
        return json;
      } catch (err) {
      }
      return response;
    } catch (e) {
      console.error('Error add urls:', e);
    }
    return null;
  },

  list: async () => {
    try {
      const result = await api.post('/memory_list', {});
      console.log('list result', result);

      let response = result.data || result;
      try {
        const json = JSON.parse(response);
        console.log(json);
        return json.memories;
      } catch (err) {
        console.log(err);
      }
      return response.memories;
    } catch (e) {
      console.error('Error list data:', e);
    }
    return 'Error';
  },

  searchDocs: async (text: string) => {
    try {
      const result = await api.post('/memory_search_documents', {
        text: text
      });
      console.log('search docs result', result);

      let response = result.data || result;
      try {
        const json = JSON.parse(response);
        console.log(json);
        return json.results;
      } catch (err) {
        console.log(err);
      }
      return response;
    } catch (e) {
      console.error('Error search docs:', e);
    }
    return 'Error';
  },

  search: async (text: string) => {
    try {
      const result = await api.post('/memory_search', {
        text: text
      });
      console.log('search result', result);

      let response = result.data || result;
      try {
        const json = JSON.parse(response);
        console.log(json);
        return json.results;
      } catch (err) {
        console.log(err);
      }
      return response;
    } catch (e) {
      console.error('Error search:', e);
    }
    return 'Error';
  },

  deleteDoc: async (docId: string) => {
    try {
      const result = await api.post('/memory_delete', {
        id: docId
      });
      console.log('delete result', result);

      let response = result.data || result;
      if (result.status != 200) {
        return "Error in response " + result.statusText;
      }
      return response;
    } catch (e) {
      console.error('Error delete data:', e);
    }
    return null;
  },
};
