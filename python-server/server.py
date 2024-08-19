import asyncio
import tornado
import os
import sys
import chat
import json

class BaseHandler(tornado.web.RequestHandler):

    def set_default_headers(self):
        self.set_header("access-control-allow-origin", "*")
        self.set_header("Access-Control-Allow-Headers", "x-requested-with")
        self.set_header('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS')
        # HEADERS!
        self.set_header("Access-Control-Allow-Headers", "access-control-allow-origin,authorization,content-type") 

    def options(self):
        # no body
        self.set_status(204)
        self.finish()

class MainHandler(BaseHandler):
    def post(self):
        chatBot = chat.ChatBot()
        body = json.loads(self.request.body)
        # print(body)
        base64Img = body.get("base64Img")
        question = body.get("question")
        result =  chatBot.invoke(base64Img, question)
        self.write({'message': result.content})


def make_app():
    settings = {
        'debug':True,
        "static_path": os.path.join(os.path.dirname(__file__), "static"),
    }
    return tornado.web.Application([
        (r"/", MainHandler),
    ], **settings)

async def main():
    print("Starting Server")
    app = make_app()
    port = 8888
    app.listen(port)
    print(f"Listening on port {port}")
    await asyncio.Event().wait()

if __name__ == "__main__":
    print("Starting main")
    asyncio.run(main())
