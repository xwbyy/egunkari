// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyARC1rM9Hv0cN0SA7ghiszVnuPuolpoHXY",
  authDomain: "egunkari-22fcb.firebaseapp.com",
  projectId: "egunkari-22fcb",
  storageBucket: "egunkari-22fcb.firebasestorage.app",
  messagingSenderId: "1023582590091",
  appId: "1:1023582590091:web:762e77a8f8e04acbb6708e",
  measurementId: "G-TSSKT7E60W"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Firebase Login Function
async function loginWithFirebase(event) {
  event.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const idToken = await userCredential.user.getIdToken();
    
    const response = await fetch('/api/firebase-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      window.location.href = data.redirect;
    } else {
      alert('Login failed: ' + (data.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('Firebase login error:', error);
    alert('Login failed: ' + error.message);
  }
}

// Firebase Signup Function
async function signupWithFirebase(event) {
  event.preventDefault();
  const name = document.getElementById('signupName').value;
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;
  
  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    await userCredential.user.updateProfile({
      displayName: name
    });
    
    const idToken = await userCredential.user.getIdToken();
    
    const response = await fetch('/api/firebase-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      window.location.href = data.redirect;
    } else {
      alert('Signup failed: ' + (data.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('Firebase signup error:', error);
    alert('Signup failed: ' + error.message);
  }
}

// UI Functions
function showSignup() {
  document.getElementById('signupModal').style.display = 'block';
}

function hideSignup() {
  document.getElementById('signupModal').style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
  const modal = document.getElementById('signupModal');
  if (event.target === modal) {
    modal.style.display = 'none';
  }
};