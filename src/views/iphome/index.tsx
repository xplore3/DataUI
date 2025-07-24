import React from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import './index.less';

const IpHome: React.FC = () => {

  const navigate = useNavigate();

  const checkUserProfile = () => {
    const set = localStorage.getItem('trendmuse_form_submitted') === 'true';
    if (!set) {
      toast.error('请在设置页面输入IP背景资料等');
      navigate('/user');
    }
    return set;
  };

  const onStart = () => {
    if (checkUserProfile()) {
      navigate('/chat');
    }
    else {
      navigate('/user');
    }
  };

  return (
    <div className="ip-container">
      <Sidebar />

      <main className="main-content">
        <div className="header">
          <img src="/logo.png" alt="IP罗盘 Logo" className="logo" />
          <div className="header-text">
            <div className="title">IP罗盘</div>
            <div className="subtitle">找到属于你的罗盘，直达正确之路</div>
          </div>
        </div>

        <h1 className="section-title">IP定位</h1>

        <p className="description">
          一款面向企业主的智能IP定位工具。基于你的个人特质与多平台实时数据，通过顶尖大模型分析，帮助你精准梳理人设定位、商业定位与内容方向。
          从小红书、抖音、视频号等平台获取趋势信号，输出可理解、可执行、可验证的个性化定位方案。
          不仅提供明确的行动路径，更帮助你塑造一个有温度、有辨识度的“人格化品牌”，让你的影响力与事业一起成长，成为真正意义上的“人货合一”。
        </p>

        <button className="start-button" onClick={onStart}>立即使用</button>
      </main>
    </div>
  );
};

export default IpHome;
