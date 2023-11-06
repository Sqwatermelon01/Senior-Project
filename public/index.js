import './487styles.css';
import { AuthErrorCodes } from 'firebase/auth';
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, doc, getDoc, getDocs, writeBatch, batch, setDoc, deleteDoc, orderBy, query, updateDoc } from "firebase/firestore";
// import { javascript } from 'webpack'; <-- WATCH OUT FOR THIS LITTLE SHIT! WILL BRAKE WEBPACK IF USED.
import { 
    getAuth,
    onAuthStateChanged, 
    signOut,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    connectAuthEmulator
  } from 'firebase/auth';

  const firebaseApp = initializeApp({
    apiKey: "AIzaSyBJcxblZCDq1ovvSchILY69TuAODLXNRlM",
    authDomain: "the-daily-riddle.firebaseapp.com",
    projectId: "the-daily-riddle",
    storageBucket: "the-daily-riddle.appspot.com",
    messagingSenderId: "96418369554",
    appId: "1:96418369554:web:a175dc7608624db91f48cb",
    measurementId: "G-F4R08QE4VP"
  });
const db = getFirestore();

// Get the date from the user and return the index for riddles.
// Only works for year 2023.
function getCurrentDate() {
  
  const date = new Date();
  let index = 0;

  let day = date.getDate() -1;
  let month = date.getMonth() + 1;

  if (month === 1){ 
    index = day;
  }
  else if (month === 2) {
    index = (31 + day);
  }
  else if (month === 3) {
    index = (28 + 31 + day);
  }
  else if (month === 4){
    index = (31 + 28 + 31 + day)
  }
  else if (month === 5){
    index = (30 + 31 + 28 + 31 + day)
  }
  else if (month === 6){
    index = (31 + 30 + 31 + 28 + 31 + day)
  }
  else if (month === 7){
    index = (30 + 31 + 30 + 31 + 28 + 31 + day)
  }
  else if (month === 8){
    index = (31 + 30 + 31 + 30 + 31 + 28 + 31 + day)
  }
  else if (month === 9){
    index = (31 + 31 + 30 + 31 + 30 + 31 + 28 + 31 + day)
  }
  else if (month === 10){
    index = (30 + 31 + 31 + 30 + 31 + 30 + 31 + 28 + 31 + day)
  }
  else if (month === 11){
    index = (31 + 30 + 31 + 31 + 30 + 31 + 30 + 31 + 28 + 31 + day)
  }
  else if (month === 12){
    index = (30 + 31 + 30 + 31 + 31 + 30 + 31 + 30 + 31 + 28 + 31 + day)
  }
  
  return index + 100;
}
console.log("Total days for this year: " + getCurrentDate())

// Gets the riddle of the day and displays it. 
async function getRiddle(db) {
  const riddleCol = doc(db, 'Riddles', getCurrentDate().toString());
  const riddleDoc = await getDoc(riddleCol);
  const riddle = riddleDoc.data().riddle;
  const answer = riddleDoc.data().answer;

  const lenOfAnswer = answer.length;
  const answerLen = document.querySelector('#answerLen');
  answerLen.textContent = "The answer is " + lenOfAnswer + " letters long";
  const dailyRiddle = document.querySelector('#riddle');
  dailyRiddle.textContent = riddle;
}
getRiddle(db);

const btnstart = document.querySelector('#btnStart');
btnstart.addEventListener("click", startRiddle);


// Refreshing the page resets the number of attempts. CHANGE THIS SO THAT THE USER DOES NOT HAVE UNLIMITED ATTEMPTS---------------
let counter = 3;
let attemptsUsed = 0;
const checkAnswer = async () => { 
  const userAnswer = txtAnswer.value;
  const riddleCol = doc(db, 'Riddles', getCurrentDate().toString());
  const riddleDoc = await getDoc(riddleCol);
  const i = riddleDoc.data().answer;
  let feedback = "";
  if (userAnswer === "") {
    feedback = "Please enter an answer.";
  }

  else if (userAnswer.toUpperCase() === i.toUpperCase()) {
    feedback = "You got it!";
    btnAnswer.remove();
    stop(attemptsUsed); // Stops the timer
  } 

  else  if (userAnswer.toUpperCase() != i.toUpperCase()){
    counter = counter -1;
    attemptsUsed = attemptsUsed +1;
    feedback = "That's not it, try agian!" + " You have " + counter + " attempts left.";
    if (counter === 0){
      btnAnswer.remove();
      feedback = "You are out of attempts. Better luck next time!";
      clearInterval(interval); // Stops the timer
    }
  }
  feedbackForAnswer.textContent = feedback;
}

// Functions for timer
let timeCounter = 0;
let interval;
let totalTime = 0;

function start() {
  interval = setInterval(function() {
   totalTime = convertSec(timeCounter++); // timer start counting here.
  }, 1000);
}

function convertSec(cnt) {
  let sec = cnt;
  return sec;
}

function stop(attemptsUsed) {
  attemptsUsed = attemptsUsed;
  clearInterval(interval);
  if (auth.currentUser){
  userScore(attemptsUsed);
  }
}
// End of timer functions.

// Make function/s for submiting user score
let usedHints = 3;
function userScore(attemptsUsed) {
  let score = 10000;
  totalTime = totalTime + 30 * attemptsUsed; // Simple score might need to change --------
  let totalScore = score / totalTime;
  totalScore = Math.round(totalScore);

  console.log(totalScore);
  addDailyScore(totalScore)
  addMonlthyScore(totalScore)
}

const addDailyScore = async (Dailyscore) => {
  // Get DailyScores collection
  const dailyScoresCol = collection(db, "DailyScores")
  const q = query(dailyScoresCol, orderBy("score", "desc"));
  const querySnapshot = await getDocs(q);

   // Get the username
  const UsernamesCol = doc(db, 'Usernames', auth.currentUser.uid);
  const usernameDoc = await getDoc(UsernamesCol);
  const theUsername = usernameDoc.data().username;

  // Check if user has submitted a score already
  let flag = false;
  for(let i = 0; i <= querySnapshot.size -1; i++){
    if (querySnapshot.docs[i].data().userUID === auth.currentUser.uid){
      flag = true;
    }
  }
  if (flag === false){
  let dailyDoc = {score: Dailyscore, username: theUsername, userUID: auth.currentUser.uid}
  if (querySnapshot.size === 10){
    if (Dailyscore > querySnapshot.docs[9].data().score){
      setDoc(doc(db, "DailyScores", querySnapshot.docs[9].id.toString()), dailyDoc);
    }
  }else {
    let i = querySnapshot.size + 1
    setDoc(doc(db, "DailyScores", i.toString()), dailyDoc);
  }
}else{
  console.log("You have already attempted today")
}
}

const addMonlthyScore = async (Dailyscore) => {
  // Get users monthly doc
  const UserMonthlyScoreCol = doc(db, "MonthlyScores", auth.currentUser.uid);
  const monthlyScoreDoc = await getDoc(UserMonthlyScoreCol);

  // Get username
  const UsernamesCol = doc(db, 'Usernames', auth.currentUser.uid);
  const usernameDoc = await getDoc(UsernamesCol);
  const theUsername = usernameDoc.data().username;

  // Check if doc exists and if user has submitted today
  if (monthlyScoreDoc.exists()) {
    if (monthlyScoreDoc.data().dailySubmission === false){
    let score = monthlyScoreDoc.data().score;
    let MonthlyTotalScore = score + Dailyscore;
    await updateDoc(UserMonthlyScoreCol, {
      dailySubmission: true,
      score: MonthlyTotalScore
    });
    }
  }else{
    let monlthyDoc = {score: Dailyscore, username: theUsername, dailySubmission: true}
    setDoc(doc(db, "MonthlyScores", auth.currentUser.uid), monlthyDoc)
  }


}

// Other
const feedbackForAnswer = document.querySelector('#feedbackForAnswer');
// Text 
const txtEmail = document.querySelector('#txtEmail');
const txtPassword = document.querySelector('#txtPassword');
const txtAnswer = document.querySelector('#txtAnswer')
const txtUsername = document.querySelector('#txtUsername')
// Buttons
const btnLogin = document.querySelector('#btnLogin')
const btnAnswer = document.querySelector('#btnAnswer')
const btnLogout = document.querySelector('#btnLogout');
const btnSignup = document.querySelector('#btnSignup');

// Set up Authentication.
const loginEmailPassword = async () => {
    const loginEmail = txtEmail.value
    const loginPassword = txtPassword.value
  
    await signInWithEmailAndPassword(auth, loginEmail, loginPassword)
  }
  
  // Create new account using email/password
  const createAccount = async () => {
    const email = txtEmail.value
    const password = txtPassword.value
    const username = txtUsername.value
    if (username != "" && email != "" && password != ""){
    try {
      await createUserWithEmailAndPassword(auth, email, password)
    }
    catch(error) {
      console.log(`There was an error: ${error}`)
      alert(error)
    } 
    createUsername();
  }
  else{
    alert("Please make sure all fields are filled out.")
  }
  }

  // Monitor auth state
const monitorAuthState = async () => {
  onAuthStateChanged(auth, user => {
    if (user) {
      console.log(user)
    }
    else {
      console.log('You are not logged in')
    }
  })
}

const logout = async () => {
  await signOut(auth);
  alert("You are now logged out.")
}

function createUsername() {
  const username = txtUsername.value
  console.log("user id: " + auth.currentUser.uid); 
  let docData = {username: username}
  setDoc(doc(db, "Usernames", auth.currentUser.uid), docData);
}

  btnLogin.addEventListener("click", loginEmailPassword) 
  btnSignup.addEventListener("click", createAccount)
  btnLogout.addEventListener("click", logout)
  btnAnswer.addEventListener("click", checkAnswer)
  

  const auth = getAuth(firebaseApp);

monitorAuthState();

//                            OLD WAY TO DO LEADERBOARDS                       
// TODO: First, finish createUsername function.
// Create a firestore function that gets all of the users scores and puts the top 10 scores into the daily 
// scores, then make another function that does the same but in monthly scores. 
// Create a firebase function that moves all the daily scores to the monthly scores, then deletes all the daily 
// scores at the end of every day, then make another function that deletes all the monthly scores at the end of every month.

// OR User score with data goes to the scores collection and goes to the doc that has the ID of the courrent date and into the docs collection.
// So, the firebase functions would simply get the top 10 scores from the users date.

//                          NEW BETTER WAY TO DO LEADERBOARDS
// Daliy score keep only the top 10. Collection should only be 10 docs (with username and score only) long. 
// If the collection has 10 docs (scores) in it compare lowest score and if the new score is highter replace the lowest score, 
// then have a function sort it. Then upload to firebase, then when a button is clicked display the all the docs data.
// Do the same for monthly with a collection of 20 docs. But have an accumulative score that is only updated weekly.
// This may require a firebase function to do so.

// Add hints function. When a hint is used it takes points away from the total score.




// --------------------------------- UI CODE ---------------------------------





// Hide riddleDiv
let y = document.getElementById("riddleDiv");
y.style.display = "none";

// Unhide riddleDiv
function startRiddle() {
  let x = document.getElementById("riddleDiv");
  if (x.style.display === "none") {
    x.style.display = "block";
  } else {
    x.style.display = "none";
  }
  btnstart.remove()
  start()
}

let btndropdown = document.querySelector('.dropdownbtn')
btndropdown.addEventListener("click", homeDropdown)

function homeDropdown(){
  document.getElementById("TheDropdown").classList.toggle("show");
}

// Display the top 10 daily scores
const displayDailyScores = async () =>{
  const dailyScoresCol = collection(db, "DailyScores")
  const q = query(dailyScoresCol, orderBy("score", "desc"));
  const querySnapshot = await getDocs(q);
  
  

  if (querySnapshot.size === 0){
    let info = document.getElementById("user1")
    info.textContent = "No scores have been submitted yet today"
    
  } else {

  for (let i = 1; i < querySnapshot.size +1; i++){
    let score = document.getElementById("score" + i.toString());
    let username = document.getElementById("user" + i.toString());

    let docscore = querySnapshot.docs[i -1].data().score.toString();
    let docusername = querySnapshot.docs[i -1].data().username;

    username.textContent = "Username: " + docusername;
    score.textContent = "Score: " + docscore;

    
  }
 }
}

const btnopenDailyTop10Popup = document.getElementById("openDailyTop10Popup")
btnopenDailyTop10Popup.addEventListener("click", displayDailyScores)

// Display the top 20 monthly scores
const displayMonthlyScores = async () =>{
  const monthlyScoresCol = collection(db, "MonthlyScores")
  const q = query(monthlyScoresCol, orderBy("score", "desc"));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.size === 0){
    let info = document.getElementById("user1")
    info.textContent = "No scores have been submitted yet today"
    
  } else {

  for (let i = 1; i < querySnapshot.size +1; i++){ 
    let score = document.getElementById("monthlyScore" + i.toString());
    let username = document.getElementById("monthlyUser" + i.toString());

    let docscore = querySnapshot.docs[i -1].data().score.toString();
    let docusername = querySnapshot.docs[i -1].data().username;

    username.textContent = "Username: " + docusername;
    score.textContent = "Score: " + docscore;
    
  }
 }
}

const btnopenMonthlyTop20Popup = document.getElementById("openMonthlyTop20Popup")
btnopenMonthlyTop20Popup.addEventListener("click", displayMonthlyScores)

// Show and hide signin/login popup
const btnopen = document.getElementById("openSignup-loginPopup");
const btnclose = document.getElementById("closeSignup-loginPopup");
const signupLoginModal = document.getElementById("signup-loginPopup");

btnopen.addEventListener("click", () => {
  signupLoginModal.classList.add("open");
});

btnclose.addEventListener("click", () => {
  signupLoginModal.classList.remove("open");
});

// Show and hide daily top 10 scores popup
const btnopenDaily = document.getElementById("openDailyTop10Popup");
const btncloseDaily = document.getElementById("closeDailyTop10Popup");
const dailyTop10Modal = document.getElementById("dailyTop10Popup");

btnopenDaily.addEventListener("click", () => {
  dailyTop10Modal.classList.add("open");
});

btncloseDaily.addEventListener("click", () => {
  dailyTop10Modal.classList.remove("open");
});

// Show and hide monthly top 20 scores popup
const btnopenMonthly = document.getElementById("openMonthlyTop20Popup");
const btncloseMonthly = document.getElementById("closeMonthlyTop20Popup");
const monthlyTop20Modal = document.getElementById("monthlyTop20Popup");

btnopenMonthly.addEventListener("click", () => {
  monthlyTop20Modal.classList.add("open");
});

btncloseMonthly.addEventListener("click", () => {
  monthlyTop20Modal.classList.remove("open");
});



// Make it when the user clicks the login or sign up button it tells them if it was successful or not. <-------
// Also let the user know if they are signed in or not when they load the page. <-------
// Let the user know what score they got. <-------
// Add the number of times the user has completed a riddle for the month when displaying the top 20 monthly scores <-------

// Sort by using a firebase function or just use what you have below (this is for displaying the top 10 scores) -----------
// const dailyScoresCol = collection(db, "DailyScores")
//   const q = query(dailyScoresCol, orderBy("score", "desc"));
//   const querySnapshot = await getDocs(q);