import React from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import './index.less';

const Introduce: React.FC = () => {

  const navigate = useNavigate();

  const onStart = () => {
    navigate('/chat');
  };

  return (
    <div className="ip-container">
      <Sidebar />

      <main className="main-content">
        <div className="header">
          <img src="/logo.png" alt="Logo" className="logo" />
          <div className="header-text">
            <div className="title">SeekInsight</div>
            <div className="subtitle">不仅是AI搜索，SeekInsight是AI数据引擎，自定义AI搜索，自定义AI数据处理</div>
          </div>
        </div>

        <h1 className="section-title">数据能力</h1>

        <p className="description">{`
          最简洁最快捷的方式获取多类数据，免费数据、收费数据都能获取：
          1. 搜索数据，包括百度/必应/博查/Tavily等；
          2. API数据，各类传统AI数据均可获取，从数据宝等公共数据、到多种API聚合提供者，到微博、知乎等各类生态数据；
          3. MCP数据，所有个体/企业开放的、合作的各类数据都轻易接入使用；
          4. 自有数据，SeekIn帮你快速接入、管理使用各类历史数据、传统数据等。

          为您的AI应用、Agent开发带来如下便利：
          1. 避免接入和管理多种API的繁琐过程；
          2. 避免查找和整合各种数据源的耗时耗力；
          3. 避免为API的稳定性而做的多种额外沟通；
          4. 像使用内部数据一样使用外部数据，外部数据的使用快捷透明；
          重要的是，与AI的快捷无缝连接。`}
        </p>

        <button className="start-button" onClick={onStart}>开始使用</button>
      </main>
    </div>
  );
};

export default Introduce;
