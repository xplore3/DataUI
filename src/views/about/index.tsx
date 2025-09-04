import React from 'react';
import Sidebar from '@/components/Sidebar';

const About: React.FC = () => (
  <div className="about-page" style={{ padding: 32 }}>
    <Sidebar />

    <main className="main-content" style={{ flex: 1; padding: 32 }}>
      <h2>联系我们</h2>
      <p>
        EMail： Data3Agent@qq.com
        <br />公众号： SeekInsight稀视数据
      </p>
    </main>
  </div>
);

export default About;