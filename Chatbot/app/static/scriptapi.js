let waitingForAnswer = false;
let originalQuestion = "";
let buttonWrapper="";
const textSpeeed=25;

function disableInputButton(condition){
    document.getElementById('send-button').disabled = condition;  // Enable button after greeting
    document.getElementById('user-input').disabled = condition;  // Enable input after greeting

}

function initializeChat() {
    console.log("External Connected Apis Scripts running !")
    const greeting = "Hey, how can I assist you?";
    typeText('chatbot-message',greeting,textSpeeed);
    disableInputButton(false);
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

    if (userInput === '') return;

    appendMessage('user-message', userInput);
    showLoadingIndicator();

    // Disable input and button
    disableInputButton(true);

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

            if (data.chatbot_response === "allDetails") {
                fetchEmployeeDetails().finally(() => {
                     // Enable input and button
                    disableInputButton(false);
                });
            } else {
                typeText('chatbot-message', data.chatbot_response, 50); // Typing speed: 50ms per character

                // Enable input and button after response is fully typed
                setTimeout(() => {
                    disableInputButton(false);

                    if (data.chatbot_response.includes("Would you like to provide one here?")) {
                        handleNoAnswer(userInput);
                    } else if (data.suggested_question) {
                        handleSuggestion(data.suggested_question, userInput);
                    }
                }, data.chatbot_response.length * 50 + 500); // Delay based on typing speed and response length
            }
        })
        .catch(error => {
            console.error('Error:', error);

            // Re-enable input and button on error
            disableInputButton(false);
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
    disableInputButton(true);
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
        }else{
            disableInputButton(false);
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

}

function handleNo() {
    document.getElementById('yes-button').remove();
    document.getElementById('no-button').remove();
    typeText('chatbot-message',"okay what else i can do ?", textSpeeed);
}

function saveAnswer() {
    const userAnswer = document.getElementById('user-input').value.trim();

    if (userAnswer !== '') {
        disableInputButton(true);
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
        disableInputButton(false);
        waitingForAnswer = false;
        originalQuestion = "";
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


// Api to get all details of employees

// function typeHtml(className, html, typingSpeed) {
//     disableInputButton(true);
//     const chatHistory = document.getElementById('chat-history');
//     const messageElement = document.createElement('div');
//     messageElement.className = `message-wrapper ${className}`;
//     const messageText = document.createElement('div');
//     messageText.className = className;
//     messageElement.appendChild(messageText);
//     chatHistory.appendChild(messageElement);

//     let index = 0;
//     function type() {
//         if (index < html.length) {
//             messageText.innerHTML += html[index];
//             index++;
//             chatHistory.scrollTop = chatHistory.scrollHeight; // Keep chat scrolled to the bottom
//             setTimeout(type, typingSpeed);
//         }
//     }

//     type();
// }


function fetchEmployeeDetails() {
    disableInputButton(true);
    return fetch('https://dummy.restapiexample.com/api/v1/employees') 
        .then(response => response.json())
        .then(employeeData => {
            const employeeTable = createEmployeeTable(employeeData.data);
            appendHtml('chatbot-message', employeeTable);
        })
        .catch(error => {
            console.error('Error:', error);
            typeText('chatbot-message', 'Sorry, there was an error fetching employee details.', textSpeeed);
        });
}


function createEmployeeTable(employeeData) {
    let table = '<table><tr><th>ID</th><th>Name</th><th>Salary</th><th>Age</th></tr>';
    employeeData.forEach(employee => {
        table += `<tr>
                    <td>${employee.id}</td>
                    <td>${employee.employee_name}</td>
                    <td>${employee.employee_salary}</td>
                    <td>${employee.employee_age}</td>
                  </tr>`;
    });
    table += '</table>';
    return table;
}

function appendHtml(className, html) {
    const chatHistory = document.getElementById('chat-history');
    const messageElement = document.createElement('div');
    messageElement.className = `message-wrapper ${className}`;
    const messageText = document.createElement('div');
    messageText.className = className;
    messageText.innerHTML = html;
    messageElement.appendChild(messageText);
    chatHistory.appendChild(messageElement);
    chatHistory.scrollTop = chatHistory.scrollHeight; 
}

window.onload = initializeChat;
