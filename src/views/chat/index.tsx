import './index.less';
import { useNavigate } from 'react-router-dom';
import Logo from '@/assets/icons/logo.png';
import Send from '@/assets/icons/send.svg';
import SendActive from '@/assets/icons/send-active.svg';
import LoadingImg from '@/assets/icons/loading.svg';
import User from '@/assets/icons/user.svg';
import { useEffect, useLayoutEffect, useState, useCallback, useRef } from 'react';
import FooterOperation from '@/components/FooterOperation';
import { chatApi } from '@/services/chat';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ReactSVG } from 'react-svg';
import { Cron } from "croner";
import  { QuestionItem } from '@/components/Question';
import { toast } from 'react-toastify';
import PromptPin from './prompt';
import { useUserStore } from '@/stores/useUserStore';
import { getRandomElements } from '@/utils/common';
//import Lang from './lang';
//import welcome from './welcome';

type Message = {
  //id: string;
  text: string;
  user: string;
  action: string;
  displayText: string;
  taskId?: string;
  note?: string;
  options?: string[];
  backup_options?: string[];
  questions?: QuestionItem[];
  answers?: Record<string, string | string[]>;
  hasSubmit?: boolean;
};

const Chat = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [messageList, setMessageList] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [pinPrompt, setPinPrompt] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  //const { userProfile } = useUserStore();

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const isTranslatingRef = useRef(false);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const keyList = ['模板', '获取热榜', '找KOL', '账号分析'];

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
          text: `你好，我是 TrendMuse —— 基于自然语言驱动的数据洞察与内容执行助手。
                  \n你只需说出需求，我将自动获取社交媒体及短视频数据，输出：
                    \r\n1. **--高热趋势内容分析📈**
                    \n2. **--竞品账号策略解构📚**
                    \n3. **--用户评论兴趣提炼🚀**
                    \n4. **--达人合作建议🤖**
                    \n5. **--可直接发布的内容文案与评论模版📚**
                  \n等任意社媒运营需求.…
✍️              \r\n请输入你现在最想解决的问题，我将为你构建内容策略和落地方案。
          `,
          displayText: '',
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

  // Data Process
  const onDataProcess = useCallback(
    async (overrideText: string, msgIndex: number = messageList.length - 1) => {
      const finalText = overrideText || text;
      if (!finalText.trim() || loading) return;
      let taskId = "";
      try {
        if (msgIndex < messageList.length) {
          taskId = messageList[msgIndex].taskId || "";
        }
      }
      catch (err) {
        console.error(err);
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
      //const origin_input = useUserStore.getState().getOriginInput() || '';
      chatApi
        .dataProcess(finalText, taskId)
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
  };

  const handleKeyPress = async (key: string) => {
    if (key === '模板') {
      toast('正在获取模板，请稍候......');
      if (loading) return;
      setLoading(true);
      try {
        chatApi.getPromptTemplates().then(res => {
          setMessageList(prev => [
            ...prev,
            { ...res, displayText: '', questions: [

              ], hasSubmit: false
            },
          ]);
        })
        .finally(() => {
          setLoading(false);
        });
      } catch (error) {
        console.log(error);
      }
    }
    else if (key === '获取热榜') {
      toast('正在获取热榜，请稍候......');
      if (loading) return;
      setLoading(true);
      try {
        chatApi.createChat('最近小红书/抖音的热词、热话题有哪些？').then(res => {
          setMessageList(prev => [
            ...prev,
            { ...res, displayText: '' },
          ]);
        })
        .finally(() => {
          setLoading(false);
        });
      } catch (error) {
        console.log(error);
      }
    }
    else if (key === '找KOL') {
      toast('正在根据产品信息获取对标网红KOC，请稍候......');
      /*if (!text.trim()) {
        toast.error('请输入产品名称/产品链接/产品官网');
        return;
      }*/
      if (loading) return;
      setLoading(true);
      try {
        chatApi.createChat(`根据我的产品名称/产品链接/产品官网推荐对标网红KOC`).then(res => {
          setMessageList(prev => [
            ...prev,
            { ...res, displayText: '' },
          ]);
        })
        .finally(() => {
          setLoading(false);
        });
      } catch (error) {
        console.log(error);
      }
    }
    else if (key === '账号分析') {
      if (!text.trim()) {
        toast.error('请输入账号名称/账号链接/账号ID');
        setText('请输入账号名称/账号链接/账号ID');
        return;
      }
      toast(`正在根据给定的账号${text}，对其进行深度分析，请稍候......`);
      if (loading) return;
      setLoading(true);
      try {
        chatApi.createChat(`根据给定的账号${text}，对其进行深度分析`).then(res => {
          setMessageList(prev => [
            ...prev,
            { ...res, displayText: '' },
          ]);
        })
        .finally(() => {
          setLoading(false);
        });
      } catch (error) {
        console.log(error);
      }
    }
    else if (key === '开发信') {
      if (!text.trim()) {
        toast.error('请输入网红名称/网红链接/网红ID');
        setText('请输入网红名称/网红链接/网红ID');
        return;
      }
      toast(`正在根据网红${text}，生成一封开发信，请稍候......`);
      if (loading) return;
      setLoading(true);
      try {
        chatApi.createChat(`针对这个网红${text}，生成一封开发信`).then(res => {
          setMessageList(prev => [
            ...prev,
            { ...res, displayText: '' },
          ]);
        })
        .finally(() => {
          setLoading(false);
        });
      } catch (error) {
        console.log(error);
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
        const taskId = useUserStore.getState().getTaskId();
        if (taskId) {
          onDataProcess(text);
        }
        else {
          onSend();
        }
        useUserStore.getState().setOriginInput(text);
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
    /*const previousMessageText = messageList[messageList.length - 2].text;
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
      });*/
    setMessageList(prevData => {
      const newData = [...prevData];
      const newOptions = getRandomElements<string>(newData[newData.length - 1].backup_options || [], 3, 5);
      newData[newData.length - 1].options = newOptions;
      return newData;
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
        <span>TrendMuse</span>
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
              {/* {item.questions && item.questions.length > 0 && (
                <QuestionForm
                  questions={item.questions}
                  hasSubmit={item.hasSubmit || false}
                  onSubmit={(answers) => handleQuestionSend(answers, index)}
                />
              )} */}
              {item.options && item.options.length > 0 && (
                <div className="options-view">
                {item.options.map((option) => (
                  <button className={item.hasSubmit ? "option-button-disabled" : "option-button"}
                    disabled={item.hasSubmit/* || (index !== messageList.length - 1)*/}
                    onClick={() => { onDataProcess(option, index); }}>
                    {option}
                  </button>
                ))}
                <div>其他选项请直接在对话框输入</div>
                </div>
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
              {item.user === 'user' && item.text?.length > 10 && (
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
                const taskId = useUserStore.getState().getTaskId();
                if (taskId) {
                  onDataProcess(text);
                }
                else {
                  onSend();
                }
                useUserStore.getState().setOriginInput(text);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
