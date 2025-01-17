import openai
import asyncio
from asyncio import Semaphore, Queue
import config
import requests
import os
import base64
from PIL import Image
import json

                            
openai.api_key = config.OPENAI_KEY  

class GPTInstance:
    def __init__(self):
        pass
        
class GPTInstancePool:
    def __init__(self, instance_num):
        self.gpt_instances = asyncio.Queue()
        for _ in range(instance_num):
            self.gpt_instances.put_nowait(GPTInstance())
        self.semaphore = asyncio.Semaphore(instance_num)
        self.initial = {"role": "system", "content": "你是一名经验丰富的设计师，你正在与另一名产品设计师写作设计产品。在协作过程中，你和设计师会不断对话，你的回复需要满足以下要求：1）回复简洁，不要太长，避免过于书面的表达；2）回答关键信息即可，无需给出设计师没有询问的信息，例如定义、背景信息等；3）使用亲和的语气，保持礼貌，不要太生硬；"}
        self.history = []
    
    def setInitial(self, prompt):
        self.initial = {"role": "system", "content": prompt}
        return {
            "text": "好的"
        }

    async def chat(self, prompt):
        async with self.semaphore:
            gpt_instance = await self.gpt_instances.get()
        try:
            client = openai.AsyncOpenAI(
                api_key=config.OPENAI_KEY,
                base_url=config.OPENAI_BASE_URL
            )
            if len(self.history) > 10:
                # 删除最前面的两个元素
                self.history = self.history[2:]
            msg = {"role": "user", "content": [{"type": "text", "text": prompt}]}
            self.history.append(msg)
            # print(self.history)
            response = await client.chat.completions.create(
                model="gpt-4o",
                messages=[self.initial]+self.history,
                temperature=0,
                max_tokens=600,
            )
            # 获取第一个 choice（通常情况下，聊天接口只返回一个 choice）
            first_choice = response.choices[0]

            # 获取 message 对象
            message = first_choice.message

            # 提取回复内容
            response_content = message.content
            self.history.append({"role": "assistant", "content": response_content})

            # 清理和格式化回复内容
            print()
            print("Response:")
            print(response_content)
            # response_content = response_content.replace('\n', ' ').replace(' .', '.').strip()

            # 返回处理后的回复内容
            return {
                "text": response_content
            }
        except Exception as e:
            print(f"Error: 调用GPT生成文本失败，{str(e)}")
            return {
                "text": ""
            }
        finally:
            await self.gpt_instances.put(gpt_instance)   

    async def text2Image(self, work_path, prompt):
        async with self.semaphore:
            gpt_instance = await self.gpt_instances.get()
        try:
            client = openai.AsyncOpenAI(
                api_key=config.OPENAI_KEY,
                base_url=config.OPENAI_BASE_URL
            )
            response = await client.images.generate(
                model="dall-e-3",
                prompt=prompt,
                size="1024x1024",
                quality="standard",
                n=1,
            )
            r = response.data[0].url
            # 使用requests下载图片内容
            print(r)
            response = requests.get(r)

            # 确保请求成功
            if response.status_code == 200:
                # 指定要保存图片的目录和文件名
                # 例如，保存到当前目录下的 'downloaded_image.jpg'
                # 获取 gpt.py 文件所在的目录
                # current_dir = os.path.dirname(__file__)

                # 构建从当前目录到 images 目录的相对路径
                images_dir = os.path.join(work_path, 'images')
                
                # 计算目录中现有的文件数
                file_count = len([name for name in os.listdir(images_dir) if os.path.isfile(os.path.join(images_dir, name))])

                # 生成新的文件名（例如：'img3.jpg'）
                new_file_name = f'img{file_count}.jpg'
                save_path = os.path.join(images_dir, new_file_name)

                # 写入图片数据到文件
                with open(save_path, 'wb') as file:
                    file.write(response.content)

                print(f"Image saved to {save_path}")
                return {
                    "text": "图片生成成功！"
                }
            else:
                print("Failed to download the image")
                return {
                    "text": ""
                }
        except Exception as e:
            print(f"Error: 调用GPT文生图失败，{str(e)}")
            return {
                "text": ""
            }
        finally:
            await self.gpt_instances.put(gpt_instance)     
    
    def compress_image_by_size(self, input_image_path, output_image_path, size):
        with Image.open(input_image_path) as img:
            img.thumbnail(size)
            img.save(output_image_path)
    
    async def ask_image(self, work_path, prompt, active_img):
        async with self.semaphore:
            gpt_instance = await self.gpt_instances.get()
        try:
            print("ask image: ")
            print(prompt)
            # print(base64_image) # base64_image 是 B64编码
        
            client = openai.AsyncOpenAI(
                api_key=config.OPENAI_KEY,
                base_url=config.OPENAI_BASE_URL
            )
            
            # 构建从当前目录到 images 目录的相对路径
            images_dir = os.path.join(work_path, 'images')
            active_img = active_img.replace("http://127.0.0.1:5020/images", images_dir)
            upload_img = active_img.replace("images", "compressed_images")
            self.compress_image_by_size(active_img, upload_img, (512, 512))
            # print(upload_img)
            with open(upload_img,'rb') as f:
                base64_image = base64.b64encode(f.read()).decode('utf-8')
            
            msg = {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": prompt,
                        },
                        {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{base64_image}"
                        }
                        }]
                    }
            response = await client.chat.completions.create(
                model="gpt-4o",
                messages=[self.initial]+self.history+[msg],
                max_tokens=600,
            )
            
            if len(self.history) > 10:
                # 删除最前面的两个元素
                self.history = self.history[2:]

            textmsg = {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": prompt,
                        },
                        ]
                    }
            self.history.append(textmsg)
            
            # 获取第一个 choice（通常情况下，聊天接口只返回一个 choice）
            first_choice = response.choices[0]

            # 获取 message 对象
            message = first_choice.message

            # 提取回复内容
            response_content = message.content
            self.history.append({"role": "assistant", "content": response_content})

            # 清理和格式化回复内容
            response_content = response_content.replace('\n', ' ').replace(' .', '.').strip()
            
            print()
            print("Response:")
            print(response_content)

            # 返回处理后的回复内容
            return {
                "text": response_content
            }
        except Exception as e:
            print(f"Error: 调用GPT图片提问失败，{str(e)}")
            return {
                "text": ""
            }
        finally:
            await self.gpt_instances.put(gpt_instance)
    
    async def text_image(self, work_path, prompt, active_img):
        async with self.semaphore:
            gpt_instance = await self.gpt_instances.get()
        try:
            print("text with image: ")
            print(prompt)
            # print(base64_image) # base64_image 是 B64编码
        
            client = openai.AsyncOpenAI(
                api_key=config.OPENAI_KEY,
                base_url=config.OPENAI_BASE_URL
            )
            
            # 构建从当前目录到 images 目录的相对路径
            images_dir = os.path.join(work_path, 'images')
            active_img = active_img.replace("http://127.0.0.1:5020/images", images_dir)
            upload_img = active_img.replace("images", "compressed_images")
            self.compress_image_by_size(active_img, upload_img, (512, 512))
            # print(upload_img)
            with open(upload_img,'rb') as f:
                base64_image = base64.b64encode(f.read()).decode('utf-8')
                
            action_decision = (
                '''
                你是一名AI设计师，你要与人类设计师协作完成设计任务，在这个过程中你负责决策另一个AI设计师的行为。
                现在人类设计师在与你对话，并向你提出了问题。请你综合所给信息分析人类设计师现在的设计状态以及遇到的设计问题，并选择生成文本还是图片对人类设计师进行反馈。
                1. 生成文本设计建议；2. 生成图片，辅助设计师思考。
                请你以json格式输出，分为三个字段，一个字段为“type”，值为所选行为的序号，有且仅有一个数字；第二个字段为“analysis”，字符串格式，包括对设计师设计状态和面临设计问题的分析，不超过50个字；
                第三个字段为“prompt”，字符串格式，在prompt字段里不需要回答设计师的问题，也不需要执行所选择的生成任务，仅需针对选择的行为设计提示词，以指导另一个界面设计师执行选择的生成任务。
                “prompt”字段的内容可以采用祈使句，如“生成xxx”或者“请你提供xxx”等格式，表述简洁明了，不超过30字。
                '''
            )
            
            msg = {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": prompt,
                        },
                        {
                            "type": "text",
                            "text": action_decision,
                        },
                        {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{base64_image}"
                        }
                        }]
                    }
            response = await client.chat.completions.create(
                model="gpt-4o",
                response_format={ "type": "json_object" },
                messages=[self.initial]+self.history+[msg],
                max_tokens=600,
            )
            
            first_choice = response.choices[0]
            message = first_choice.message
            response_content = message.content
            
            print()
            print("Response:")
            print(response_content)
            
            behaviour = json.loads(response_content)
            if(behaviour["type"] == 1):
                result = self.ask_image(work_path, prompt, active_img)
                return result
            else:
                new_prompt = behaviour["analysis"]+behaviour["prompt"]
                result = self.text2Image(self, work_path, new_prompt)
                return result
        except Exception as e:
            print(f"Error: 调用GPT图片提问失败，{str(e)}")
            return {
                "text": ""
            }
        finally:
            await self.gpt_instances.put(gpt_instance)
