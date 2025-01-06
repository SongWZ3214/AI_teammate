import React from 'react';
import './App.css';
import AI_teammate from './AI_teammate/AI_teammate';
import { useState } from "react";
import { KeyOutlined } from '@ant-design/icons';
import { Input, Button } from 'antd';

function App() {
  const [login, setLogin] = useState(false);

  const LoginPageForProbe: React.FC = () => {
    const [api, setAPI] = useState('');

    async function handleLogin(api: string) {
      if (login === false) {
        const sendData = { "api": api }
        const response = await fetch('http://127.0.0.1:5020/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json', // 设置请求头为 JSON
          },
          body: JSON.stringify(sendData), // 将数据对象转换为 JSON 字符串并发送
        })

        if (response.ok) {
          const receivedData = await response.json()
          setLogin(true)
          console.log(receivedData.message)
        }
        else {
          console.error('Failed to login');
        }
      }
    }
    return (
      <div className="loginPageForProbe">
        <Input size="large" placeholder="请输入API" prefix={<KeyOutlined />} value={api} onChange={(e) => setAPI(e.target.value)} />
        <br />
        <br />
        <Button type="primary" onClick={() => { handleLogin(api) }}>提交</Button>
      </div>
    )
  };

  function switchPage() {
    if (login === false)
      return (
        <div className='LoginContainer'>
          <LoginPageForProbe />
        </div>
      )
    else return <AI_teammate/>
  }

  return (
    <div className="App">
      {switchPage()}
    </div>
  );
}

export default App;
