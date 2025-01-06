import React, { useState, useEffect } from 'react'
import Message from './message'
import styles from '../../AI_teammate.module.scss'
import { message } from 'antd'
import { Keyboard, VoiceOne } from '@icon-park/react'
import { Redo } from '@icon-park/react'
import { Button } from 'antd'

interface ChatMessage {
    id: number
    text: string
    sender: 'sent' | 'received'
}

let lastMessage : number = 0

const ChatBox: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [inputText, setInputText] = useState('')
    const [speechText, setSpeechText] = useState('')
    const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)

    const [messageApi, contextHolder] = message.useMessage()

    // 从后端恢复数据
  const restoreData = async () => {
    const msg_response = await fetch('http://127.0.0.1:5020/api/getMessages')
    const savedMsg = await msg_response.json()
    setMessages(savedMsg)
  }

  // 将数据保存到后端
  const saveData = async () => {
    await fetch('http://127.0.0.1:5020/api/saveMessages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    })
  }

  useEffect(() => {
    // 组件挂载时恢复数据
    restoreData()
  }, [])

    const speak = (txt: string) => {
        // 创建一个SpeechSynthesisUtterance实例
        const utterance = new SpeechSynthesisUtterance(txt)
                    
        // 设置语言
        utterance.lang = 'zh-CN'

        // 设置语速
        utterance.rate = 1.5

        // 设置语音自动播放
        utterance.onend = () => {
            console.log('SpeechSynthesisUtterance ended')
        }
        utterance.onerror = (event) => {
            console.error('SpeechSynthesisUtterance encountered an error:', event.error)
        }

        // 进行朗读
        window.speechSynthesis.speak(utterance)
    }

    const gptChatFunction = async (question: string, mode: number) => {
        // 创建要发送的数据对象
        const sendData = { "mode": mode, "prompt": question }

        // 发送 POST 请求
        const res = await fetch('http://127.0.0.1:5020/ask', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', // 设置请求头为 JSON
            },
            body: JSON.stringify(sendData), // 将数据对象转换为 JSON 字符串并发送
        })
        const needReply = await res.json()
        if(needReply.text === "needReply"){
            const wait = '思考中，请稍等片刻'
            speak(wait)
            // 发送 POST 请求
            const response = await fetch('http://127.0.0.1:5020/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json', // 设置请求头为 JSON
                },
                body: JSON.stringify(sendData), // 将数据对象转换为 JSON 字符串并发送
            })

            const receivedData = await response.json()
            if(receivedData.text !== ""){
                if(receivedData.text !== "noReply"){
                    const reply: ChatMessage = {
                        id: lastMessage + 1,
                        text: receivedData.text,
                        sender: 'received'
                    }
                    setMessages(prevMessages => [...prevMessages, reply])
                    lastMessage += 1
                    console.log("receive: "+reply.id)
                    console.log("last: "+lastMessage)
                    if(mode === 1){
                        speak(reply.text)
                    }
                    else{
                        speak("已完成，请查收我的思考结果吧")
                    }
                }
            }
            else{
                speak("出错了，请再试一次吧")
            }
        }
        else if(needReply.text === ''){
            speak("出错了，请再试一次吧")
        }
    }

    // let silenceTimer

    const ask = async () => {
        // console.log("set")
        // 设置定时器，在指定时间内没有语音输入时触发
        // silenceTimer = setTimeout(async() => {
            // 向后端发送信息
        const res = await fetch('http://127.0.0.1:5020/ask', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ "prompt": 'No speech detected for a while.' }),
        })
        const needReply = await res.json()
        if(needReply.text === "needReply"){
            const response = await fetch('http://127.0.0.1:5020/giveinfo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ "prompt": 'No speech detected for a while.' }),
            })
            const receivedData = await response.json()
            if(receivedData.text !== ""){
                const reply: ChatMessage = {
                    id: lastMessage + 1,
                    text: receivedData.text,
                    sender: 'received'
                }
                setMessages(prevMessages => [...prevMessages, reply])
                lastMessage += 1
                speak(reply.text)
            }
        }
        // }, 15020) // 例如，这里设置为15秒
    }

    // const resetSilenceTimer = () => {
    //     // console.log("reset")
    //     clearTimeout(silenceTimer)
    //     startSilenceTimer()
    // }

    useEffect(() => {
        const interval = setInterval(ask, 10000) // 每10秒询问一次是否需要主动回复
        return () => clearInterval(interval)
    }, [])

    const handleSend = (txt:string, row: number) => {
        if (txt !== '') {
            const newMessage: ChatMessage = {
                id: lastMessage + 1,
                text: txt,
                sender: 'sent'
            }
            setMessages(prevMessages => [...prevMessages, newMessage])
            lastMessage += 1
            console.log("send: "+newMessage.id)
            console.log("last: "+lastMessage)
            if(row === 1) setSpeechText('')
            else if(row === 2) setInputText('') // 清空输入框
            gptChatFunction(newMessage.text, row)
        }
    }

    const reGenerate = async (id: number) => {
        // 创建要发送的数据对象
        const sendData = { "mode": 2, "prompt": "重新回复一下上一条信息" }

        const wait = '思考中，请稍等片刻'
        speak(wait)

        // 发送 POST 请求
        const response = await fetch('http://127.0.0.1:5020/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', // 设置请求头为 JSON
            },
            body: JSON.stringify(sendData), // 将数据对象转换为 JSON 字符串并发送
        })

        const receivedData = await response.json()
        if(receivedData.text !== ""){
            if(receivedData.text !== "noReply"){
                messages.map(msg => {
                    if(msg.id === id){
                        console.log("regenerate: "+msg.id)
                        msg.text = receivedData.text
                    }
                })
                speak("已完成，请查收我的思考结果吧")
            }
        }
        else{
            speak("出错了，请再试一次吧")
        }
        // resetSilenceTimer()
    }

    useEffect(() => {
        const speechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        if (speechRecognition) {
            const recognitionInstance = new speechRecognition()
            recognitionInstance.continuous = true
            recognitionInstance.interimResults = true
            recognitionInstance.lang = 'zh-CN' // 设置所需的语言
        
            recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
                let finalTranscript = ''
                let interimTranscript = ''
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    // console.log(i)
                    const transcript = event.results[i][0].transcript
                    // console.log(transcript)
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript
                    } else {
                        interimTranscript = transcript
                    }
                }
                if (finalTranscript.length > 0) {
                    setSpeechText(prev => prev + finalTranscript)
                    handleSend(finalTranscript, 1)
                }
                setSpeechText(speechText + interimTranscript)
            }

            recognitionInstance.onstart = () => {
                // console.log("start")
                // startSilenceTimer() // 当语音识别开始时启动定时器
            }
    
            recognitionInstance.onend = () => {
                // console.log("end")
                // clearTimeout(silenceTimer) // 清除定时器
                recognitionInstance.start() // 当识别服务停止时，自动重新启动
            }
    
            setRecognition(recognitionInstance)
        }
    }, [])
    
    useEffect(() => {
        recognition?.start()
        return () => {
            recognition?.stop()
        }
    }, [recognition])

    return (
        <div className={styles.chatbox}>
            {contextHolder}
            <div className={styles['message-container']}>
                {messages.map(msg => (
                    <div className={styles['message-row']} style={{alignSelf: (msg.sender === 'sent')?'flex-end':'flex-start', maxWidth: (msg.sender === 'sent')?'70%':'80%'}}>
                        <Message key={msg.id} text={msg.text} sender={msg.sender} />
                        {(msg.sender === 'received')&&(msg.id === lastMessage)&&<Button shape="circle" type='text' icon={<Redo/>} size='small' onClick={() => reGenerate(msg.id)}/>}
                    </div>
                ))}
            </div>
            <div className={styles['send-container']}>
                <div className={styles['row']}>
                    <VoiceOne theme="outline" size="30" fill="#333" style={{top: 2, position: 'relative'}}/>
                    <textarea
                        className={styles['chat-speech-input']}
                        value={speechText}
                        onChange={e => setSpeechText(e.target.value)}
                    />
                    <button onClick={saveData} className={styles['save-button']}>Save</button>
                </div>
                <div className={styles['row']}>
                    <Keyboard theme="outline" size="30" fill="#333" style={{top: 2, position: 'relative'}}/>
                    <textarea
                        className={styles['chat-text-input']}
                        value={inputText}
                        onChange={e => setInputText(e.target.value)}
                        placeholder="Type your message here..."
                    />
                    <button onClick={() => handleSend(inputText, 2)} className={styles['send-button']}>Send</button>
                </div>
            </div>
        </div>
    )
}

export default ChatBox
