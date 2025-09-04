import React from 'react';
import { useNavigate } from 'react-router-dom';
import './index.less';

const Sidebar: React.FC = () => {

  const navigate = useNavigate();

  const onIntro = () => {
    navigate('/intro');
  };

  const onApiDocs = () => {
    const docUrl = 'https://docs.qq.com/doc/DY0ZBcFd2VWZoWm9j';
    window.location.href = docUrl;
  };

  const onAbout = () => {
    navigate('/about');
  };

  return (
    <aside className="sidebar">
      <div className="nav-item" onClick={onIntro}>能力介绍</div>
      <div className="nav-item" onClick={onApiDocs}>API文档</div>
      <div className="nav-item" onClick={onAbout}>联系我们</div>
    </aside>
  );
};

export default Sidebar;
