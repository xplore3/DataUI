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

  videoBgRemove: async (videoUrl: string) => {
    try {
      let result = await api.post(`/video_bg_remove`, {video_url: videoUrl});
      console.log('video_bg_remove result', result);
      let response = result.data || result;
      return response;
    } catch (e) {
      console.error('Error preparing form data:', e);
    }
    return 'Error';
  },

  readVideo: async (taskId: any, model: string = 'bailian') => {
    try {
      let result = null;
      if (model === 'bailian') {
        result = await api.get(`/get_video_result?task_id=${taskId}&model=${model}`, {});
      } else if (model === 'volce') {
        result = await api.get(`/get_video_result?task_id=${taskId.task_id}&req_key=${taskId.req_key}&model=${model}`, {});
      } else if (model === 'videobgremover') {
        result = await api.get(`/get_video_result?job_id=${taskId}&model=${model}`, {});
      }
      else {
        result = await api.get(`/get_video_result?task_id=${taskId}&model=${model}`, {});
      }
      console.log('video result', result);
      let response = result.data || result;
      return response;
    } catch (e) {
      console.error('Error preparing form data:', e);
    }
    return 'Error';
  },

  videoToGif: async (videoUrl: string, fps: number = 10) => {
    try {
      console.log('videoToGif called with:', { videoUrl: videoUrl.substring(0, 100), fps });
      
      // 下载视频文件
      const videoResponse = await fetch(videoUrl);
      if (!videoResponse.ok) {
        throw new Error(`Failed to fetch video: ${videoResponse.status}`);
      }
      const videoBlob = await videoResponse.blob();
      
      // 创建File对象
      const videoFile = new File([videoBlob], 'video.mp4', { type: 'video/mp4' });
      
      // 创建FormData
      const formData = new FormData();
      formData.append('files', videoFile);
      formData.append('skipBgRemoval', 'true'); // 跳过背景去除
      formData.append('fps', fps.toString());
      
      // 使用绝对路径调用后端API（video2gif API不在/:agentId路径下）
      const baseApiUrl = import.meta.env.VITE_API_BASE_URL;
      const fullUrl = `${baseApiUrl}/video2gif`;
      
      console.log('Calling video2gif API:', fullUrl);
      
      const result = await fetch(fullUrl, {
        method: 'POST',
        body: formData,
        // 不设置Content-Type，让浏览器自动设置（包含boundary）
      });
      
      if (!result.ok) {
        const errorText = await result.text();
        throw new Error(`API error: ${result.status} - ${errorText}`);
      }
      
      const responseText = await result.text();
      console.log('videoToGif result:', responseText);
      
      return responseText;
    } catch (e: any) {
      console.error('Error converting video to gif:', e);
      throw new Error(e.message || 'Video to GIF conversion failed');
    }
  },
};
