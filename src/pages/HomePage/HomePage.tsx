import React from 'react';
import NavigationBar from '../../components/NavigationBar/NavigationBar';
import Footer from '../../components/Footer/Footer';

const HomePage: React.FC = () => {
  return (
    <>
    <NavigationBar />
    <div>
      <h1>Welcome to the Home Page</h1>
      <p>This is a simple home page.</p>
    </div>
    <Footer />
    </>
  );
};

export default HomePage;