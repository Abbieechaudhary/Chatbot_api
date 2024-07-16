from flask import Blueprint, request, jsonify, render_template
from app.services.chatbot_service import (
    find_closest_question,
    update_dataset,
    load_dataset_and_model
)

chatbot_bp = Blueprint('chatbot', __name__)

# Load dataset and embeddings once
df, embeddings = load_dataset_and_model()

@chatbot_bp.route('/')
def home():
    return render_template('index.html')

@chatbot_bp.route('/chat', methods=['POST'])
def chat():
    global df, embeddings
    user_input = request.json.get('user_input', '').strip()

    if user_input.lower() == 'exit':
        return jsonify(chatbot_response="Goodbye!")

    if user_input == '':
        return jsonify(chatbot_response="Please enter a valid question.")

    matched_question, answer = find_closest_question(user_input, df, embeddings)

    if answer is None:
        return jsonify(chatbot_response=f"Sorry, I don't have an answer for that. Would you like to provide one here?")
    elif "Did you mean" in answer:
        return jsonify(chatbot_response=answer, suggested_question=matched_question)

    return jsonify(chatbot_response=answer)

@chatbot_bp.route('/add', methods=['POST'])
def add():
    global df, embeddings
    user_input = request.json.get('user_input', '')
    user_answer = request.json.get('user_answer', '').strip()

    if user_input == '' or user_answer == '':
        return jsonify(status="error", message="Both question and answer must be provided.")

    df, embeddings = update_dataset(user_input, user_answer, df, embeddings)
    return jsonify(status="success", message="New question and answer added to the dataset.")
