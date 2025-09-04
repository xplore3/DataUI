import './index.less';
import { useNavigate } from 'react-router-dom';
import Logo from '@/assets/icons/logo.png';
import Send from '@/assets/icons/send.svg';
import SendActive from '@/assets/icons/send-active.svg';
import LoadingImg from '@/assets/icons/loading.svg';
import Setting from '@/assets/icons/setting.svg';
import { useEffect, useLayoutEffect, useState, useCallback, useRef, memo } from 'react';
import FooterOperation from '@/components/FooterOperation';
import { chatApi } from '@/services/chat';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ReactSVG } from 'react-svg';
import { Cron } from 'croner';
import { QuestionItem } from '@/components/Question';
import { toast } from 'react-toastify';
import PromptPin from './prompt';
import { useUserStore } from '@/stores/useUserStore';
import { getRandomElements } from '@/utils/common';
import ToggleButton from '@/components/ToggleButton';
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
  completed?: boolean;
};

// AIMessage component with requestAnimationFrame typing animation - 抽取到外部避免重新渲染
const AIMessage = memo(({ message, onDisplayUpdate }: { message: Message; onDisplayUpdate: (text: string) => void }) => {
  const animationFrameRef = useRef<number | null>(null);
  const [renderError, setRenderError] = useState(false);

  useEffect(() => {
    // Skip if the content is already complete
    if (message.displayText === message.text) return;
    let currentIndex = message.displayText.length;
    const chunkSize = 300; // Number of characters to add per frame
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

  // 错误边界：如果 ReactMarkdown 出错，显示纯文本内容
  if (renderError) {
    return <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{message.displayText}</pre>;
  }

  try {
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
  } catch (error) {
    // 如果 ReactMarkdown 渲染失败，切换到纯文本模式
    console.warn('ReactMarkdown render failed, falling back to plain text:', error);
    setRenderError(true);
    return <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{message.displayText}</pre>;
  }
}, (prevProps, nextProps) => {
  // 自定义比较函数：只有关键属性变化时才重新渲染
  const prev = prevProps.message;
  const next = nextProps.message;
  
  // 如果是同一个对象引用，直接返回true（不重新渲染）
  if (prev === next) return true;
  
  // 比较影响显示的核心属性
  const isSameMessage = (
    prev.text === next.text &&
    prev.displayText === next.displayText &&
    prev.user === next.user &&
    prev.action === next.action
  );
  
  // 比较onDisplayUpdate回调函数（虽然这个可能每次都不同，但我们还是检查一下）
  const isSameCallback = prevProps.onDisplayUpdate === nextProps.onDisplayUpdate;
  
  // 只有消息内容相同且回调相同时才不重新渲染
  return isSameMessage && isSameCallback;
});

const Chat = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [messageList, setMessageList] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [tips, setTips] = useState('请输入你的数据处理指令');
  //const [preText, setPreText] = useState('');
  const [pinPrompt, setPinPrompt] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [rawDataState, setRawDataState] = useState(false);
  //const { userProfile } = useUserStore();
  //let preText = '';

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const isTranslatingRef = useRef(false);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const keyList = ['模板', '今日热门', '趋势洞察'];

  // Load saved messages from local storage and initialize displayText
  useEffect(() => {
    const savedMessages = localStorage.getItem('ChatMessage');
    if (savedMessages) {
      const parsedMessages: Message[] = JSON.parse(savedMessages);
      const initializedMessages = parsedMessages.slice(-200).map(msg => {
        return {
          ...msg,
          displayText: msg.text,
        };
      });
      setMessageList(initializedMessages);
    } else {
      setMessageList([
        {
          text: `你好，我是SeekInsight —— 面向AI的商业数据引擎。
                \r\n\r\n为了更好的实现数据获取和数据处理的功能效果，输入内容最好是如下格式：
                \r\n🚩【平台】【时间期限】【关键词】【数量】【过滤条件】【排序相关】
                \r\n如：
                \r\n找一下【知乎】上关于【AI应用】的【10条】内容
                \r\n
          `,
          displayText: '',
          user: 'agent',
          action: 'NONE',
        },
      ]);
    }

    // Get message from url
    // const urlParams = new URLSearchParams(window.location.search);
    // const message = urlParams.get('message');
    const message = localStorage.getItem('welcomeMessage');
    console.log(message);
    // const handleCaMessage = async (msg: string) => {
    //   setMessageList(prev => [...prev, { text: msg, user: 'user', action: 'NONE', displayText: msg }]);
    //   handleLlmAnalysis(msg);
    // };
    if (message) {
      // handleCaMessage(message);
      setText(message);
      setTimeout(() => {
        onSend(message);
      }, 1);
      localStorage.removeItem('welcomeMessage');
    }

    setTips('请输入你的数据处理指令');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save messages to local storage
  useEffect(() => {
    if (messageList.length > 0) {
      localStorage.setItem('ChatMessage', JSON.stringify(messageList));
    }

    setTips('请输入你的数据处理指令');
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



  // Handle input changes in the text area
  const onInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = '18px';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
    setTips('请输入你的数据处理指令');
  }, []);

  const fixCommand = (finalText: string) => {
    try {
      if (finalText === '人工' || finalText === '人工服务' || finalText === '人工客服') {
        window.open('https://work.weixin.qq.com/kfid/kfc24a58f16a24c1eaf', '_blank');
        return true;
      }

      if (finalText === '测试001') {
        toast('正在获取测试信息，请稍候......');
        setLoading(true);
        chatApi
          .getQualityEvaluation()
          .then(response => {
            setMessageList(prev => [...prev, { text: response, user: 'client', action: 'NONE', displayText: response }]);
          })
          .finally(async () => {
            setText('');
            setLoading(false);
            return true;
          });
        return true;
      } else if (finalText.slice(0, 5) === '测试002') {
        toast('正在获取测试信息002，请稍候......');
        setLoading(true);
        chatApi
          .dataHub(finalText.slice(5))
          .then(res => {
            setMessageList(prev => [...prev, { ...res, displayText: '' }]);
          })
          .finally(async () => {
            setText('');
            setLoading(false);
            return true;
          });
        return true;
      }
    } catch (err) {
      console.log(err);
    }
    return false;
  };

  // Send message
  const onSend = useCallback(
    async (overrideText?: string) => {
      const finalText = overrideText || text;
      if (!finalText.trim() || loading) return;
      if (fixCommand(finalText)) {
        return;
      }

      setLoading(true);
      setText('');
      setMessageList(prev => [...prev, { text: finalText, user: 'user', action: 'NONE', displayText: finalText }]);
      if (rawDataState) {
        chatApi
          .dataHub(finalText)
          .then(res => {
            setMessageList(prev => [...prev, { ...res, displayText: '' }]);
          })
          .finally(async () => {
            setText('');
            setLoading(false);
            return true;
          });
        return;
      }
      else {
        chatApi
          .dataHub(finalText + `|||||需对数据进行文本化总结整理，如果内容过长，需要控制在1000字符以内`)
          .then(res => {
            setMessageList(prev => [...prev, { ...res, displayText: '' }]);
          })
          .finally(async () => {
            setText('');
            setLoading(false);
            return true;
          });
      }
    },
    [text, loading]
  );

  // Data Process
  const onDataProcess = useCallback(
    async (overrideText: string, fromOptions: boolean, msgIndex: number = messageList.length - 1) => {
      const finalText = overrideText || text;
      if (!finalText.trim() || loading) return;
      if (fixCommand(finalText)) {
        return;
      }
      try {
        if (msgIndex < messageList.length) {
          taskId = messageList[msgIndex].taskId || '';
        }
      } catch (err) {
        console.error(err);
      }

      setLoading(true);
      setText('');
      setMessageList(prev => [...prev, { text: finalText, user: 'user', action: 'NONE', displayText: finalText }]);
      //const origin_input = useUserStore.getState().getOriginInput() || '';
      if (rawDataState) {
        chatApi
          .dataHub(finalText)
          .then(res => {
            setMessageList(prev => [...prev, { ...res, displayText: '' }]);
          })
          .finally(async () => {
            setText('');
            setLoading(false);
            return true;
          });
        return;
      }
      else {
        chatApi
          .dataHub(finalText + `|||||需对数据进行文本化总结整理，如果内容过长，需要控制在1000字符以内`)
          .then(res => {
            setMessageList(prev => [...prev, { ...res, displayText: '' }]);
          })
          .finally(async () => {
            setText('');
            setLoading(false);
            return true;
          });
      }
    },
    [text, loading]
  );

  const handlerStatus = async () => {
    try {
      // checkResp per 30 seconds
      let jobSkip = false;
      const job = new Cron('*/10 * * * * *', async () => {
        //console.log(`Response check at ${new Date().toISOString()}`);
        if (jobSkip) {
          return;
        }
        try {
          chatApi.checkTaskStatus().then(res => {
            if (jobSkip) {
              return;
            }
            if (res.completed) {
              setLoading(false);
              jobSkip = true;
              job.stop();
            }
            //console.log(preText);
            //console.log(res.text);
            /*if (res.text && res.text != '' && res.text !== preText) {
              setMessageList(prev => [
                ...prev,
                { ...res, displayText: '' },
              ]);
              preText = res.text;
            }*/
            if (res.text) {
              setMessageList(prev => {
                const newList = [...prev];
                const index = newList.length - 1;
                if (newList[index].taskId != res.taskId) {
                  return [...prev, { ...res, displayText: '' }];
                }
                newList[index] = { ...newList[index], text: res.text, displayText: res.text };
                return newList;
              });
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

  const handleUserSettings = async () => {
    navigate('/intro');
  };

  const handleKeyPress = async (key: string) => {
    if (key === '模板') {
      if (loading) return;
      toast('正在获取模板，请稍候......');
      setLoading(true);
      try {
        chatApi
          .getPromptTemplates()
          .then(res => {
            setMessageList(prev => [...prev, { ...res, displayText: '', questions: [], hasSubmit: false }]);
          })
          .finally(() => {
            setLoading(false);
          });
      } catch (error) {
        console.log(error);
      }
    } else if (key === '今日热门') {
      if (loading) return;
      toast('正在获取今日热门内容，请稍候......');
      setLoading(true);
      const prompt =
        '根据我的产品/背景知识库等信息，获取相关热门商业数据、生态数据等。';
      setMessageList(prev => [...prev, { text: prompt, user: 'user', action: 'NONE', displayText: prompt }]);
      try {
        chatApi
          .routineTask(prompt, 'hot_posts')
          .then(res => {
            setMessageList(prev => [...prev, { ...res, displayText: '' }]);
          })
          .finally(async () => {
            //setLoading(false);
            await handlerStatus();
          });
      } catch (error) {
        console.log(error);
      }
    } else if (key === '趋势洞察') {
      toast('功能正在开发中，请耐心等待~，如有问题请回复【人工】获取支持~~');
    } else if (key === '人工') {
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
          onDataProcess(text, false);
        } else {
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

  const handleRefresh = async () => {
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
    if (messageList[messageList.length - 1].backup_options) {
      setMessageList(prevData => {
        const newData = [...prevData];
        const newOptions = getRandomElements<string>(newData[newData.length - 1].backup_options || [], 3, 5);
        newData[newData.length - 1].options = newOptions;
        return newData;
      });
    } else {
      await handlerStatus();
    }
  };

  return (
    <div className="chat-page ">
      <PromptPin open={showPinModal} promptText={pinPrompt} onClose={() => setShowPinModal(false)} />
      {/* Header */}
      <header className="chat-page-header">
        {/* <img src={backLeft} alt="Back" onClick={() => navigate(-1)} /> */}
        <img src={Logo} alt="Logo" />
        <span>SeekInsight</span>
        <div className="flex-1"></div>
        <img src={Setting} alt="Setting" onClick={() => handleUserSettings()} />
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
                {item.options.map(option => (
                  <button
                    className={item.hasSubmit ? 'option-button-disabled' : 'option-button'}
                    disabled={item.hasSubmit /* || (index !== messageList.length - 1)*/}
                    onClick={() => {
                      onDataProcess(option, true, index);
                    }}
                  >
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
          <ToggleButton defaultActive={rawDataState} onToggle={(val: boolean) => setRawDataState(val)}>
            RawData
          </ToggleButton>
          {keyList.map(item => (
            <div className="chat-page-items" key={item} onClick={() => handleKeyPress(item)}>
              {item}
            </div>
          ))}
        </div>
        <div className="chat-page-input">
          <textarea ref={textareaRef} placeholder={tips} value={text} onInput={onInput} onKeyDown={handleKeyDown} disabled={loading} />
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
                  onDataProcess(text, false);
                } else {
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
