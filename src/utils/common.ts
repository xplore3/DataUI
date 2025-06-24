export const CheckIsMobile = () => {
  return /android|avantgo|blackberry|iphone|ipad|ipod|opera mini|palm|silk|windows phone|iemobile/i.test(navigator.userAgent);
};

export function getRandomElements<T>(array: T[], min: number, max: number): T[] {
  if (min < 0 || max < min) throw new Error("Invalid range");
  if (array.length === 0) return [];

  const effectiveMin = Math.min(min, array.length);
  const effectiveMax = Math.min(max, array.length);

  const count = Math.floor(Math.random() * (effectiveMax - effectiveMin + 1)) + effectiveMin;

  return [...array]
    .sort(() => Math.random() - 0.5)
    .slice(0, count);
}

export function getUnknownErrorDesc(debugInfo: any) {
  let err = '哎呀，处理过程出错了，你可以稍后重试，或回复【人工】联系管理员进行支持~';
  const debug = import.meta.env.VITE_DEBUG;
  if (debug && debugInfo && debugInfo.message) {
    err += "\r\n" + debugInfo.message + "\r\n" + debugInfo.status;
  }
  return err;
}

export function getWaitTip() {
  return '系统正在处理，请稍等~';
}
