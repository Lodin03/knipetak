import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, User, onAuthStateChanged, signOut } from 'firebase/auth';
import app from '../firebase.ts';
import { createUserDocument } from './firebase.userservice';
import { UserType } from '../../interfaces/UserData';
export const auth = getAuth(app);

// Function to get current user
export const getCurrentUser = (): User | null => {
    return auth.currentUser;
};

// Export onAuthStateChanged for components to use
export { onAuthStateChanged };

// Function to sign up a user
export const signUp = async (email: string, password: string, username: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update the user's display name
    await updateProfile(user, {
      displayName: username
    });

    // Create user document in Firestore
    await createUserDocument(user.uid, {
      uid: user.uid,
      displayName: username,
      email: email,
      userType: UserType.CUSTOMER,
      createdAt: new Date()
    });
    
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

// Function to log out the current user
export const logOut = async () => {
  try {
      await signOut(auth);
      console.log('User signed out');
  } catch (error) {
      console.error('Error signing out: ', error);
      throw error;
  }
};