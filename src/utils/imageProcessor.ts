/**
 * 图像处理工具函数
 * 为大模型生成的图片添加白色背景，保持原图比例
 */

export interface ImageProcessorOptions {
  /** 宠物缩放比例 (0-1)，默认0.5 */
  petScale?: number;
  /** 背景颜色，默认为白色 */
  backgroundColor?: string;
}

/**
 * 为图片添加白色背景，同时缩小宠物并居中
 * 类似Python的add_white_background函数
 * @param imageUrl 原始图片URL或base64
 * @param options 处理选项
 * @returns 处理后的图片Blob URL（格式：blob:http://...，更短更高效）
 */
export async function addWhiteBackgroundToGenerated(
  imageUrl: string,
  options: ImageProcessorOptions = {}
): Promise<string> {
  const { petScale = 0.5, backgroundColor = '#FFFFFF' } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('无法创建Canvas上下文'));
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous'; // 处理跨域问题
    
    img.onload = () => {
      try {
        // 1. 获取原始图片尺寸
        const originalWidth = img.width;
        const originalHeight = img.height;
        
        // 2. 保持原图比例，设置新画布尺寸
        const targetWidth = originalWidth;
        const targetHeight = originalHeight;
        
        // 3. 计算缩小后的宠物尺寸（保持原比例）
        let newPetWidth = Math.floor(originalWidth * petScale);
        let newPetHeight = Math.floor(originalHeight * petScale);
        
        // 确保缩小后的宠物不会超过新画布
        newPetWidth = Math.min(newPetWidth, targetWidth);
        newPetHeight = Math.min(newPetHeight, targetHeight);
        
        // 4. 设置画布尺寸（与原图相同）
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        
        // 5. 填充白色背景
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        
        // 6. 计算宠物居中的位置
        const x = Math.floor((targetWidth - newPetWidth) / 2);
        const y = Math.floor((targetHeight - newPetHeight) / 2);
        
        // 7. 使用高质量缩放算法绘制宠物
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, x, y, newPetWidth, newPetHeight);
        
        // 8. 转换为Blob URL（更短的URL）
        canvas.toBlob((blob) => {
          if (blob) {
            const blobUrl = URL.createObjectURL(blob);
            resolve(blobUrl);
          } else {
            reject(new Error('无法生成Blob'));
          }
        }, 'image/png', 0.5);
        
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error('图片加载失败'));
    };
    
    // 加载图片
    img.src = imageUrl;
  });
}

/**
 * 为图片添加白色背景（16:9比例版本）
 * @param imageUrl 原始图片URL或base64
 * @param options 处理选项
 * @returns 处理后的图片Blob URL（格式：blob:http://...，更短更高效）
 */
export async function addWhiteBackground16x9(
  imageUrl: string,
  options: ImageProcessorOptions = {}
): Promise<string> {
  const { petScale = 0.5, backgroundColor = '#FFFFFF' } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('无法创建Canvas上下文'));
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        // 1. 获取原始图片尺寸
        const originalWidth = img.width;
        const originalHeight = img.height;
        
        // 2. 设置16:9比例的画布
        let targetWidth: number;
        let targetHeight: number;
        
        if (originalWidth / originalHeight > 16 / 9) {
          // 原图更宽，以宽度为基准
          targetWidth = originalWidth;
          targetHeight = Math.floor(originalWidth * 9 / 16);
        } else {
          // 原图更高，以高度为基准
          targetHeight = originalHeight;
          targetWidth = Math.floor(originalHeight * 16 / 9);
        }
        
        // 3. 计算缩小后的宠物尺寸
        let newPetWidth = Math.floor(originalWidth * petScale);
        let newPetHeight = Math.floor(originalHeight * petScale);
        
        // 确保不超过画布
        newPetWidth = Math.min(newPetWidth, targetWidth);
        newPetHeight = Math.min(newPetHeight, targetHeight);
        
        // 4. 设置画布尺寸
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        
        // 5. 填充白色背景
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        
        // 6. 计算居中位置
        const x = Math.floor((targetWidth - newPetWidth) / 2);
        const y = Math.floor((targetHeight - newPetHeight) / 2);
        
        // 7. 绘制缩小的宠物
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, x, y, newPetWidth, newPetHeight);
        
        // 8. 转换为Blob URL（更短的URL）
        canvas.toBlob((blob) => {
          if (blob) {
            const blobUrl = URL.createObjectURL(blob);
            resolve(blobUrl);
          } else {
            reject(new Error('无法生成Blob'));
          }
        }, 'image/png', 0.95);
        
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error('图片加载失败'));
    };
    
    img.src = imageUrl;
  });
}

/**
 * 下载处理后的图片
 * @param imageUrl 图片URL（base64或blob URL）
 * @param filename 文件名
 */
export function downloadImage(imageUrl: string, filename: string = 'processed-pet.png'): void {
  const a = document.createElement('a');
  a.href = imageUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

