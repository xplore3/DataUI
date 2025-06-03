import './index.less';
import { useNavigate } from 'react-router-dom';
//import backLeft from '@/assets/icons/back-left.svg';
import Logo from '@/assets/icons/logo.png';
import Send from '@/assets/icons/send.svg';
import SendActive from '@/assets/icons/send-active.svg';
import LoadingImg from '@/assets/icons/loading.svg';
import User from '@/assets/icons/user.svg';
import { useEffect, useLayoutEffect, useState, useCallback, useRef } from 'react';
import FooterOperation from '@/components/FooterOperation';
import { chatApi } from '@/services/chat';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';;
import { ReactSVG } from 'react-svg';
import { Cron } from "croner";
import QuestionForm, { QuestionItem } from '@/components/Question';
import { toast } from 'react-toastify';
import PromptPin from './prompt';
//import Lang from './lang';
//import welcome from './welcome';

type Message = {
  text: string;
  user: string;
  action: string;
  displayText: string;
  taskId?: string;
  note?: string;
  questions?: QuestionItem[];
};

const Chat = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [messageList, setMessageList] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [pinPrompt, setPinPrompt] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const isTranslatingRef = useRef(false);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const keyList = ['模板', '获取热榜', '找KOL', '深度分析', '开发信'];

  // Load saved messages from local storage and initialize displayText
  useEffect(() => {
    const savedMessages = localStorage.getItem('ChatMessage');
    if (savedMessages) {
      const parsedMessages: Message[] = JSON.parse(savedMessages);
      const initializedMessages = parsedMessages.map(msg => {
        return {
          ...msg,
          displayText: msg.text,
        };
      });
      setMessageList(initializedMessages);
    } else {
      setMessageList([
        {
          text: `Welcome to Data3Agent.🤖\n\nData3Agent是一个帮助获取数据的Agent，需要任何数据📚只管说；
              不管是收费的还是免费的，不管是API还是网页，......📈等任何数据，都能帮你搞定。🚀`,
          displayText: `Welcome to Data3Agent.🤖\n\nData3Agent是一个帮助获取数据的Agent，需要任何数据📚只管说；
              不管是收费的还是免费的，不管是API还是网页，......📈等任何数据，都能帮你搞定。🚀`,
          user: 'agent',
          action: 'NONE',
        },
      ]);
    }

    // Get message from url
    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get('message');
    const handleCaMessage = async (msg: string) => {
      setMessageList(prev => [...prev, { text: msg, user: 'user', action: 'NONE', displayText: msg }]);
      handleLlmAnalysis(msg);
    };
    if (message) {
      handleCaMessage(message);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save messages to local storage
  useEffect(() => {
    if (messageList.length > 0) {
      localStorage.setItem('ChatMessage', JSON.stringify(messageList));
    }
  }, [messageList]);

  // Scroll to the bottom when the message list changes (using useLayoutEffect for smoother behavior)
  useLayoutEffect(() => {
    if (chatContainerRef.current && !isTranslatingRef.current) {
      setTimeout(() => {
        chatContainerRef.current?.scrollTo({
          top: chatContainerRef.current.scrollHeight,
        });
      }, 100);
    }
  }, [messageList]);

  // AIMessage component with requestAnimationFrame typing animation
  const AIMessage = ({ message, onDisplayUpdate }: { message: Message; onDisplayUpdate: (text: string) => void }) => {
    const animationFrameRef = useRef<number | null>(null);

    useEffect(() => {
      // Skip if the content is already complete
      if (message.displayText === message.text) return;
      let currentIndex = message.displayText.length;
      const chunkSize = 10; // Number of characters to add per frame
      const updateText = () => {
        if (currentIndex < message.text.length) {
          const nextIndex = Math.min(currentIndex + chunkSize, message.text.length);
          onDisplayUpdate(message.text.substring(0, nextIndex));
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
    }, [message.text, message.displayText, onDisplayUpdate]);

    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
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
        }}
      >
        {message.displayText}
      </ReactMarkdown>
    );
  };

  // Handle input changes in the text area
  const onInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = '18px';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, []);

  // Send message
  const onSend = useCallback(
    async (overrideText?: string) => {
      const finalText = overrideText || text;
      if (!finalText.trim() || loading) return;

      if (finalText === '人工' || finalText === '人工服务' || finalText === '人工客服') {
        window.open('https://work.weixin.qq.com/kfid/kfc24a58f16a24c1eaf', '_blank');
        return
      }

      // checkResp per 10 seconds
      let jobSkip = false;
      const job = new Cron("*/30 * * * * *", async () => {
        console.log(`Response check at ${new Date().toISOString()}`);
        if (jobSkip) {
          return;
        }
        chatApi.checkTaskStatus().then(res => {
          if (jobSkip) {
            return;
          }
          setMessageList(prev => [
            ...prev,
            { ...res, displayText: '' },
          ]);
        })
      });

      setLoading(true);
      setText('');
      setMessageList(prev => [
        ...prev,
        { text: finalText, user: 'user', action: 'NONE', displayText: finalText },
      ]);
      chatApi
        .createChat(finalText)
        .then(res => {
          jobSkip = true;
          setMessageList(prev => [
            ...prev,
            { ...res, displayText: '' },
          ]);
        })
        .finally(() => {
          job.stop();
          setLoading(false);
        });
    },
    [text, loading]
  );

  const handleUserSettings = async () => {
    navigate('/user');
    // Placeholder for user settings logic
    /*console.log('User settings clicked');
    const corpId = import.meta.env.VITE_WECHAT_CORP_ID;
    const agentId = import.meta.env.VITE_WECOM_AGENT_ID;
    const host = import.meta.env.VITE_API_HOST_URL;
    const authCallback = import.meta.env.VITE_WECOM_AUTH_CALLBACK;
    const redirectUri = encodeURIComponent(host + authCallback);
    const state = 'RandomCSRF';

    //const authUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${corpId}&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_userinfo&state=${state}#wechat_redirect`;
    const authUrl = `https://login.work.weixin.qq.com/wwlogin/sso/login?login_type=CorpApp&appid=${corpId}&agentid=${agentId}&redirect_uri=${redirectUri}&state=${state}`;
    window.location.href = authUrl;*/
  };

  const handleKeyPress = async (key: string) => {
    if (key === '模板') {
      if (loading) return;
      setLoading(true);
      try {
        chatApi.getPromptTemplates().then(res => {
          setMessageList(prev => [
            ...prev,
            { ...res, displayText: '', questions: [
              { id: 'template', question: '请选择您的业务领域', type: 'single', options: ['食品饮料', '美容美妆', '健康养生'] },
              { id: 'product', question: '请输入产品名称/产品链接/产品官网', type: 'text' },
              { id: 'platform', question: '请选择平台', type: 'multiple', options: ['小红书', '抖音'] }
            ] },
          ]);
        })
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    }
    else if (key === '获取热榜') {
      if (loading) return;
      setLoading(true);
      try {
        chatApi.createChat('最近小红书/抖音的热词、热话题有哪些？').then(res => {
          setMessageList(prev => [
            ...prev,
            { ...res, displayText: '' },
          ]);
        })
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    }
    else if (key === '找KOL') {
      if (!text.trim()) {
        toast.error('请输入产品名称/产品链接/产品官网');
        return;
      }
      if (loading) return;
      setLoading(true);
      try {
        chatApi.createChat(`根据产品名称/产品链接/产品官网${text}推荐对标网红`).then(res => {
          setMessageList(prev => [
            ...prev,
            { ...res, displayText: '' },
          ]);
        })
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    }
    else if (key === '深度分析') {
      if (!text.trim()) {
        toast.error('请输入账号名称/账号链接/账号ID');
        return;
      }
      if (loading) return;
      setLoading(true);
      try {
        chatApi.createChat(`根据给定的账号${text}，对其进行深度分析`).then(res => {
          setMessageList(prev => [
            ...prev,
            { ...res, displayText: '' },
          ]);
        })
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    }
    else if (key === '开发信') {
      if (!text.trim()) {
        toast.error('请输入网红名称/网红链接/网红ID');
        return;
      }
      if (loading) return;
      setLoading(true);
      try {
        chatApi.createChat(`针对这个网红${text}，生成一封开发信`).then(res => {
          setMessageList(prev => [
            ...prev,
            { ...res, displayText: '' },
          ]);
        })
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    }
    else if (key === '人工') {
      window.open('https://work.weixin.qq.com/kfid/kfc24a58f16a24c1eaf', '_blank');
    }
  };

  // Listen for keyboard input
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.altKey) {
        e.preventDefault();
        onSend();
      }
    },
    [onSend]
  );

  const handlePin = (promptText: string) => {
    console.log(promptText);
    // Popup a modal to show the prompt text and allow user to edit it,
    // then allow user to add a title for the prompt,
    // and save it to the local storage or send it to the server.
    setPinPrompt(promptText);
    setShowPinModal(true);
  };

  const handleTranslate = (translatedText: string, index: number) => {
    console.warn(translatedText);
    isTranslatingRef.current = true;
    setMessageList(prevData => {
      const newData = [...prevData];
      newData[index].text = translatedText;
      newData[index].displayText = translatedText;
      return newData;
    });
    setTimeout(() => {
      isTranslatingRef.current = false;
    }, 2000);
  };

  const handleRefresh = () => {
    // is ca
    const previousMessageText = messageList[messageList.length - 2].text;
    setLoading(true);
    chatApi
      .createChat(previousMessageText)
      .then(res => {
        setMessageList(prevData => {
          const newData = [...prevData];
          newData[newData.length - 1].text = res.text;
          newData[newData.length - 1].displayText = '';
          return newData;
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Updated handleAnalysis uses functional update to append messages instead of replacing the list.
  const handleLlmAnalysis = async (input: string) => {
    if (input) {
      if (loading) return;
      setText('AI Analysis Processing...');
      setLoading(true);
      try {
        //const response = await chatApi.dataQuery(input, userProfile!.userId);
        /*setMessageList(prev => [
          ...prev,
          {
          },
        ]);*/
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
        setText('');
      }
    }
  };

  return (
    <div className="chat-page ">
      <PromptPin
        open={showPinModal}
        promptText={pinPrompt}
        onClose={() => setShowPinModal(false)}
      />
      {/* Header */}
      <header className="chat-page-header">
        {/* <img src={backLeft} alt="Back" onClick={() => navigate(-1)} /> */}
        <img src={Logo} alt="Logo" />
        <span>Data3Agent</span>
        <div className="flex-1"></div>
        <img src={User} alt="User" onClick={() => handleUserSettings()} />
        {/* <Lang
          onChange={lang => {
            setMessageList(pre => {
              return [...pre, welcome[lang as keyof typeof welcome]];
            });
          }}
        /> */}
      </header>

      {/* Chat content */}
      <div className="chat-page-cont" ref={chatContainerRef}>
        {messageList.map((item, index) => (
          <div key={index} className={`chat-page-cont-item ${item.user === 'user' ? 'self' : ''}`}>
            {item.user === 'user' ? (
              item.text
            ) : (
              <>
                {/*item.action === 'caQuery' && item.ca && <GmgnView ca={item.ca} chain={item.token_chain as string}></GmgnView>*/}
                {/* {item.action === 'caQuery' && item.token_symbol && <TradingView symbol={item.token_symbol}></TradingView>} */}
                <AIMessage
                  message={item}
                  onDisplayUpdate={newDisplayText => {
                    setMessageList(prev => {
                      const newList = [...prev];
                      newList[index] = { ...newList[index], displayText: newDisplayText };
                      return newList;
                    });
                  }}
                />
              </>
              )}
              {item.questions && item.questions.length > 0 && (
                <QuestionForm
                questions={item.questions}
                onSubmit={option => {
                  const str = option.text;
                  const textAsString = Array.isArray(str) ? str.join("\n") : str;
                  setMessageList(prev => {
                  const newList = [...prev];
                  // 追加用户选择的内容为新消息
                  newList.push({
                    text: textAsString,
                    user: 'user',
                    action: 'NONE',
                    displayText: textAsString,
                  });
                  return newList;
                  });
                  // 发送选择内容
                  //onSend(textAsString);
                  toast.error('Send ' + textAsString);
                }}
                />
              )}
              {item.user === 'agent' && item.displayText === item.text && (
                <FooterOperation
                text={item.text + `|||||${item.note}`}
                onTranslate={translatedText => {
                  handleTranslate(translatedText, index);
                }}
                onRefresh={handleRefresh}
                menuList={
                  index === messageList.length - 1 && messageList.length > 1 && item.action !== 'bnbQuery'
                    ? ['share', 'translate', 'copy', 'refresh']
                    : ['share', 'translate', 'copy']
                }
              />
              )}
              {item.user === 'user' && item.text.length > 50 && (
                <FooterOperation
                  text={item.text}
                  onPin={promptText => {
                    handlePin(promptText);
                  }}
                  menuList={['pined']}
                />
              )}
          </div>
        ))}
      </div>

      {/* Bottom input area */}
      <div className="chat-page-bottom">
        <div className="chat-page-keys">
          {keyList.map(item => (
            <div className="chat-page-items" key={item} onClick={() => handleKeyPress(item)}>
              {item}
            </div>
          ))}
        </div>
        <div className="chat-page-input">
          <textarea ref={textareaRef} placeholder="Input your data request" value={text} onInput={onInput} onKeyDown={handleKeyDown} disabled={loading} />
          {loading ? (
            <ReactSVG src={LoadingImg} className="chat-loading"></ReactSVG>
          ) : (
            // <img src={} className="chat-loading" alt="loading" />
            <img
              src={text ? SendActive : Send}
              alt="Send"
              onClick={() => {
                onSend();
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
