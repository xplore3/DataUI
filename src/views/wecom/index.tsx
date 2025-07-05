import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const WecomAuth = () => {
  const appid = import.meta.env.VITE_WECHAT_CORP_ID;
  const host = import.meta.env.VITE_API_HOST_URL;
  const authCallbackFront = import.meta.env.VITE_WECOM_AUTH_CALLBACK_FRONT;
  const authCallbackBack = import.meta.env.VITE_WECOM_AUTH_CALLBACK_BACK;
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const retryLogin = () => {
    const redirectUri = encodeURIComponent(host + authCallbackFront);
    const state = Date.now();

    const url = `https://open.weixin.qq.com/connect/qrconnect?appid=${appid}&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_login&state=${state}`;
    window.location.href = url;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    if (!code) {
      setError('缺少微信 code 参数');
      return;
    }

    fetch(`${host}${authCallbackBack}?code=${code}&state=${state}`)
      .then((res) => res.json())
      .then((data) => {
        console.log('微信登录响应:', data);
        if (!data.userInfo) throw new Error('后端未返回用户信息');
        localStorage.setItem('userInfo', JSON.stringify(data.userInfo));
        navigate('/user');
      })
      .catch((err) => {
        console.error('微信登录失败:', err);
        setError('微信登录失败，请稍后重试');
      });
  }, [navigate]);

  return (
    <div style={{ textAlign: 'center', marginTop: 100 }}>
      {error ? (
        <>
          <h2 style={{ color: 'red' }}>{error}</h2>
          <button onClick={retryLogin} style={{ marginTop: 20 }}>
            重新扫码登录
          </button>
        </>
      ) : (
        <h2>登录中，请稍候...</h2>
      )}
    </div>
  );
};

export default WecomAuth;
