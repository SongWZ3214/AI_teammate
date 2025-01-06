import styles from './AI_teammate.module.scss'
import Canvas from './modules/drawboard/drawBoard'
import Video from './modules/video/video'
import ChatBox from './modules/chatbox/chatbox'

// 编写前端并暴露页面接口
const AI_teammate = () => {
    return (
        <div className={styles['page']}>
            <Canvas />
            <div className={styles['input']}>
                <Video />
                <ChatBox />
            </div>
            
        </div>
    )
}

export default AI_teammate