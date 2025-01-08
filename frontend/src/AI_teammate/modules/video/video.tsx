import { useEffect, useState, useRef } from 'react'
import styles from '../../AI_teammate.module.scss'
import { Button, Select } from 'antd'

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
        <Button className={styles['toggle-camera-btn']} type='primary' onClick={toggleCamera}>
          {isCameraOn ? 'Camera Off' : 'Camera On'}
        </Button>
        <Select
          onChange={(value) => setSelectedDevice(value)}
          value={selectedDevice}
          className={styles['toggle-camera-select']}
        >
          {devices.map((device) => (
            <Select.Option key={device.deviceId} value={device.deviceId}>
              {device.label || `Camera ${device.deviceId}`}
            </Select.Option>
          ))}
        </Select>
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
