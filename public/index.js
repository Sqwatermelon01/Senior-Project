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

// Get access to database (Firestore)
const db = getFirestore();

// Gets the riddle of the day and displays it. 
async function getRiddle(db) {
  const riddleCol = doc(db, 'Riddles', getCurrentDate().toString()); // Access the Riddles Colection,
  const riddleDoc = await getDoc(riddleCol);//                          then call getCurrentDate to
  // Get riddle data.                                                   get the right riddle.
  const riddle = riddleDoc.data().riddle;
  const answer = riddleDoc.data().answer;

  const lenOfAnswer = answer.length; // Show the user how many letters long the answer is.
  const answerLen = document.querySelector('#answerLen');
  answerLen.textContent = "The answer is " + lenOfAnswer + " letters long (one word)";
  const dailyRiddle = document.querySelector('#riddle');
  dailyRiddle.textContent = riddle;
}
getRiddle(db); // Call getRiddle function

const btnstart = document.querySelector('#btnStart');
btnstart.addEventListener("click", startRiddle);

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
  // Only add score if the user is logged in
  if (auth.currentUser){
  userScore(attemptsUsed);
  }
}
// End of timer functions.

// Create user score
let usedHints = 3;
function userScore(attemptsUsed) {
  let score = 100000;
  totalTime = totalTime + 30 * attemptsUsed; // Simple score might need to change --------
  let totalScore = score / totalTime;
  totalScore = Math.round(totalScore);

  console.log(totalScore);
  addDailyScore(totalScore)
  addMonlthyScore(totalScore)
}

// for(let i = 0; i <= querySnapshot.size -1; i++){
  //   if (querySnapshot.docs[i].data().userUID === auth.currentUser.uid){
  //     flag = true;
  //   }
  // }

const addDailyScore = async (Dailyscore) => {
  // Get DailyScores collection
  const dailyScoresCol = collection(db, "DailyScores")
  const q = query(dailyScoresCol, orderBy("score", "desc"));
  const querySnapshot = await getDocs(q);

  // Get users monthly doc
  const UserMonthlyScoreCol = doc(db, "MonthlyScores", auth.currentUser.uid);
  const monthlyScoreDoc = await getDoc(UserMonthlyScoreCol);

   // Get the username
  const UsernamesCol = doc(db, 'Usernames', auth.currentUser.uid);
  const usernameDoc = await getDoc(UsernamesCol);
  const theUsername = usernameDoc.data().username;

  // Check if user has submitted a score already
  let flag = false;
  if (monthlyScoreDoc.exists()){
    if (monthlyScoreDoc.data().dailySubmission === true){
      flag = true
    }
  }
  if (flag === false){
  // Create the daily score document
  let dailyDoc = {score: Dailyscore, username: theUsername}
  if (querySnapshot.size === 10){
    if (Dailyscore > querySnapshot.docs[9].data().score){
      // Replace the lowest score if the new score is higher
      setDoc(doc(db, "DailyScores", querySnapshot.docs[9].id.toString()), dailyDoc);
    }
  }else {
    let i = querySnapshot.size + 1
    // Add a new score document if there is not 10 scores
    setDoc(doc(db, "DailyScores", i.toString()), dailyDoc);
  }
}else{
  // Inform the user that they have already attempted to today
  alert("You have already attempted today (New score will not be submitted)")
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
    let completions = monthlyScoreDoc.data().numberOfCompletions;
    let MonthlyTotalScore = score + Dailyscore;
    await updateDoc(UserMonthlyScoreCol, {
      dailySubmission: true,
      score: MonthlyTotalScore,
      numberOfCompletions: completions +1
    });
    }
  }else{
    let monlthyDoc = {score: Dailyscore, username: theUsername, dailySubmission: true, numberOfCompletions: 1}
    setDoc(doc(db, "MonthlyScores", auth.currentUser.uid), monlthyDoc)
  }
}
 
const addNewRiddle = async () => {
  const inputDate = document.getElementById("dateForNewRiddle").value;
  const inputRiddle = document.getElementById("newRiddle").value
  const inputAns = document.getElementById("ansForNewRiddle").value
  var dateArray = inputDate.split('-');

  let day = parseInt(dateArray[2], 10);
  let month = parseInt(dateArray[1], 10);
  let year = parseInt(dateArray[0], 10);

  let index = 0;

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

  index = index + 99;

  const riddleCol = doc(db, 'Riddles', index.toString());

  await updateDoc(riddleCol, {
    riddle: inputRiddle,
    answer: inputAns
  });
  alert("You have successfully changed the riddle for: " + month + "-" + day + "-" + year);
  
}

const btnsubmitRiddle = document.getElementById("btnsubmitNewRiddle")
btnsubmitRiddle.addEventListener('click', addNewRiddle)

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

const showUsername = async () =>  {
      const UsernamesCol = doc(db, 'Usernames', auth.currentUser.uid);
      const usernameDoc = await getDoc(UsernamesCol);
      const theUsername = usernameDoc.data().username;
      alert("You are logged in as: " + theUsername)
}

  // Monitor auth state
const monitorAuthState = async () => {
  onAuthStateChanged(auth, user => {
    if (user) {
      console.log(user)
      showUsername()
      isAdmin();
    }
    else {
      console.log('You are not logged in')
    }
  })
}

// Check if user is a admin
const isAdmin = async () => {
  const adminCol = doc(db, 'Administrators', auth.currentUser.uid);
  const adminDoc = await getDoc(adminCol);

  if (adminDoc.exists()) {
    // alert("You are logged in as an administrator");
    const btnChangeRidle = document.getElementById("openChangeRidlePopup");
    btnChangeRidle.style.display = "";
  } else {
    btnOpenChangeRidle.style.display = "none"
  }
  
}

const logout = async () => {
  await signOut(auth);
  alert("You are now logged out.")
  window.location.reload();
}

function createUsername() {
  const username = txtUsername.value 
  let docData = {username: username}
  setDoc(doc(db, "Usernames", auth.currentUser.uid), docData);
}

  btnLogin.addEventListener("click", loginEmailPassword) 
  btnSignup.addEventListener("click", createAccount)
  btnLogout.addEventListener("click", logout)
  btnAnswer.addEventListener("click", checkAnswer)
  

  const auth = getAuth(firebaseApp);

monitorAuthState();


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

// Display the top 10 daily scores
const displayDailyScores = async () =>{
  const dailyScoresCol = collection(db, "DailyScores")
  const q = query(dailyScoresCol, orderBy("score", "desc"));
  const querySnapshot = await getDocs(q);
  
  

  if (querySnapshot.size === 0){
    let info = document.getElementById("user1")
    info.textContent = "No scores have been submitted for today"
    
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
    info.textContent = "No scores have been submitted for this month"
    
  } else {

    if (querySnapshot.size < 20){
    var numberOfDocs = querySnapshot.size;
    }else {
    var numberOfDocs = 20;
    }

  for (let i = 1; i < numberOfDocs +1; i++){ 
    
    let score = document.getElementById("monthlyScore" + i.toString());
    let username = document.getElementById("monthlyUser" + i.toString());
    let trys = document.getElementById("monthlyTrys" + i.toString());

    let docScore = querySnapshot.docs[i -1].data().score.toString();
    let docUsername = querySnapshot.docs[i -1].data().username;
    let docTrys = querySnapshot.docs[i -1].data().numberOfCompletions;

    username.textContent = "Username: " + docUsername;
    score.textContent = "Score: " + docScore;
    trys.textContent = "Number of completions for this month: " + docTrys;

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
const btnOpenMonthly = document.getElementById("openMonthlyTop20Popup");
const btnCloseMonthly = document.getElementById("closeMonthlyTop20Popup");
const monthlyTop20Modal = document.getElementById("monthlyTop20Popup");

btnOpenMonthly.addEventListener("click", () => {
  monthlyTop20Modal.classList.add("open");
});

btnCloseMonthly.addEventListener("click", () => {
  monthlyTop20Modal.classList.remove("open");
});

// Show and hide change riddle popup
const btnOpenChangeRidle = document.getElementById("openChangeRidlePopup");
const btnCloseChangeRiddle = document.getElementById("closeChangeRiddlePopup");
const changeRiddleModal = document.getElementById("changeRiddlePopup");

btnOpenChangeRidle.addEventListener("click", () => {
  changeRiddleModal.classList.add("open");
});

btnCloseChangeRiddle.addEventListener("click", () => {
  changeRiddleModal.classList.remove("open");
});

let btndropdown = document.querySelector('.btnSidenavOpen')
btndropdown.addEventListener("click", openNav)

let clostbtn = document.querySelector('.closebtn')
clostbtn.addEventListener('click', closeNav)

function openNav() {
  document.getElementById("sidenavDiv").style.width = "250px";
}

function closeNav() {
  document.getElementById("sidenavDiv").style.width = "0";
}

// Also let the user know if they are signed in or not when they load the page. DONE
// Add the number of times the user has completed a riddle for the month when displaying the top 20 monthly scores. DONE
// Change addDailyScore function to check if user has already submitted for the day (only checks if user is already on the leaderboard). DONE.

// Move leaderboards to a diffrent HTML page. <-------
// Make it when the user clicks the login or sign up button it tells them if it was successful or not. <-------
// Let the user know what score they got. <-------
// Add hints function. When a hint is used it takes points away from the total score. <-------
// Make a profile page
