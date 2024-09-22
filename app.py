from flask import Flask, request, jsonify
from flask_cors import CORS
from pydantic import BaseModel, Field
from openai import OpenAI
from dotenv import load_dotenv
import os
load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=api_key)

app = Flask(__name__)
CORS(app)

class Comment(BaseModel):
    anchor: str = Field(..., description="Must be verbatim and unique from the entire text")
    type: str = Field(..., description="Must be one of: 'REPLACE', 'ADD_BEFORE', 'ADD_AFTER', 'REMOVE', 'QUESTION'")
    text: str

class CommentList(BaseModel):
    comments: list[Comment]

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    messages = data.get('messages')

    for message in messages:
        if message.get('role') == 'assistant' and isinstance(message.get('content'), dict):
            message['content'] = str(message['content'])

    if not messages:
        return jsonify({"error": "Messages are required"}), 400

    completion = client.beta.chat.completions.parse(
        model="gpt-4o-mini",
        messages=messages,
        response_format=CommentList,
    )

    response = completion.choices[0].message
    if response.refusal:
        return jsonify({"refusal": response.refusal}), 200
    else:
        print(response.parsed.dict())
        return jsonify(response.parsed.dict()), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)