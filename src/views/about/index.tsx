import React from 'react';
import Sidebar from '@/components/Sidebar';

const About: React.FC = () => (
  <div className="about-page">
    <Sidebar />

    <main className="main-content">
      <h2 className="section-title">联系我们</h2>
      <p className="description">
        EMail： Data3Agent@qq.com
        <br />公众号： SeekInsight稀视数据
      </p>
    </main>
  </div>
);

export default About;