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
            <div className="subtitle">直达正确之路</div>
          </div>
        </div>

        <h1 className="section-title">IP定位</h1>

        <p className="description">
          这是一款强大的智能IP定位工具，它通过分析IP主个人数据、各大平台实时数据，结合全球顶尖定位理论，
          为处于各个阶段的企业主打造个人IP提供决策支撑。定位内容包括：人设定位、商业定位、内容定位等。
          它灵活调用各大平台（小红书、抖音、视频号、快手等）实时数据，结合全球顶尖大模型的分析，
          为企业主输出动态的定位报告。该定位方案简易读、可执行、可验证、具备短期效能和长期价值。
          把企业主独特的个人特质（如专业能力、价值观、奋斗故事等）转化为具有高识别度和情感吸引力的
          “人格化品牌”，为企业构建新的护城河，注入新的生命力。
        </p>

        <button className="start-button" onClick={onStart}>立即使用</button>
      </main>
    </div>
  );
};

export default IpHome;
