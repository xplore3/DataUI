import { useState } from 'react';
import { message, Modal } from 'antd';
import JSZip from 'jszip';
import { ImageApi } from '../../services/image';
import './index.less';

const PIXEL_BASE_PROMPT = '将图片中的宠物提取出来，保持其品种、体型、毛色和花纹等特征基本一致。\n\n重新生成一张高像素辨识度的像素艺术风格图（Pixel Art），像素颗粒感清晰、线条锐利。宠物四腿站立，重心平衡，姿态自然稳健；头部微微左转，面部正向镜头，双眼平视，神态温和。身体与画面呈约5°角，头在左、尾在右，形成轻微立体透视感。眼睛不可为纯黑色，需保留高光与层次。\n\n背景为纯白色（锁定Hex#FFFFFF），无阴影、无噪点、无渐变；画面比例为横向16:9，宠物完整居中，构图简洁明快。去除水印，整体风格清晰、干净、平衡。';

const PIXEL_WALK_PROMPT = '将图片中的宠物提取出来，保持其品种、体型、毛色和花纹等特征基本一致。\n\n重新生成一张高像素辨识度的像素艺术风格图（Pixel Art），像素颗粒感清晰、线条锐利。宠物身体成走路启动姿势，身体前倾，重心前移。迈出左前肢与右后肢，同时头部自然地从正面转向行进方向（正前方），视线随之改变；身体与画面呈约5°角，头在左、尾在右，形成轻微立体透视感。眼睛不可为纯黑色，需保留高光与层次。\n\n背景为纯白色（锁定Hex#FFFFFF），无阴影、无噪点、无渐变；画面比例为横向16:9，宠物完整居中，构图简洁明快。去除水印，整体风格清晰、干净、平衡。';

const PIXEL_RUN_PROMPT = '将图片中的宠物提取出来，保持其品种、体型、毛色和花纹等特征基本一致。\n\n重新生成一张高像素辨识度的像素艺术风格图（Pixel Art），像素颗粒感清晰、线条锐利。宠物身体成跑步姿势，身体前倾，重心前移。右后肢率先向后蹬直发力，左后肢尚处于收缩状态准备跟进，身体开始向前（画面左侧）推进；身体与画面呈约5°角，头在左、尾在右，形成轻微立体透视感。眼睛不可为纯黑色，需保留高光与层次。\n\n背景为纯白色（锁定Hex#FFFFFF），无阴影、无噪点、无渐变；画面比例为横向16:9，宠物完整居中，构图简洁明快。去除水印，整体风格清晰、干净、平衡。';

const DISNEY_BASE_PROMPT = '把图片中的宠物提取出来，保持其基本特征不变；\n同时把宠物的独特特征（如毛色、花纹、耳朵形状、眼睛颜色、嘴巴、两只脚有不同毛色等）进行强化；\n生成一个3D卡通风格图，高辨识度；融合迪士尼萌宠可爱元素；\n头正向直面镜头；后腿并拢，坐立姿势；保持宠物的毛流感；\n\n背景为纯白色（锁定Hex#FFFFFF），无阴影、无噪点、无渐变；画面比例为竖向9:16；，宠物完整居中，构图简洁明快。去除水印，整体风格清晰、干净、平衡。';

const GENERATE_TIMEOUT = 4 * 60 * 1000;
const MIN_IMAGE_BYTES = 10 * 1024;

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
  // 每4个字符代表3个字节
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

const PetCreator = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedStyle, setSelectedStyle] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingActions, setIsGeneratingActions] = useState(false);
  const [generatedActions, setGeneratedActions] = useState<GeneratedAction[]>([]);
  const [generatedPetImage, setGeneratedPetImage] = useState<string | null>(null);
  const [generatedWalkImage, setGeneratedWalkImage] = useState<string | null>(null);
  const [generatedRunImage, setGeneratedRunImage] = useState<string | null>(null);
  const [isRegeneratingPetImage, setIsRegeneratingPetImage] = useState(false);
  const [isRegeneratingWalkImage, setIsRegeneratingWalkImage] = useState(false);
  const [isRegeneratingRunImage, setIsRegeneratingRunImage] = useState(false);

  const handleStyleSelect = (style: string) => {
    setSelectedStyle(style);
  };

  const handleImageUpload = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFile(file); // 保存File对象用于API调用
      const reader = new FileReader();
      reader.onload = (event: any) => {
        setUploadedImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

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

  const handleGenerateImage = async () => {
    if (!uploadedFile) {
      message.error('请先上传图片');
      return;
    }

    setIsGenerating(true);
    
    try {
      const prompt = selectedStyle === 'pixel' ? PIXEL_BASE_PROMPT : DISNEY_BASE_PROMPT;
      
      // 根据风格设置目标比例和模型
      const targetRatio = selectedStyle === 'pixel' ? 16/9 : 9/16;
      // 必须使用 volce 模型生成图片
      const model = 'volce';
      
      console.log('开始生成宠物形象...', { 
        style: selectedStyle, 
        model,
        targetRatio,
        ratioDesc: selectedStyle === 'pixel' ? '16:9横向' : '9:16竖向',
        prompt 
      });
      
      // 调用图片生成API（传递目标比例）
      //const result = await ImageApi.imageEdit(prompt, [uploadedFile], model, targetRatio);
      const result = await withTimeout(ImageApi.imageEdit(prompt, [uploadedFile], model), GENERATE_TIMEOUT);

      console.log('生成结果:', result);

      const imageData = await normalizeImageResult(result);
      assertValidImageData(imageData, '宠物定妆照');
      setGeneratedPetImage(imageData);
      message.success('宠物定妆照生成成功！');

      if (selectedStyle === 'pixel') {
        await handleGenerateActionImage(imageData);
      } else {
        setGeneratedWalkImage(null);
        setGeneratedRunImage(null);
      }
    } catch (error: any) {
      console.error('生成图片失败:', error);
      message.error(error.message || '生成失败，请重试');
      setGeneratedPetImage(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateActionImage = async (data: string) => {
    if (!data) {
      message.error('基础图片生成尚未成功');
      return;
    }

    setIsGenerating(true);
    try {
      // 使用 wan 模型生成图片
      const model = 'bailian';

      console.log('开始生成宠物动作形象...');
      // 将生成的宠物图片转换为File对象
      const petImageFile = await base64ToFile(data, 'pet-action-image.png');

      // 调用图片生成API,生成【走路】姿态
      let result = await withTimeout(ImageApi.imageEdit(PIXEL_WALK_PROMPT, [petImageFile], model), GENERATE_TIMEOUT);
      console.log('生成【走路】姿态结果:', result);

      const walkImage = await normalizeImageResult(result);
      assertValidImageData(walkImage, '走路姿态');
      setGeneratedWalkImage(walkImage);
      message.success('宠物【走路】姿态生成成功！');

      // 调用图片生成API,生成【跑步】姿态
      result = await withTimeout(ImageApi.imageEdit(PIXEL_RUN_PROMPT, [petImageFile], model), GENERATE_TIMEOUT);
      console.log('生成【跑步】姿态结果:', result);

      const runImage = await normalizeImageResult(result);
      assertValidImageData(runImage, '跑步姿态');
      setGeneratedRunImage(runImage);
      message.success('宠物【跑步】姿态生成成功！');
    } catch (error: any) {
      console.error('生成图片失败:', error);
      message.error(error.message || '生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegeneratePixelPetImage = async () => {
    if (selectedStyle !== 'pixel') {
      return;
    }

    if (!uploadedFile) {
      message.error('请返回上一步重新上传图片');
      return;
    }

    const confirmed = await confirmRegeneratePetImageModal();
    if (!confirmed) {
      return;
    }

    const key = 'regen-pet-image';
    setIsRegeneratingPetImage(true);
    message.loading({ content: '正在重新生成宠物定妆照...', key, duration: 0 });

    try {
      const result = await withTimeout(ImageApi.imageEdit(PIXEL_BASE_PROMPT, [uploadedFile], 'volce'), GENERATE_TIMEOUT);
      const imageData = await normalizeImageResult(result);
      assertValidImageData(imageData, '宠物定妆照');
      setGeneratedPetImage(imageData);
      setGeneratedWalkImage(null);
      setGeneratedRunImage(null);
      message.loading({ content: '定妆照更新成功，正在重新生成走路与跑步姿态...', key, duration: 0 });
      await handleGenerateActionImage(imageData);
      message.success({ content: '定妆照、走路与跑步姿态已全部重新生成！', key });
    } catch (error: any) {
      console.error('重新生成宠物形象失败:', error);
      message.error({ content: error.message || '重新生成失败，请重试', key });
    } finally {
      setIsRegeneratingPetImage(false);
    }
  };

  const handleRegeneratePixelActionImage = async (type: 'walk' | 'run') => {
    if (selectedStyle !== 'pixel') {
      return;
    }

    const baseImage = generatedPetImage;

    if (!baseImage) {
      message.error('请先生成宠物定妆照');
      return;
    }

    const key = type === 'walk' ? 'regen-walk-image' : 'regen-run-image';
    const setLoading = type === 'walk' ? setIsRegeneratingWalkImage : setIsRegeneratingRunImage;
    const successText = type === 'walk' ? '宠物【走路】姿态重新生成成功！' : '宠物【跑步】姿态重新生成成功！';
    const prompt = type === 'walk' ? PIXEL_WALK_PROMPT : PIXEL_RUN_PROMPT;

    setLoading(true);
    message.loading({ content: `正在重新生成宠物【${type === 'walk' ? '走路' : '跑步'}】姿态...`, key, duration: 0 });

    try {
      const petImageFile = await base64ToFile(baseImage, `pet-${type}-image.png`);
      const result = await withTimeout(ImageApi.imageEdit(prompt, [petImageFile], 'bailian'), GENERATE_TIMEOUT);
      const imageData = await normalizeImageResult(result);
      assertValidImageData(imageData, type === 'walk' ? '走路姿态' : '跑步姿态');
      if (type === 'walk') {
        setGeneratedWalkImage(imageData);
      } else {
        setGeneratedRunImage(imageData);
      }
      message.success({ content: successText, key });
    } catch (error: any) {
      console.error(`重新生成${type === 'walk' ? '走路' : '跑步'}姿态失败:`, error);
      message.error({ content: error.message || '重新生成失败，请重试', key });
    } finally {
      setLoading(false);
    }
  };

  // 将base64转换为File对象
  const base64ToFile = async (base64: string, filename: string): Promise<File> => {
    const response = await fetch(base64);
    const blob = await response.blob();
    return new File([blob], filename, { type: blob.type });
  };

  const imageUrlToBase64 = async(url: string): Promise<string> => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();

      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
  
        reader.onloadend = () => {
          // reader.result 是 base64 字符串
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Failed to convert blob to base64'));
          }
        };

        reader.onerror = () => {
          reject(new Error('FileReader error'));
        };

        reader.readAsDataURL(blob);
      });
    } catch (error) {
      throw new Error(`Failed to convert image to base64: ${error}`);
    }
  }

  // 轮询查询视频生成结果
  const pollVideoResult = async (taskId: string | any, model: string = 'bailian'): Promise<string> => {
    const maxAttempts = 120; // 最多等待10分钟
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const result = await ImageApi.readVideo(taskId, model);
        console.log(`轮询第${attempts + 1}次（模型: ${model}），结果类型:`, typeof result);
        console.log(`轮询第${attempts + 1}次（模型: ${model}），结果前缀:`, typeof result === 'string' ? result.substring(0, 50) + '...' : result);

        // 如果返回的是URL或base64视频数据，说明生成完成
        if (typeof result === 'string' && (result.startsWith('http') || result.startsWith('https') || result.startsWith('data:video/'))) {
          console.log('✅ 视频生成完成，类型:', result.startsWith('data:video/') ? 'base64' : 'URL');
          return result;
        }

        // 等待5秒后继续轮询
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
      } catch (error) {
        console.error('轮询视频结果失败:', error);
        attempts++;
      }
    }

    throw new Error('视频生成超时');
  };

  const handleGenerateActions = async () => {
    if (!generatedPetImage) {
      message.error('请先生成宠物形象');
      return;
    }
    if (selectedStyle === 'pixel' && (!generatedWalkImage || !generatedRunImage)) {
      message.error('请先生成宠物动作姿态');
      return;
    }

    setIsGeneratingActions(true);
    
    try {
      message.info('开始生成动作，这可能需要几分钟时间...');

      // 将生成的宠物图片转换为File对象
      const petImageFile = await base64ToFile(generatedPetImage, 'pet-image.png');
      
      // 根据风格定义不同的动作列表
      const pixelActions = [
        { id: 1, name: '自然状态', prompt: '为图片中的宠物生成如下动作：全身站立姿势，尾巴轻轻摇动，身体呈现自然呼吸感（轻微起伏，富有生命力）；画面居中，宠物完整入镜；背景为纯白色；' },
        { id: 2, name: '走', prompt: '基础： 纯白无杂质背景，1080P高清画质，镜头固定无晃动。参考图小狗处于行走过程中的某一姿态（非站立），全身完整入镜，无裁切，1:1像素级还原毛发纹理、毛色、眼型、耳型等定妆细节。/n角色： 按定妆图进行像素化呈现，保留毛发的蓬松质感与装饰元素。行走过程中体态自然稳定，神态愉悦放松，头部与身体始终严格朝向正前方（行进方向）。/n动作设计：5秒无缝循环行走（核心：头部稳定与直线匀速前进）/n核心指令1： 将小狗视为一个整体单元进行水平平移，其内部的四肢动画作为独立的行走循环，仅表现为纹理层面的周期性运动，不改变整体几何位置，以避免腿部身份互换或形变。/n核心指令2： 头部作为整体单元的一部分锁定空间位置，在整个行走过程中相对于身体主干保持绝对稳定，无上下点头或左右摆动。/n0–1秒： 整体单元从画面中心起始，沿中心轴线匀速向左平移。内部动画中，左前肢与右后肢前摆，右前肢与左后肢后蹬，头部完全保持稳定。/n1–2秒： 整体继续左移。左前肢与右后肢蹬地发力，右前肢与左后肢前摆。身体波动轻微、节奏自然，头部始终保持稳定。/n2–3秒： 整体持续左移。右前肢与左后肢到达最大前伸位，左前肢与右后肢处于最大后蹬位，动作节奏平滑无顿挫。/n3–4秒： 整体继续左移。右前肢与左后肢蹬地推进，左前肢与右后肢前摆，姿态逐步回归与起始帧对称。头部始终保持稳定无晃动。/n4–5秒： 整体单元移动至循环终点，内部肢体姿态与0秒帧完全一致，实现无缝衔接与完美循环。/n细节要求： 首要目标为确保行走循环的稳定性与无缝衔接，头部保持绝对稳定。运动轨迹必须为严格的水平直线，无旋转、无偏移、无抖动。首尾帧完全一致，形成连续循环的匀速行走状态。' },
        { id: 3, name: '跑', prompt: '基础设置： 纯白无杂质背景，1080P高清画质。镜头固定无晃，无变焦。小狗全身（头、躯干、四肢、尾巴）完整入镜，无裁切。1:1像素还原毛发纹理、毛色、眼型、耳型等定妆细节。小狗始终位于画面中心。/n角色： 按定妆图还原毛质蓬松感和装饰细节。身体侧面朝向镜头，神态兴奋、专注，体现速度与力量感。/n时间片动作描述（单镜头）/n0–1 秒｜起跑阶段： 小狗前倾、重心前移，后腿肌肉明显绷紧。右后肢强力蹬地发力，身体迅速向左方推进。地面轻微尘气动态（模拟摩擦），身体略带模糊感体现加速度。镜头固定，轻微动态景深虚化，突出启动爆发力。/n1–2 秒｜首次腾空加速： 小狗短暂离地，腾空弧线低而快。身体完全伸展，毛发随气流轻微飘动。左后肢前摆准备落地。光线略偏暖，表现高速运动中的动能光感。画面保持流畅无晃，腾空瞬间有轻微运动模糊（motion blur）。/n2–3 秒｜交替加速阶段： 左后肢迅猛蹬伸，提供第二次强劲推力。背部随后腿交替呈波浪形起伏，肌肉动态清晰。前后肢节奏加快，身体速度明显提升。镜头依旧固定，背景略带速度拖影，强化“疾速奔跑”感。/n3–4 秒｜高速腾空阶段： 小狗达到最大速度，身体再次腾空，姿态流畅优雅。前后肢交替频率极高，尾巴轻扬形成自然平衡。动作连贯无停顿，腾空至着地间无滑动。镜头略带环境流动模糊，突出速度感。/n4–5 秒｜收势阶段： 小狗逐渐减速，动作频率下降，恢复平稳小跑。四肢有节奏地交替触地，从高速奔跑平滑过渡至停止。最终稳定停在画面中心，头部保持前向注视，呼吸轻微起伏。尾巴自然下垂，姿态放松，光线回归柔和。/n物理与表现要求： 动作符合真实犬类力学规律，后腿交替蹬伸提供主要推力，无滑动。腾空由单腿强力蹬地自然产生，非跳跃式双腿发力。强调“爆发”“加速”“连续推进”的动感词汇，突出速度与力量。毛发动态随风摆动但不凌乱，镜头始终聚焦小狗主体。' },
        { id: 4, name: '搜寻', prompt: '为图片中的宠物生成如下动作：行走姿势，呈搜寻状态，边走边低头嗅闻；画面居中，宠物完整入镜；背景为纯白色；' },
        { id: 5, name: '站-坐-趴下', prompt: '为图片中的宠物生成如下动作：坐姿，呈侧坐状态，身体偏向一侧，臀部着地，并从坐下过渡到趴下；画面居中，宠物完整入镜；背景为纯白色；' },
        { id: 6, name: '蜷缩睡觉', prompt: '为图片中的宠物生成如下动作：从站立姿势慢慢坐下，然后再趴下，进入睡觉状态；身体蜷缩成一团，四肢自然收拢，尾巴轻轻环在身侧；随呼吸轻微起伏，呈现柔和而富有生命力的动态感。画面居中，宠物完整入镜；背景为纯白色（#FFFFFF），无阴影、无杂物、无渐变；整体风格清晰、干净、温和。' },
        { id: 7, name: '吃狗粮', prompt: '为图片中的宠物生成如下动作：地上出现一个宠物粮碗，宠物凑近粮碗，先是低下头仔细闻了闻，随后便低下头，津津有味地吃了起来。画面居中，宠物完整入镜；背景为纯白色；' },
        { id: 8, name: '跳跃', prompt: '基础要求： 纯白无杂质背景，1080P 高清画质，镜头固定无晃动，小狗全身（头、躯干、四肢、尾巴）完整入镜，无裁切，画面 1:1 像素级还原定妆细节（毛发纹理、毛色、眼型、耳型等）。/n动作要求（仅一次跳跃动作）： 0–3 秒：小狗先稳稳转身，目光坚定地望向画面左侧。身体略微下沉完成蓄力，随后仅一次有力蹬地跳跃。腾空时身体向斜上方跃起，四肢完全伸展，形成自然流畅的抛物线轨迹。/n3–5 秒：前爪率先落地，身体轻微前倾以保持惯性平衡，后爪随即着地。落地稳固、无滑动，尾巴自然下垂。随后保持放松的站立姿态，动作平稳结束。/n物理与表现要求： 动作物理准确，步伐扎实、蹬地有爆发力、落地无滑动。整体体现力量感与动态美，通过“强力蹬地—腾空伸展—平稳落地”的节奏表现小狗一次完整跳跃的力量与优雅。' },
      ];
      const disneyActions = [
        { id: 1, name: '自然状态', prompt: '基础参数：1080P 高清分辨率，9:16 竖屏比例，纯白无杂质背景，无任何多余道具或元素。镜头固定不动，无推拉、摇移、晃动，全程保持小狗全身（头部、躯干、四肢、尾巴）完整入镜，无任何裁切。角色要求：严格按照定妆图还原，毛发纹理、毛色、眼型、耳型、身体装饰等细节 1:1 呈现。全程保持固定坐姿（臀部不离开地面，四肢不站立），体态、愉悦神态不改变，毛质蓬松自然。5 秒动作设计（全程全身可见，坐姿不变）：0-1 秒：小狗位于画面中下区域，呈放松坐姿，胸腔随平稳呼吸轻微起伏，无多余动作。1-2 秒：保持坐姿不变，缓慢眨眼 1 次。2-3 秒：保持坐姿不变，头部缓慢向左右两侧各转动 1 次（转动角度不超过30°），随后恢复正视镜头状态。3-4 秒：保持坐姿不变，尾巴小幅度上下摆动（摆动幅度不超过身体高度的 1/4），呼吸保持平稳。4-5 秒：保持坐姿不变，停止尾巴摆动，恢复初始放松状态，胸腔随平稳呼吸轻微起伏。风格细节：整体风格治愈，小狗状态放松自然，无紧张或夸张动作。定妆细节（毛发、装饰、五官）全程清晰可见，无模糊或变形。' },
        { id: 2, name: '趴下', prompt: '1080P 高清，9:16 竖屏，纯白背景无杂物。镜头固定，全程小狗全身（含尾巴）完整入镜无裁切，尾巴尖始终不超出画面边缘。角色要求：按定妆图 1:1 还原毛发、五官、装饰，全程愉悦神态，毛质蓬松。动作前为标准坐姿（臀贴地，后肢弯，前肢撑），转换流畅不僵硬。5 秒动作设计（全身含尾巴可见）：0-1 秒：中下区域标准坐姿，呼吸起伏，头正视，尾巴自然垂地且尖不超画面，无多余动作。1-2 秒：头不动，前肢前伸（尖不超画面，不站立），臀微抬（不超身体厚 1/2），后肢弯，尾巴保持垂地不超界。2-3 秒：前肢不动，臀慢贴地，后肢展向两侧（不挡腹部），过渡半趴，尾巴始终在画面内。3-4 秒：完全趴姿（腹贴地，前肢撑，后肢展），尾巴小幅左右摆（尖不超画面，幅度不超身体宽 1/3）。4-5 秒：尾停贴地不超界，保持趴姿，呼吸起伏，无多余动作。风格细节：治愈自然，动作自然流畅。定妆细节、尾巴全程清晰，无遮挡模糊，突出小狗主体。' },
        { id: 3, name: '玩球', prompt: '基础：纯白无杂质背景，1080P 高清，9:16 竖屏比例，镜头固定无晃，确保参考图狗狗全身（头、躯干、四肢、尾巴）完整入镜，无裁切，1:1 还原定妆细节（毛发纹理、毛色、眼型、耳型、爪色）。角色：按参考图呈现，保留毛质、花纹、装饰，全身入镜时体态、神态不变，表情愉悦。5 秒动作（全程全身可见）：0-1 秒：狗狗全身站画面中下，尾轻扫（不能扫出画面边界），左侧浅粉毛绒球（爪部 1.2 倍大）匀速滚来；1-2 秒：球到爪前，狗狗抬左前爪轻拦；2-3 秒：狗狗低头叼球，耳前倾，尾微翘；3-4 秒：狗狗叼球轻盈趴下，全身贴地姿势完整；(全身入镜，包括耳朵尖与尾巴尖) 4-5 秒：狗狗用爪轻拨球，低头蹭球玩球。细节：球带柔影，狗狗动作轻盈流畅，全身细节全程清晰，风格软萌。(全程全身入镜，包括耳朵尖与尾巴尖)' },
        { id: 4, name: '吃粮', prompt: '基础：纯白无杂质背景，1080P 高清，9:16 竖屏，镜头固定无晃，参考图小狗全身（头、躯干、四肢、尾巴）完整入镜，无裁切，1:1 还原定妆细节（毛发纹理、毛色、眼型、耳型等）。角色：按定妆图呈现，保留毛质、装饰，全身入镜时体态不变，神态不变，表情愉悦。5 秒动作（全程全身可见）：0-1 秒：小狗站画面中下，画面左侧自然进入一个浅蓝宠物粮碗（装满颗粒粮，大小与狗嘴协调）；1-2 秒：小狗凑近，鼻子贴近粮碗上方；2-3 秒：小狗低头仔细闻粮，耳朵微垂显专注；3-4 秒：小狗低头张口，开始津津有味吃粮，嘴部轻微咀嚼动作；4-5 秒：持续吃粮，头部小幅动，尾巴轻晃。细节：粮碗带浅影，滑动轨迹流畅柔和，狗动作自然，定妆细节全程清晰，风格治愈。' },
        { id: 5, name: '睡觉', prompt: '基础：纯白无杂质背景，1080P 高清，9:16 竖屏，镜头固定无晃，小狗全身（头、躯干、四肢、尾巴）完整入镜无裁切，1:1 还原定妆细节（毛发纹理、毛色、眼型等）。角色：按定妆图呈现，保毛质、装饰，体态神态不变，表情安详愉悦。5 秒动作（全程全身可见）：0-1 秒：坐画面中下，身体放松，眼渐闭，腹随呼吸轻起伏；1-3 秒：然后正面趴下（小狗必须始终正面朝向镜头，不允许出现任何侧面或背面）；3-4 秒：完全趴地（腹贴地），保持闭眼睡觉，头枕前腿，尾垂身后（全身包括耳朵尖和尾巴尖都不得超出画面边界）；4-5 秒：持续趴睡，眼闭尾静，呼吸不变。细节：full body，Panoramic View，无多余道具，毛发随呼吸 / 动作微动，定妆细节清晰，风格治愈。' },
        { id: 6, name: '迎接主人', prompt: '基础：纯白无杂质背景，1080P 高清，9:16 竖屏，镜头固定无晃，参考图小狗全身（头、躯干、四肢、尾巴）完整入镜，无裁切，1:1 还原定妆细节（毛发纹理、毛色、眼型、耳型等）。角色：按定妆图呈现，保留毛质、装饰，全身入镜时体态不变，神态不变，表情愉悦。5秒动作（全程全身可见）：0-1 秒：小狗坐画面中下，身体稳定，腹部随呼吸轻微起伏，舌头自然吐出口外（舌尖微卷）；1-2 秒：持续呼吸起伏，尾巴轻快向上小幅度摆 1 次；2-3 秒：小狗轻快的趴在地上，尾巴左右摆动；3-4 秒：小狗重新坐起来，尾巴停止摆动，呼吸起伏持续；4-5 秒：尾巴再轻快上下摆 1 次，呼吸起伏不变，吐舌姿态保持。细节：无多余道具，毛发随呼吸、动作微动，定妆细节全程清晰，风格治愈。' },
      ];

      const actions = selectedStyle === 'pixel' ? pixelActions : disneyActions;
      
      // 根据风格选择模型：像素风用 bailian，迪士尼风用 volce
      const videoModel = selectedStyle === 'pixel' ? 'bailian' : 'volce';
      console.log('视频生成模型:', videoModel);

      const generatedActionsList: GeneratedAction[] = [];

      // 为每个动作生成视频（串行执行，一个完成后再生成下一个）
      for (let i = 0; i < actions.length; i++) {
        const action = actions[i];
        
        try {
          console.log(`[${i + 1}/${actions.length}] 开始生成动作: ${action.name}, 使用模型: ${videoModel}`);
          message.loading({ content: `正在生成"${action.name}"动作... (${i + 1}/${actions.length})`, key: 'genAction', duration: 0 });

          let frameFiles = [petImageFile];
          if (action.name == '走') {
            const walkStartFile = await base64ToFile(generatedWalkImage!, 'walk-start-image.png');
            const walkEndFile = await base64ToFile(generatedWalkImage!, 'walk-end-image.png');
            frameFiles = [walkStartFile, walkEndFile];
          }
          else if (action.name == '跑') {
            const runStartFile = await base64ToFile(generatedRunImage!, 'run-start-image.png');
            const runEndFile = await base64ToFile(generatedRunImage!, 'run-end-image.png');
            frameFiles = [runStartFile, runEndFile];
          }
          // 调用视频生成API
          let taskId: any = await ImageApi.imageToVideo(action.prompt, frameFiles, videoModel);
          console.log(`${action.name} 任务ID（原始）:`, taskId);

          // volce 特殊处理：如果直接返回了URL，视为已完成，无需轮询
          if (videoModel === 'volce' && typeof taskId === 'string' && (taskId.startsWith('http://') || taskId.startsWith('https://'))) {
            console.log(`${action.name} 收到直接视频URL（无需轮询）`);
            generatedActionsList.push({
              id: action.id,
              name: action.name,
              preview: taskId,
              taskId: undefined,
              prompt: action.prompt
            });
            message.success({ content: `${action.name}动作生成成功！(${i + 1}/${actions.length})`, key: 'genAction' });
            // 等待 2 秒再继续下一个
            if (i < actions.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
            continue;
          }

          // volce 模型可能返回 JSON 字符串，需要解析
          if (videoModel === 'volce' && typeof taskId === 'string' && taskId.startsWith('{')) {
            try {
              taskId = JSON.parse(taskId);
              console.log(`${action.name} 解析后任务ID:`, taskId);
            } catch (e) {
              console.error('解析 volce taskId 失败:', e);
            }
          }

          // 检测 Volce API 并发限制错误
          if (videoModel === 'volce' && typeof taskId === 'string' && taskId.includes('API Concurrent Limit')) {
            console.warn(`${action.name} 遇到并发限制，等待 5 秒后重试...`);
            message.warning({ content: `${action.name}遇到并发限制，等待后重试...`, key: 'genAction', duration: 3 });
            await new Promise(resolve => setTimeout(resolve, 5000));
            // 重试一次
            taskId = await ImageApi.imageToVideo(action.prompt, [petImageFile], videoModel);
            console.log(`${action.name} 重试后任务ID:`, taskId);
            // 重新检查是否需要解析 JSON
            if (typeof taskId === 'string' && taskId.startsWith('{')) {
              try {
                taskId = JSON.parse(taskId);
              } catch (e) {
                console.error('解析重试后的 volce taskId 失败:', e);
              }
            }
          }

          // bailian 返回字符串，volce 返回对象 { task_id, req_key } 或数字
          // JavaScript 大整数会丢失精度，需要转为字符串
          if (typeof taskId === 'number') {
            taskId = String(taskId);
            console.log(`${action.name} 将数字型 taskId 转为字符串:`, taskId);
          }
          
          if (taskId && (typeof taskId === 'string' || (taskId.task_id && taskId.req_key))) {
            // 轮询获取视频结果（传递模型参数）- 这里会等待视频生成完成
            message.loading({ content: `等待"${action.name}"视频生成中... (${i + 1}/${actions.length})`, key: 'genAction', duration: 0 });
            const videoUrl = await pollVideoResult(taskId, videoModel);
            console.log(`${action.name} 视频生成完成:`, videoUrl);
            console.log(`${action.name} 视频URL类型:`, typeof videoUrl);
            console.log(`${action.name} 视频URL长度:`, videoUrl?.length);

            generatedActionsList.push({
              id: action.id,
              name: action.name,
              preview: videoUrl,
              taskId,
              prompt: action.prompt // 保存prompt用于重新生成
            });

            message.success({ content: `${action.name}动作生成成功！(${i + 1}/${actions.length})`, key: 'genAction' });
          } else {
            throw new Error(`无效的任务ID: ${JSON.stringify(taskId)}`);
          }
        } catch (error: any) {
          console.error(`生成${action.name}动作失败:`, error);
          message.error({ content: `${action.name}动作生成失败，已跳过`, key: 'genAction', duration: 3 });
        }
        
        // 每个动作完成后，等待 3 秒再开始下一个（确保完全串行）
        if (i < actions.length - 1) {
          console.log(`等待 3 秒后开始生成下一个动作...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }

      if (generatedActionsList.length > 0) {
        setGeneratedActions(generatedActionsList);
        setCurrentStep(5);
        message.success(`成功生成 ${generatedActionsList.length} 个动作！`);
      } else {
        throw new Error('所有动作生成都失败了');
      }

    } catch (error: any) {
      console.error('生成动作失败:', error);
      message.error(error.message || '生成动作失败，请重试');
    } finally {
      setIsGeneratingActions(false);
    }
  };

  // 获取动作的完整提示词（与初始生成时使用相同的详细提示词）
  const getActionPrompt = (actionName: string, style: string): string => {
    const pixelActions = [
      { id: 1, name: '自然状态', prompt: '为图片中的宠物生成如下动作：全身站立姿势，尾巴轻轻摇动，身体呈现自然呼吸感（轻微起伏，富有生命力）；画面居中，宠物完整入镜；背景为纯白色；' },
      { id: 2, name: '走', prompt: '基础： 纯白无杂质背景，1080P高清画质，镜头固定无晃动。参考图小狗处于行走过程中的某一姿态（非站立），全身完整入镜，无裁切，1:1像素级还原毛发纹理、毛色、眼型、耳型等定妆细节。/n角色： 按定妆图进行像素化呈现，保留毛发的蓬松质感与装饰元素。行走过程中体态自然稳定，神态愉悦放松，头部与身体始终严格朝向正前方（行进方向）。/n动作设计：5秒无缝循环行走（核心：头部稳定与直线匀速前进）/n核心指令1： 将小狗视为一个整体单元进行水平平移，其内部的四肢动画作为独立的行走循环，仅表现为纹理层面的周期性运动，不改变整体几何位置，以避免腿部身份互换或形变。/n核心指令2： 头部作为整体单元的一部分锁定空间位置，在整个行走过程中相对于身体主干保持绝对稳定，无上下点头或左右摆动。/n0–1秒： 整体单元从画面中心起始，沿中心轴线匀速向左平移。内部动画中，左前肢与右后肢前摆，右前肢与左后肢后蹬，头部完全保持稳定。/n1–2秒： 整体继续左移。左前肢与右后肢蹬地发力，右前肢与左后肢前摆。身体波动轻微、节奏自然，头部始终保持稳定。/n2–3秒： 整体持续左移。右前肢与左后肢到达最大前伸位，左前肢与右后肢处于最大后蹬位，动作节奏平滑无顿挫。/n3–4秒： 整体继续左移。右前肢与左后肢蹬地推进，左前肢与右后肢前摆，姿态逐步回归与起始帧对称。头部始终保持稳定无晃动。/n4–5秒： 整体单元移动至循环终点，内部肢体姿态与0秒帧完全一致，实现无缝衔接与完美循环。/n细节要求： 首要目标为确保行走循环的稳定性与无缝衔接，头部保持绝对稳定。运动轨迹必须为严格的水平直线，无旋转、无偏移、无抖动。首尾帧完全一致，形成连续循环的匀速行走状态。' },
      { id: 3, name: '跑', prompt: '基础设置： 纯白无杂质背景，1080P高清画质。镜头固定无晃，无变焦。小狗全身（头、躯干、四肢、尾巴）完整入镜，无裁切。1:1像素还原毛发纹理、毛色、眼型、耳型等定妆细节。小狗始终位于画面中心。/n角色： 按定妆图还原毛质蓬松感和装饰细节。身体侧面朝向镜头，神态兴奋、专注，体现速度与力量感。/n时间片动作描述（单镜头）/n0–1 秒｜起跑阶段： 小狗前倾、重心前移，后腿肌肉明显绷紧。右后肢强力蹬地发力，身体迅速向左方推进。地面轻微尘气动态（模拟摩擦），身体略带模糊感体现加速度。镜头固定，轻微动态景深虚化，突出启动爆发力。/n1–2 秒｜首次腾空加速： 小狗短暂离地，腾空弧线低而快。身体完全伸展，毛发随气流轻微飘动。左后肢前摆准备落地。光线略偏暖，表现高速运动中的动能光感。画面保持流畅无晃，腾空瞬间有轻微运动模糊（motion blur）。/n2–3 秒｜交替加速阶段： 左后肢迅猛蹬伸，提供第二次强劲推力。背部随后腿交替呈波浪形起伏，肌肉动态清晰。前后肢节奏加快，身体速度明显提升。镜头依旧固定，背景略带速度拖影，强化“疾速奔跑”感。/n3–4 秒｜高速腾空阶段： 小狗达到最大速度，身体再次腾空，姿态流畅优雅。前后肢交替频率极高，尾巴轻扬形成自然平衡。动作连贯无停顿，腾空至着地间无滑动。镜头略带环境流动模糊，突出速度感。/n4–5 秒｜收势阶段： 小狗逐渐减速，动作频率下降，恢复平稳小跑。四肢有节奏地交替触地，从高速奔跑平滑过渡至停止。最终稳定停在画面中心，头部保持前向注视，呼吸轻微起伏。尾巴自然下垂，姿态放松，光线回归柔和。/n物理与表现要求： 动作符合真实犬类力学规律，后腿交替蹬伸提供主要推力，无滑动。腾空由单腿强力蹬地自然产生，非跳跃式双腿发力。强调“爆发”“加速”“连续推进”的动感词汇，突出速度与力量。毛发动态随风摆动但不凌乱，镜头始终聚焦小狗主体。' },
      { id: 4, name: '搜寻', prompt: '为图片中的宠物生成如下动作：行走姿势，呈搜寻状态，边走边低头嗅闻；画面居中，宠物完整入镜；背景为纯白色；' },
      { id: 5, name: '站-坐-趴下', prompt: '为图片中的宠物生成如下动作：坐姿，呈侧坐状态，身体偏向一侧，臀部着地，并从坐下过渡到趴下；画面居中，宠物完整入镜；背景为纯白色；' },
      { id: 6, name: '蜷缩睡觉', prompt: '为图片中的宠物生成如下动作：从站立姿势慢慢坐下，然后再趴下，进入睡觉状态；身体蜷缩成一团，四肢自然收拢，尾巴轻轻环在身侧；随呼吸轻微起伏，呈现柔和而富有生命力的动态感。画面居中，宠物完整入镜；背景为纯白色（#FFFFFF），无阴影、无杂物、无渐变；整体风格清晰、干净、温和。' },
      { id: 7, name: '吃狗粮', prompt: '为图片中的宠物生成如下动作：地上出现一个宠物粮碗，宠物凑近粮碗，先是低下头仔细闻了闻，随后便低下头，津津有味地吃了起来。画面居中，宠物完整入镜；背景为纯白色；' },
      { id: 8, name: '跳跃', prompt: '基础要求： 纯白无杂质背景，1080P 高清画质，镜头固定无晃动，小狗全身（头、躯干、四肢、尾巴）完整入镜，无裁切，画面 1:1 像素级还原定妆细节（毛发纹理、毛色、眼型、耳型等）。/n动作要求（仅一次跳跃动作）： 0–3 秒：小狗先稳稳转身，目光坚定地望向画面左侧。身体略微下沉完成蓄力，随后仅一次有力蹬地跳跃。腾空时身体向斜上方跃起，四肢完全伸展，形成自然流畅的抛物线轨迹。/n3–5 秒：前爪率先落地，身体轻微前倾以保持惯性平衡，后爪随即着地。落地稳固、无滑动，尾巴自然下垂。随后保持放松的站立姿态，动作平稳结束。/n物理与表现要求： 动作物理准确，步伐扎实、蹬地有爆发力、落地无滑动。整体体现力量感与动态美，通过“强力蹬地—腾空伸展—平稳落地”的节奏表现小狗一次完整跳跃的力量与优雅。' },
    ];

    const disneyActions = [
      { id: 1, name: '自然状态', prompt: '基础参数：1080P 高清分辨率，9:16 竖屏比例，纯白无杂质背景，无任何多余道具或元素。镜头固定不动，无推拉、摇移、晃动，全程保持小狗全身（头部、躯干、四肢、尾巴）完整入镜，无任何裁切。角色要求：严格按照定妆图还原，毛发纹理、毛色、眼型、耳型、身体装饰等细节 1:1 呈现。全程保持固定坐姿（臀部不离开地面，四肢不站立），体态、愉悦神态不改变，毛质蓬松自然。5 秒动作设计（全程全身可见，坐姿不变）：0-1 秒：小狗位于画面中下区域，呈放松坐姿，胸腔随平稳呼吸轻微起伏，无多余动作。1-2 秒：保持坐姿不变，缓慢眨眼 1 次。2-3 秒：保持坐姿不变，头部缓慢向左右两侧各转动 1 次（转动角度不超过30°），随后恢复正视镜头状态。3-4 秒：保持坐姿不变，尾巴小幅度上下摆动（摆动幅度不超过身体高度的 1/4），呼吸保持平稳。4-5 秒：保持坐姿不变，停止尾巴摆动，恢复初始放松状态，胸腔随平稳呼吸轻微起伏。风格细节：整体风格治愈，小狗状态放松自然，无紧张或夸张动作。定妆细节（毛发、装饰、五官）全程清晰可见，无模糊或变形。' },
      { id: 2, name: '趴下', prompt: '1080P 高清，9:16 竖屏，纯白背景无杂物。镜头固定，全程小狗全身（含尾巴）完整入镜无裁切，尾巴尖始终不超出画面边缘。角色要求：按定妆图 1:1 还原毛发、五官、装饰，全程愉悦神态，毛质蓬松。动作前为标准坐姿（臀贴地，后肢弯，前肢撑），转换流畅不僵硬。5 秒动作设计（全身含尾巴可见）：0-1 秒：中下区域标准坐姿，呼吸起伏，头正视，尾巴自然垂地且尖不超画面，无多余动作。1-2 秒：头不动，前肢前伸（尖不超画面，不站立），臀微抬（不超身体厚 1/2），后肢弯，尾巴保持垂地不超界。2-3 秒：前肢不动，臀慢贴地，后肢展向两侧（不挡腹部），过渡半趴，尾巴始终在画面内。3-4 秒：完全趴姿（腹贴地，前肢撑，后肢展），尾巴小幅左右摆（尖不超画面，幅度不超身体宽 1/3）。4-5 秒：尾停贴地不超界，保持趴姿，呼吸起伏，无多余动作。风格细节：治愈自然，动作自然流畅。定妆细节、尾巴全程清晰，无遮挡模糊，突出小狗主体。' },
      { id: 3, name: '玩球', prompt: '基础：纯白无杂质背景，1080P 高清，9:16 竖屏比例，镜头固定无晃，确保参考图狗狗全身（头、躯干、四肢、尾巴）完整入镜，无裁切，1:1 还原定妆细节（毛发纹理、毛色、眼型、耳型、爪色）。角色：按参考图呈现，保留毛质、花纹、装饰，全身入镜时体态、神态不变，表情愉悦。5 秒动作（全程全身可见）：0-1 秒：狗狗全身站画面中下，尾轻扫（不能扫出画面边界），左侧浅粉毛绒球（爪部 1.2 倍大）匀速滚来；1-2 秒：球到爪前，狗狗抬左前爪轻拦；2-3 秒：狗狗低头叼球，耳前倾，尾微翘；3-4 秒：狗狗叼球轻盈趴下，全身贴地姿势完整；(全身入镜，包括耳朵尖与尾巴尖) 4-5 秒：狗狗用爪轻拨球，低头蹭球玩球。细节：球带柔影，狗狗动作轻盈流畅，全身细节全程清晰，风格软萌。(全程全身入镜，包括耳朵尖与尾巴尖)' },
      { id: 4, name: '吃粮', prompt: '基础：纯白无杂质背景，1080P 高清，9:16 竖屏，镜头固定无晃，参考图小狗全身（头、躯干、四肢、尾巴）完整入镜，无裁切，1:1 还原定妆细节（毛发纹理、毛色、眼型、耳型等）。角色：按定妆图呈现，保留毛质、装饰，全身入镜时体态不变，神态不变，表情愉悦。5 秒动作（全程全身可见）：0-1 秒：小狗站画面中下，画面左侧自然进入一个浅蓝宠物粮碗（装满颗粒粮，大小与狗嘴协调）；1-2 秒：小狗凑近，鼻子贴近粮碗上方；2-3 秒：小狗低头仔细闻粮，耳朵微垂显专注；3-4 秒：小狗低头张口，开始津津有味吃粮，嘴部轻微咀嚼动作；4-5 秒：持续吃粮，头部小幅动，尾巴轻晃。细节：粮碗带浅影，滑动轨迹流畅柔和，狗动作自然，定妆细节全程清晰，风格治愈。' },
      { id: 5, name: '睡觉', prompt: '基础：纯白无杂质背景，1080P 高清，9:16 竖屏，镜头固定无晃，小狗全身（头、躯干、四肢、尾巴）完整入镜无裁切，1:1 还原定妆细节（毛发纹理、毛色、眼型等）。角色：按定妆图呈现，保毛质、装饰，体态神态不变，表情安详愉悦。5 秒动作（全程全身可见）：0-1 秒：坐画面中下，身体放松，眼渐闭，腹随呼吸轻起伏；1-3 秒：然后正面趴下（小狗必须始终正面朝向镜头，不允许出现任何侧面或背面）；3-4 秒：完全趴地（腹贴地），保持闭眼睡觉，头枕前腿，尾垂身后（全身包括耳朵尖和尾巴尖都不得超出画面边界）；4-5 秒：持续趴睡，眼闭尾静，呼吸不变。细节：full body，Panoramic View，无多余道具，毛发随呼吸 / 动作微动，定妆细节清晰，风格治愈。' },
      { id: 6, name: '迎接主人', prompt: '基础：纯白无杂质背景，1080P 高清，9:16 竖屏，镜头固定无晃，参考图小狗全身（头、躯干、四肢、尾巴）完整入镜，无裁切，1:1 还原定妆细节（毛发纹理、毛色、眼型、耳型等）。角色：按定妆图呈现，保留毛质、装饰，全身入镜时体态不变，神态不变，表情愉悦。5秒动作（全程全身可见）：0-1 秒：小狗坐画面中下，身体稳定，腹部随呼吸轻微起伏，舌头自然吐出口外（舌尖微卷）；1-2 秒：持续呼吸起伏，尾巴轻快向上小幅度摆 1 次；2-3 秒：小狗轻快的趴在地上，尾巴左右摆动；3-4 秒：小狗重新坐起来，尾巴停止摆动，呼吸起伏持续；4-5 秒：尾巴再轻快上下摆 1 次，呼吸起伏不变，吐舌姿态保持。细节：无多余道具，毛发随呼吸、动作微动，定妆细节全程清晰，风格治愈。' },
    ];

    const actions = style === 'pixel' ? pixelActions : disneyActions;
    const foundAction = actions.find(a => a.name === actionName);
    return foundAction?.prompt || `宠物${actionName}动作，背景为纯白色，全身完整入镜`;
  };

  const handleRegenerateAction = async (actionId: number) => {
    const action = generatedActions.find(a => a.id === actionId);
    
    if (!action) {
      message.error('动作不存在');
      console.error('Action not found:', actionId, generatedActions);
      return;
    }

    if (!generatedPetImage) {
      message.error('宠物形象不存在，请返回重新生成');
      return;
    }

    // 使用与初始生成相同的详细提示词
    const prompt = action.prompt || getActionPrompt(action.name, selectedStyle);
    
    console.log('重新生成动作:', {
      id: actionId,
      name: action.name,
      hasPrompt: !!action.prompt,
      useDefault: !action.prompt,
      prompt
    });

    // 设置重新生成状态
    setGeneratedActions(prev =>
      prev.map(a => a.id === actionId ? { ...a, isRegenerating: true } : a)
    );

    try {
      // 根据风格选择模型：像素风用 bailian，迪士尼风用 volce
      const videoModel = selectedStyle === 'pixel' ? 'bailian' : 'volce';
      
      message.loading({ content: `正在重新生成"${action.name}"动作（模型: ${videoModel}）...`, key: `regen-${actionId}`, duration: 0 });
      
      // 将生成的宠物图片转换为File对象
      const petImageFile = await base64ToFile(generatedPetImage, 'pet-image.png');
      
      // 调用视频生成API（使用获取到的prompt和对应的模型）
      let taskId: any = await ImageApi.imageToVideo(prompt, [petImageFile], videoModel);
      console.log(`${action.name} 重新生成任务ID（原始）:`, taskId, ', 模型:', videoModel);

      // volce：如果直接返回URL，视为已完成
      if (videoModel === 'volce' && typeof taskId === 'string' && (taskId.startsWith('http://') || taskId.startsWith('https://'))) {
        setGeneratedActions(prev =>
          prev.map(a => a.id === actionId ? {
            ...a,
            preview: taskId,
            taskId: undefined,
            prompt,
            gifUrl: undefined,
            isRegenerating: false
          } : a)
        );
        message.success({ content: `"${action.name}"动作重新生成成功！`, key: `regen-${actionId}` });
        return;
      }

      // volce 模型可能返回 JSON 字符串，需要解析
      if (videoModel === 'volce' && typeof taskId === 'string' && taskId.startsWith('{')) {
        try {
          taskId = JSON.parse(taskId);
          console.log(`${action.name} 解析后任务ID:`, taskId);
        } catch (e) {
          console.error('解析 volce taskId 失败:', e);
        }
      }

      // JavaScript 大整数会丢失精度，需要转为字符串
      if (typeof taskId === 'number') {
        taskId = String(taskId);
        console.log(`${action.name} 将数字型 taskId 转为字符串:`, taskId);
      }

      // bailian 返回字符串，volce 返回对象 { task_id, req_key }
      if (taskId && (typeof taskId === 'string' || (taskId.task_id && taskId.req_key))) {
        // 轮询获取视频结果（传递模型参数）
        message.loading({ content: `等待"${action.name}"动作生成中...`, key: `regen-${actionId}`, duration: 0 });
        const videoUrl = await pollVideoResult(taskId, videoModel);
        console.log(`${action.name} 重新生成完成:`, videoUrl);

        // 更新动作信息（清除旧的GIF，保留prompt）
        setGeneratedActions(prev =>
          prev.map(a => a.id === actionId ? {
            ...a,
            preview: videoUrl,
            taskId,
            prompt, // 确保 prompt 被保存
            gifUrl: undefined, // 清除旧的GIF
            isRegenerating: false
          } : a)
        );

        message.success({ content: `"${action.name}"动作重新生成成功！`, key: `regen-${actionId}` });
      } else {
        throw new Error(`无效的任务ID: ${JSON.stringify(taskId)}`);
      }
    } catch (error: any) {
      console.error(`重新生成${action.name}动作失败:`, error);
      message.error({ content: error.message || `重新生成失败，请重试`, key: `regen-${actionId}` });
      
      // 重置状态
      setGeneratedActions(prev =>
        prev.map(a => a.id === actionId ? { ...a, isRegenerating: false } : a)
      );
    }
  };

  // 转换视频为GIF
  const handleConvertToGif = async (actionId: number) => {
    const action = generatedActions.find(a => a.id === actionId);
    if (!action || !action.preview) {
      message.error('视频不存在');
      return;
    }

    // 如果已经有GIF，直接返回
    if (action.gifUrl) {
      message.info('已经转换为GIF了');
      return;
    }

    // 更新状态为转换中
    setGeneratedActions(prev => 
      prev.map(a => a.id === actionId ? { ...a, isConvertingToGif: true } : a)
    );

    try {
      message.loading({ content: '正在转换为GIF，请稍候...', key: 'convertGif', duration: 0 });
      
      // 调用转换API，使用10fps确保流畅度
      const gifUrl = await ImageApi.videoToGif(action.preview, 10);
      
      if (gifUrl && typeof gifUrl === 'string' && gifUrl.startsWith('http')) {
        // 更新状态
        setGeneratedActions(prev =>
          prev.map(a => a.id === actionId ? { ...a, gifUrl, isConvertingToGif: false } : a)
        );
        message.success({ content: `${action.name} 转换成功！`, key: 'convertGif' });
      } else {
        throw new Error('转换失败，返回格式不正确');
      }
    } catch (error: any) {
      console.error('转换GIF失败:', error);
      message.error({ content: error.message || '转换失败，请重试', key: 'convertGif' });
      setGeneratedActions(prev =>
        prev.map(a => a.id === actionId ? { ...a, isConvertingToGif: false } : a)
      );
    }
  };

  // 批量下载所有资源（打包成ZIP）
  const handleDownloadAll = async () => {
    try {
      message.loading({ content: '正在打包资源...', key: 'downloadAll', duration: 0 });

      const zip = new JSZip();
      let fileCount = 0;

      // 辅助函数：将URL或base64转换为Blob
      const urlToBlob = async (url: string): Promise<Blob> => {
        if (url.startsWith('data:')) {
          // base64格式
          const response = await fetch(url);
          return await response.blob();
        } else {
          // HTTP URL
          const response = await fetch(url);
          return await response.blob();
        }
      };

      // 1. 添加宠物形象到ZIP
      if (generatedPetImage) {
        message.loading({ content: `正在添加宠物形象...`, key: 'downloadAll', duration: 0 });
        try {
          const blob = await urlToBlob(generatedPetImage);
          zip.file(`pet-image-${selectedStyle}.png`, blob);
          fileCount++;
        } catch (error) {
          console.error('添加宠物形象失败:', error);
        }
      }

      // 2. 添加所有动作到ZIP
      for (let i = 0; i < generatedActions.length; i++) {
        const action = generatedActions[i];
        message.loading({ 
          content: `正在添加动作 ${i + 1}/${generatedActions.length}...`, 
          key: 'downloadAll', 
          duration: 0 
        });

        try {
          // 优先使用GIF，如果没有GIF则使用视频
          const downloadUrl = action.gifUrl || action.preview;
          const fileExtension = action.gifUrl ? 'gif' : 'mp4';
          
          const blob = await urlToBlob(downloadUrl);
          zip.file(`actions/${action.name}.${fileExtension}`, blob);
          fileCount++;
        } catch (error) {
          console.error(`添加动作 ${action.name} 失败:`, error);
        }
      }

      if (fileCount === 0) {
        message.warning({ content: '没有可下载的资源', key: 'downloadAll' });
        return;
      }

      // 3. 生成ZIP文件
      message.loading({ content: '正在生成压缩包...', key: 'downloadAll', duration: 0 });
      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      // 4. 触发下载
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      const filename = `pet-${selectedStyle}-${timestamp}.zip`;
      
      const a = document.createElement('a');
      a.href = URL.createObjectURL(zipBlob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // 释放URL对象
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      
      message.success({ 
        content: `成功打包 ${fileCount} 个文件！正在下载...`, 
        key: 'downloadAll',
        duration: 3
      });
    } catch (error: any) {
      console.error('打包下载失败:', error);
      message.error({ content: error.message || '打包失败，请重试', key: 'downloadAll' });
    }
  };

  // 批量转换所有视频为GIF
  const handleConvertAllToGif = async () => {
    const unconvertedActions = generatedActions.filter(a => !a.gifUrl && !a.isConvertingToGif);
    
    if (unconvertedActions.length === 0) {
      message.info('所有动作都已转换为GIF');
      return;
    }

    message.info(`开始批量转换 ${unconvertedActions.length} 个视频...`);

    for (const action of unconvertedActions) {
      await handleConvertToGif(action.id);
      // 每个转换之间延迟一下，避免并发过多
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    message.success('批量转换完成！');
  };

  // 批量重新生成所有动作
  const handleRegenerateAll = async () => {
    if (!generatedPetImage) {
      message.error('宠物形象不存在，请返回重新生成');
      return;
    }

    if (generatedActions.length === 0) {
      message.warning('没有动作需要重新生成');
      return;
    }

    const confirmed = window.confirm(`确定要重新生成所有 ${generatedActions.length} 个动作吗？这将清除已转换的GIF。`);
    if (!confirmed) return;

    message.info(`开始批量重新生成 ${generatedActions.length} 个动作...`);

    try {
      // 根据风格选择模型：像素风用 bailian，迪士尼风用 volce
      const videoModel = selectedStyle === 'pixel' ? 'bailian' : 'volce';
      console.log('批量重新生成使用模型:', videoModel);
      
      // 将生成的宠物图片转换为File对象
      const petImageFile = await base64ToFile(generatedPetImage, 'pet-image.png');
      
      const newActionsList: GeneratedAction[] = [];

      // 按顺序重新生成每个动作（完全串行，一个完成后再生成下一个）
      for (let i = 0; i < generatedActions.length; i++) {
        const action = generatedActions[i];
        
        console.log(`[${i + 1}/${generatedActions.length}] 开始重新生成动作: ${action.name}`);
        
        // 设置当前动作为重新生成状态
        setGeneratedActions(prev =>
          prev.map(a => a.id === action.id ? { ...a, isRegenerating: true } : a)
        );

        try {
          // 使用与初始生成相同的详细提示词
          const prompt = action.prompt || getActionPrompt(action.name, selectedStyle);

          message.loading({ 
            content: `正在重新生成"${action.name}"动作... (${i + 1}/${generatedActions.length})`, 
            key: 'regenAll', 
            duration: 0 
          });

          // 调用视频生成API（使用对应的模型）
          let taskId: any = await ImageApi.imageToVideo(prompt, [petImageFile], videoModel);
          console.log(`${action.name} 重新生成任务ID（原始）:`, taskId, ', 模型:', videoModel);

          // volce：如果直接返回URL，视为已完成
          if (videoModel === 'volce' && typeof taskId === 'string' && (taskId.startsWith('http://') || taskId.startsWith('https://'))) {
            newActionsList.push({
              id: action.id,
              name: action.name,
              preview: taskId,
              taskId: undefined,
              prompt
            });
            setGeneratedActions(prev =>
              prev.map(a => a.id === action.id ? {
                ...a,
                preview: taskId,
                taskId: undefined,
                prompt,
                gifUrl: undefined,
                isRegenerating: false
              } : a)
            );
            message.success({ 
              content: `"${action.name}"重新生成成功！(${i + 1}/${generatedActions.length})`, 
              key: 'regenAll',
              duration: 1
            });
            // 等待 3 秒再继续下一个
            if (i < generatedActions.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 3000));
            }
            continue;
          }

      // volce 模型可能返回 JSON 字符串，需要解析
      if (videoModel === 'volce' && typeof taskId === 'string' && taskId.startsWith('{')) {
        try {
          taskId = JSON.parse(taskId);
          console.log(`${action.name} 解析后任务ID:`, taskId);
        } catch (e) {
          console.error('解析 volce taskId 失败:', e);
        }
      }

      // 检测 Volce API 并发限制错误（批量重新生成）
      if (videoModel === 'volce' && typeof taskId === 'string' && taskId.includes('API Concurrent Limit')) {
        console.warn(`${action.name} 遇到并发限制，等待 3 秒后重试...`);
        message.warning({ content: `${action.name}遇到并发限制，等待后重试...`, key: 'regenAll', duration: 2 });
        await new Promise(resolve => setTimeout(resolve, 3000));
        // 重试一次
        taskId = await ImageApi.imageToVideo(prompt, [petImageFile], videoModel);
        console.log(`${action.name} 重试后任务ID:`, taskId);
        // 重新检查是否需要解析 JSON
        if (typeof taskId === 'string' && taskId.startsWith('{')) {
          try {
            taskId = JSON.parse(taskId);
          } catch (e) {
            console.error('解析重试后的 volce taskId 失败:', e);
          }
        }
      }

      // bailian 返回字符串，volce 返回对象 { task_id, req_key } 或数字
      // JavaScript 大整数会丢失精度，需要转为字符串
      if (typeof taskId === 'number') {
        taskId = String(taskId);
        console.log(`${action.name} 将数字型 taskId 转为字符串:`, taskId);
      }
      
      if (taskId && (typeof taskId === 'string' || (taskId.task_id && taskId.req_key))) {
        // 轮询获取视频结果（传递模型参数）- 这里会等待视频生成完成
        message.loading({ content: `等待"${action.name}"视频生成中... (${i + 1}/${generatedActions.length})`, key: 'regenAll', duration: 0 });
        const videoUrl = await pollVideoResult(taskId, videoModel);
        console.log(`${action.name} 重新生成完成:`, videoUrl);

        // 更新到新列表
        newActionsList.push({
          id: action.id,
          name: action.name,
          preview: videoUrl,
          taskId,
          prompt
        });

        // 更新当前状态
        setGeneratedActions(prev =>
          prev.map(a => a.id === action.id ? {
            ...a,
            preview: videoUrl,
            taskId,
            prompt,
            gifUrl: undefined,
            isRegenerating: false
          } : a)
        );

        message.success({ 
          content: `"${action.name}"重新生成成功！(${i + 1}/${generatedActions.length})`, 
          key: 'regenAll',
          duration: 1
        });
      } else {
        throw new Error(`无效的任务ID: ${JSON.stringify(taskId)}`);
      }
        } catch (error: any) {
          console.error(`批量重新生成${action.name}失败:`, error);
          message.error({ content: `${action.name}重新生成失败，已跳过`, key: 'regenAll', duration: 3 });
          
          // 重置状态
          setGeneratedActions(prev =>
            prev.map(a => a.id === action.id ? { ...a, isRegenerating: false } : a)
          );
        }
        
        // 每个动作完成后，等待 3 秒再开始下一个（确保完全串行）
        if (i < generatedActions.length - 1) {
          console.log(`等待 3 秒后开始重新生成下一个动作...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }

      message.success({ 
        content: `批量重新生成完成！成功生成 ${newActionsList.length}/${generatedActions.length} 个动作`, 
        key: 'regenAll',
        duration: 3
      });
    } catch (error: any) {
      console.error('批量重新生成失败:', error);
      message.error({ content: '批量重新生成失败', key: 'regenAll' });
    }
  };

  return (
    <div className="pet-creator">
      <div className="container">
        <h1>桌面萌宠制作器</h1>
        
        {/* 步骤指示器 */}
        <div className="step-indicator">
          <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
            <span>1</span>
            <p>选择风格</p>
          </div>
          <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
            <span>2</span>
            <p>上传图片</p>
          </div>
          <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
            <span>3</span>
            <p>生成形象</p>
          </div>
          <div className={`step ${currentStep >= 4 ? 'active' : ''}`}>
            <span>4</span>
            <p>生成动作</p>
          </div>
          <div className={`step ${currentStep >= 5 ? 'active' : ''}`}>
            <span>5</span>
            <p>完成</p>
          </div>
        </div>

        {/* 步骤一：选择风格 */}
        {currentStep === 1 && (
          <div className="step-content">
            <h2>步骤一：选择桌宠风格</h2>
            <div className="style-selection">
              <div 
                className={`style-option ${selectedStyle === 'pixel' ? 'selected' : ''}`}
                onClick={() => handleStyleSelect('pixel')}
              >
                <div className="style-preview pixel-preview"></div>
                <h3>像素风</h3>
                <p>效果预览</p>
              </div>
              <div 
                className={`style-option ${selectedStyle === 'disney' ? 'selected' : ''}`}
                onClick={() => handleStyleSelect('disney')}
              >
                <div className="style-preview disney-preview"></div>
                <h3>迪士尼风</h3>
                <p>效果预览</p>
              </div>
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
            
            {!isGenerating && !generatedPetImage && (
              <>
                <div className="preview-container">
                  <p className="instruction">
                    点击下方按钮，开始生成你的{selectedStyle === 'pixel' ? '像素风' : '迪士尼风'}宠物形象
                  </p>
            </div>
            <div className="action-buttons">
              <button className="btn secondary" onClick={() => setCurrentStep(2)}>
                上一步
              </button>
              <button className="btn primary" onClick={handleGenerateImage}>
                生成形象
              </button>
            </div>
              </>
            )}

            {isGenerating && (
              <>
                <div className="generating-container">
                  <div className="loading-spinner"></div>
                  <p>稍等45s，毛孩子的{selectedStyle === 'pixel' ? '像素风' : '迪士尼风'}的可爱形象正在加急制作中...</p>
                  <div className="progress-bar">
                    <div className="progress"></div>
                  </div>
                </div>
              </>
            )}

            {!isGenerating && generatedPetImage && (
              <>
                <div className="generated-pet-preview">
                  <p className="success-text">🎉 你的{selectedStyle === 'pixel' ? '像素风' : '迪士尼风'}宠物形象生成完成！</p>
                  <div className="pet-image-container">
                    <img src={generatedPetImage} alt="生成的宠物形象" className="generated-pet-image" />
                    {selectedStyle === 'pixel' && (
                      <button
                        className="btn secondary small"
                        onClick={handleRegeneratePixelPetImage}
                        disabled={isGenerating || isRegeneratingPetImage || isRegeneratingWalkImage || isRegeneratingRunImage}
                      >
                        {isRegeneratingPetImage ? '定妆照重新生成中...' : '重新生成定妆照'}
                      </button>
                    )}
                  </div>
                  {selectedStyle === 'pixel' && (
                  <>
                    <p className="instruction">
                      走路和跑步姿态可单独重新生成，避免一次性生成全部图片
                    </p>
                    <div className="pet-action-image-container">
                      <div className="pet-action-card">
                        {generatedWalkImage ? (
                          <img src={generatedWalkImage} alt="生成的走路形象" className="generated-pet-action-image" />
                        ) : (
                          <div className="action-placeholder">暂无走路姿态</div>
                        )}
                        <button
                          className="btn secondary small"
                          onClick={() => handleRegeneratePixelActionImage('walk')}
                          disabled={isGenerating || isRegeneratingWalkImage || isRegeneratingPetImage || isRegeneratingRunImage}
                        >
                          {isRegeneratingWalkImage ? '走路姿态重新生成中...' : generatedWalkImage ? '重新生成走路姿态' : '生成走路姿态'}
                        </button>
                      </div>
                      <div className="pet-action-card">
                        {generatedRunImage ? (
                          <img src={generatedRunImage} alt="生成的跑步形象" className="generated-pet-action-image" />
                        ) : (
                          <div className="action-placeholder">暂无跑步姿态</div>
                        )}
                        <button
                          className="btn secondary small"
                          onClick={() => handleRegeneratePixelActionImage('run')}
                          disabled={isGenerating || isRegeneratingRunImage || isRegeneratingPetImage || isRegeneratingWalkImage}
                        >
                          {isRegeneratingRunImage ? '跑步姿态重新生成中...' : generatedRunImage ? '重新生成跑步姿态' : '生成跑步姿态'}
                        </button>
                      </div>
                    </div>
                  </>)}
                  <p className="instruction">
                    如果对生成的形象满意，可以下载保存或继续下一步生成专属动作
                  </p>
                </div>
                <div className="action-buttons">
                  <button className="btn secondary" onClick={() => {
                    setGeneratedPetImage(null);
                    setGeneratedWalkImage(null);
                    setGeneratedRunImage(null);
                  }}>
                    全部重新生成
                  </button>
                  <button 
                    className="btn" 
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = generatedPetImage;
                      a.download = `pet-image-${selectedStyle}-${Date.now()}.png`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      message.success('宠物形象下载成功！');
                    }}
                  >
                    💾 下载形象
                  </button>
                  <button className="btn primary" onClick={() => setCurrentStep(4)}>
                    继续下一步
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* 步骤四：生成动作 */}
        {currentStep === 4 && (
          <div className="step-content">
            <h2>步骤四：生成专属动作</h2>
            <p className="instruction">
              接下来就开始进行专属的动作生成啦！
              {selectedStyle === 'pixel' ? '像素风将生成8个动作' : '迪士尼风将生成6个动作'}
              （自然状态、行走、跳跃、睡觉等）。
              此步骤预计需要{selectedStyle === 'pixel' ? '30-40' : '20-30'}分钟，点击下方生成按钮后即可退出页面，一段时间后记得过来哦~
            </p>
            <div className="action-buttons">
              <button className="btn secondary" onClick={() => setCurrentStep(3)}>
                上一步
              </button>
              <button 
                className={`btn primary ${isGeneratingActions ? 'loading' : ''}`}
                onClick={handleGenerateActions}
                disabled={isGeneratingActions}
              >
                {isGeneratingActions ? '正在生成...' : '生成专属的萌宠动作'}
              </button>
            </div>
          </div>
        )}

        {/* 步骤五：完成 */}
        {currentStep === 5 && (
          <div className="step-content">
            <h2>🎉 你的专属桌面萌宠已经制作完成啦！快来看看吧~</h2>
            
            {/* 宠物形象展示 */}
            {generatedPetImage && (
              <div className="pet-result-preview">
                <h3>宠物形象</h3>
                <div className="pet-image-result">
                  <img src={generatedPetImage} alt="生成的宠物形象" />
                </div>
              </div>
            )}
            
            {/* 动作展示 */}
            <div className="actions-section">
              <div className="actions-header">
                <h3>生成的动作 ({generatedActions.length}个)</h3>
                <div className="batch-actions">
                  <button 
                    className="btn small secondary"
                    onClick={handleRegenerateAll}
                    disabled={generatedActions.some(a => a.isRegenerating)}
                  >
                    🔁 全部重生成
                  </button>
                  <button 
                    className="btn small primary"
                    onClick={handleConvertAllToGif}
                    disabled={generatedActions.every(a => a.gifUrl || a.isConvertingToGif)}
                  >
                    🔄 批量转GIF
                  </button>
              </div>
            </div>
            
            <div className="actions-grid">
              {generatedActions.map(action => (
                  <div key={action.id} className={`action-item ${action.gifUrl ? 'has-gif' : ''} ${action.isRegenerating ? 'regenerating' : ''}`}>
                  <div className="action-preview">
                      {action.isRegenerating ? (
                        // 重新生成中显示加载动画
                        <div className="regenerating-overlay">
                          <div className="loading-spinner"></div>
                          <p>重新生成中...</p>
                    </div>
                      ) : action.gifUrl ? (
                        // 如果有GIF，显示GIF
                        <img 
                          src={action.gifUrl} 
                          alt={action.name}
                          className="action-gif"
                        />
                      ) : action.preview ? (
                        // 否则显示视频
                        <video 
                          src={action.preview} 
                          autoPlay 
                          loop 
                          muted
                          playsInline
                          crossOrigin="anonymous"
                          className="action-video"
                          onError={(e) => {
                            console.error(`视频加载失败: ${action.name}`, e);
                            console.error(`视频URL: ${action.preview}`);
                            message.error(`${action.name}视频加载失败，请尝试转换为GIF`);
                          }}
                          onLoadedData={() => {
                            console.log(`视频加载成功: ${action.name}`);
                          }}
                        >
                          您的浏览器不支持视频播放
                        </video>
                      ) : null}
                      {action.gifUrl && !action.isRegenerating && (
                        <span className="gif-badge">GIF</span>
                      )}
                  </div>
                  <div className="action-info">
                    <p className="action-name">{action.name}</p>
                      <div className="action-buttons-group">
                        {!action.gifUrl && !action.isRegenerating && (
                          <button 
                            className="btn small primary"
                            onClick={() => handleConvertToGif(action.id)}
                            disabled={action.isConvertingToGif || action.isRegenerating}
                          >
                            {action.isConvertingToGif ? '转换中...' : '转GIF'}
                          </button>
                        )}
                        {!action.isRegenerating && (
                    <button 
                      className="btn small"
                            onClick={async () => {
                              try {
                                const url = action.gifUrl || action.preview;
                                const extension = action.gifUrl ? 'gif' : 'mp4';
                                const filename = `${action.name}.${extension}`;
                                
                                // 下载文件
                                const response = await fetch(url);
                                const blob = await response.blob();
                                
                                // 创建临时URL并下载
                                const blobUrl = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = blobUrl;
                                a.download = filename;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                
                                // 清理
                                setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
                                message.success(`${action.name}下载成功！`);
                              } catch (error) {
                                console.error('下载失败:', error);
                                message.error('下载失败，请重试');
                              }
                            }}
                            disabled={action.isConvertingToGif}
                          >
                            下载
                          </button>
                        )}
                        <button 
                          className="btn small secondary"
                      onClick={() => handleRegenerateAction(action.id)}
                          disabled={action.isRegenerating || action.isConvertingToGif}
                    >
                          {action.isRegenerating ? '生成中...' : '重生成'}
                    </button>
                        
                      </div>
                  </div>
                </div>
              ))}
              </div>
            </div>
            
            <div className="action-buttons">
              <button className="btn secondary" onClick={() => {
                setCurrentStep(1);
                setSelectedStyle('');
                setUploadedImage(null);
                setUploadedFile(null);
                setGeneratedPetImage(null);
                setGeneratedActions([]);
              }}>
                制作新的桌宠
              </button>
              <button 
                className="btn primary" 
                onClick={handleDownloadAll}
                disabled={!generatedPetImage && generatedActions.length === 0}
              >
                📦 打包下载 ({(generatedPetImage ? 1 : 0) + generatedActions.length}个文件)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PetCreator;
