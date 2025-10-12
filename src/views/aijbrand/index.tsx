// BrandResultPage.jsx
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { Cron } from 'croner';
import { toast } from 'react-toastify';
//import { Modal } from 'antd';
//import { ExclamationCircleOutlined } from '@ant-design/icons';
import './index.less';
import Header from '@/components/JHeader';
import Footer from '@/components/JFooter';
import InnerChart from '@/components/InnerChart';
import { QualityApi } from '@/services/quality';


const QUALITY_SEARCH_VALUE_KEY = 'quality_search_value';
const QUALITY_SEARCH_RESULT_KEY = 'quality_search_result';

const BrandResultPage = () => {
  const location = useLocation();
  const [searchValue, setSearchValue] = useState(() => {
    if (location.state && (location.state as any).query) {
      localStorage.setItem(QUALITY_SEARCH_VALUE_KEY, (location.state as any).query);
      return (location.state as any).query;
    }
    return localStorage.getItem(QUALITY_SEARCH_VALUE_KEY) || '';
  });
  const [searchResult, setSearchResult] = useState(() => {
    return localStorage.getItem(QUALITY_SEARCH_RESULT_KEY) || '';
  });
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    // 这里可以添加搜索逻辑
    console.log('搜索:', searchValue);
    if (!searchValue || searchValue.trim() === '') {
      return;
    }
    if (loading) {
      return;
    }
    localStorage.setItem(QUALITY_SEARCH_VALUE_KEY, searchValue);
    setLoading(true);
    const product = await QualityApi.productName(searchValue);
    console.log(product);
    if (!product || (product.result && product.result === 'fail')) {
      setSearchResult(typeof product === 'string' ? product : (product.reason || '无法识别目标商品'));
      setLoading(false);
      toast.error('无法识别目标商品，请准确输入品牌、品类名称');
      return;
    }
    console.log('识别到的商品:', product);
    const result = await QualityApi.productQuality(product.product);
    console.log('搜索结果:', result);
    setSearchResult(result);
    await handlerStatus();
  };

  if (location.state && (location.state as any).query) {
    handleSearch();
    location.state = {};
  }

  const handlerStatus = async () => {
    try {
      // checkResp per 10 seconds
      let jobSkip = false;
      const job = new Cron('*/10 * * * * *', async () => {
        //console.log(`Response check at ${new Date().toISOString()}`);
        if (jobSkip) {
          return;
        }
        try {
          QualityApi.checkTaskStatus().then(res => {
            if (jobSkip) {
              return;
            }
            if (res.completed) {
              setLoading(false);
              jobSkip = true;
              job.stop();
            }
            if (res.text) {
              setSearchResult(res.text);
              localStorage.setItem(QUALITY_SEARCH_RESULT_KEY, res.text);
            }
          });
        } catch (err) {
          console.log(err);
        }
      });
    } catch (err) {
      console.log(err);
    }
  };

  // AIMessage component with requestAnimationFrame typing animation
  const AIMessage = ({ message, onDisplayUpdate }: { message: string; onDisplayUpdate: (text: string) => void }) => {
    const animationFrameRef = useRef<number | null>(null);
    const [renderError, setRenderError] = useState(false);

    useEffect(() => {
      // Skip if the content is already complete
      let currentIndex = message.length;
      const chunkSize = 300; // Number of characters to add per frame
      const updateText = () => {
        if (currentIndex < message.length) {
          const nextIndex = Math.min(currentIndex + chunkSize, message.length);
          onDisplayUpdate(message.substring(0, nextIndex));
          currentIndex = nextIndex;
          animationFrameRef.current = requestAnimationFrame(updateText);
        }
      };
      animationFrameRef.current = requestAnimationFrame(updateText);
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, [message, onDisplayUpdate]);

    // 错误边界：如果 ReactMarkdown 出错，显示纯文本内容
    if (renderError) {
      return <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{message}</pre>;
    }

    try {
      return (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw as unknown as any]}
          components={{
            a: ({ href, children, ...props }) => (
              <a
                href={href}
                onClick={e => {
                  e.preventDefault();
                  window.open(href, '_blank');
                }}
                style={{ cursor: 'pointer' }}
                {...props}
              >
                {children}
              </a>
            ),
            code({ className, children }) {
              const lang = className?.replace('language-', '');

              if (lang === 'chart') {
                try {
                  const config = JSON.parse(children as string);
                  // console.log('chart-config', children);
                  return <InnerChart {...config} />
                } catch (e) {
                  return <pre style={{color: 'red', fontWeight: 'bold'}} >图表配置格式错误</pre>
                }
              }

              return (
                <pre
                  style={{backgroundColor: '#f3f4f6', borderRadius: '0.5rem', padding: '0.5rem', fontSize: '0.875rem', overflowX: 'auto', fontFamily: 'monospace'}}
                >
                  {children}
                </pre>
              );
            }
          }}
        >
          {message}
        </ReactMarkdown>
      );
    } catch (error) {
      // 如果 ReactMarkdown 渲染失败，切换到纯文本模式
      console.warn('ReactMarkdown render failed, falling back to plain text:', error);
      setRenderError(true);
      return <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{message}</pre>;
    }
  };

  return (
    <div className="brand-result-page">
      <Header currentPage="brand" />

      <main className="main-content">
        <section className="brand-intro">
          <h2 className="page-title">品牌安全鉴定</h2>
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
              <button className="search-btn" onClick={handleSearch} disabled={loading}>
                {loading ? '处理中...' : '搜索'}
              </button>
            </div>
          </div>
          <p className="page-description">
            只需输入品牌、品类名称或者商品截图，即可输出相关的AI品牌评级、消费警示、不合格详情、比较测评、消费引导等内容，帮助用户规避假冒伪劣商品，少踩坑，少被骗，并推荐来自权威测评的高性价比优质商品。
          </p>
        </section>

        <section className="result-section">
          <div className="result-header">
            <h3 className="brand-name">鉴定结果：{searchValue}</h3>
          </div>

          <div className="rating-section">
            <AIMessage
              message={searchResult}
              onDisplayUpdate={newDisplayText => {
                setSearchResult(newDisplayText);
              }}
            />
          </div>

          {/*<div className="rating-section">
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
            {/* 消费警示部分 /}
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

                {/* 可以继续添加更多警示项目 /}
              </div>
            </div>

            {/* 比较测评部分 /}
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

            {/* 消费引导部分 /}
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
          </div>*/}

        </section>
      </main>

      <Footer />
    </div>
  );
};

export default BrandResultPage;
