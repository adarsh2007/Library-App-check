import firebase from 'firebase'
require('@firebase/firestore')


  // Your web app's Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyDYz8aFEvNwoGbRrQkbTW1MTJRP9hNm0o8",
    authDomain: "wilyapp-f0258.firebaseapp.com",
    databaseURL: "https://wilyapp-f0258.firebaseio.com",
    projectId: "wilyapp-f0258",
    storageBucket: "wilyapp-f0258.appspot.com",
    messagingSenderId: "570185681537",
    appId: "1:570185681537:web:c8ef7fdd74457128a79b80"
  };
   const firebaseApp=firebase.initializeApp(firebaseConfig);
   const db= firebaseApp.firestore();

  

  export default db;