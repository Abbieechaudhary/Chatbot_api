import pandas as pd
import re
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

file_path = 'Conversation.csv'
model_name = 'sentence-transformers_all-MiniLM-L6-v2'  # Use a valid model name

def preprocess_text(text):
    text = text.lower()
    text = re.sub(r'[^\w\s]', '', text)
    return text

def load_dataset_and_model():
    df = pd.read_csv(file_path)
    cleaned_questions = df['question'].apply(preprocess_text)
    model = SentenceTransformer(model_name)
    embeddings = model.encode(cleaned_questions.tolist())
    return df, embeddings

def get_embeddings(model, texts):
    return model.encode(texts)

SIMILARITY_THRESHOLD = 0.7
SUGGESTION_THRESHOLD = 0.5

def find_closest_question(user_input, df, embeddings):
    user_input_cleaned = preprocess_text(user_input)
    model = SentenceTransformer(model_name)
    user_input_embedding = get_embeddings(model, [user_input_cleaned])
    similarities = cosine_similarity(user_input_embedding, embeddings).flatten()

    similarity_results = pd.DataFrame({
        'question': df['question'],
        'answer': df['answer'],
        'similarity_score': similarities
    })

    sorted_results = similarity_results.sort_values(by='similarity_score', ascending=False)
    max_similarity_score = similarities.max()
    closest_question_idx = similarities.argmax()

    if max_similarity_score >= SIMILARITY_THRESHOLD:
        closest_question = df.iloc[closest_question_idx]['question']
        closest_answer = df.iloc[closest_question_idx]['answer']
        return closest_question, closest_answer
    elif max_similarity_score >= SUGGESTION_THRESHOLD:
        closest_question = df.iloc[closest_question_idx]['question']
        return closest_question, f"Did you mean: '{closest_question}'?"
    else:
        return None, None

def update_dataset(new_question, new_answer, df, embeddings):
    if new_question.strip() == '' or new_answer.strip() == '':
        return df, embeddings

    new_question_cleaned = preprocess_text(new_question)
    model = SentenceTransformer(model_name)
    new_embedding = get_embeddings(model, [new_question_cleaned])[0]
    new_row = pd.DataFrame({
        'question': [new_question],
        'answer': [new_answer]
    })
    updated_df = pd.concat([df, new_row], ignore_index=True)
    updated_embeddings = np.vstack([embeddings, new_embedding])

    updated_df.to_csv(file_path, index=False)
    return updated_df, updated_embeddings
