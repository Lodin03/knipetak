import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import app from '../firebase.ts'; 

const auth = getAuth(app);

// Function to sign up a user
export const signUp = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('User signed up: ', user);
    return user;
  } catch (error) {
    console.error('Error signing up: ', error);
    throw error;
  }
};

// Function to sign in a user
export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('User signed in: ', user);
    return user;
  } catch (error) {
    console.error('Error signing in: ', error);
    throw error;
  }
};