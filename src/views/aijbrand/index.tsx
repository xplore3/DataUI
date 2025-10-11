// BrandResultPage.jsx
import { useState } from 'react';
import './index.less';

const BrandResultPage = () => {
  const [searchValue, setSearchValue] = useState('');

  const handleSearch = () => {
    // 这里可以添加搜索逻辑
    console.log('搜索品牌:', searchValue);
    // 实际应用中这里会触发API调用等操作
  };

  return (
    <div className="brand-result-page">
      <header className="header">
        <nav className="nav">
          <h1 className="logo">AI智鉴局</h1>
          <div className="nav-links">
            <a href="#" className="nav-link">首页</a>
            <a href="#" className="nav-link active">品牌鉴定</a>
            <a href="#" className="nav-link">消费指南</a>
            <a href="#" className="nav-link">关于我们</a>
          </div>
        </nav>
      </header>

      <main className="main-content">
        <section className="brand-intro">
          <h2 className="page-title">品牌安全鉴定</h2>
          <p className="page-description">
            只需输入品牌、品类名称或者商品截图，即可输出相关的AI品牌评级、消费警示、不合格详情、比较测评、消费引导等内容，帮助用户规避假冒伪劣商品，少踩坑，少被骗，并推荐来自权威测评的高性价比优质商品。
          </p>
          
          {/* 新增搜索区域 */}
          <div className="search-section">
            <div className="search-box">
              <input 
                type="text" 
                placeholder="输入品牌、品类名称" 
                className="search-input"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button className="search-btn" onClick={handleSearch}>
                搜索
              </button>
            </div>
          </div>
        </section>

        <section className="result-section">
          <div className="result-header">
            <h3 className="brand-name">鉴定结果：ABC品牌</h3>
          </div>

          <div className="rating-section">
            <div className="rating-header">
              <span className="rating-icon">⭐</span>
              <span className="rating-title">AI品牌评级</span>
              <span className="rating-level caution">谨慎</span>
            </div>
            <p className="rating-description">
              品牌实力中等，但存在多起不合格记录和行政处罚
            </p>
            <div className="rating-basis">
              <h4>评级依据：</h4>
              <p>
                根据国家市场监督管理总局抽检数据，ABC品牌近三年有5批次产品不合格，涉及质量安全和虚假宣传问题。2023年因虚假宣传被罚款50万元。品牌市场份额中等，研发投入低于行业平均水平。
              </p>
            </div>
          </div>

          <div className="info-sections">
            {/* 消费警示部分 */}
            <div className="info-section">
              <div className="info-header">
                <span className="info-icon">⚠</span>
                <span className="info-title">消费警示</span>
              </div>
              <div className="info-content">
                <div className="alert-item">
                  <div className="alert-header">
                    <span className="alert-brand">ABC品牌</span>
                    <span className="alert-date">2023-11-15</span>
                  </div>
                  <h4 className="alert-title">ABC品牌涉嫌虚假宣传被立案调查</h4>
                  <p className="alert-content">
                    国家市场监督管理总局在广告中宣称产品具有"医疗级效果"，但无法提供相关证明材料，涉嫌违反《广告法》规定，已被立案调查。
                  </p>
                  <p className="alert-source">来源: 国家市场监督管理总局</p>
                  <a href="#" className="read-more">阅读原文</a>
                </div>

                <div className="alert-item">
                  <div className="alert-header">
                    <span className="alert-brand">ABC品牌</span>
                    <span className="alert-date">2023-10-28</span>
                  </div>
                  <h4 className="alert-title">消费者投诉ABC产品引发皮肤过敏</h4>
                  <p className="alert-content">
                    近期收到多起关于ABC品牌护肤产品的投诉，消费者反映使用后出现红肿、瘙痒等过敏症状，检测发现产品含有未标明的防腐剂成分。
                  </p>
                  <p className="alert-source">来源: 中国消费者协会</p>
                  <a href="#" className="read-more">阅读原文</a>
                </div>

                {/* 可以继续添加更多警示项目 */}
              </div>
            </div>

            {/* 比较测评部分 */}
            <div className="info-section">
              <div className="info-header">
                <span className="info-icon">⚖</span>
                <span className="info-title">比较测评</span>
              </div>
              <div className="info-content">
                <div className="comparison-item">
                  <h4 className="comparison-title">五大品牌护肤品成分安全性对比测评</h4>
                  <p className="comparison-date">2023-10-10</p>
                  <p className="comparison-content">
                    测评显示，ABC品牌在成分安全性方面得分中等，含有2种潜在致敏成分，而DEF品牌和GHI品牌在成分安全性和有效性方面表现更优。
                  </p>
                  <p className="comparison-source">来源: 中国消费者协会</p>
                  <a href="#" className="read-more">阅读原文</a>
                </div>

                <div className="comparison-item">
                  <h4 className="comparison-title">儿童玩具安全性能横向测评报告</h4>
                  <p className="comparison-date">2023-09-05</p>
                  <p className="comparison-content">
                    在对10个主流品牌儿童玩具的安全性能测评中，ABC品牌在机械物理性能方面得分较低，存在小零件风险，而JKL品牌和MNO品牌表现优异。
                  </p>
                  <p className="comparison-source">来源: 国家玩具质量监督检验中心</p>
                  <a href="#" className="read-more">阅读原文</a>
                </div>
              </div>
            </div>

            {/* 消费引导部分 */}
            <div className="info-section">
              <div className="info-header">
                <span className="info-icon">&</span>
                <span className="info-title">消费引导</span>
              </div>
              <div className="info-content">
                <div className="guide-item">
                  <h4 className="guide-title">如何识别化妆品中的潜在致敏成分</h4>
                  <p className="guide-date">2023-11-20</p>
                  <p className="guide-content">
                    专家建议消费者在购买化妆品时，应仔细查看成分表，避免含有香精、防腐剂等常见致敏成分的产品，特别是敏感肌肤人群应选择成分简单的产品。
                  </p>
                  <p className="guide-source">来源: 中国药品监督管理研究会</p>
                  <a href="#" className="read-more">阅读原文</a>
                </div>

                <div className="guide-item">
                  <h4 className="guide-title">儿童玩具选购安全指南</h4>
                  <p className="guide-date">2023-10-30</p>
                  <p className="guide-content">
                    家长在为儿童选购玩具时，应注意查看3C认证标志，避免购买有小零件的玩具给3岁以下儿童，同时检查玩具是否有锐利边缘和异味。
                  </p>
                  <p className="guide-source">来源: 中国玩具和婴童用品协会</p>
                  <a href="#" className="read-more">阅读原文</a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-logo">
            <h3>AI智鉴局</h3>
            <p>智能消费安全鉴定平台</p>
          </div>
          <div className="footer-info">
            <p>© 2023 AI智鉴局 版权所有</p>
            <p>数据来源：国家市场监督管理总局、中国消费者协会等权威机构</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BrandResultPage;
