import React, { useRef, useState, useEffect, PointerEvent } from 'react'
import styles from '../../AI_teammate.module.scss' // 导入样式文件
import { FloatButton, Button } from 'antd'
import { SketchPicker } from 'react-color'
import pencil from '../../Image/pencil.png'
import eraser from '../../Image/eraser.png'
import {
  ClearFormat,
  Delete,
  MoveOne, Pencil, Pic, Platte, Save, Selected, Text
} from '@icon-park/react'
import html2canvas from 'html2canvas'

/**
 * 光标坐标
 */
interface Coordinates {
  x: number
  y: number
}

/**
 * 文本框
 */
interface TextBox {
  x: number
  y: number
  abs_x: number
  abs_y: number
  text: string
  visible: boolean
}

/**
 * 图片
 */
interface Image {
  x: number
  y: number
  abs_x: number
  abs_y: number
  src: string
  visible: boolean
}

const canvasState = {
  scrollX: 0,
  scrollY: 0,
}

interface Line {
  originalPointerPosition: Coordinates,
  newPointerPosition: Coordinates,
  mode,
  mycolor: string,
  width: number
}

let drawingSteps: Line[] = []

const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const temporaryCanvasRef = useRef<HTMLCanvasElement>(null)
  const [isDefault, setIsDefault] = useState<boolean>(true)  // 是否是默认状态

  const [isPainting, setIsPainting] = useState<boolean>(false)   // 鼠标是否点击画布（处于绘画或擦除状态）
  const [PointerPosition, setPointerPosition] = useState<Coordinates | undefined>(undefined)   // 鼠标位置
  const [strokeColor, setStrokeColor] = useState<string>('black')  // 画笔颜色
  const [strokeWidth, setStrokeWidth] = useState<number>(2)    // 画笔粗细
  const [colorPickerVisible, setColorPickerVisible] = useState<boolean>(false)   // 颜色选择器是否可见
  const [isDrawing, setIsDrawing] = useState<boolean>(false)  // 是否处于绘画状态
  const [isErasing, setIsErasing] = useState<boolean>(false)  // 是否处于擦除状态

  const [Images, setImages] = useState<Image[]>([])    // 存放图片信息的数组
  const [activeImage, setActiveImage] = useState<number | null>(null)   // 处于激活状态的图片的index
  const [imageDragging, setImageDragging] = useState(false)   // 是否在拖拽图片
  const [imageDragStart, setImageDragStart] = useState({ x: 0, y: 0 })   // 是否开始拖拽图片

  const [isTextMode, setIsTextMode] = useState<boolean>(false)    // 是否处于文本输入状态
  const [textBoxes, setTextBoxes] = useState<TextBox[]>([])    // 存放文本框信息的数组
  const [activeBox, setActiveBox] = useState<number | null>(null)   // 处于激活状态的文本框的index
  const [isDragging, setIsDragging] = useState(false)      // 是否在拖拽文本框
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })   // 是否开始拖拽文本框
  const resizeThreshold = 16

  const [isButtonVisible, setIsButtonVisible] = useState(false)    // 删除和复制的button是否可见
  const [activePointers, setActivePointers] = useState<Map<number, { x: number, y: number }>>(new Map())

  const [selectionStart, setSelectionStart] = useState<{x: number, y: number} | null>(null)
  const [selectionEnd, setSelectionEnd] = useState<{x: number, y: number} | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const [isSelectMode, setIsSelectMode] = useState(false)

  // 从后端恢复数据
  const restoreData = async () => {
    const Offset_response = await fetch('http://127.0.0.1:5020/api/getOffset')
    const offset = await Offset_response.json()
    canvasState.scrollX = offset.scrollX
    canvasState.scrollY = offset.scrollY
    const txt_response = await fetch('http://127.0.0.1:5020/api/getTextBoxes')
    const savedTextBoxes = await txt_response.json()
    setTextBoxes(savedTextBoxes)
    const img_response = await fetch('http://127.0.0.1:5020/api/getImages')
    const savedImages = await img_response.json()
    setImages(savedImages)
    const line_response = await fetch('http://127.0.0.1:5020/api/getLines')
    const savedLines = await line_response.json()
    drawingSteps = savedLines
    redraw()
  }

  // 将数据保存到后端
  const saveData = async () => {
    await fetch('http://127.0.0.1:5020/api/saveTextBoxes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(textBoxes),
    })
    await fetch('http://127.0.0.1:5020/api/saveImages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(Images),
    })
    await fetch('http://127.0.0.1:5020/api/saveLines', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(drawingSteps),
    })
    await fetch('http://127.0.0.1:5020/api/saveOffset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(canvasState),
    })
  }

  useEffect(() => {
    // 组件挂载时恢复数据
    restoreData()
  }, []) 

  /**
   * 设置当前状态
   * @param DefaultMode 默认状态
   * @param PaintMode 绘画状态
   * @param EraseMode 擦除状态
   * @param TextMode 文本输入状态
   */
  const chooseMode = (DefaultMode: boolean, PaintMode: boolean, EraseMode: boolean, TextMode: boolean, SelectMode: boolean) => {
    setIsDefault(DefaultMode)
    setIsDrawing(PaintMode)
    setIsErasing(EraseMode)
    setIsTextMode(TextMode)
    setIsSelectMode(SelectMode)
    if(DefaultMode) {
      if (canvasRef.current) {
        canvasRef.current.style.pointerEvents = 'none'
      }
      if (temporaryCanvasRef.current) {
        temporaryCanvasRef.current.style.pointerEvents = 'none'
      }
    }
    else if(SelectMode) {
      if (canvasRef.current) {
        canvasRef.current.style.pointerEvents = 'none'
      }
      if (temporaryCanvasRef.current) {
        temporaryCanvasRef.current.style.pointerEvents = 'all'
      }
    }
    else {
      if (canvasRef.current) {
        canvasRef.current.style.pointerEvents = 'all'
      }
      if (temporaryCanvasRef.current) {
        temporaryCanvasRef.current.style.pointerEvents = 'none'
      }
    }
  }

  /**
   * 工具栏
   * @param param0 一些按钮点击触发事件
   * @returns FloatButton.Group
   */
  const Tools = ({ className, changeColor, erase, draw, setdefault }) => (
    <>
      <FloatButton.Group
        shape="square"
        className={className}
        // style={{position:'absolute', top: 15, right: 220, bottom: 700,display: 'flex'}}
      >
        <FloatButton
          icon={<MoveOne />}
          onClick={setdefault}
        />
        <FloatButton
          icon={<Pencil />}
          onClick={draw}
        />
        <FloatButton 
          icon={<ClearFormat />}
          onClick={erase}
        />
        <FloatButton
          icon={<Platte />}
          onClick={changeColor}
        />
        {colorPickerVisible && isDrawing && (
          <div className={styles['color-picker']}>
            <SketchPicker
              color={strokeColor}
              onChangeComplete={(color) => setStrokeColor(color.hex)}
            />
          </div>
        )}
        <FloatButton icon={<Pic onClick={handleUploadClick} />} />
        <FloatButton icon={<Text onClick={() => {
          chooseMode(false, false, false, true, false)
        }} />} />
        {/* <FloatButton icon={<Selected onClick={() => {
          chooseMode(false, false, false, false, true)
        }} />} /> */}
        <FloatButton icon={<Save onClick={saveData} />} />
      </FloatButton.Group>
    </>
  )

  /**
   * 删除图片或者文本框
   */
  const deleteTorI = () => {
    if(activeBox != null){
      textBoxes[activeBox].visible = false
      setActiveBox(null)
    }
    else if(activeImage != null){
      Images[activeImage].visible = false
      setActiveImage(null)
    }
  }

  /**
   * 有处于激活状态的文本框或图片时删除和复制按钮可见
   */
  useEffect(() => {
    if(activeBox != null || activeImage != null){
      setIsButtonVisible(true)
    }
    else setIsButtonVisible(false)
  }, [activeBox, activeImage])

  /**
   * 开始拖拽图片
   * @param index 要拖拽图片的index
   * @param event 鼠标事件
   * @returns 
   */
  const startDragImage = (index: number, event: React.PointerEvent<HTMLImageElement>) => {
    event.preventDefault()
    const image = event.currentTarget
    const { right, bottom } = image.getBoundingClientRect()

    // 检查鼠标点击是否在image的右下角
    const isResizing = 
      event.clientX >= right - resizeThreshold && 
      event.clientY >= bottom - resizeThreshold

    if (isResizing) {
      // 用户正在尝试调整大小，不开始拖拽
      return
    }
    setImageDragStart({
      x: event.clientX - Images[index].x,
      y: event.clientY - Images[index].y,
    })
    setActiveImage(index)
    setImageDragging(true)
  }

  /**
   * 正在拖拽图片
   * @param event 鼠标事件
   * @returns 
   */
  const onDragImage = (event: React.PointerEvent) => {
    event.preventDefault()
    if (!imageDragging || activeImage === null) return

    const newX = event.clientX - imageDragStart.x
    const newY = event.clientY - imageDragStart.y

    setImages(Images.map((image, index) =>
      index === activeImage ? { ...image, x: newX, y: newY, abs_x: newX - canvasState.scrollX, abs_y: newY - canvasState.scrollY } : image
    ))
  }

  /**
   * 结束拖拽图片
   */
  const endDragImage = () => {
    setImageDragging(false)
  }

  /**
   * 上传图片
   */
  const handleUploadClick = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      // 创建 FormData 对象并添加文件
      const formData = new FormData()
      formData.append('image', file)

      // 发送 POST 请求到后端
      try {
        const response = await fetch('http://127.0.0.1:5020/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error('Upload failed')
        }

        // 处理响应（根据需要）
        console.log('Image uploaded successfully')
      } catch (error) {
        console.error('Error uploading image:', error)
      }
    }
    input.click()
  }

  /**
   * 将新图片的信息加入数组
   * @param x 图片左上角横坐标
   * @param y 图片左上角纵坐标
   * @param src 图片Base64编码
   * @param visible 图片是否可见
   */
  const addImage = (x: number, y: number, abs_x: number, abs_y: number, src: string, visible: boolean) => {
    const newImage: Image = { x, y, abs_x, abs_y, src, visible}
    setImages([...Images, newImage])
    setActiveImage(Images.length)
  }

  const fetchImages = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5020/api/images')
      const imageUrls: string[] = await response.json()
      const newImages = imageUrls.filter(newImageUrl => !Images.some(image => image.src === newImageUrl))
      
      if (newImages.length > 0) {
        newImages.forEach((newimage) => {
          addImage(100 + canvasState.scrollX, 100 + canvasState.scrollY, 100, 100, newimage, true)
        })
      }
    } 
    catch (error) {
      // console.error('Failed to fetch images', error)
    }
  }

  useEffect(() => {
    // fetchImages()
    const interval = setInterval(fetchImages, 2000) // 每2秒更新一次
    return () => clearInterval(interval)
  }, [Images])

  /**
   * 将新文本框的信息加入数组
   * @param x 文本框左上角横坐标
   * @param y 文本框左上角纵坐标
   * @param visible 文本框是否可见
   */
  const addTextBox = (x: number, y: number, abs_x: number, abs_y: number, visible: boolean) => {
    const newTextBox: TextBox = { x, y, abs_x, abs_y, text: '', visible}
    setTextBoxes([...textBoxes, newTextBox])
    setActiveBox(textBoxes.length)
  }

  /**
   * 点击画布添加文本框
   * @param e 鼠标事件
   */
  const handleCanvasClick = (e: React.MouseEvent) => {
    setActiveImage(null)
    setActiveBox(null)
    const rect = canvasRef.current?.getBoundingClientRect()
    if (rect && isTextMode) {
      const x = e.pageX - rect.left
      const y = e.pageY - rect.top
      addTextBox(x, y, x - canvasState.scrollX, y - canvasState.scrollY, true)
      chooseMode(true, false, false, false, false)
    }
  }

  const convertBreaksToNewlines = (html) => {
    return html
      .replace(/<br>/g, "\n")         // 将 <br> 转换为 \n
      .replace(/<\/div>/g, "")      // 将 </div> 结束标签转换为 \n
      .replace(/<div>/g, "\n")          // 移除 <div> 开始标签
  }

  /**
   * 文本框内容更新
   * @param e 
   */
  const handleTextChange = (e) => {
    // 使用 textContent 或 innerText 获取 div 中的文本
    const html = e.currentTarget.innerHTML
    const newText = convertBreaksToNewlines(html)
    
    console.log(newText)
    setTextBoxes(prevTextBoxes =>
      prevTextBoxes.map((box, index) =>
        index === activeBox ? { ...box, text: newText } : box
      )
    )
  }

  /**
   * 开始拖拽文本框
   * @param index 要拖拽的文本框的index
   * @param event 鼠标事件
   * @returns 
   */
  const startDrag = (index: number, event: React.PointerEvent<HTMLDivElement>) => {
    const textarea = event.currentTarget
    const { right, bottom } = textarea.getBoundingClientRect()

    // 检查鼠标点击是否在textarea的右下角
    const isResizing = 
      event.clientX >= right - resizeThreshold && 
      event.clientY >= bottom - resizeThreshold

    if (isResizing) {
      // 用户正在尝试调整大小，不开始拖拽
      return
    }
    setDragStart({
      x: event.clientX - textBoxes[index].x,
      y: event.clientY - textBoxes[index].y,
    })
    setActiveBox(index)
    setIsDragging(true)
    // event.preventDefault()
  }

  /**
   * 正在拖拽文本框
   * @param event 鼠标事件
   * @returns 
   */
  const onDrag = (event: React.PointerEvent) => {
    if (!isDragging || activeBox === null) return

    const newX = event.clientX - dragStart.x
    const newY = event.clientY - dragStart.y

    setTextBoxes(textBoxes.map((box, index) =>
      index === activeBox ? { ...box, x: newX, y: newY, abs_x: newX - canvasState.scrollX, abs_y: newY - canvasState.scrollY } : box
    ))
  }

  /**
   * 文本框拖拽结束
   */
  const endDrag = () => {
    setIsDragging(false)
  }

  const redraw = () => {
    if (!canvasRef.current) {
      return
    }
  
    const context = canvasRef.current.getContext('2d')
    if (context) {
      context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height) // 清除画布
      drawingSteps.forEach(step => {
        // 使用保存的绘制步骤重绘
        context.globalCompositeOperation = step.mode
        context.strokeStyle = step.mycolor
        context.lineWidth = step.width
        context.lineJoin = 'round'
        context.beginPath()
        context.moveTo(step.originalPointerPosition.x + canvasState.scrollX, step.originalPointerPosition.y + canvasState.scrollY)
        context.lineTo(step.newPointerPosition.x + canvasState.scrollX, step.newPointerPosition.y + canvasState.scrollY)
        context.stroke()
      })
    }
  }

  const update = (canvas) =>{
    // renderScene(canvas, canvasState)
    setImages(Images.map((image) => {
      return {
        ...image,
        x: image.abs_x + canvasState.scrollX,
        y: image.abs_y + canvasState.scrollY,
      }
    }))
    setTextBoxes(textBoxes.map((box) => {
      return {
        ...box,
        x: box.abs_x + canvasState.scrollX,
        y: box.abs_y + canvasState.scrollY,
      }
    }))
    redraw()
  }

  /**
   * 设置canvas尺寸以匹配其父元素
   */
  const setCanvasSize = () => {
    if (canvasRef.current && temporaryCanvasRef.current) {
      console.log("canvas")
      const { width, height } = canvasRef.current.getBoundingClientRect()
      canvasRef.current.width = width
      canvasRef.current.height = height
      temporaryCanvasRef.current.width = width
      temporaryCanvasRef.current.height = height
      update(canvasRef.current)
    }
  }

  /**
   * 动态设置canvas元素实际绘图表面大小
   */
  useEffect(() => {
    setCanvasSize()
    window.addEventListener('resize', setCanvasSize)

    return () => {
      window.removeEventListener('resize', setCanvasSize)
    }
  }, [])

  /**
   * 获取鼠标所在位置在画布区域的坐标
   * @param event 根据event获取鼠标在整个页面上的坐标
   * @returns 鼠标位置在画布区域的相对坐标
   */
  const getCoordinates = (event: PointerEvent, { scrollX, scrollY }): Coordinates | undefined => {
    if (!canvasRef.current) {
      return
    }
  
    const canvas = canvasRef.current.getBoundingClientRect()
    return {
      x: event.pageX - canvas.x - scrollX,
      y: event.pageY - canvas.y - scrollY
    }
  }

  /**
   * 鼠标点击画板，标记绘制或擦除开始
   * @param event PointerEvent
   */
  const startPaint = (event: PointerEvent): void => {
    setColorPickerVisible(false)
    const coordinates = getCoordinates(event, canvasState)
    if (coordinates && (isDrawing || isErasing)) {
      setPointerPosition(coordinates)
      setIsPainting(true)
    }
    event.preventDefault()
  }

  /**
   * 绘制或擦除过程的整体实现，调用drawLine函数在两点间画线
   * @param event PointerEvent
   */
  const paint = (event: PointerEvent): void => {
    event.preventDefault()
    event.stopPropagation()

    if (isPainting) {
      const newPointerPosition = getCoordinates(event, canvasState)
      if (PointerPosition && newPointerPosition) {
        drawLine(PointerPosition, newPointerPosition, strokeColor, strokeWidth)
        setPointerPosition(newPointerPosition)
      }
    }
  }

  /**
   * 鼠标松开或离开画布，结束绘制or擦除
   */
  const exitPaint = (): void => {
    setIsPainting(false)
    setPointerPosition(undefined)
  }

  /**
   * 设置颜色选择器可见
   */
  const showColorPicker = () => {
    setColorPickerVisible(true)
  }

  /**
   * 绘制的实际操作：画线
   * @param originalPointerPosition 起始点坐标
   * @param newPointerPosition 结束点坐标
   * @param color 线段颜色
   * @param width 线段粗细
   * @returns 
   */
  const drawLine = (
    originalPointerPosition: Coordinates,
    newPointerPosition: Coordinates,
    color: string,
    width: number
  ): void => {
    if (!canvasRef.current) {
      return
    }

    const context = canvasRef.current.getContext('2d')
    if (context) {
      let mode, mycolor
      if (isErasing) {
        mode = 'destination-out' // 设置为擦除模式
        mycolor = 'rgba(0,0,0,1)' // 颜色设置为完全不透明
      } else {
        mode = 'source-over' // 设置为正常绘图模式
        mycolor = color
      }
      context.globalCompositeOperation = mode
      context.strokeStyle = mycolor
      context.lineJoin = 'round'
      context.lineWidth = width // 线条宽度

      context.beginPath()
      context.moveTo(originalPointerPosition.x + canvasState.scrollX, originalPointerPosition.y + canvasState.scrollY)
      context.lineTo(newPointerPosition.x + canvasState.scrollX, newPointerPosition.y + canvasState.scrollY)
      context.closePath()

      context.stroke()
      drawingSteps.push({
        originalPointerPosition,
        newPointerPosition,
        mode,
        mycolor,
        width
      })
    }
  }

  /**
   * 擦除，宽度设置为30
   */
  const Erase = () => {
    setStrokeWidth(30)
    chooseMode(false, false, true, false, false)
  }

  /**
   * 绘制，默认颜色为黑色，宽度为2
   */
  const Draw = () => {
    setStrokeColor('black')
    setStrokeWidth(2)
    chooseMode(false, true, false, false, false)
  }

  /**
   * 设置默认状态
   */
  const setdefault = () => {
    chooseMode(true, false, false, false, false)
  }

  /**
   * 根据不同状态选择不同的光标样式
   * @returns 光标样式
   */
  const getCursor = () => {
    let cursor
    if(isDefault) cursor='default'
    else if(isDrawing) cursor=`url(${pencil}) 10 26, auto`
    else if(isErasing) cursor=`url(${eraser}) 10 10, auto`
    else if(isTextMode) cursor='text'
    return cursor
  }

  const handleImageClick = async (index: number) => {
    setActiveImage(index)
    setActiveBox(null)
    try {
      const sendData = { "src": Images[index].src }
      const response = await fetch('http://127.0.0.1:5020/active', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // 设置请求头为 JSON
        },
        body: JSON.stringify(sendData), // 将数据对象转换为 JSON 字符串并发送
      })

      if (!response.ok) {
        throw new Error('Transmit failed')
      }

      // 处理响应（根据需要）
      console.log('Transmit successfully')
    } catch (error) {
      console.error('Error transmitting image:', error)
    }
  }

  const handleTextClick = async (index: number) => {
    setActiveImage(null)
    setActiveBox(index)
    try {
      const sendData = { "text": textBoxes[index].text }
      const response = await fetch('http://127.0.0.1:5020/activeText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // 设置请求头为 JSON
        },
        body: JSON.stringify(sendData), // 将数据对象转换为 JSON 字符串并发送
      })

      if (!response.ok) {
        throw new Error('Transmit failed')
      }

      // 处理响应（根据需要）
      console.log('Transmit successfully')
    } catch (error) {
      console.error('Error transmitting image:', error)
    }
  }

  // 开始选择区域
  const startSelection = (event: PointerEvent): void => {
    console.log("startselection")
    const coordinates = getCoordinates(event, canvasState)
    console.log(coordinates)
    if (coordinates && isSelectMode) {
      setSelectionStart(coordinates)
      setIsSelecting(true)
    }
  }

  // 更新选择区域
  const updateSelection = (event: PointerEvent): void => {
    console.log("updateselection")
    if (!isSelecting || !selectionStart || !temporaryCanvasRef.current) return

    const newCoordinates = getCoordinates(event, canvasState)
    if (newCoordinates) {
      setSelectionEnd(newCoordinates)

      // 绘制选区矩形
      const ctx = temporaryCanvasRef.current.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, temporaryCanvasRef.current.width, temporaryCanvasRef.current.height) // 清除之前的绘制
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)' // 设置矩形边框颜色和透明度
        ctx.lineWidth = 1
        ctx.setLineDash([5, 5]) // 设置虚线样式
        ctx.strokeRect(
          Math.min(selectionStart.x, newCoordinates.x) + canvasState.scrollX, // 矩形的 x 坐标
          Math.min(selectionStart.y, newCoordinates.y) + canvasState.scrollY, // 矩形的 y 坐标
          Math.abs(newCoordinates.x - selectionStart.x), // 矩形的宽度
          Math.abs(newCoordinates.y - selectionStart.y)  // 矩形的高度
        )
      }
    }
  }

  // 完成选择区域
  const endSelection = (): void => {
    console.log("endselection")
    if(isSelecting) captureSelection()
    setIsSelecting(false)
    if (temporaryCanvasRef.current) {
      const ctx = temporaryCanvasRef.current.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, temporaryCanvasRef.current.width, temporaryCanvasRef.current.height) // 清除选区矩形
      }
    }
    setdefault()
  }

  const uploadImageDataUrl = async (dataUrl: string): Promise<void> => {
    try {
      const response = await fetch('http://127.0.0.1:5020/screenshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ image: dataUrl })
      })
  
      if (response.ok) {
        console.log('Image uploaded successfully')
      } else {
        console.error('Upload failed')
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const captureSelection = async () => {
    if (!selectionStart || !selectionEnd || !canvasContainerRef.current) return
  
    const x = Math.min(selectionStart.x, selectionEnd.x) + canvasState.scrollX
    const y = Math.min(selectionStart.y, selectionEnd.y) + canvasState.scrollY
    const width = Math.abs(selectionEnd.x - selectionStart.x)
    const height = Math.abs(selectionEnd.y - selectionStart.y)
  
    // 捕捉整个 canvasContainer 区域
    const screenshot = await html2canvas(canvasContainerRef.current, {
      x: x,
      y: y,
      width: width,
      height: height,
      useCORS: true // 如果图片涉及跨域，可能需要设置
    })
  
    // 处理截图结果
    const capturedImage = screenshot.toDataURL()
    // 可以保存 capturedImage，或者以其他方式处理
    uploadImageDataUrl(capturedImage)
  }

  const move = (originalPointerPosition: Coordinates, newPointerPosition: Coordinates) => {
    // console.log("x: "+(newPointerPosition.x - originalPointerPosition.x))
    // console.log("y: "+(newPointerPosition.y - originalPointerPosition.y))
    canvasState.scrollX = canvasState.scrollX + (newPointerPosition.x - originalPointerPosition.x)
    canvasState.scrollY = canvasState.scrollY + (newPointerPosition.y - originalPointerPosition.y)
    update(canvasRef.current)
  }

  useEffect(() => {
    const wrap = canvasContainerRef.current
    const handleWheel = (e) => {
      e.preventDefault()
    }
    // 防止双指滑动时切换页面
    if(wrap){
      wrap.addEventListener("wheel", handleWheel, {
        passive: false,
      })
      return () => {
        wrap.removeEventListener("wheel", handleWheel)
      }
    }
  }, [])

  const handlePointerDown = (e: React.PointerEvent) => {
    setActivePointers(new Map(activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY })))
    if (activePointers.size === 1) {
      // 开始单指绘画
      startPaint(e)
    } else if (activePointers.size === 2) {
      // 准备双指操作
      // const coordinates = getCoordinates(e, canvasState)
      // if (coordinates) {
      //   setPointerPosition(coordinates)
      // }
    }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (activePointers.has(e.pointerId)) {
      if (activePointers.size === 1) {
        // 单指绘画逻辑
        paint(e)
      } else if (activePointers.size === 2) {
        // 双指操作逻辑
        // const newPointerPosition = getCoordinates(e, canvasState)
        // if (PointerPosition && newPointerPosition) {
        //   move(PointerPosition, newPointerPosition)
        //   setPointerPosition(newPointerPosition)
        // }
      }
    }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    const newPointers = new Map(activePointers)
    newPointers.delete(e.pointerId)
    setActivePointers(newPointers)
    // 绘画或操作结束处理
    exitPaint()
  }

  const handleWheel = (event) => {
    const { deltaX, deltaY } = event
    canvasState.scrollX = canvasState.scrollX - deltaX
    canvasState.scrollY = canvasState.scrollY - deltaY
    update(canvasRef.current)
  }
  
  return (
    <div className={styles['graph']} ref={canvasContainerRef} onWheel={handleWheel}>
      <canvas
        ref={canvasRef}
        id='canvas'
        className={styles['canvas']}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onClick={handleCanvasClick}
        style={{cursor: getCursor()}}
      />
      <canvas
        ref={temporaryCanvasRef}
        className={styles['temporaryCanvas']}
        onPointerDown={startSelection}
        onPointerMove={updateSelection}
        onPointerUp={endSelection}
        onPointerLeave={endSelection}
      />
      {Images.map((image, index) => (
        <img
          key={index}
          className= {activeImage === index ? styles['activeimage'] : styles['noactiveimage']}
          style={{
            position: 'absolute',
            top: image.y,
            left: image.x,
            cursor: imageDragging ? "move" : "",
            maxWidth: '25%',
            maxHeight: '25%',
            display: image.visible? '' : 'none'
          }}
          src={image.src}
          onClick={() => {handleImageClick(index)}}
          onPointerDown={(e) => startDragImage(index, e)}
          onPointerUp={endDragImage}
          onPointerMove={onDragImage}
          onPointerLeave={endDragImage}
        />
      ))}
      {textBoxes.map((box, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            top: box.y,
            left: box.x,
            border: activeBox === index ? '1px dashed black' : 'none',
            textAlign: 'justify',
            resize: 'both',
            cursor: isDragging ? "move" : "",
            background: "none",
            display: box.visible? '' : 'none',
            touchAction: 'none',
            padding: 16,
            overflow: 'auto',  // 添加 overflow 属性
            minWidth: '100px',  // 设置最小宽度
            minHeight: '50px',  // 设置最小高度
          }}
          onBlur={(e) => {
            if(index === activeBox){
              handleTextChange(e)
              setActiveBox(null)
            }
          }}  // 处理文本更改
          contentEditable="true"
          onClick={() => {
            handleTextClick(index)
          }}
          onPointerDown={(e) => startDrag(index, e)}
          onPointerUp={endDrag}
          onPointerMove={onDrag}
          onPointerLeave={endDrag}
          dangerouslySetInnerHTML={{ __html: box.text.replace(/(\n|\r|\r\n)/g, '<br />') }}
        />
      ))}
      <Tools
        className={styles['toolsRight']}
        changeColor={showColorPicker}
        erase={Erase}
        draw={Draw}
        setdefault={setdefault}
      />
      {isButtonVisible && (
        <Button
          type="primary"
          danger
          shape="circle"
          icon={<Delete />}
          style={{ position:'absolute', top: 15, right: 20}}
          onClick={deleteTorI}
        />
      )}
    </div>
  )
}

export default Canvas
