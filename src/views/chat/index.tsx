import './index.less';
//import { useNavigate } from 'react-router-dom';
//import backLeft from '@/assets/icons/back-left.svg';
import Logo from '@/assets/icons/logo.png';
import Send from '@/assets/icons/send.svg';
import SendActive from '@/assets/icons/send-active.svg';
import LoadingImg from '@/assets/icons/loading.svg';
import { useEffect, useLayoutEffect, useState, useCallback, useRef } from 'react';
import FooterOperation from '@/components/FooterOperation';
import { chatApi } from '@/services/chat';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';;
import { ReactSVG } from 'react-svg';
import { Cron } from "croner";
//import Lang from './lang';
//import welcome from './welcome';

type Message = {
  text: string;
  user: string;
  action: string;
  displayText: string;
  taskId?: string;
  note?: string;
  ca?: string;
};

const Chat = () => {
  //const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [messageList, setMessageList] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const isTranslatingRef = useRef(false);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const keyList = ['AI Prediction'];

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
          text: `🤖Welcome to Data3Agent.`,
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

      // checkResp per 10 seconds
      const job = new Cron("*/20 * * * * *", async () => {
        console.log(`Response check at ${new Date().toISOString()}`);
        chatApi.checkTaskStatus().then(res => {
          setMessageList(prev => [
            ...prev,
            { ...res, displayText: '' },
          ]);
        })
      });

      setLoading(true);
      chatApi
        .createChat(finalText)
        .then(res => {
          setText('');
          setMessageList(prev => [
            ...prev,
            { text: finalText, user: 'user', action: 'NONE', displayText: finalText },
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

  const handleKeyPress = async (key: string) => {
    if (key === 'AI Prediction') {
      if (loading) return;
      setLoading(true);
      // Randomly choose a token from TokenName
      try {
        /*setMessageList(prev => [
          ...prev,
          {
          },
        ]);*/
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
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
      {/* Header */}
      <header className="chat-page-header">
        {/* <img src={backLeft} alt="Back" onClick={() => navigate(-1)} /> */}
        <img src={Logo} alt="Logo" />
        <span>Data3Agent</span>
        <div className="flex-1"></div>
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
            {item.user !== 'user' && item.displayText === item.text && (
              <FooterOperation
                text={item.text + `|||||${item.note}`}
                onTranslate={translatedText => {
                  handleTranslate(translatedText, index);
                }}
                onRefresh={handleRefresh}
                menuList={
                  index === messageList.length - 1 && messageList.length > 1 && item.action !== 'bnbQuery'
                    ? ['share', 'bookmark', 'translate', 'copy', 'refresh']
                    : ['share', 'bookmark', 'translate', 'copy']
                }
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
