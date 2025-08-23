// src/hooks/useUser.ts
export const useUser = () => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const isLogin = !!(userInfo.unionid || userInfo.openid || userInfo.nickname);
  return { userInfo, isLogin };
};
