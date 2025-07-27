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
import { Cron } from 'croner';
import { QuestionItem } from '@/components/Question';
import { toast } from 'react-toastify';
import PromptPin from './prompt';
import InviteCodeModal from './inviteCode';
import { useUserStore } from '@/stores/useUserStore';
import { getRandomElements } from '@/utils/common';
import { CodeApi } from '@/services/code';
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

const Chat = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [messageList, setMessageList] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [tips, setTips] = useState('请输入你的数据处理指令');
  //const [preText, setPreText] = useState('');
  const [pinPrompt, setPinPrompt] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  //const { userProfile } = useUserStore();
  //let preText = '';

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const isTranslatingRef = useRef(false);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const keyList = ['开始定位'];
  const [inviteCode, setInviteCode] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const localInviteCode = localStorage.getItem('invite_code') || '';
    const paramInviteCode = params.get('inviteCode') || '';
    if (paramInviteCode && paramInviteCode !== localInviteCode) {
      CodeApi.codeUse(paramInviteCode).then(res => {
        if (res.valid) {
          localStorage.setItem('invite_code', paramInviteCode);
          setInviteCode(paramInviteCode);
        }
      });
    } else if (localInviteCode) {
      setInviteCode(localInviteCode);
    } else {
      setInviteCode('');
    }
  }, []);

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
          text: `你好，我是IP罗盘 —— 一款强大的智能IP定位工具。
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

    //handleKeyPress('开始定位');
    knowledgeCheck();

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

  // AIMessage component with requestAnimationFrame typing animation
  const AIMessage = ({ message, onDisplayUpdate }: { message: Message; onDisplayUpdate: (text: string) => void }) => {
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
  };

  // Handle input changes in the text area
  const onInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = '18px';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
    setTips('请输入你的数据处理指令');
  }, []);

  const knowledgeCheck = () => {
    console.log('knowledgeCheck');
    try {
      const knowledgeUpdated = localStorage.getItem('local_knowledge_value_updated');
      console.log(knowledgeUpdated);
      if (knowledgeUpdated && knowledgeUpdated === 'true') {
        const newKnowledge = localStorage.getItem('local_knowledge_value');
        if (newKnowledge && newKnowledge != '') {
          setMessageList(prev => [...prev, { text: newKnowledge, user: 'user', action: 'NONE', displayText: newKnowledge }]);
        }
        localStorage.setItem('local_knowledge_value_updated', 'false');
      }
    } catch (err) {
      console.log(err);
    }
    return false;
  };

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
      chatApi
        .createChat(finalText)
        .then(res => {
          setMessageList(prev => [...prev, { ...res, displayText: '' }]);
        })
        .finally(async () => {
          //setLoading(false);
          await handlerStatus();
        });
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
      let taskId = '';
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
      chatApi
        .dataProcess(finalText, taskId, fromOptions)
        .then(res => {
          setMessageList(prev => [...prev, { ...res, displayText: '' }]);
        })
        .finally(async () => {
          //setLoading(false);
          await handlerStatus();
        });
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
    navigate('/user');
  };

  const checkUserProfile = () => {
    const set = localStorage.getItem('trendmuse_form_submitted') === 'true';
    if (!set) {
      toast.error('请在设置页面输入产品品牌/介绍/兴趣/偏好等');
      navigate('/user');
    }
    return set;
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
    } else if (key === '开始定位') {
      if (inviteCode) {
        const res = await CodeApi.codeValidate(inviteCode);
        console.warn(res);
        if (!res.valid) {
          // 打开邀请码输入框
          setShowInviteModal(true);
          return;
        }
      } else {
        // 打开邀请码输入框
        setShowInviteModal(true);
        return;
      }
      if (!checkUserProfile()) {
        return;
      }
      if (loading) {
        toast('正在处理中，请稍候......');
        return;
      }
      toast('正在根据背景知识库等信息进行IP定位分析，请稍候......');
      setLoading(true);
      const prompt = '根据我的背景知识库等信息，生成IP定位分析报告。';
      setMessageList(prev => [...prev, { text: prompt, user: 'user', action: 'NONE', displayText: prompt }]);
      try {
        chatApi
          .routineTask(prompt, 'positioning_analysis')
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
    } else if (key === '口播文案') {
      if (!checkUserProfile()) {
        return;
      }
      if (loading) return;
      toast('正在根据你的今日任务生成文案，请稍候......');
      setLoading(true);
      const prompt = '根据我的产品信息，生成今日的一些内容文案，包括标题、正文、标签等。';
      setMessageList(prev => [...prev, { text: prompt, user: 'user', action: 'NONE', displayText: prompt }]);
      try {
        chatApi
          .routineTask(prompt, 'today_posts')
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
      /*if (loading) return;
      toast('正在获取内容趋势，请稍候......');
      setLoading(true);
      let prompt = '根据我的产品信息，获取并预测下周社交媒体平台的内容趋势，包括热门话题、热搜词等。';
      setMessageList(prev => [
        ...prev,
        { text: prompt, user: 'user', action: 'NONE', displayText: prompt },
      ]);
      try {
        chatApi.routineTask(prompt, 'trend_prediction').then(res => {
          setMessageList(prev => [
            ...prev,
            { ...res, displayText: '' },
          ]);
        })
        .finally(async () => {
          //setLoading(false);
          await handlerStatus();
        });
      } catch (error) {
        console.log(error);
      }*/
    } else if (key === '爆款仿写') {
      if (!checkUserProfile()) {
        return;
      }
      if (loading) return;
      toast('正在获取相关热门内容，并进行分析和仿写，请稍候......');
      setLoading(true);
      const prompt = `找到所在行业/赛道的热门内容（包括低粉爆文）并汇集成数据表格，并基于这些爆款，生成10篇高仿写但原创表达的内容文案`;
      setMessageList(prev => [...prev, { text: prompt, user: 'user', action: 'NONE', displayText: prompt }]);
      try {
        chatApi
          .routineTask(prompt, 'hot_posts')
          .then(res => {
            setMessageList(prev => [...prev, { ...res, displayText: '' }]);
          })
          .finally(async () => {
            //setText('');
            //setLoading(false);
            await handlerStatus();
          });
      } catch (error) {
        console.log(error);
      }
    } else if (key === '达人评估') {
      if (!checkUserProfile()) {
        return;
      }
      toast(`正在根据我的信息，寻找潜在合作达人，并进行合作评估，请稍候......`);
      if (loading) return;
      setLoading(true);
      const prompt = `根据我的产品/产品类型/使用场景/目标群体/内容风格等，
        找到潜在合作达人画像，对其进行合作评估，包括：
        \r\n1. 根据达人内容与互动质量，评估每位达人的合作优先级（
          - 高：调性高度契合 + 内容稳定 + 互动率高
          - 中：部分调性契合 + 内容有潜力
          - 低：调性边缘或互动一般，待观察）；
        \r\n2. 达人内容调性分析与匹配判断，输出"内容调性匹配度打分"+ 内容风格简评；
        \r\n3. 合作投放建议，包括合作形式、内容方向、适合投放时间段、预算建议等`;
      setMessageList(prev => [...prev, { text: prompt, user: 'user', action: 'NONE', displayText: prompt }]);
      try {
        chatApi
          .routineTask(prompt, 'search_koc')
          .then(res => {
            setMessageList(prev => [...prev, { ...res, displayText: '' }]);
          })
          .finally(async () => {
            setText('');
            //setLoading(false);
            await handlerStatus();
          });
      } catch (error) {
        console.log(error);
      }
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
      <InviteCodeModal
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={code => {
          setInviteCode(code);
          handleKeyPress('开始定位');
          localStorage.setItem('invite_code', code);
        }}
      />
      {/* Header */}
      <header className="chat-page-header">
        {/* <img src={backLeft} alt="Back" onClick={() => navigate(-1)} /> */}
        <img src={Logo} alt="Logo" />
        <span>IP罗盘</span>
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
                  index === messageList.length - 1 && messageList.length > 1
                    ? item.completed
                      ? ['share', 'copy', 'refresh']
                      : ['copy', 'refresh']
                    : item.completed
                    ? ['share', 'copy']
                    : ['copy']
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
            <div className={loading ? 'chat-page-items loading' : 'chat-page-items'} key={item} onClick={() => handleKeyPress(item)}>
              {loading ? '正在处理...' : item}
            </div>
          ))}
        </div>
        {false && (
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
        )}
      </div>
    </div>
  );
};

export default Chat;
