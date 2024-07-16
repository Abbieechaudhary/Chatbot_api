let waitingForAnswer = false;
let originalQuestion = "";
let buttonWrapper="";
const textSpeeed=25;

function initializeChat() {
    const greeting = "Hey, how can I assist you?";
    typeText('chatbot-message',greeting,textSpeeed);
    document.getElementById('send-button').disabled = false;  // Enable button after greeting
    document.getElementById('user-input').disabled = false;  // Enable input after greeting
}

function handleSendButtonClick() {
    if (waitingForAnswer) {
        saveAnswer();
    } else {
        
        if(buttonWrapper){
            buttonWrapper.remove();
            buttonWrapper="";
        }
        sendMessage();
    }
}

function sendMessage() {
    const userInput = document.getElementById('user-input').value.trim();
    const sendButton = document.getElementById('send-button');
    const inputField = document.getElementById('user-input');

    if (userInput === '') return;

    appendMessage('user-message', userInput);
    showLoadingIndicator();

    // Disable input and button
    sendButton.disabled = true;
    inputField.disabled = true;

    // Simulate delay
    setTimeout(() => {
        fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user_input: userInput })
        })
        .then(response => response.json())
        .then(data => {
            hideLoadingIndicator();
            typeText('chatbot-message', data.chatbot_response, textSpeeed); // Typing speed: 50ms per character

            // Enable input and button after response is fully typed
            setTimeout(() => {
                sendButton.disabled = false;
                inputField.disabled = false;

                if (data.chatbot_response.includes("Would you like to provide one here?")) {
                    handleNoAnswer(userInput);
                } else if (data.suggested_question) {
                    handleSuggestion(data.suggested_question, userInput);
                }
            }, data.chatbot_response.length * textSpeeed + 500); // Delay based on typing speed and response length

        })
        .catch(error => {
            console.error('Error:', error);

            // Re-enable input and button on error
            sendButton.disabled = false;
            inputField.disabled = false;
        });
    }, 2000); // Delay for 2 seconds

    document.getElementById('user-input').value = '';
}

function showLoadingIndicator() {
    const chatHistory = document.getElementById('chat-history');
    const loadingElement = document.createElement('div');
    loadingElement.className = 'chatbot-message loading';
    loadingElement.id = 'loading-indicator';
    loadingElement.innerHTML = '<span></span><span></span><span></span>';
    chatHistory.appendChild(loadingElement);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function hideLoadingIndicator() {
    const loadingElement = document.getElementById('loading-indicator');
    if (loadingElement) {
        loadingElement.remove();
    }
}

function appendMessage(className, message) {
    const chatHistory = document.getElementById('chat-history');
    const messageElement = document.createElement('div');
    messageElement.className = `message-wrapper ${className}`;
    const messageText = document.createElement('div');
    messageText.className = className;
    messageText.textContent = message;
    messageElement.appendChild(messageText);
    chatHistory.appendChild(messageElement);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function typeText(className, message, typingSpeed) {
    const chatHistory = document.getElementById('chat-history');
    const messageElement = document.createElement('div');
    messageElement.className = `message-wrapper ${className}`;
    const messageText = document.createElement('div');
    messageText.className = className;
    messageElement.appendChild(messageText);
    chatHistory.appendChild(messageElement);

    let index = 0;
    function type() {
        if (index < message.length) {
            messageText.textContent += message[index];
            index++;
            chatHistory.scrollTop = chatHistory.scrollHeight; // Keep chat scrolled to the bottom
            setTimeout(type, typingSpeed);
        }
    }

    type();
}

function handleNoAnswer(originalInput) {
    // appendMessage('chatbot-message', "Sorry, I don't have an answer for that. Would you like to provide one here?");
    
    const chatHistory = document.getElementById('chat-history');
    buttonWrapper = document.createElement('div');
    buttonWrapper.className = 'button-wrapper';

    const yesButton = document.createElement('button');
    yesButton.id = 'yes-button';
    yesButton.innerText = 'Yes';
    yesButton.onclick = function() {
        appendMessage('user-message', "Yes");
        handleYes(originalInput);
    };

    const noButton = document.createElement('button');
    noButton.id = 'no-button';
    noButton.innerText = 'No';
    noButton.onclick = function() {
        appendMessage('user-message', "No");
        handleNo();
    };

    buttonWrapper.appendChild(yesButton);
    buttonWrapper.appendChild(noButton);
    chatHistory.appendChild(buttonWrapper);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function handleYes(originalInput) {
    document.getElementById('yes-button').remove();
    document.getElementById('no-button').remove();
    typeText('chatbot-message',"Please provide the answer for the question.", textSpeeed);

    waitingForAnswer = true;
    originalQuestion = originalInput;

    const sendButton = document.getElementById('send-button');
    sendButton.disabled = false;
    document.getElementById('user-input').disabled = false;
}

function handleNo() {
    document.getElementById('yes-button').remove();
    document.getElementById('no-button').remove();
    typeText('chatbot-message',"okay what else i can do ?", textSpeeed);
}

function saveAnswer() {
    const userAnswer = document.getElementById('user-input').value.trim();

    if (userAnswer !== '') {
        appendMessage('user-message', userAnswer);  // Append the answer as a user message

        fetch('/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user_input: originalQuestion, user_answer: userAnswer })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === "success") {
                typeText('chatbot-message',"Thank you! The new question and answer have been saved.", textSpeeed);
            }
        })
        .catch(error => console.error('Error:', error));

        waitingForAnswer = false;
        originalQuestion = "";

        const sendButton = document.getElementById('send-button');
        sendButton.disabled = false;
        document.getElementById('user-input').disabled = false;
    }

    document.getElementById('user-input').value = '';
}

function handleSuggestion(suggestedQuestion, originalInput) {

    const chatHistory = document.getElementById('chat-history');
    buttonWrapper = document.createElement('div');
    buttonWrapper.className = 'button-wrapper';

    const yesButton = document.createElement('button');
    yesButton.id = 'yes-button';
    yesButton.innerText = 'Yes';
    yesButton.onclick = function() {
        appendMessage('user-message', "Yes");
        fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user_input: suggestedQuestion })
        })
        .then(response => response.json())
        .then(data => {
            typeText('chatbot-message', data.chatbot_response, textSpeeed); // Typing speed: 50ms per character
        })
        .catch(error => console.error('Error:', error));
        
        buttonWrapper.remove();  // Remove buttons after selection
    };

    const noButton = document.createElement('button');
    noButton.id = 'no-button';
    noButton.innerText = 'No';
    noButton.onclick = function() {
        appendMessage('user-message', "No");
        buttonWrapper.remove();  // Remove buttons after selection
        typeText('chatbot-message',"okay what else i can do ?", textSpeeed);
    };

    const provideAnswerButton = document.createElement('button');
    provideAnswerButton.id = 'provide-answer-button';
    provideAnswerButton.innerText = 'Provide Answer';
    provideAnswerButton.onclick = function() {
        appendMessage('user-message', "Provide Answer");
        waitingForAnswer = true;
        originalQuestion = originalInput;
        typeText('chatbot-message',"Please provide the answer for the question.", textSpeeed);
        buttonWrapper.remove();  // Remove buttons after selection
    };

    buttonWrapper.appendChild(yesButton);
    buttonWrapper.appendChild(noButton);
    buttonWrapper.appendChild(provideAnswerButton);
    chatHistory.appendChild(buttonWrapper);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

window.onload = initializeChat;
