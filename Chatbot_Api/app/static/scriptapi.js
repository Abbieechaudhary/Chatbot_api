//Global variables--------------------------------------------------------------
let waitingForAnswer = false;
let originalQuestion = "";
let buttonWrapper="";
const textSpeeed=25;
//*******************************************************************************



//All apis-----------------------------------------------------------------------
const apiMapping = {
    "allDetails": "https://dummy.restapiexample.com/api/v1/employees",
    "getbyid": "https://dummy.restapiexample.com/api/v1/employee/1"
};
//*******************************************************************************



//on window load intialize the chat---------------------------------------------
window.onload = initializeChat;
//*******************************************************************************



//Initialize the chat in chatbot
function initializeChat() {
    console.log("External Connected Apis Scripts running !")
    const greeting = "Hey, how can I assist you?";
    typeText('chatbot-message',greeting,textSpeeed);
    disableInputButton(false);
   }
//*******************************************************************************



//Append message in chatbot------------------------------------------------------
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
//*******************************************************************************



//Append html content in chatbot-------------------------------------------------
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
//*******************************************************************************



//Disable the input button and input text area of chatbot------------------------
function disableInputButton(condition){
    document.getElementById('send-button').disabled = condition;
    document.getElementById('user-input').disabled = condition;

}
//*******************************************************************************



//Input button of chatbot 
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
//*******************************************************************************



//Method for send user input in backend------------------------------------------ 
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

            // if (data.chatbot_response === "allDetails") {

               if (apiMapping.hasOwnProperty(data.chatbot_response)) {
                fetchEmployeeDetails(apiMapping[data.chatbot_response]).finally(() => {
                        // Enable input and button
                       
                       disableInputButton(false);
                   });

                // fetchEmployeeDetails().finally(() => {
                //      // Enable input and button
                    
                //     disableInputButton(false);
                // });
            } else {
                typeText('chatbot-message', data.chatbot_response, textSpeeed); // Typing speed: 50ms per character

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
            typeText('chatbot-message', 'Sorry, there was an error connecting to server', textSpeeed);
            hideLoadingIndicator();
            // Re-enable input and button on error
            disableInputButton(false);
            
        });
    }, 2000); // Delay for 2 seconds

    document.getElementById('user-input').value = '';
}
//*******************************************************************************



//Loading indicator of chatbot thinking------------------------------------------
function showLoadingIndicator() {
    const chatHistory = document.getElementById('chat-history');
    const loadingElement = document.createElement('div');
    loadingElement.className = 'chatbot-message loading';
    loadingElement.id = 'loading-indicator';
    loadingElement.innerHTML = '<span></span><span></span><span></span>';
    chatHistory.appendChild(loadingElement);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}
//*******************************************************************************



//Hide loading indicator of chatbot thinking-------------------------------------
function hideLoadingIndicator() {
    const loadingElement = document.getElementById('loading-indicator');
    if (loadingElement) {
        loadingElement.remove();
    }
}
//*******************************************************************************



//Type chatbot message----------------------------------------------------------- 
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
//*******************************************************************************



//Function to handle null response from chatbot----------------------------------
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

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//if user click yes for none response
function handleYes(originalInput) {
    document.getElementById('yes-button').remove();
    document.getElementById('no-button').remove();
    typeText('chatbot-message',"Please provide the answer for the question.", textSpeeed);

    waitingForAnswer = true;
    originalQuestion = originalInput;

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//if user click no for none response
function handleNo() {
    document.getElementById('yes-button').remove();
    document.getElementById('no-button').remove();
    typeText('chatbot-message',"okay what else i can do ?", textSpeeed);
}
//*******************************************************************************



//Function to handle suggestion response from chatbot----------------------------
function handleSuggestion(suggestedQuestion, originalInput) {

    const chatHistory = document.getElementById('chat-history');
    buttonWrapper = document.createElement('div');
    buttonWrapper.className = 'button-wrapper';

    const yesButton = document.createElement('button');
    yesButton.id = 'yes-button';
    yesButton.innerText = 'Yes';
    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    //if user click yes for suggestion response
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
            if (apiMapping.hasOwnProperty(data.chatbot_response)) {
                fetchEmployeeDetails(apiMapping[data.chatbot_response]).finally(() => {
                        // Enable input and button
                       
                       disableInputButton(false);
                   });
            } else {
                typeText('chatbot-message', data.chatbot_response, textSpeeed); // Typing speed: 50ms per character
                console.log("else:  "+data.chatbot_response)
            }

            
        })
        .catch(error => console.error('Error:', error));
        
        buttonWrapper.remove();  // Remove buttons after selection
    };

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    //if user click no for suggestion response
    const noButton = document.createElement('button');
    noButton.id = 'no-button';
    noButton.innerText = 'No';
    noButton.onclick = function() {
        appendMessage('user-message', "No");
        buttonWrapper.remove();  // Remove buttons after selection
        typeText('chatbot-message',"okay what else i can do ?", textSpeeed);
    };

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    //if user click provide answer for suggestion response
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
//*******************************************************************************



//Fucntion for saving new answer from user---------------------------------------
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
//*******************************************************************************



//Api function for fetch details-------------------------------------------------
function fetchEmployeeDetails(apiendpoint) {
    console.log("api end point: ",apiendpoint)
    disableInputButton(true);
    showLoadingIndicator();
    return fetch(apiendpoint) 
        .then(response => response.json())
        .then(responseData => {
            hideLoadingIndicator();
            console.log('API Response:', responseData); // Log the full response
            let data = responseData.data;
            console.log('API  data  Response:', data); // Log the full response

            
            // Check if employeeData is an array, if not, try to use responseData directly
            if (!Array.isArray(data)) {
                console.log(data,"            Check if employeeData is an array, if not, try to use responseData directly")
                data = responseData;
                const dataTable = SingleformatAPIResponse(data);
                appendHtml('chatbot-message', dataTable);
            }

              // Check if employeeData is an array
            else if (Array.isArray(data) && data.length > 0) {
                data = responseData;
                console.log("Check if employeeData is an array", data)
                const dataTable = ArrayformatAPIResponse(data);
                // const jsonString = JSON.stringify(employeeData,null,2);

                // const formattedJson = `<pre>${jsonString}</pre>`;

                appendHtml('chatbot-message', dataTable);
            } 
            
            else {
                typeText('chatbot-message', 'No employee data found or invalid data structure.', textSpeeed);
            }

        })


        .catch(error => {
            hideLoadingIndicator();
            console.error('Error:', error);
            typeText('chatbot-message', 'Sorry, there was an error fetching employee details.', textSpeeed);
        });
}
//*******************************************************************************



//Function to show single object or inherited object from api in chatbot---------
function SingleformatAPIResponse(data) {
    console.log("Single format api data:", data);
    if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
        return "<p>No data available</p>";
    }

    let formatted = "<table>";

    function addRowsRecursively(obj, indent = "") {
        Object.entries(obj).forEach(([key, value]) => {
            formatted += "<tr>";
            formatted += `<th>${indent}${key}</th>`;
            if (typeof value === 'object' && value !== null) {
                formatted += "<td></td></tr>";
                addRowsRecursively(value, indent + "&nbsp;&nbsp;&nbsp;&nbsp;");
            } else {
                formatted += `<td>${value}</td></tr>`;
            }
        });
    }

    addRowsRecursively(data);
    formatted += "</table>";

    return formatted;
}
//*******************************************************************************



//Function to show array object from api in chatbot------------------------------ 
function ArrayformatAPIResponse(response) {
    console.log("format api data: ", response);
    if (!response || typeof response !== 'object') {
        return "<p>No data available</p>";
    }

    let formatted = "<table>";

    function addRowsRecursively(obj, indent = "") {
        Object.entries(obj).forEach(([key, value]) => {
            formatted += "<tr>";
            formatted += `<th>${indent}${key}</th>`;
            
            if (Array.isArray(value)) {
                formatted += "<td></td></tr>";
                value.forEach((item, index) => {
                    formatted += `<tr><th>${indent}&nbsp;&nbsp;&nbsp;&nbsp;[${index}]</th><td></td></tr>`;
                    addRowsRecursively(item, indent + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;");
                });
            } else if (typeof value === 'object' && value !== null) {
                formatted += "<td></td></tr>";
                addRowsRecursively(value, indent + "&nbsp;&nbsp;&nbsp;&nbsp;");
            } else {
                formatted += `<td>${value}</td></tr>`;
            }
        });
    }

    addRowsRecursively(response);
    formatted += "</table>";

    return formatted;
}
//*******************************************************************************


//|||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||


// function sendMessage() {
//     const userInput = document.getElementById('user-input').value.trim();
//     if (userInput === "") return;
    
//     appendMessage('user', userInput);

//     fetch('/chatbot', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ message: userInput })
//     })
//     .then(response => response.json())
//     .then(data => {
//         appendMessage('bot', data.chatbot_response);

//         // Check if the response requires an API call
//         if (apiMapping.hasOwnProperty(data.chatbot_response)) {
//             callAPI(apiMapping[data.chatbot_response]);
//         }
//     })
//     .catch(error => console.error('Error:', error));

//     document.getElementById('user-input').value = '';
// }

// function callAPI(endpoint) {
//     fetch(endpoint)
//     .then(response => response.json())
//     .then(data => {
//         // Format and display the data dynamically
//         const formattedData = formatAPIResponse(data);
//         typeText('bot', formattedData, 50); // Use typeText to display the API response
//     })
//     .catch(error => console.error('Error fetching API:', error));
// }

// function formatAPIResponse(data) {
//     if (!data || !data.data || data.data.length === 0) {
//         return "<p>No data available</p>";
//     }

//     const keys = Object.keys(data.data[0]);

//     // Create table headers
//     let formatted = "<table><tr>";
//     keys.forEach(key => {
//         formatted += `<th>${key}</th>`;
//     });
//     formatted += "</tr>";

//     // Create table rows
//     data.data.forEach(item => {
//         formatted += "<tr>";
//         keys.forEach(key => {
//             formatted += `<td>${item[key]}</td>`;
//         });
//         formatted += "</tr>";
//     });
//     formatted += "</table>";

//     return formatted;
// }

// function typeText(className, message, typingSpeed) {
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
//         if (index < message.length) {
//             messageText.innerHTML += message[index]; // Use innerHTML to properly render HTML content
//             index++;
//             chatHistory.scrollTop = chatHistory.scrollHeight; // Keep chat scrolled to the bottom
//             setTimeout(type, typingSpeed);
//         } else {
//             disableInputButton(false); // Enable the button after typing is complete
//         }
//     }

//     type();
// }

//|||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||














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

//  https://dummy.restapiexample.com/api/v1/employees


