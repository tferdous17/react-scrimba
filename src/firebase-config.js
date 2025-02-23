// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, doc, updateDoc, collection, getDocs, query, where, orderBy, serverTimestamp, setDoc, getDoc } from "firebase/firestore"
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDswSWoS_bi_5qGWQHekRGG1VzAyy_ho5s",
  authDomain: "bounty-streak-59f86.firebaseapp.com",
  projectId: "bounty-streak-59f86",
  storageBucket: "bounty-streak-59f86.firebasestorage.app",
  messagingSenderId: "888983731303",
  appId: "1:888983731303:web:b3d41d2008171d1fa9e8c2",
  measurementId: "G-78EP3K988E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app)
// const analytics = getAnalytics(app); doesnt work idk why

// TEST
const db = getFirestore()
const userRefs = collection(db, "User")

// getDocs(userRefs).then((querySnapshot) => {
//     querySnapshot.forEach((doc) => {
//         console.log(`${doc.id} => ${JSON.stringify(doc.get("doubloons"))}`)
//     })
// }).catch((error) => {
//     console.error("Error getting document: ", error)
// })

// 1. List all users, and sort by points
async function getAllUsers() {
    try {
        const usersRef = collection(db, "User")
        const querySnapshot = await getDocs(usersRef)
        return querySnapshot.docs.map(doc => ( { id: doc.id, ...doc.data() }))
    } catch (error) {
        console.error("Error getting documents: ", error)
        return []
    }
}


async function getUsersSortedByDoubloons() {
    try {
        const usersRef = collection(db, "User")
        const q = query(usersRef, orderBy("doubloons", "desc")) // descending
        const querySnapshot = await getDocs(usersRef)
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
        console.log("error bruh: ", error)
        return []
    }
}

async function fetchUserData() {
    const allUsers = await getUsersSortedByDoubloons()
    console.log("All Users: ", allUsers)
}

async function getUserByUid(uid) {
    try {
      const usersRef = collection(db, "User");
      const q = query(usersRef, where("uid", "==", uid)); //This is the key change.
      const querySnapshot = await getDoc(q);
  
      if (querySnapshot.empty) {
        return null; // User not found
      }
    
    //   return querySnapshot // return the snapshot

      //Since we expect one user, we directly access the first document
      return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() }; 
    } catch (error) {
      console.error("Error getting user by UID: ", error);
      return null; // Return null if there's an error
    }
  };
  
// Function to handle Google Sign-In and Firestore user creation/updating
export async function handleGoogleSignIn() {
    const provider = new GoogleAuthProvider();

    try {
        // Sign in with Google
        const result = await signInWithPopup(auth, provider);

        // Get user info from the result
        const user = result.user;
        const userId = user.uid;
        const email = user.email;
        const username = user.displayName || '';  // Use Google account display name as username

        console.log('User signed in:', user);

        // Check if the user already exists in Firestore
        await createUserIfNotExists(userId, email, username);

    } catch (error) {
        console.error('Error during Google Sign-In:', error);
    }
}
// Function to create a user in Firestore if they don't already exist
async function createUserIfNotExists(userId, email, username) {
    const userDocRef = doc(db, 'User', userId);

    try {
        // Check if the user document already exists in the 'User' collection
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            // User does not exist, create a new document with the required fields
            const userData = {
                currentStreak: 0,
                doubloons: 0,
                email: email || '',
                itemRecycleCount: 0,
                lastRecycledDate: serverTimestamp(),  // Set to server timestamp
                petPirate: [],  // Empty array for pet items
                questsCompleted: [],  // Empty array for completed quests
                uid: userId,
                username: username,  // Use the Google account's display name as username
            };

            // Add the new user to the 'User' collection
            await setDoc(userDocRef, userData);
            console.log(`User created with UID: ${userId}, Username: ${username}`);
            // Initialize the usersQuest subcollection with some default quests
            const usersQuestRef = collection(userDocRef, 'usersQuest');

            // Example of quest data to be added for the new user
            const questData = [
                {
                    questName: "RecyclePlastic",
                    currentProgress: 0,
                    maxProgress: 50,
                    completed: false,
                    rewardInDoubloons: 0,
                },
                {
                    questName: "RecycleGlass",
                    currentProgress: 0,
                    maxProgress: 50,
                    completed: false,
                    rewardInDoubloons: 0,
                },
                // You can add more quests here as needed
            ];

            // Add each quest document to the usersQuest subcollection
            for (const quest of questData) {
                const questDocRef = doc(usersQuestRef); // Automatically generate a document ID
                await setDoc(questDocRef, quest);
                console.log(`Quest "${quest.questName}" initialized for user ${userId}`);
            }

        } else {
            // User already exists, notify that the user already exists
            console.log(`User with UID: ${userId} already exists!`);
            // You can handle this scenario in your frontend or alert the user
        }
    } catch (error) {
        console.error('Error creating or updating user:', error);
    }
}

// async function getAllUsers() {
//     try {
//         const usersRef = collection(db, "User")
//         const querySnapshot = await getDocs(usersRef)
//         return querySnapshot.docs.map(doc => ( { id: doc.id, ...doc.data() }))
//     } catch (error) {
//         console.error("Error getting documents: ", error)
//         return []
//     }
// }

// GET QUEST DATA
async function getAllUsersQuestData() {
    try {
        const usersRef = collection(db, "User")
        const querySnapshot = await getDocs(usersRef)
        const uids = []
        querySnapshot.forEach((snapshot) => {
            uids.push(snapshot.data().uid)
        })

        for (let uid of uids) {
            const collectionRef = collection(db, "User", uid, "usersQuest")
            const collectionSnapshot = await getDocs(collectionRef)
            collectionSnapshot.forEach(snapshot => {
                console.log(snapshot.data())
            })
        }
    } catch (error) {
        console.log("Error: ", error)
    }
}

async function getSpecificUsersQuestData(uid) {
    try {
        const collectionRef = collection(db, "User", uid, "usersQuest")
        const collectionSnapshot = await getDocs(collectionRef)

        return collectionSnapshot
    } catch (error) {
        console.log("Error: ", error)
    }
}

async function incrementQuestProgressForSpecificUser(uid, questName) {
    try {
        // get the specific quest for this particular uid first
        const questSnapshot = await getSpecificUsersQuestData(uid)
        // console.log(questSnapshot)
        questSnapshot.forEach(quest => {
            if (quest.data().questName == questName) {
                // increment current progress by 1
                if (quest.data().currentProgress < quest.data().maxProgress) {
                    const docRef = quest.ref
                    updateDoc(docRef, { "currentProgress": quest.data().currentProgress + 1 })
                        .then(() => {
                            console.log(`SUCCESS: Quest ${questName} progress updated by 1.`)

                            if (quest.data().currentProgress + 1 >= quest.data().maxProgress) {
                                console.log("yeen we neda update quest as completed")
                                markQuestCompleteAndUpdateUsersPoints(uid, questName)
                            }
                        }).catch(err => { console.log(`ERROR: Quest ${questName}'s progress could not be incremented. Err: ${err}`)})
                }
                return
            } 
        })
    } catch (error) {
        console.log(error)
    }
}

async function markQuestCompleteAndUpdateUsersPoints(uid, questName) {
    try {   
        const questSnapshot = await getSpecificUsersQuestData(uid)
        questSnapshot.forEach(quest => {
            if (quest.data().questName == questName) {
                // increment current progress by 1
                const docRef = quest.ref
                updateDoc(docRef, { "completed": true })
                    .then(() => {
                        console.log(`SUCCESS: Quest ${questName} marked complete`)

                        // now update users points w/ reward in doubloons
                        const reward = quest.data().rewardInDoubloons
                        updateUsersDoubloons(uid, reward)

                        // updateDoc(userSnapshotRef[0], { "doubloons": userSnapshotRef.doubloons + reward })
                        //     .then(() => {
                        //         console.log("SUCCESS IN INCREMENT DOUBLOONS AFTER QUEST WAS COMPLETED")
                        //     }).catch(err => { console.error("COULD NOT GIVE OUT REWARD IN DOUBLOONS")})
                        
                    }).catch(err => { console.error(`ERROR: Quest ${questName} could not be marked complete. Err: ${err}`)})
                return
            } 
        })
    } catch (error) {
        console.log(error)
    }
}

async function updateUsersDoubloons(uid, amountOfDoubloons) {
    const userRef = doc(db, "User", uid)
    const userSnap = await getDoc(userRef)

    await updateDoc(userRef, {
        "doubloons": userSnap.data().doubloons + amountOfDoubloons
    }).then(() => {
        console.log("SUCCESS IN INCREMENT DOUBLOONS AFTER QUEST WAS COMPLETED")
    }).catch(err => { console.error("COULD NOT GIVE OUT REWARD IN DOUBLOONS")})
}

// await incrementQuestProgressForSpecificUser("tXR02zn3HkNJ9ErHu0uoe2tQnCF3", "RecycleGlass")
await updateUsersDoubloons("tXR02zn3HkNJ9ErHu0uoe2tQnCF3", 100)

