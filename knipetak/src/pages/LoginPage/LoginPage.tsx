import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn, signUp } from '../../backend/firebase/services/firebase.authservice';
import NavigationBar from '../../components/NavigationBar/NavigationBar';
import Footer from '../../components/Footer/Footer';
import './LoginPage.css';

function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await signIn(email, password);
            navigate('/');
        } catch (error: any) {
            setError('Feil email eller passord. Vennligst prøv igjen.');
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await signUp(email, password, username);
            navigate('/');
        } catch (error: any) {
            setError('Kunne ikke opprette konto. Vennligst prøv igjen.');
        }
    };

    return (
        <>
            <NavigationBar />
            <div className="login-container">
                <div className="login-box">
                    <h1>{isRegistering ? 'Registrer deg' : 'Logg Inn'}</h1>
                    {error && <p className="error-message">{error}</p>}
                    <form onSubmit={isRegistering ? handleRegister : handleLogin}>
                        {isRegistering && (
                            <div className="form-group">
                                <label htmlFor="username">Brukernavn</label>
                                <input
                                    type="text"
                                    id="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    placeholder="Velg et brukernavn"
                                />
                            </div>
                        )}
                        <div className="form-group">
                            <label htmlFor="email">E-post</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="password">Passord</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="login-button">
                            {isRegistering ? 'Registrer deg' : 'Logg Inn'}
                        </button>
                    </form>
                    <div className="toggle-form">
                        <button 
                            className="toggle-button"
                            onClick={() => {
                                setIsRegistering(!isRegistering);
                                setError('');
                                setUsername('');
                            }}
                        >
                            {isRegistering ? 'Har du allerede en konto? Logg inn' : 'Ny bruker? Registrer deg'}
                        </button>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}

export default LoginPage;