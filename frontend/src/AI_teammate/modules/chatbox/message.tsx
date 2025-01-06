import React from 'react'
import styles from '../../AI_teammate.module.scss'
import { Redo } from '@icon-park/react';
import { Button } from 'antd'

interface MessageProps {
  text: string
  sender: 'sent' | 'received'
}

const Message: React.FC<MessageProps> = ({ text, sender }) => (
  // <div className={styles['message-row']} style={{alignSelf: (sender == 'sent')?'flex-end':'flex-start', maxWidth: (sender == 'sent')?'70%':'80%'}}>
    <div className={`${styles.message} ${styles[sender]}`}>
      {text}
    </div>
  //   {(sender == 'received') &&
  //   <Button shape="circle" type='text' icon={<Redo/>} size='small'/>
  //   }
  // </div>
  
)

export default Message