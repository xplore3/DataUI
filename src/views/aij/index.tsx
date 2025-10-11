// HomePage.jsx
import { useState } from 'react';
import './index.less';
import Header from '@/components/JHeader';
import Footer from '@/components/JFooter';

const HomePage = () => {
  const [searchValue, setSearchValue] = useState('');

  const handleSearch = () => {
    // 这里可以添加搜索逻辑
    console.log('搜索品牌:', searchValue);
    // 实际应用中这里会触发API调用等操作
  };

  const handleUpload = () => {
    // 处理图片上传逻辑
    console.log('上传图片');
  };

  return (
    <div className="home-page">
      <Header currentPage="home" />

      <header className="title">
        <h1 className="logo">AI智鉴局</h1>
        <p className="subtitle">智能消费安全鉴定平台</p>
      </header>

      <main className="main-content">
        <section className="search-section">
          <p className="search-description">
            输入品牌、品类名称或上传商品截图
          </p>
          <div className="search-box">
            <input 
              type="text" 
              placeholder="输入品牌、品类名称或上传商品截图"
              className="search-input"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button className="upload-btn" onClick={handleUpload}>
              上传图片
            </button>
            <button className="search-btn" onClick={handleSearch}>
              搜索
            </button>
          </div>
          <p className="feature-description">
            只需输入品牌、品类名称或者商品截图，即可输出相关的AI品牌评级、消费警示、比较测评、消费引导等四部分内容，帮助用户规避顾客的劣质、少踩坑、少碰蹭，并推荐来自权威测评的高性价比优质商品
          </p>
        </section>

        <section className="popular-searches">
          <h3 className="section-title">用户正在搜</h3>
          <div className="search-tags">
            <span className="search-tag">Apple</span>
            <span className="search-tag">护肤品</span>
            <span className="search-tag">Nike</span>
            <span className="search-tag">奶粉</span>
            <span className="view-more">查看更多</span>
          </div>
          <p className="update-time">更新于:2025-08-23</p>
        </section>

        <section className="daily-alerts">
          <h3 className="section-title">每日消费警示</h3>
          <div className="alert-list">
            <div className="alert-item">
              <h4 className="alert-title">某品牌儿童玩具被检出重金属超标</h4>
              <p className="alert-content">
                国家市场监督管理总局最新抽检显示，某品牌儿童玩具中铝含量超出国家标准3倍，已责令下架并召回。请家长注意检查家中玩具，避免儿童接触。
              </p>
              <p className="alert-source">来源:国家市场监督管理总局 · 2025-08-23</p>
            </div>
            <div className="alert-item">
              <h4 className="alert-title">多款网红零食被检出非法添加剂</h4>
              <p className="alert-content">
                某电商平台热销的多款网红零食被检出含有国家明令禁止的添加剂，长期食用可能对健康造成损害。消费者请谨慎购买。
              </p>
              <p className="alert-source">来源:中国消费者协会 · 2025-08-22</p>
            </div>
          </div>
        </section>

        <section className="safety-databases">
          <h3 className="section-title">消费质量安全数据库</h3>
          <div className="database-cards">
            <div className="database-card">
              <h4 className="card-title">食品安全地图</h4>
              <p className="card-description">
                实时监控全国食品安全状况，可视化展示各地区食品安全指数，帮助消费者了解本地食品安全风险。
              </p>
              <button className="view-details-btn">查看详情</button>
            </div>
            <div className="database-card">
              <h4 className="card-title">装修建材质量安全数据库</h4>
              <p className="card-description">
                收录全国装修建材质量安全数据，包括甲醛释放量、放射性等关键指标，为消费者提供权威选购参考。
              </p>
              <button className="view-details-btn">查看详情</button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;
