import { useEffect, useState, useRef } from 'react'
import styles from '../../AI_teammate.module.scss'

const Video = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDevice, setSelectedDevice] = useState('')
  const [isCameraOn, setIsCameraOn] = useState(false)

  const toggleCamera = () => {
    setIsCameraOn(!isCameraOn)
  }

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const videoDevices = devices.filter(
        (device) => device.kind === 'videoinput'
      )
      setDevices(videoDevices)
      if (videoDevices.length > 0) {
        setSelectedDevice(videoDevices[0].deviceId)
      }
    })
  }, [])

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: selectedDevice } },
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch (error) {
        console.error('Error accessing the camera:', error)
      }
    }

    if (isCameraOn && selectedDevice) {
      startCamera()
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current?.srcObject as MediaStream
        stream.getTracks().forEach((track) => track.stop())
        videoRef.current.srcObject = null
      }
    }
  }, [selectedDevice, isCameraOn])

  return (
    <div className={styles['video-container']}>
      <div className={styles['video-controls']}>
        <button onClick={toggleCamera}>
          {isCameraOn ? '关闭摄像头' : '开启摄像头'}
        </button>
        <select
          onChange={(e) => setSelectedDevice(e.target.value)}
          value={selectedDevice}
        >
          {devices.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Camera ${device.deviceId}`}
            </option>
          ))}
        </select>
      </div>
      <video
        className={styles['camera']}
        ref={videoRef}
        autoPlay
        muted
        playsInline
      ></video>
    </div>
  )
}

export default Video
