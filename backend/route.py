from flask import Flask, request, jsonify, send_from_directory
import config
from agent import gpt as gptAgent
import asyncio
from flask_cors import CORS
import os
import logging
import base64
import json

app = Flask(__name__)
gpt = gptAgent.GPTInstancePool(10)
CORS(app, origins="*")

# 设置日志级别为警告，这将隐藏正常的访问日志
log = logging.getLogger('werkzeug')
log.setLevel(logging.WARNING)

# images_dir = './images'  # 替换为您的图片文件夹路径
root_dir = os.path.dirname(__file__)
work_path = os.path.join(root_dir, 'user_data')
active_image = ''
active_text = ''
id = 0
# f_path = os.path.join(user_dir, 'workpath.json')
# with open(f_path, 'r') as file:
#     work_path = json.load(file)

def set_active_image(src):
    global active_image 
    active_image = src
    print("Set active image: " + active_image)

@app.route('/active', methods=['POST'])
def active():
    data = request.get_json()
    src = data.get('src', '')
    set_active_image(src)
    return 'Set successfully', 200

@app.route('/activeText', methods=['POST'])
def activeText():
    data = request.get_json()
    txt = data.get('text', '')
    global active_text 
    active_text = txt
    # print("Set active text: " + active_text)
    return 'Set successfully', 200
    
@app.route('/images/<filename>')
def serve_image(filename):
    images_dir = os.path.join(work_path, 'images')
    return send_from_directory(images_dir, filename)

@app.route('/api/images')
def list_images():
    images_dir = os.path.join(work_path, 'images')
    files = os.listdir(images_dir)
    image_files = [f for f in files if f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif'))]
    image_urls = ['http://127.0.0.1:5020/images/' + filename for filename in image_files]
    return jsonify(image_urls)

@app.route('/upload', methods=['POST'])
def upload_image():
    file = request.files['image']
    if file:
        filename = file.filename
        images_dir = os.path.join(work_path, 'images')
        save_path = os.path.join(images_dir, filename)
        file.save(save_path)
        return 'Image uploaded successfully', 200
    else:
        return 'No file found', 400
    
@app.route('/screenshot', methods=['POST'])
def screenshot():
    data = request.json
    image_data = data['image']
    header, encoded = image_data.split(",", 1)
    file_extension = header.split(';')[0].split('/')[1]
    
    file_data = base64.b64decode(encoded)
    images_dir = os.path.join(work_path, 'screenshot')
                
    # 计算目录中现有的文件数
    file_count = len([name for name in os.listdir(images_dir) if os.path.isfile(os.path.join(images_dir, name))])

    # 生成新的文件名（例如：'img3.jpg'）
    new_file_name = f'img{file_count}.{file_extension}'
    file_path = os.path.join(images_dir, new_file_name)
    
    with open(file_path, 'wb') as file:
        file.write(file_data)
    
    set_active_image(file_path)
    return jsonify({'message': 'Image uploaded successfully'})

@app.route('/ask', methods=['POST'])
def ask():
    global id
    id = id+1
    # 使用 request.get_json() 获取 JSON 数据
    data = request.get_json()
    input_mode = data.get('mode', '')
    # 从 JSON 数据中获取 prompt 字段的值
    prompt = data.get('prompt', '')  # 如果 prompt 字段不存在，默认为空字符串
    print("\nMessage "+str(id)+": ")
    print(prompt)
    isreply = input("Need to reply message "+str(id)+"? ")
    if isreply == 'y':
        return jsonify({"text": "needReply"})
    else:
        return jsonify({"text": "noReply"})

@app.route('/chat', methods=['POST'])
def chat():
    # global id
    # id = id+1
    # 使用 request.get_json() 获取 JSON 数据
    data = request.get_json()
    input_mode = data.get('mode', '')
    # 从 JSON 数据中获取 prompt 字段的值
    prompt = data.get('prompt', '')  # 如果 prompt 字段不存在，默认为空字符串
    print("\nMessage "+str(id)+": ")
    print(prompt)
    # isreply = input("Need to reply message "+str(id)+"? ")
    # if isreply == 'y':
    isrewrite = input("Rewrite the prompt? ")
    if isrewrite == 'y':
        prompt = input("Final Prompt: ")
    
    prompt += "，以对话的语气，回答3个要点即可，不做过多解释，字数不超过100字"
        
    mode = input("Choose a mode: ")
    if mode == '1':
        # 纯文本问答
        result = asyncio.run(gpt.chat(prompt))
        return jsonify(result)
    elif mode == '2':
        # 文生图
        result = asyncio.run(gpt.text2Image(work_path, prompt))
        return jsonify(result)
    elif mode == '3':
        # 确认图片路径
        change_img = input("Change the active image? ")
        if change_img == 'y':
            img_name = input("Active image: ")
            set_active_image(f'http://127.0.0.1:5020/images/{img_name}')
        # 询问图片
        print("Mode 3 use img: " + active_image)
        result = asyncio.run(gpt.ask_image(work_path, prompt, active_image))
        return jsonify(result)
    elif mode == '4':
        prompt = active_text + prompt
        result = asyncio.run(gpt.chat(prompt))
        return jsonify(result)
    elif mode == '5':
        prompt = active_text + prompt
        result = asyncio.run(gpt.text2Image(work_path, prompt))
        return jsonify(result)
    elif mode == '6':
        # for test, send msg directly
        response = input("Give your response: ")
        result = {"text": response}
        return jsonify(result)
    else:
        return jsonify({"text": "noReply"})
    # else:
    #     return jsonify({"text": "noReply"})

@app.route('/giveinfo', methods=['POST'])
def giveinfo():
    # 使用 request.get_json() 获取 JSON 数据
    data = request.get_json()
    # 从 JSON 数据中获取 prompt 字段的值
    prompt = data.get('prompt', '')  # 如果 prompt 字段不存在，默认为空字符串
    print("\nMessage "+str(id)+": ")
    print(prompt)
    response = input("Give your response: ")
    result = {"text": response}
    return jsonify(result)

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    api = data.get('api', '')
    config.OPENAI_KEY = api
    global work_path

    # 检查目录是否存在
    if not os.path.exists(work_path):
        # 创建目录
        os.makedirs(work_path)
        
        os.makedirs(os.path.join(work_path, 'images'))
        os.makedirs(os.path.join(work_path, 'compressed_images'))
        os.makedirs(os.path.join(work_path, 'screenshot'))
                
    return jsonify({"text": "login"})
    
@app.route('/api/saveTextBoxes', methods=['POST'])
def save_text_boxes():
    print("saveText")
    data = request.json
    file_path = os.path.join(work_path, 'textboxes.json')
    with open(file_path, 'w') as file:
        json.dump(data, file)
    return jsonify({"message": "Data saved successfully"}), 200

@app.route('/api/getTextBoxes', methods=['GET'])
def get_text_boxes():
    print("getText")
    try:
        file_path = os.path.join(work_path, 'textboxes.json')
        with open(file_path, 'r') as file:
            data = json.load(file)
        return jsonify(data), 200
    except FileNotFoundError:
        # 文件不存在时返回空列表
        return jsonify([]), 200
    
@app.route('/api/saveImages', methods=['POST'])
def save_images():
    print("saveImage")
    data = request.json
    file_path = os.path.join(work_path, 'images.json')
    with open(file_path, 'w') as file:
        json.dump(data, file)
    return jsonify({"message": "Data saved successfully"}), 200

@app.route('/api/getImages', methods=['GET'])
def get_images():
    print("getImage")
    try:
        file_path = os.path.join(work_path, 'images.json')
        with open(file_path, 'r') as file:
            data = json.load(file)
        return jsonify(data), 200
    except FileNotFoundError:
        # 文件不存在时返回空列表
        return jsonify([]), 200

@app.route('/api/saveLines', methods=['POST'])
def save_lines():
    print("saveLines")
    data = request.json
    file_path = os.path.join(work_path, 'lines.json')
    with open(file_path, 'w') as file:
        json.dump(data, file)
    return jsonify({"message": "Data saved successfully"}), 200

@app.route('/api/getLines', methods=['GET'])
def get_lines():
    print("getLines")
    try:
        file_path = os.path.join(work_path, 'lines.json')
        with open(file_path, 'r') as file:
            data = json.load(file)
        return jsonify(data), 200
    except FileNotFoundError:
        # 文件不存在时返回空列表
        return jsonify([]), 200

@app.route('/api/saveMessages', methods=['POST'])
def save_msg():
    print("saveMsg")
    data = request.json
    file_path = os.path.join(work_path, 'msg.json')
    with open(file_path, 'w') as file:
        json.dump(data, file)
    return jsonify({"message": "Data saved successfully"}), 200

@app.route('/api/getMessages', methods=['GET'])
def get_msg():
    print("getMsg")
    try:
        file_path = os.path.join(work_path, 'msg.json')
        with open(file_path, 'r') as file:
            data = json.load(file)
        return jsonify(data), 200
    except FileNotFoundError:
        # 文件不存在时返回空列表
        return jsonify([]), 200
    
@app.route('/api/saveOffset', methods=['POST'])
def save_offset():
    print("saveOffset")
    data = request.json
    file_path = os.path.join(work_path, 'offset.json')
    with open(file_path, 'w') as file:
        json.dump(data, file)
    return jsonify({"message": "Data saved successfully"}), 200

@app.route('/api/getOffset', methods=['GET'])
def get_offset():
    print("getOffset")
    try:
        file_path = os.path.join(work_path, 'offset.json')
        with open(file_path, 'r') as file:
            data = json.load(file)
        return jsonify(data), 200
    except FileNotFoundError:
        # 文件不存在时返回空列表
        return jsonify({"scrollX": 0, "scrollY": 0 }), 200    

if __name__ == '__main__':
    app.run(debug=True,host='0.0.0.0', port=5020)
