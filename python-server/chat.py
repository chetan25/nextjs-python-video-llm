
import os 
import base64
from dotenv import load_dotenv
load_dotenv()

from langchain.prompts import MessagesPlaceholder, ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage

import requests
import graph_agent

prompt = """
You are an expert analyzing Images.
You receive a tiled series of screenshots from a user's live video feed.
These screenshots represent sequential frames from the video, capturing distinct moments.
Your job is to analyze these frames as a continuous video feed, answer user's questions while
focusing on direct and specific interpretations of the visual content.

1. When the user asks a question, use spatial and temporal information from the video screenshots.
2. Respond with brief, precise answers to the user questions. Go straight to the point, avoid superficial details. Be concise as much as possible.
3. Address the user directly, and assume that what is shown in the images is what the user is doing.
4. Use "you" and "your" to refer to the user.
5. DO NOT mention a series of individual images, a strip, a grid, a pattern or a sequence. Do as if the user and the assistant were both seeing the video.
6. DO NOT be over descriptive.
7. Assistant will not interact with what is shown in the images. It is the user that is interacting with the objects in the images.
7. Keep in mind that the grid of images will show the same object in a sequence of time. E.g. If an identical glass is shown in several consecutive images, it is the same glass and NOT multiple glasses.
8. When asked about spatial questions, provide clear and specific information regarding the location and arrangement of elements within the frames. This includes understanding and describing the relative positions, distances, and orientations of objects and people in the visual field, as if observing a real-time 3D space.
9. If the user gives instructions, follow them precisely.
"""  

default_question = "Determine who is in the images, a Man or a lady and what is the user doing and what is the background details"

class ChatBot:
   def __init__(self):
      print("Initializing chat bot")
      self.chain = graph_agent.create_graph()


   def get_local_img_as_base64(self, url):
      with open(url, "rb") as f:
        return  base64.b64encode(f.read()).decode('utf-8')
        # return base64.b64encode(requests.get(url).content)

   def get_hosted_img_as_base64(self, url):
        return base64.b64encode(requests.get(url).content).decode('utf-8')     
   
   def invoke(self, base64Img, question = default_question):
      print("Invoking LLM")
      #   {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64Img }"}}],
      result = self.chain.invoke([
        SystemMessage(
            content=prompt,
        ), 
        HumanMessage(
         content= [
            {"type": "text", "text": question},
           ],
        ),
        HumanMessage(
         content= [
            {"type": "image_url", "image_url": {"url": base64Img }}
           ],
        )
      ])
   
      ai_response = result[-1]
      print(ai_response, "result form LLM")
      return ai_response
