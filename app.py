from flask import Flask, render_template, request, redirect, url_for, session, jsonify
import os
import pickle

app = Flask(__name__)
app.secret_key = 'your_secret_key'  # Change this in production

# Load ML model and vectorizer
MODEL_PATH = os.path.join('models', 'spam_classifier.pkl')
VECTORIZER_PATH = os.path.join('models', 'vectorizer.pkl')
with open(MODEL_PATH, 'rb') as f:
    model = pickle.load(f)
with open(VECTORIZER_PATH, 'rb') as f:
    vectorizer = pickle.load(f)

# In-memory user store (for demo)
users = {'test@example.com': 'password123'}

@app.route('/', methods=['GET', 'POST'])
def login():
    error = None
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        if email in users and users[email] == password:
            session['user'] = email
            return redirect(url_for('detector'))
        else:
            error = 'Invalid credentials'
    return render_template('index.html', error=error)

@app.route('/register', methods=['GET', 'POST'])
def register():
    error = None
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        confirm_password = request.form['confirm_password']
        if email in users:
            error = 'Email already registered'
        elif password != confirm_password:
            error = 'Passwords do not match'
        else:
            users[email] = password
            return redirect(url_for('login'))
    return render_template('register.html', error=error)

@app.route('/detector', methods=['GET'])
def detector():
    if 'user' not in session:
        return redirect(url_for('login'))
    return render_template('detector.html')

@app.route('/predict', methods=['POST'])
def predict():
    if 'user' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    data = request.get_json()
    email_content = data.get('email_content', '')
    if not email_content:
        return jsonify({'error': 'No email content provided'}), 400
    X = vectorizer.transform([email_content])
    pred = model.predict(X)[0]
    prob = model.predict_proba(X)[0]
    result = 'Spam' if pred == 1 else 'Ham'
    return jsonify({
        'result': result,
        'spam_probability': float(prob[1]),
        'ham_probability': float(prob[0])
    })

@app.route('/logout', methods=['GET'])
def logout():
    session.pop('user', None)
    return redirect(url_for('login'))

if __name__ == '__main__':
    app.run(debug=True) 