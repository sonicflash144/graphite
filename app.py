from flask import Flask, request, jsonify
from flask_cors import CORS
app = Flask(__name__)
CORS(app)

from pydantic import BaseModel, Field
from openai import OpenAI
#from dotenv import load_dotenv
import os

#load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=api_key)

class Comment(BaseModel):
    anchor: str = Field(..., description="Must be verbatim and unique from the entire text")
    type: str = Field(..., description="Must be one of: 'REPLACE', 'ADD_BEFORE', 'ADD_AFTER', 'REMOVE', 'QUESTION'")
    text: str

class Response(BaseModel):
    chat_text: str = Field(..., description="Conversational reply to the user's message, ex. 'Sure, I can help with that.'")
    comments: list[Comment]

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    messages = data.get('messages')
    for i, message in enumerate(messages):
        if message.get('role') == 'assistant':
            content = message.get('content', {})
            comments = content.get('comments', [])
            for comment in comments:
                if comment.get('type') == 'THREAD-STARTER':
                    messages[i] = {
                        'role': 'system',
                        'content': f"Focus your response on this part of the text: {comment.get('anchor')}"
                    }
                    break
    messages = [
        {**message, 'content': str(message['content'])} if message.get('role') == 'assistant' and isinstance(message.get('content'), dict) else message
        for message in messages
    ]
    print(messages)

    if not messages:
        return jsonify({"error": "Messages are required"}), 400

    completion = client.beta.chat.completions.parse(
        model="gpt-4o-2024-08-06",
        messages=messages,
        response_format=Response,
    )

    response = completion.choices[0].message
    if response.refusal:
        return jsonify({"refusal": response.refusal}), 200
    else:
        return jsonify(response.parsed.dict()), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))