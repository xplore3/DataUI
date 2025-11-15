import { useState, useCallback } from 'react';
import { message, Modal } from 'antd';
import JSZip from 'jszip';
import { ImageApi } from '../../services/image';
import { PROMPTS } from './prompts';
import './index.less';

// 常量定义
const GENERATE_TIMEOUT = 4 * 60 * 1000;
const MIN_IMAGE_BYTES = 10 * 1024;

// 工具函数
const withTimeout = async <T,>(promise: Promise<T>, timeout: number, messageText = '生成超时，请稍后重试'): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(messageText));
    }, timeout);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
};

const getImageByteLength = (dataUrl: string): number => {
  if (!dataUrl || typeof dataUrl !== 'string') return 0;
  const parts = dataUrl.split(',');
  if (parts.length < 2) return 0;
  const base64 = parts[1];
  return Math.floor((base64.length * 3) / 4);
};

const isValidImageData = (dataUrl: string, minBytes: number = MIN_IMAGE_BYTES): boolean => {
  if (!dataUrl?.startsWith('data:image')) return false;
  return getImageByteLength(dataUrl) >= minBytes;
};

const assertValidImageData = (dataUrl: string, context: string) => {
  if (!isValidImageData(dataUrl)) {
    throw new Error(`${context}生成结果异常，请稍后重试`);
  }
};

const base64ToFile = async (base64: string, filename: string): Promise<File> => {
  const response = await fetch(base64);
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type });
};

const imageUrlToBase64 = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert blob to base64'));
        }
      };
      reader.onerror = () => reject(new Error('FileReader error'));
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    throw new Error(`Failed to convert image to base64: ${error}`);
  }
};

// 确认对话框
const confirmRegeneratePetImageModal = (): Promise<boolean> => {
  return new Promise<boolean>((resolve) => {
    let settled = false;
    const complete = (result: boolean) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    const modal = Modal.confirm({
      title: '重新生成定妆照',
      content: (
        <div>
          <p>重新生成会清空当前定妆照，并重新生成走路和跑步姿态。</p>
          <p style={{ marginTop: 8 }}>整个过程预计耗时约 1 分钟，是否继续？</p>
        </div>
      ),
      okText: '确认重新生成',
      cancelText: '取消',
      centered: true,
      icon: null,
      maskClosable: true,
      okButtonProps: { danger: true },
      onOk: () => {
        modal.destroy();
        complete(true);
      },
      onCancel: () => {
        modal.destroy();
        complete(false);
      }
    });
  });
};

// 接口定义
interface GeneratedAction {
  id: number;
  name: string;
  preview: string;
  taskId?: string;
  gifUrl?: string;
  isConvertingToGif?: boolean;
  isRegenerating?: boolean;
  prompt?: string;
}

interface GenerationState {
  isGenerating: boolean;
  progress: number;
  currentTask?: string;
}

const PetCreator = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedStyle, setSelectedStyle] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  // 生成状态管理
  const [generationState, setGenerationState] = useState<GenerationState>({
    isGenerating: false,
    progress: 0,
    currentTask: ''
  });
  
  // 生成结果
  const [generatedResults, setGeneratedResults] = useState<{
    petImage?: string;
    walkImage?: string;
    runImage?: string;
    actions: GeneratedAction[];
  }>({
    actions: []
  });

  // 重新生成状态
  const [regeneratingStates, setRegeneratingStates] = useState({
    petImage: false,
    walkImage: false,
    runImage: false
  });

  // 预定义动作列表
  const getPredefinedActions = () => {
    return selectedStyle === 'pixel' ? PROMPTS.actions.pixel : PROMPTS.actions.disney;
  };

  // 样式选择
  const handleStyleSelect = (style: string) => {
    setSelectedStyle(style);
  };

  // 图片上传
  const handleImageUpload = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onload = (event: any) => {
        setUploadedImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // 图片结果标准化
  const normalizeImageResult = async (result: any): Promise<string> => {
    if (result && typeof result === 'string' && result.startsWith('data:image')) {
      return result;
    }

    if (result && typeof result === 'string' && result.startsWith('{')) {
      try {
        const errorObj = JSON.parse(result);
        if (errorObj.code === 'Arrearage') {
          throw new Error('⚠️ 阿里百炼账户余额不足，请充值后重试');
        }
        throw new Error(errorObj.message || errorObj.error || '生成失败');
      } catch (e: any) {
        if (e instanceof Error && e.message.includes('余额不足')) {
          throw e;
        }
        throw new Error('生成失败：' + result);
      }
    }

    if (result && result.error) {
      throw new Error(result.error);
    }

    return await imageUrlToBase64(result);
  };

  // 更新生成状态
  const updateGenerationState = useCallback((updates: Partial<GenerationState>) => {
    setGenerationState(prev => ({ ...prev, ...updates }));
  }, []);

  // 显示错误消息
  const showError = useCallback((error: any, context: string) => {
    console.error(`${context}:`, error);
    let errorMessage = '生成失败，请重试';
    
    if (error instanceof Error) {
      if (error.message.includes('余额不足')) {
        errorMessage = error.message;
      } else if (error.message.includes('超时')) {
        errorMessage = error.message;
      } else {
        errorMessage = `${context}${error.message}`;
      }
    }
    
    message.error(errorMessage);
  }, []);

  // 生成宠物形象
  const handleGeneratePetImage = async () => {
    if (!uploadedFile) {
      message.error('请先上传图片');
      return;
    }

    updateGenerationState({ 
      isGenerating: true, 
      progress: 0, 
      currentTask: '正在生成宠物形象...' 
    });

    try {
      const prompt = selectedStyle === 'pixel' ? PROMPTS.pixel.base : PROMPTS.disney.base;
      const targetRatio = selectedStyle === 'pixel' ? 16/9 : 9/16;
      const model = 'volce';

      console.log('开始生成宠物形象...', { 
        style: selectedStyle, 
        model,
        targetRatio 
      });

      const result = await withTimeout(
        ImageApi.imageEdit(prompt, [uploadedFile], model), 
        GENERATE_TIMEOUT
      );

      const imageData = await normalizeImageResult(result);
      assertValidImageData(imageData, '宠物定妆照');
      
      setGeneratedResults(prev => ({ ...prev, petImage: imageData }));
      updateGenerationState({ progress: 33, currentTask: '宠物形象生成完成！' });
      message.success('宠物定妆照生成成功！');

      // 如果是像素风格，自动生成动作图片
      if (selectedStyle === 'pixel') {
        await handleGenerateActionImages(imageData);
      } else {
        updateGenerationState({ progress: 100, currentTask: '所有图片生成完成！' });
      }
    } catch (error: any) {
      showError(error, '生成宠物形象失败');
    } finally {
      setTimeout(() => {
        updateGenerationState({ isGenerating: false, progress: 0, currentTask: '' });
      }, 1000);
    }
  };

  // 生成动作图片（走路、跑步）
  const handleGenerateActionImages = async (baseImage: string) => {
    if (!baseImage) return;

    updateGenerationState({ 
      isGenerating: true, 
      progress: 33, 
      currentTask: '正在生成走路姿态...' 
    });

    try {
      const model = 'bailian';
      const petImageFile = await base64ToFile(baseImage, 'pet-action-image.png');

      // 生成走路姿态
      updateGenerationState({ currentTask: '正在生成走路姿态...', progress: 33 });
      let result = await withTimeout(
        ImageApi.imageEdit(PROMPTS.pixel.walk, [petImageFile], model), 
        GENERATE_TIMEOUT
      );
      const walkImage = await normalizeImageResult(result);
      assertValidImageData(walkImage, '走路姿态');
      setGeneratedResults(prev => ({ ...prev, walkImage }));
      updateGenerationState({ progress: 66, currentTask: '走路姿态生成完成！' });
      message.success('宠物走路姿态生成成功！');

      // 等待1秒再生成下一个，让用户能看到进度变化
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 生成跑步姿态
      updateGenerationState({ currentTask: '正在生成跑步姿态...', progress: 66 });
      result = await withTimeout(
        ImageApi.imageEdit(PROMPTS.pixel.run, [petImageFile], model), 
        GENERATE_TIMEOUT
      );
      const runImage = await normalizeImageResult(result);
      assertValidImageData(runImage, '跑步姿态');
      setGeneratedResults(prev => ({ ...prev, runImage }));
      updateGenerationState({ progress: 100, currentTask: '所有动作图片生成完成！' });
      message.success('宠物跑步姿态生成成功！');

      // 保持完成状态1秒
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error: any) {
      showError(error, '生成动作图片失败');
    } finally {
      updateGenerationState({ isGenerating: false, progress: 0, currentTask: '' });
    }
  };

  // 重新生成宠物形象
  const handleRegeneratePetImage = async () => {
    if (selectedStyle !== 'pixel' || !uploadedFile) {
      message.error('请返回上一步重新上传图片');
      return;
    }

    const confirmed = await confirmRegeneratePetImageModal();
    if (!confirmed) return;

    setRegeneratingStates(prev => ({ ...prev, petImage: true }));
    const key = 'regen-pet-image';
    message.loading({ content: '正在重新生成宠物定妆照...', key, duration: 0 });

    try {
      const result = await withTimeout(
        ImageApi.imageEdit(PROMPTS.pixel.base, [uploadedFile], 'volce'), 
        GENERATE_TIMEOUT
      );
      const imageData = await normalizeImageResult(result);
      assertValidImageData(imageData, '宠物定妆照');
      
      setGeneratedResults({ 
        petImage: imageData, 
        walkImage: undefined, 
        runImage: undefined, 
        actions: [] 
      });
      
      message.loading({ content: '定妆照更新成功，正在重新生成动作图片...', key, duration: 0 });
      await handleGenerateActionImages(imageData);
      message.success({ content: '宠物形象已全部重新生成！', key });
    } catch (error: any) {
      showError(error, '重新生成宠物形象失败');
    } finally {
      setRegeneratingStates(prev => ({ ...prev, petImage: false }));
    }
  };

  // 重新生成单个动作图片
  const handleRegenerateActionImage = async (type: 'walk' | 'run') => {
    if (selectedStyle !== 'pixel' || !generatedResults.petImage) {
      message.error('请先生成宠物定妆照');
      return;
    }

    const key = type === 'walk' ? 'regen-walk-image' : 'regen-run-image';
    const setLoading = (loading: boolean) => 
      setRegeneratingStates(prev => ({ ...prev, [type === 'walk' ? 'walkImage' : 'runImage']: loading }));
    
    const prompt = type === 'walk' ? PROMPTS.pixel.walk : PROMPTS.pixel.run;
    const successText = type === 'walk' ? '走路姿态重新生成成功！' : '跑步姿态重新生成成功！';

    setLoading(true);
    message.loading({ content: `正在重新生成${type === 'walk' ? '走路' : '跑步'}姿态...`, key, duration: 0 });

    try {
      const petImageFile = await base64ToFile(generatedResults.petImage, `pet-${type}-image.png`);
      const result = await withTimeout(
        ImageApi.imageEdit(prompt, [petImageFile], 'bailian'), 
        GENERATE_TIMEOUT
      );
      const imageData = await normalizeImageResult(result);
      assertValidImageData(imageData, `${type === 'walk' ? '走路' : '跑步'}姿态`);
      
      setGeneratedResults(prev => ({ 
        ...prev, 
        [type === 'walk' ? 'walkImage' : 'runImage']: imageData 
      }));
      
      message.success({ content: successText, key });
    } catch (error: any) {
      showError(error, `重新生成${type === 'walk' ? '走路' : '跑步'}姿态失败`);
    } finally {
      setLoading(false);
    }
  };

  // 轮询视频结果
  const pollVideoResult = async (taskId: string, model: string = 'bailian'): Promise<string> => {
    const maxAttempts = 120;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const result = await ImageApi.readVideo(taskId, model);
        
        if (typeof result === 'string' && (result.startsWith('http') || result.startsWith('https') || result.startsWith('data:video/'))) {
          return result;
        }

        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
      } catch (error) {
        console.error('轮询视频结果失败:', error);
        attempts++;
      }
    }

    throw new Error('视频生成超时');
  };

  // 生成所有动作视频
  const handleGenerateAllActions = async () => {
    if (!generatedResults.petImage) {
      message.error('请先生成宠物形象');
      return;
    }

    // 初始化空的动作列表
    const predefinedActions = getPredefinedActions();
    const initialActions: GeneratedAction[] = predefinedActions.map(action => ({
      id: action.id,
      name: action.name,
      preview: '',
      prompt: action.prompt
    }));
    
    setGeneratedResults(prev => ({ ...prev, actions: initialActions }));

    updateGenerationState({ 
      isGenerating: true, 
      progress: 0, 
      currentTask: '正在准备生成动作...' 
    });

    try {
      const actions = predefinedActions;
      const videoModel = selectedStyle === 'pixel' ? 'bailian' : 'volce';
      const petImageFile = await base64ToFile(generatedResults.petImage, 'pet-image.png');

      const newActions: GeneratedAction[] = [];

      for (let i = 0; i < actions.length; i++) {
        const action = actions[i];
        const progress = Math.round((i / actions.length) * 100);
        
        updateGenerationState({ 
          progress,
          currentTask: `正在生成"${action.name}"动作... (${i + 1}/${actions.length})` 
        });

        try {
          let frameFiles = [petImageFile];
          
          // 为走和跑动作使用对应的图片
          if (action.name === '走' && generatedResults.walkImage) {
            const walkFile = await base64ToFile(generatedResults.walkImage, 'walk-image.png');
            frameFiles = [walkFile, walkFile];
          } else if (action.name === '跑' && generatedResults.runImage) {
            const runFile = await base64ToFile(generatedResults.runImage, 'run-image.png');
            frameFiles = [runFile, runFile];
          }

          let taskId: any = await ImageApi.imageToVideo(action.prompt, frameFiles, videoModel);

          // Volce 模型直接返回URL的处理
          if (videoModel === 'volce' && typeof taskId === 'string' && 
              (taskId.startsWith('http://') || taskId.startsWith('https://'))) {
            newActions.push({
              id: action.id,
              name: action.name,
              preview: taskId,
              prompt: action.prompt
            });

            // 实时更新已生成的动作
            setGeneratedResults(prev => ({
              ...prev,
              actions: prev.actions.map(a => 
                a.id === action.id ? { ...a, preview: taskId } : a
              )
            }));
            continue;
          }

          // 处理任务ID
          if (typeof taskId === 'number') {
            taskId = String(taskId);
          }

          // Volce 模型可能返回 JSON 字符串
          if (videoModel === 'volce' && typeof taskId === 'string' && taskId.startsWith('{')) {
            try {
              taskId = JSON.parse(taskId);
            } catch (e) {
              console.error('解析 volce taskId 失败:', e);
            }
          }

          // 验证任务ID
          if (!taskId || (typeof taskId !== 'string' && !(taskId.task_id && taskId.req_key))) {
            throw new Error(`无效的任务ID: ${JSON.stringify(taskId)}`);
          }

          // 轮询获取视频结果
          updateGenerationState({ 
            currentTask: `等待"${action.name}"视频生成中... (${i + 1}/${actions.length})` 
          });
          const videoUrl = await pollVideoResult(taskId, videoModel);

          // 添加到新动作列表
          newActions.push({
            id: action.id,
            name: action.name,
            preview: videoUrl,
            taskId,
            prompt: action.prompt
          });

          // 实时更新已生成的动作
          setGeneratedResults(prev => ({
            ...prev,
            actions: prev.actions.map(a => 
              a.id === action.id ? { ...a, preview: videoUrl, taskId } : a
            )
          }));

          // 串行执行，每个动作间隔2秒
          if (i < actions.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        } catch (error) {
          console.error(`生成${action.name}动作失败:`, error);
          message.error(`"${action.name}"动作生成失败，已跳过`);
        }
      }

      message.success(`成功生成 ${newActions.length} 个动作！`);
    } catch (error: any) {
      showError(error, '生成动作失败');
    } finally {
      updateGenerationState({ isGenerating: false, progress: 0, currentTask: '' });
    }
  };

  // 重新生成单个动作
  const handleRegenerateAction = async (actionId: number) => {
    const action = generatedResults.actions.find(a => a.id === actionId);
    if (!action || !generatedResults.petImage) {
      message.error('动作不存在或宠物形象未生成');
      return;
    }

    // 设置重新生成状态
    const updatedActions = generatedResults.actions.map(a => 
      a.id === actionId ? { ...a, isRegenerating: true } : a
    );
    setGeneratedResults(prev => ({ ...prev, actions: updatedActions }));

    const key = `regen-action-${actionId}`;
    message.loading({ content: `正在重新生成"${action.name}"动作...`, key, duration: 0 });

    try {
      const videoModel = selectedStyle === 'pixel' ? 'bailian' : 'volce';
      const petImageFile = await base64ToFile(generatedResults.petImage, 'pet-image.png');
      const prompt = action.prompt || '';

      // 为走和跑动作使用对应的图片
      let frameFiles = [petImageFile];
      if (action.name === '走' && generatedResults.walkImage) {
        const walkFile = await base64ToFile(generatedResults.walkImage, 'walk-image.png');
        frameFiles = [walkFile, walkFile];
      } else if (action.name === '跑' && generatedResults.runImage) {
        const runFile = await base64ToFile(generatedResults.runImage, 'run-image.png');
        frameFiles = [runFile, runFile];
      }

      let taskId: any = await ImageApi.imageToVideo(prompt, frameFiles, videoModel);

      // Volce 模型直接返回URL的处理
      if (videoModel === 'volce' && typeof taskId === 'string' && 
          (taskId.startsWith('http://') || taskId.startsWith('https://'))) {
        
        const finalActions = generatedResults.actions.map(a => 
          a.id === actionId ? { 
            ...a, 
            preview: taskId,
            gifUrl: undefined,
            isRegenerating: false 
          } : a
        );
        setGeneratedResults(prev => ({ ...prev, actions: finalActions }));
        
        message.success({ content: `"${action.name}"动作重新生成成功！`, key });
        return;
      }

      // 处理任务ID
      if (typeof taskId === 'number') {
        taskId = String(taskId);
      }

      // Volce 模型可能返回 JSON 字符串
      if (videoModel === 'volce' && typeof taskId === 'string' && taskId.startsWith('{')) {
        try {
          taskId = JSON.parse(taskId);
        } catch (e) {
          console.error('解析 volce taskId 失败:', e);
        }
      }

      // 检测并发限制错误
      if (videoModel === 'volce' && typeof taskId === 'string' && taskId.includes('API Concurrent Limit')) {
        console.warn(`${action.name} 遇到并发限制，等待 5 秒后重试...`);
        message.warning({ content: `"${action.name}"遇到并发限制，等待后重试...`, key, duration: 3 });
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // 重试一次
        taskId = await ImageApi.imageToVideo(prompt, frameFiles, videoModel);
        
        if (typeof taskId === 'string' && taskId.startsWith('{')) {
          try {
            taskId = JSON.parse(taskId);
          } catch (e) {
            console.error('解析重试后的 volce taskId 失败:', e);
          }
        }
      }

      // 验证任务ID
      if (!taskId || (typeof taskId !== 'string' && !(taskId.task_id && taskId.req_key))) {
        throw new Error(`无效的任务ID: ${JSON.stringify(taskId)}`);
      }

      // 轮询获取视频结果
      message.loading({ content: `等待"${action.name}"视频生成中...`, key, duration: 0 });
      const videoUrl = await pollVideoResult(taskId, videoModel);

      // 更新动作信息
      const finalActions = generatedResults.actions.map(a => 
        a.id === actionId ? { 
          ...a, 
          preview: videoUrl,
          taskId,
          gifUrl: undefined,
          isRegenerating: false 
        } : a
      );
      setGeneratedResults(prev => ({ ...prev, actions: finalActions }));

      message.success({ content: `"${action.name}"动作重新生成成功！`, key });

    } catch (error: any) {
      console.error(`重新生成${action.name}动作失败:`, error);
      
      let errorMessage = '重新生成失败，请重试';
      if (error instanceof Error) {
        if (error.message.includes('余额不足')) {
          errorMessage = error.message;
        } else if (error.message.includes('超时')) {
          errorMessage = '生成超时，请稍后重试';
        } else {
          errorMessage = `重新生成失败: ${error.message}`;
        }
      }
      
      message.error({ content: errorMessage, key });
      
      // 重置状态
      const resetActions = generatedResults.actions.map(a => 
        a.id === actionId ? { ...a, isRegenerating: false } : a
      );
      setGeneratedResults(prev => ({ ...prev, actions: resetActions }));
    }
  };

  // 转换为GIF
  const handleConvertToGif = async (actionId: number) => {
    const action = generatedResults.actions.find(a => a.id === actionId);
    if (!action) return;

    const updatedActions = generatedResults.actions.map(a => 
      a.id === actionId ? { ...a, isConvertingToGif: true } : a
    );
    setGeneratedResults(prev => ({ ...prev, actions: updatedActions }));

    try {
      const gifUrl = await ImageApi.videoToGif(action.preview, 10);
      if (gifUrl && typeof gifUrl === 'string' && gifUrl.startsWith('http')) {
        const finalActions = generatedResults.actions.map(a => 
          a.id === actionId ? { ...a, gifUrl, isConvertingToGif: false } : a
        );
        setGeneratedResults(prev => ({ ...prev, actions: finalActions }));
        message.success(`"${action.name}"转换成功！`);
      }
    } catch (error: any) {
      showError(error, '转换GIF失败');
      const resetActions = generatedResults.actions.map(a => 
        a.id === actionId ? { ...a, isConvertingToGif: false } : a
      );
      setGeneratedResults(prev => ({ ...prev, actions: resetActions }));
    }
  };

  // 下载单个文件
  const handleDownloadFile = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      message.success('下载成功！');
    } catch (error) {
      message.error('下载失败，请重试');
    }
  };

  // 打包下载所有资源
  const handleDownloadAll = async () => {
    try {
      message.loading({ content: '正在打包资源...', key: 'downloadAll', duration: 0 });
      const zip = new JSZip();
      let fileCount = 0;

      const urlToBlob = async (url: string): Promise<Blob> => {
        const response = await fetch(url);
        return await response.blob();
      };

      // 添加宠物形象
      if (generatedResults.petImage) {
        const blob = await urlToBlob(generatedResults.petImage);
        zip.file(`pet-image-${selectedStyle}.png`, blob);
        fileCount++;
      }

      // 添加动作文件
      for (const action of generatedResults.actions) {
        if (action.preview) {
          const downloadUrl = action.gifUrl || action.preview;
          const fileExtension = action.gifUrl ? 'gif' : 'mp4';
          const blob = await urlToBlob(downloadUrl);
          zip.file(`actions/${action.name}.${fileExtension}`, blob);
          fileCount++;
        }
      }

      if (fileCount === 0) {
        message.warning({ content: '没有可下载的资源', key: 'downloadAll' });
        return;
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      const filename = `pet-${selectedStyle}-${timestamp}.zip`;

      const a = document.createElement('a');
      a.href = URL.createObjectURL(zipBlob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);

      message.success({ 
        content: `成功打包 ${fileCount} 个文件！`, 
        key: 'downloadAll',
        duration: 3
      });
    } catch (error: any) {
      showError(error, '打包下载失败');
    }
  };

  // 重置生成器
  const resetCreator = () => {
    setCurrentStep(1);
    setSelectedStyle('');
    setUploadedImage(null);
    setUploadedFile(null);
    setGeneratedResults({ actions: [] });
    setGenerationState({ isGenerating: false, progress: 0, currentTask: '' });
  };

  // 获取预定义动作列表
  const predefinedActions = getPredefinedActions();

  return (
    <div className="pet-creator">
      <div className="container">
        <h1>桌面萌宠制作器</h1>
        
        {/* 步骤指示器 */}
        <div className="step-indicator">
          {[1, 2, 3, 4, 5].map(step => (
            <div key={step} className={`step ${currentStep >= step ? 'active' : ''}`}>
              <span>{step}</span>
              <p>
                {step === 1 && '选择风格'}
                {step === 2 && '上传图片'}
                {step === 3 && '生成形象'}
                {step === 4 && '生成动作'}
                {step === 5 && '完成'}
              </p>
            </div>
          ))}
        </div>

        {/* 步骤一：选择风格 */}
        {currentStep === 1 && (
          <div className="step-content">
            <h2>步骤一：选择桌宠风格</h2>
            <div className="style-selection">
              {[
                { value: 'pixel', label: '像素风', previewClass: 'pixel-preview' },
                { value: 'disney', label: '迪士尼风', previewClass: 'disney-preview' }
              ].map(style => (
                <div 
                  key={style.value}
                  className={`style-option ${selectedStyle === style.value ? 'selected' : ''}`}
                  onClick={() => handleStyleSelect(style.value)}
                >
                  <div className={`style-preview ${style.previewClass}`}></div>
                  <h3>{style.label}</h3>
                  <p>效果预览</p>
                </div>
              ))}
            </div>
            <div className="action-buttons">
              <button 
                className="btn primary" 
                disabled={!selectedStyle}
                onClick={() => setCurrentStep(2)}
              >
                制作{selectedStyle === 'pixel' ? '像素风' : '迪士尼风'}
              </button>
            </div>
          </div>
        )}

        {/* 步骤二：上传图片 */}
        {currentStep === 2 && (
          <div className="step-content">
            <h2>步骤二：上传图片</h2>
            <p className="instruction">
              请上传毛孩子的侧面站立照/正面俯拍照，保持光线充足，纯色背景最佳。
            </p>
            <div className="upload-area">
              <input 
                type="file" 
                id="pet-image" 
                accept="image/*" 
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
              <label htmlFor="pet-image" className="upload-btn">
                {uploadedImage ? (
                  <img src={uploadedImage} alt="上传的宠物图片" className="uploaded-image" />
                ) : (
                  <div className="upload-placeholder">
                    <span>+</span>
                    <p>上传图片</p>
                  </div>
                )}
              </label>
            </div>
            <div className="action-buttons">
              <button className="btn secondary" onClick={() => setCurrentStep(1)}>
                上一步
              </button>
              <button 
                className="btn primary" 
                disabled={!uploadedImage}
                onClick={() => setCurrentStep(3)}
              >
                下一步
              </button>
            </div>
          </div>
        )}

        {/* 步骤三：生成形象 */}
        {currentStep === 3 && (
          <div className="step-content">
            <h2>步骤三：生成桌宠形象照</h2>
            
            {/* 生成状态显示 */}
            {generationState.isGenerating && (
              <div className="generating-container">
                <div className="loading-spinner"></div>
                <p>{generationState.currentTask}</p>
                <div className="progress-bar">
                  <div 
                    className="progress" 
                    style={{ width: `${generationState.progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* 生成结果展示 */}
            <div className="generated-results">
              {/* 宠物形象展示区域 - 始终显示 */}
              <div className="result-item">
                <h3 className={generatedResults.petImage ? "success-text" : "waiting-text"}>
                  {generatedResults.petImage ? '🎉 宠物定妆照生成完成！' : '等待生成宠物形象...'}
                </h3>
                <div className="pet-image-container">
                  <div className="image-wrapper large">
                    {generatedResults.petImage ? (
                      <img src={generatedResults.petImage} alt="生成的宠物形象" className="generated-pet-image" />
                    ) : (
                      <div className="image-placeholder">等待生成...</div>
                    )}
                  </div>
                  {selectedStyle === 'pixel' && generatedResults.petImage && (
                    <button
                      className="btn secondary small"
                      onClick={handleRegeneratePetImage}
                      disabled={regeneratingStates.petImage}
                    >
                      {regeneratingStates.petImage ? '重新生成中...' : '重新生成定妆照'}
                    </button>
                  )}
                </div>
              </div>

              {/* 动作图片展示区域 - 像素风格时显示 */}
              {selectedStyle === 'pixel' && (
                <div className="action-images-section">
                  <h3>动作姿态</h3>
                  <div className="action-images-grid">
                    {/* 走路姿态 */}
                    <div className="action-image-item">
                      <h4>走路姿态</h4>
                      <div className="pet-action-card">
                        <div className="image-wrapper small">
                          {generatedResults.walkImage ? (
                            <img src={generatedResults.walkImage} alt="生成的走路形象" className="generated-pet-action-image" />
                          ) : (
                            <div className="image-placeholder">等待生成...</div>
                          )}
                        </div>
                        <button
                          className="btn secondary small"
                          onClick={() => handleRegenerateActionImage('walk')}
                          disabled={regeneratingStates.walkImage || !generatedResults.petImage}
                        >
                          {regeneratingStates.walkImage ? '生成中...' : generatedResults.walkImage ? '重新生成' : '等待生成'}
                        </button>
                      </div>
                    </div>

                    {/* 跑步姿态 */}
                    <div className="action-image-item">
                      <h4>跑步姿态</h4>
                      <div className="pet-action-card">
                        <div className="image-wrapper small">
                          {generatedResults.runImage ? (
                            <img src={generatedResults.runImage} alt="生成的跑步形象" className="generated-pet-action-image" />
                          ) : (
                            <div className="image-placeholder">等待生成...</div>
                          )}
                        </div>
                        <button
                          className="btn secondary small"
                          onClick={() => handleRegenerateActionImage('run')}
                          disabled={regeneratingStates.runImage || !generatedResults.petImage}
                        >
                          {regeneratingStates.runImage ? '生成中...' : generatedResults.runImage ? '重新生成' : '等待生成'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 操作按钮 */}
            <div className="action-buttons">
              {!generatedResults.petImage ? (
                <>
                  <button className="btn secondary" onClick={() => setCurrentStep(2)}>
                    上一步
                  </button>
                  <button 
                    className="btn primary" 
                    onClick={handleGeneratePetImage}
                    disabled={generationState.isGenerating}
                  >
                    {generationState.isGenerating ? '生成中...' : '生成形象'}
                  </button>
                </>
              ) : (
                <>
                  <button className="btn secondary" onClick={resetCreator}>
                    重新开始
                  </button>
                  <button 
                    className="btn" 
                    onClick={() => handleDownloadFile(generatedResults.petImage!, `pet-image-${selectedStyle}.png`)}
                  >
                    💾 下载形象
                  </button>
                  <button 
                    className="btn primary" 
                    onClick={() => setCurrentStep(4)}
                    disabled={selectedStyle === 'pixel' && (!generatedResults.walkImage || !generatedResults.runImage)}
                  >
                    继续生成动作
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* 步骤四：生成动作 */}
        {currentStep === 4 && (
          <div className="step-content">
            <h2>步骤四：生成专属动作</h2>
            
            {/* 生成状态 */}
            {generationState.isGenerating && (
              <div className="generating-container">
                <div className="loading-spinner"></div>
                <p>{generationState.currentTask}</p>
                <div className="progress-bar">
                  <div 
                    className="progress" 
                    style={{ width: `${generationState.progress}%` }}
                  ></div>
                </div>
                <p className="progress-text">
                  已生成 {generatedResults.actions.filter(a => a.preview).length} / {predefinedActions.length} 个动作
                </p>
              </div>
            )}

            {/* 动作网格 - 始终显示所有动作位置 */}
            <div className="actions-preview">
              <h3>动作生成进度 ({generatedResults.actions.filter(a => a.preview).length} / {predefinedActions.length})</h3>
              <div className="actions-grid-preview">
                {predefinedActions.map(action => {
                  const generatedAction = generatedResults.actions.find(a => a.id === action.id);
                  return (
                    <div key={action.id} className="action-preview-item">
                      <div className="action-preview">
                        {generatedAction?.preview ? (
                          <video 
                            src={generatedAction.preview} 
                            autoPlay 
                            loop 
                            muted
                            playsInline
                            className="action-video"
                          />
                        ) : (
                          <div className="action-placeholder">
                            {generationState.isGenerating ? '生成中...' : '等待生成'}
                          </div>
                        )}
                      </div>
                      <p className="action-name">{action.name}</p>
                      {generatedAction?.preview && (
                        <div className="action-status-badge">✓ 已完成</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="action-buttons">
              <button className="btn secondary" onClick={() => setCurrentStep(3)}>
                上一步
              </button>
              <button 
                className={`btn primary ${generationState.isGenerating ? 'loading' : ''}`}
                onClick={handleGenerateAllActions}
                disabled={generationState.isGenerating}
              >
                {generationState.isGenerating ? '生成中...' : '开始生成动作'}
              </button>
              {generatedResults.actions.some(a => a.preview) && (
                <button 
                  className="btn" 
                  onClick={() => setCurrentStep(5)}
                >
                  查看完整结果
                </button>
              )}
            </div>
          </div>
        )}

        {/* 步骤五：完成页面 */}
        {currentStep === 5 && (
          <div className="step-content">
            <h2>🎉 你的专属桌面萌宠已经制作完成啦！</h2>
            
            {/* 完整结果展示 */}
            <div className="final-results">
              {/* 宠物形象 */}
              {generatedResults.petImage && (
                <div className="result-section">
                  <h3>宠物形象</h3>
                  <div className="pet-image-final">
                    <div className="image-wrapper large">
                      <img src={generatedResults.petImage} alt="宠物形象" className="generated-pet-image" />
                    </div>
                  </div>
                </div>
              )}

              {/* 所有动作 */}
              <div className="actions-section">
                <h3>生成的动作 ({generatedResults.actions.filter(a => a.preview).length}个)</h3>
                <div className="actions-grid-final">
                  {generatedResults.actions
                    .filter(action => action.preview)
                    .map(action => (
                    <div key={action.id} className="action-item-final">
                      <div className="action-media">
                        {action.gifUrl ? (
                          <img src={action.gifUrl} alt={action.name} className="action-gif" />
                        ) : (
                          <video 
                            src={action.preview} 
                            autoPlay 
                            loop 
                            muted
                            playsInline
                            className="action-video"
                          />
                        )}
                      </div>
                      <div className="action-controls">
                        <span className="action-name">{action.name}</span>
                        <div className="action-buttons-group">
                          {!action.gifUrl && (
                            <button 
                              className="btn small"
                              onClick={() => handleConvertToGif(action.id)}
                              disabled={action.isConvertingToGif}
                            >
                              {action.isConvertingToGif ? '转换中...' : '转GIF'}
                            </button>
                          )}
                          <button 
                            className="btn small secondary"
                            onClick={() => handleRegenerateAction(action.id)}
                            disabled={action.isRegenerating}
                          >
                            {action.isRegenerating ? '生成中...' : '重生成'}
                          </button>
                          <button 
                            className="btn small"
                            onClick={() => handleDownloadFile(
                              action.gifUrl || action.preview, 
                              `${action.name}.${action.gifUrl ? 'gif' : 'mp4'}`
                            )}
                          >
                            下载
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="action-buttons">
              <button className="btn secondary" onClick={resetCreator}>
                制作新的桌宠
              </button>
              <button 
                className="btn primary" 
                onClick={handleDownloadAll}
              >
                📦 打包下载所有资源
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PetCreator;
